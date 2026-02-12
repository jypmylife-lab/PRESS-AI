"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Upload, FileText, ExternalLink, Calendar as CalendarIcon, FileUp, CheckCircle2, Download, Loader2, BarChart3, Trash2, RefreshCw, X } from "lucide-react";
import { format, isSameMonth, startOfYear, addMonths, isPast, isToday } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Line } from 'recharts';
import Tesseract from 'tesseract.js';
import localforage from "localforage";

// Types matching CalendarPage
interface Event {
    id: number;
    title: string;
    date: Date;
    status: string;
    type: string;
    content?: string;
    image?: string;
    imageContent?: string;
    performanceFile?: string;
    performanceFileName?: string;
    articleCount?: number;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i);
const STORAGE_KEY = "presscraft-events";

export default function ReportsPage() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [isAnalyzing, setIsAnalyzing] = useState<number | null>(null);
    const [isFetchingCount, setIsFetchingCount] = useState<number | null>(null);
    const [keywordMonthlyStats, setKeywordMonthlyStats] = useState<Record<number, number>>({});
    const [isLoadingStats, setIsLoadingStats] = useState(false);
    const [trackingKeyword, setTrackingKeyword] = useState("데스커");
    const [isBulkAnalyzing, setIsBulkAnalyzing] = useState(false);
    const bulkInputRef = useRef<HTMLInputElement>(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Initialize data from localforage with migration fallback
    useEffect(() => {
        const loadData = async () => {
            try {
                let stored = await localforage.getItem<any[]>(STORAGE_KEY);

                // Migration logic: check localStorage if localforage is empty
                if (!stored) {
                    const legacy = localStorage.getItem(STORAGE_KEY);
                    if (legacy) {
                        console.log("Migrating data from localStorage to localforage (Reports)...");
                        stored = JSON.parse(legacy);
                        await localforage.setItem(STORAGE_KEY, stored);
                    }
                }

                if (stored) {
                    const parsed = stored.map((e: any) => ({
                        ...e,
                        date: new Date(e.date)
                    }));
                    setEvents(parsed);
                }
            } catch (e) {
                console.error("Failed to load events", e);
            }
        };

        loadData();
        fetchKeywordMonthlyStats();
    }, [currentYear]);

    const fetchKeywordMonthlyStats = async () => {
        setIsLoadingStats(true);
        const stats: Record<number, number> = {};
        // Initialize all months to 0
        for (let i = 0; i < 12; i++) stats[i] = 0;

        try {
            // For historical coverage, we include the year in the query.
            // This leverages Naver's search logic to find items specifically relevant to that year.
            const searchQuery = `${trackingKeyword} ${currentYear}`;

            // Fetch up to 1000 results (maximal allowed by Naver API)
            const maxPages = 10;

            for (let p = 0; p < maxPages; p++) {
                const start = p * 100 + 1;
                // We use sort=sim (relevance) when searching with a year for better historical spread,
                // or sort=date if it's the current year to get latest updates.
                const sortType = currentYear === new Date().getFullYear() ? "date" : "sim";
                const res = await fetch(`/api/news-search?query=${encodeURIComponent(searchQuery)}&sort=${sortType}&display=100&start=${start}`);
                const data = await res.json();

                if (data.items && data.items.length > 0) {
                    data.items.forEach((item: any) => {
                        const date = new Date(item.pubDate);
                        const itemYear = date.getFullYear();

                        // Count if it matches the target year exactly
                        if (itemYear === currentYear) {
                            const month = date.getMonth();
                            stats[month] = (stats[month] || 0) + 1;
                        }
                    });
                } else {
                    break; // No more items
                }
            }
            setKeywordMonthlyStats(stats);
        } catch (error) {
            console.error("Failed to fetch keyword stats", error);
        } finally {
            setIsLoadingStats(false);
        }
    };

    const extractTextFromFile = async (file: File): Promise<{ base64: string, text: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = async () => {
                try {
                    const base64 = reader.result as string;
                    let extractedText = "";

                    if (file.type.startsWith('image/')) {
                        const { data: { text } } = await Tesseract.recognize(base64, 'kor+eng');
                        extractedText = text;
                    } else if (file.type === 'application/pdf') {
                        const pdfjs = await import('pdfjs-dist');
                        // @ts-ignore
                        pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

                        const loadingTask = pdfjs.getDocument(base64);
                        const pdf = await loadingTask.promise;
                        let fullText = "";
                        for (let i = 1; i <= pdf.numPages; i++) {
                            const page = await pdf.getPage(i);
                            const textContent = await page.getTextContent();
                            fullText += textContent.items.map((item: any) => item.str).join(" ");
                        }
                        extractedText = fullText;
                    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.name.endsWith('.docx')) {
                        const mammoth = await import('mammoth');
                        const arrayBuffer = await file.arrayBuffer();
                        const result = await mammoth.extractRawText({ arrayBuffer });
                        extractedText = result.value;
                    }

                    resolve({ base64, text: extractedText });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const extractDateFromText = (text: string): Date | null => {
        // Match YYYY.MM.DD or YYYY-MM-DD or YYYY년 MM월 DD일
        const datePatterns = [
            /(\d{4})[.-](\d{1,2})[.-](\d{1,2})/,
            /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match) {
                const year = parseInt(match[1]);
                const month = parseInt(match[2]) - 1;
                const day = parseInt(match[3]);
                const date = new Date(year, month, day);
                if (!isNaN(date.getTime())) return date;
            }
        }
        return null; // Fallback to current date or file date if needed
    };

    const extractTitleFromText = (text: string, filename: string): string => {
        // 1. Check for "Title:" or "Headline" prefix
        const explicitMatch = text.match(/(?:Title|제목|Headline)[:\s]+([^\n]+)/i);
        if (explicitMatch && explicitMatch[1].trim()) return explicitMatch[1].trim();

        // 2. Take the first non-empty line that looks like a title (not just a date or page number)
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 5);
        if (lines.length > 0) {
            // naive: take first significant line
            return lines[0].substring(0, 50);
        }

        // 3. Fallback to filename without extension
        return filename.replace(/\.[^/.]+$/, "");
    };

    const countArticlesFromText = (text: string): number => {
        // Find the position of "NO" or "번호" or "No."
        const noHeaderPattern = /(NO|번호|No\.)/gi;
        const headerMatch = noHeaderPattern.exec(text);

        if (headerMatch) {
            // Extract text after the header
            const afterHeader = text.substring(headerMatch.index);

            // Heuristic: Find all standalone numbers appearing after the "NO" header
            const numbersFound = afterHeader.match(/\b\d+\b/g);
            if (numbersFound) {
                // Filter for numbers that likely represent row indices (1 to 500)
                const numericIndices = Array.from(new Set(numbersFound.map(Number)))
                    .filter(n => n > 0 && n < 500)
                    .sort((a, b) => a - b);

                if (numericIndices.length > 0) {
                    // Check if it's a sequence starting from 1
                    let sequenceMax = 0;
                    for (let i = 0; i < numericIndices.length; i++) {
                        if (numericIndices[i] === i + 1) {
                            sequenceMax = numericIndices[i];
                        } else {
                            break;
                        }
                    }

                    // If we found a clear 1, 2, 3 sequence, return its maximum
                    if (sequenceMax > 0) return sequenceMax;

                    // Otherwise, return the total count of distinct small numbers found
                    return numericIndices.length;
                }
            }
        }

        // Fallback: use reporter/copyright patterns if "NO" column logic fails
        const copyrights = (text.match(/ⓒ|Copyright|All rights reserved/gi) || []).length;
        const reporters = (text.match(/[가-힣]{2,4}\s기자|reporter/gi) || []).length;
        const emails = (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || []).length;

        let total = Math.max(copyrights, reporters, emails);
        if (total === 0 && text.trim().length > 100) total = 1;
        return total || 0;
    };


    const extractInfoFromFilename = (filename: string): { date: Date | null, title: string } => {
        let date: Date | null = null;
        let title = "";

        // Remove extension
        const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.')) || filename;
        const parts = nameWithoutExt.split('_');

        // 1. Find Date (YYYYMMDD, YYMMDD, YYYY.MM.DD, YYYY-MM-DD) and subtract 1 day
        const dateRegex = /^(20\d{2}|\d{2})[.-]?(\d{2})[.-]?(\d{2})$/;

        // Check all parts for date to be safe, but we only use it to set the date
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            const match = part.match(dateRegex);
            if (match) {
                let year = parseInt(match[1]);
                const month = parseInt(match[2]) - 1;
                const day = parseInt(match[3]);

                if (year < 100) year += 2000;

                const d = new Date(year, month, day);
                if (!isNaN(d.getTime())) {
                    date = d;
                    date.setDate(date.getDate() - 1);
                    break;
                }
            }
        }

        // 2. Find Title (Between 1st and 2nd underscore)
        // Strictly use the second part (index 1) if available
        if (parts.length >= 2) {
            title = parts[1].trim();
        } else {
            // Fallback if no underscores
            title = nameWithoutExt;
        }

        return { date, title };
    };

    const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsBulkAnalyzing(true);
        const newEvents: Event[] = [];

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                try {
                    // Extract metadata from filename (Priority)
                    const { date: fileDate, title: fileTitle } = extractInfoFromFilename(file.name);

                    // Extract text for article count and fallback
                    const { base64, text } = await extractTextFromFile(file);

                    const extractedDate = fileDate || extractDateFromText(text) || new Date();
                    const extractedTitle = fileTitle || extractTitleFromText(text, file.name);
                    const count = countArticlesFromText(text);

                    // Add some jitter to ID to avoid collision if processed nicely in same ms
                    const newEvent: Event = {
                        id: Date.now() + i,
                        title: extractedTitle,
                        date: extractedDate,
                        status: "배포 완료",
                        type: "보도자료",
                        performanceFile: base64,
                        performanceFileName: file.name,
                        articleCount: count
                    };
                    newEvents.push(newEvent);
                } catch (err) {
                    console.error(`Failed to process file ${file.name}`, err);
                }
            }

            if (newEvents.length > 0) {
                const updatedEvents = [...events, ...newEvents].sort((a, b) => b.date.getTime() - a.date.getTime());
                setEvents(updatedEvents);

                // Persist
                const toSave = updatedEvents.map(ev => ({
                    ...ev,
                    date: ev.date.toISOString()
                }));
                await localforage.setItem(STORAGE_KEY, toSave);
                alert(`${newEvents.length}개의 파일이 성공적으로 업로드되었습니다.`);
            }
        } catch (error) {
            console.error("Bulk upload failed", error);
            alert("일괄 업로드 중 오류가 발생했습니다.");
        } finally {
            setIsBulkAnalyzing(false);
            if (bulkInputRef.current) bulkInputRef.current.value = "";
        }
    };

    const handleDeleteEvent = async (eventId: number) => {
        if (!confirm("정말로 이 성과 리포트를 삭제하시겠습니까? (복구할 수 없습니다)")) return;

        const updatedEvents = events.filter(ev => ev.id !== eventId);
        setEvents(updatedEvents);

        // Persist to localforage
        const toSave = updatedEvents.map(ev => ({
            ...ev,
            date: ev.date.toISOString()
        }));
        await localforage.setItem(STORAGE_KEY, toSave);
    };

    const handleDeletePerformanceFile = async (eventId: number) => {
        if (!confirm("성과 파일을 삭제하시겠습니까? 관련 기사 수도 초기화됩니다.")) return;

        const updatedEvents = events.map(ev =>
            ev.id === eventId
                ? { ...ev, performanceFile: undefined, performanceFileName: undefined, articleCount: 0 }
                : ev
        );
        setEvents(updatedEvents);

        // Persist to localforage
        const toSave = updatedEvents.map(ev => ({
            ...ev,
            date: ev.date.toISOString()
        }));
        await localforage.setItem(STORAGE_KEY, toSave);
    };

    const handleFileUpload = async (eventId: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(eventId);

        try {
            const { base64, text } = await extractTextFromFile(file);

            const count = countArticlesFromText(text);

            const updatedEvents = events.map(ev =>
                ev.id === eventId
                    ? { ...ev, performanceFile: base64, performanceFileName: file.name, articleCount: count }
                    : ev
            );
            setEvents(updatedEvents);

            // Persist to localforage
            const toSave = updatedEvents.map(ev => ({
                ...ev,
                date: ev.date.toISOString()
            }));
            await localforage.setItem(STORAGE_KEY, toSave);
        } catch (error) {
            console.error("Analysis failed", error);
            alert("파일 분석 중 오류가 발생했습니다. 용량이 너무 크거나 지원하지 않는 형식일 수 있습니다.");
        } finally {
            setIsAnalyzing(null);
        }
    };

    const handleUpdateArticleCount = async (eventId: number, count: string | number) => {
        const numCount = typeof count === "string" ? parseInt(count) || 0 : count;
        const updatedEvents = events.map(ev =>
            ev.id === eventId ? { ...ev, articleCount: numCount } : ev
        );
        setEvents(updatedEvents);

        // Persist to localforage
        const toSave = updatedEvents.map(ev => ({
            ...ev,
            date: ev.date.toISOString()
        }));
        await localforage.setItem(STORAGE_KEY, toSave);
    };

    const handleFetchArticleCount = async (eventId: number, title: string) => {
        setIsFetchingCount(eventId);
        try {
            // Search Naver API using the press release title
            const res = await fetch(`/api/news-search?query=${encodeURIComponent(title)}&sort=sim&display=100`);
            const data = await res.json();

            if (data.total !== undefined) {
                // Naver 'total' reflects the number of search results (articles)
                await handleUpdateArticleCount(eventId, data.total);
            }
        } catch (error) {
            console.error("Failed to fetch article count from Naver", error);
            alert("네이버 API에서 정보를 가져오는데 실패했습니다.");
        } finally {
            setIsFetchingCount(null);
        }
    };

    const getMonthStats = (monthIndex: number) => {
        const monthDate = new Date(currentYear, monthIndex, 1);
        const monthEvents = events.filter(e => isSameMonth(e.date, monthDate));

        const scheduled = monthEvents.filter(e => e.status === "예정됨" && e.date >= today).length;
        const published = monthEvents.filter(e => e.status === "배포 완료" || (e.status === "예정됨" && e.date < today)).length;

        // Use keyword stats if available, otherwise fallback to itemized counts
        const articles = keywordMonthlyStats[monthIndex] !== undefined && keywordMonthlyStats[monthIndex] > 0
            ? keywordMonthlyStats[monthIndex]
            : monthEvents.reduce((sum, e) => sum + (e.articleCount || 0), 0);

        return { scheduled, published, articles, monthName: `${monthIndex + 1}월` };
    };

    const chartData = MONTHS.map(m => getMonthStats(m));

    const totalStats = chartData.reduce((acc, curr) => ({
        scheduled: acc.scheduled + curr.scheduled,
        published: acc.published + curr.published,
        articles: acc.articles + curr.articles
    }), { scheduled: 0, published: 0, articles: 0 });

    const publishedEvents = events.filter(e => e.status === "배포 완료" || (e.status === "예정됨" && e.date < today))
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <div className="space-y-6 pb-12">
            <div className="flex justify-between items-end">
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">성과 리포트</h2>
                    <p className="text-muted-foreground">배포 캘린더 데이터 기반 연간 및 상세 성과 현황입니다.</p>
                </div>
                <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border">
                    <Button variant="ghost" size="sm" onClick={() => setCurrentYear(prev => prev - 1)}>{currentYear - 1}</Button>
                    <div className="px-4 font-bold text-primary">{currentYear}</div>
                    <Button variant="ghost" size="sm" onClick={() => setCurrentYear(prev => prev + 1)}>{currentYear + 1}</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-950/20">
                    <CardHeader className="p-4 pb-2">
                        <CardDescription>배포 계획 (연간)</CardDescription>
                        <CardTitle className="text-2xl">{totalStats.scheduled + totalStats.published}건</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20">
                    <CardHeader className="p-4 pb-2">
                        <CardDescription>배포 완료 (연간)</CardDescription>
                        <CardTitle className="text-2xl text-blue-600 dark:text-blue-400">{totalStats.published}건</CardTitle>
                    </CardHeader>
                </Card>
                <Card className="bg-gradient-to-br from-primary/5 to-white dark:from-primary/10">
                    <CardHeader className="p-4 pb-2">
                        <CardDescription>총 뉴스 기사 수</CardDescription>
                        <CardTitle className="text-2xl text-primary">{totalStats.articles}건</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            <Tabs defaultValue="yearly" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="yearly" className="gap-2"><BarChart3 className="w-4 h-4" /> 연간 현황</TabsTrigger>
                    <TabsTrigger value="archive" className="gap-2"><FileText className="w-4 h-4" /> 성과 자료 아카이브</TabsTrigger>
                </TabsList>

                <TabsContent value="yearly" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>월별 배포 성과 추이</CardTitle>
                            <CardDescription>배포 계획(예정) 대비 배포 완료 및 기사 게재 건수입니다.</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={chartData}
                                    margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                                    onClick={(data: any) => {
                                        if (data && data.activeLabel) {
                                            const month = data.activeLabel.replace('월', '');
                                            router.push(`/calendar?year=${currentYear}&month=${month}`);
                                        }
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis dataKey="monthName" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} dy={10} />
                                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} label={{ value: '배포(건)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#64748b' }} />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12 }}
                                        hide={false}
                                        domain={[0, (dataMax: number) => Math.max(dataMax, 5)]}
                                        label={{ value: '기사(건)', angle: 90, position: 'insideRight', offset: 10, fontSize: 10, fill: '#64748b' }}
                                    />
                                    <Tooltip
                                        cursor={false}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        wrapperStyle={{ pointerEvents: 'none' }}
                                    />
                                    <Legend verticalAlign="top" height={36} />
                                    <Bar
                                        yAxisId="left"
                                        dataKey="scheduled"
                                        name="배포 예정"
                                        fill="#facc15"
                                        radius={[4, 4, 0, 0]}
                                        barSize={20}
                                        style={{ cursor: "pointer" }}
                                    />
                                    <Bar
                                        yAxisId="left"
                                        dataKey="published"
                                        name="배포 완료"
                                        fill="#3b82f6"
                                        radius={[4, 4, 0, 0]}
                                        barSize={20}
                                        style={{ cursor: "pointer" }}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="linear"
                                        dataKey="articles"
                                        name="뉴스 기사 수"
                                        stroke="#18181b"
                                        strokeWidth={3}
                                        dot={{ r: 8, fill: "#18181b", strokeWidth: 3, stroke: "#fff", cursor: "pointer" }}
                                        activeDot={{ r: 10, strokeWidth: 3, stroke: "#fff", cursor: "pointer" }}
                                        legendType="circle"
                                        connectNulls={true}
                                        isAnimationActive={false}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {MONTHS.map(m => {
                            const { scheduled, published, articles } = getMonthStats(m);
                            const hasData = scheduled > 0 || published > 0;

                            return (
                                <Card
                                    key={m}
                                    className={cn("transition-all cursor-pointer hover:border-primary/50 hover:shadow-md", hasData ? "border-primary/20 shadow-sm" : "opacity-60")}
                                    onClick={() => router.push(`/calendar?year=${currentYear}&month=${m + 1}`)}
                                >
                                    <CardHeader className="p-4 pb-1 flex flex-row items-center justify-between">
                                        <CardTitle className="text-base font-bold">{m + 1}월</CardTitle>
                                        <div className="flex items-center gap-1.5">
                                            {articles > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="text-[10px] h-5 cursor-pointer hover:bg-secondary/80 flex items-center gap-1 shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/dashboard?year=${currentYear}&month=${m + 1}`);
                                                    }}
                                                >
                                                    <FileText className="h-3 w-3" />
                                                    {articles}건
                                                </Badge>
                                            )}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full hover:bg-muted"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard?year=${currentYear}&month=${m + 1}`);
                                                }}
                                                title="뉴스 클리핑 보기"
                                            >
                                                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-1">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" /> 예정
                                                </span>
                                                <span className="font-semibold">{scheduled}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="flex items-center gap-1 text-muted-foreground">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" /> 완료
                                                </span>
                                                <span className="font-semibold">{published}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="archive">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div className="space-y-1.5">
                                <CardTitle>보도 성과 아카이빙</CardTitle>
                                <CardDescription>배포된 보도자료의 파일을 업로드하면 텍스트를 분석하여 뉴스 기사 수를 자동으로 추출합니다.</CardDescription>
                            </div>
                            <div>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    ref={bulkInputRef}
                                    accept="image/*,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={handleBulkUpload}
                                />
                                <Button
                                    onClick={() => bulkInputRef.current?.click()}
                                    disabled={isBulkAnalyzing}
                                    className="bg-primary/90 hover:bg-primary"
                                >
                                    {isBulkAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileUp className="w-4 h-4 mr-2" />}
                                    {isBulkAnalyzing ? "분석 및 업로드 중..." : "성과 리포트 일괄 업로드"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {publishedEvents.length === 0 ? (
                                    <div className="text-center py-12 border rounded-lg bg-muted/10 border-dashed">
                                        <p className="text-muted-foreground">아직 배포 완료된 보도자료가 없습니다.</p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-muted/50 border-b">
                                                        <th className="p-3 text-left font-medium">배포일</th>
                                                        <th className="p-3 text-left font-medium">보도자료 제목</th>
                                                        <th className="p-3 text-center font-medium">뉴스 기사 수</th>
                                                        <th className="p-3 text-left font-medium">성과 자료</th>
                                                        <th className="p-3 text-center font-medium w-[80px]">관리</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {publishedEvents.map(event => (
                                                        <tr key={event.id} className="border-b last:border-0 hover:bg-muted/30">
                                                            <td className="p-3 text-muted-foreground w-[120px]">
                                                                {format(event.date, "yyyy-MM-dd", { locale: ko })}
                                                            </td>
                                                            <td className="p-3 font-medium min-w-[200px]">{event.title}</td>
                                                            <td className="p-3 text-center w-[160px]">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <div className="relative flex items-center gap-1">
                                                                        <Input
                                                                            type="number"
                                                                            className="w-16 h-8 text-center"
                                                                            value={event.articleCount || 0}
                                                                            onChange={(e) => handleUpdateArticleCount(event.id, e.target.value)}
                                                                        />
                                                                        {event.articleCount && event.articleCount > 0 ? (
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                                                onClick={() => handleUpdateArticleCount(event.id, 0)}
                                                                                title="기사 수 초기화"
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                            </Button>
                                                                        ) : null}
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className={cn("h-8 w-8 text-primary hover:text-primary hover:bg-primary/5", isFetchingCount === event.id && "animate-spin")}
                                                                            onClick={() => handleFetchArticleCount(event.id, event.title)}
                                                                            disabled={isFetchingCount !== null}
                                                                            title="네이버 뉴스에서 기사 수 동기화"
                                                                        >
                                                                            {isFetchingCount === event.id ? <Loader2 className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
                                                                        </Button>
                                                                    </div>
                                                                    <span className="text-xs text-muted-foreground whitespace-nowrap">건</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-2">
                                                                    {isAnalyzing === event.id ? (
                                                                        <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
                                                                            <Loader2 className="w-3 h-3 animate-spin" />
                                                                            분석 중...
                                                                        </div>
                                                                    ) : event.performanceFileName ? (
                                                                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-100 text-xs">
                                                                            <CheckCircle2 className="w-3 h-3" />
                                                                            <span className="max-w-[150px] truncate">{event.performanceFileName}</span>
                                                                            <Button variant="ghost" size="icon" className="h-4 w-4 ml-1" onClick={() => {
                                                                                const link = document.createElement("a");
                                                                                link.href = event.performanceFile!;
                                                                                link.download = event.performanceFileName!;
                                                                                link.click();
                                                                            }}>
                                                                                <Download className="w-3 h-3" />
                                                                            </Button>
                                                                            <Button variant="ghost" size="icon" className="h-4 w-4 ml-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeletePerformanceFile(event.id)} title="파일 및 데이터 삭제">
                                                                                <X className="w-3 h-3" />
                                                                            </Button>
                                                                        </div>
                                                                    ) : (
                                                                        <Label className="text-xs text-primary font-medium flex items-center gap-1 cursor-pointer hover:underline">
                                                                            <FileUp className="w-3.5 h-3.5" />
                                                                            파일 업로드
                                                                            <input
                                                                                type="file"
                                                                                className="hidden"
                                                                                accept="image/*,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                                                                onChange={(e) => handleFileUpload(event.id, e)}
                                                                            />
                                                                        </Label>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => handleDeleteEvent(event.id)}
                                                                    title="리포트 전체 삭제"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );

}
