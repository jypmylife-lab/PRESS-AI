"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Download, Upload, Edit, Check, X, Trash2, CalendarIcon, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isSameDay, isSameMonth, addDays, subDays, addMonths, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } from "docx";
import { saveAs } from "file-saver";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { isPast, isToday } from "date-fns";
import localforage from "localforage";

// Types
interface Event {
    id: number;
    title: string;
    date: Date;
    status: string;
    type: string;
    content?: string;
    image?: string;
    imageContent?: string;
}

// Mock Events
const MOCK_EVENTS: Event[] = [
    {
        id: 1,
        title: "제품 출시 v2.0",
        date: new Date(2025, 4, 15),
        status: "예정됨",
        type: "보도자료",
        content: "[보도자료]\n\n데스커, 모션데스크 알파 출시\n\n퍼시스그룹의 데스커가 새로운 모션데스크 알파를 출시했습니다...",
        image: "product_v2.jpg"
    }
];

const STORAGE_KEY = "presscraft-events";

function CalendarContent() {
    const searchParams = useSearchParams();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [events, setEvents] = useState<Event[]>([]);
    const [newEventOpen, setNewEventOpen] = useState(false);
    const [newEventTitle, setNewEventTitle] = useState("");
    const [selectedDetailEvent, setSelectedDetailEvent] = useState<Event | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState("");
    const [editContent, setEditContent] = useState("");
    const [editDate, setEditDate] = useState<Date | undefined>(undefined);
    const [viewMode, setViewMode] = useState<'day' | 'month'>('day');
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    // Update currentMonth when date changes (e.g. from header buttons)
    useEffect(() => {
        if (date) {
            setCurrentMonth(date);
        }
    }, [date]);

    // Initial date from query params
    useEffect(() => {
        const year = searchParams.get("year");
        const month = searchParams.get("month");
        if (year && month) {
            const initialDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            if (!isNaN(initialDate.getTime())) {
                setDate(initialDate);
                setCurrentMonth(initialDate);
            }
        }
    }, [searchParams]);

    // Initialize data from localforage with migration fallback
    useEffect(() => {
        const loadData = async () => {
            try {
                let stored = await localforage.getItem<any[]>(STORAGE_KEY);

                // Migration logic: check localStorage if localforage is empty
                if (!stored) {
                    const legacy = localStorage.getItem(STORAGE_KEY);
                    if (legacy) {
                        console.log("Migrating data from localStorage to localforage...");
                        stored = JSON.parse(legacy);
                        await localforage.setItem(STORAGE_KEY, stored);
                    }
                }

                if (stored) {
                    const parsed = stored.map((e: any) => ({
                        ...e,
                        date: new Date(e.date)
                    }));
                    setEvents([...MOCK_EVENTS, ...parsed]);
                } else {
                    setEvents(MOCK_EVENTS);
                }
            } catch (e) {
                console.error("Failed to load events", e);
                setEvents(MOCK_EVENTS);
            }
        };

        loadData();
    }, []);

    const selectedDateEvents = events.filter(e => date && isSameDay(e.date, date));
    const selectedMonthEvents = events.filter(e => date && isSameMonth(e.date, date)).sort((a, b) => a.date.getTime() - b.date.getTime());

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const scheduledDates = events
        .filter(e => e.status === "예정됨" && e.date >= today)
        .map(e => e.date);

    const publishedDates = events
        .filter(e => e.status === "배포됨" || (e.status === "예정됨" && e.date < today))
        .map(e => e.date);

    const handleCreateEvent = async () => {
        if (!date || !newEventTitle) return;
        const newEvent = {
            id: Date.now(),
            title: newEventTitle,
            date: date,
            status: "예정됨",
            type: "보도자료"
        };

        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);
        setNewEventTitle("");
        setNewEventOpen(false);

        const userEvents = updatedEvents.filter(e => e.id !== 1);
        const toSave = userEvents.map(e => ({ ...e, date: e.date.toISOString() }));
        await localforage.setItem(STORAGE_KEY, toSave);
    };

    const handleDownloadImage = (filename: string, content: string) => {
        const link = document.createElement("a");
        link.href = content;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadText = (filename: string, content: string) => {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${filename}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleStartEdit = (event: Event) => {
        setEditTitle(event.title);
        setEditContent(event.content || "");
        setEditDate(event.date);
        setIsEditing(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedDetailEvent || !editDate) return;

        const updatedEvents = events.map(e =>
            e.id === selectedDetailEvent.id
                ? { ...e, title: editTitle, content: editContent, date: editDate }
                : e
        );
        setEvents(updatedEvents);

        setSelectedDetailEvent({
            ...selectedDetailEvent,
            title: editTitle,
            content: editContent,
            date: editDate
        });

        const userEvents = updatedEvents.filter(e => e.id !== 1);
        const toSave = userEvents.map(e => ({ ...e, date: e.date.toISOString() }));
        await localforage.setItem(STORAGE_KEY, toSave);

        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    const handleDeleteEvent = async (id: number) => {
        if (!window.confirm("정말로 이 일정을 삭제하시겠습니까?")) return;

        const updatedEvents = events.filter(e => e.id !== id);
        setEvents(updatedEvents);

        const userEvents = updatedEvents.filter(e => e.id !== 1);
        const toSave = userEvents.map(e => ({ ...e, date: e.date.toISOString() }));
        await localforage.setItem(STORAGE_KEY, toSave);

        setSelectedDetailEvent(null);
    };

    const handleExportToWord = async (event: Event) => {
        try {
            const children: any[] = [
                new Paragraph({
                    text: event.title,
                    heading: HeadingLevel.HEADING_1,
                    spacing: { after: 400 },
                }),
            ];

            if (event.imageContent) {
                const base64Data = event.imageContent.split(",")[1];
                const binaryString = window.atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }

                children.push(
                    new Paragraph({
                        children: [
                            new ImageRun({
                                data: bytes as any,
                                transformation: {
                                    width: 400,
                                    height: 300,
                                },
                            } as any),
                        ],
                        spacing: { after: 400 },
                    })
                );
            }

            if (event.content) {
                const paragraphs = event.content.split("\n").map(line =>
                    new Paragraph({
                        children: [new TextRun(line)],
                        spacing: { after: 200 },
                    })
                );
                children.push(...paragraphs);
            }

            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: children,
                    },
                ],
            });

            const blob = await Packer.toBlob(doc);
            saveAs(blob, `${event.title}.docx`);
        } catch (error) {
            console.error("Failed to export to Word", error);
            alert("Word 파일 생성 중 오류가 발생했습니다.");
        }
    };

    const handlePrev = () => {
        if (!date) return;
        if (viewMode === 'day') {
            setDate(subDays(date, 1));
        } else {
            setDate(subMonths(date, 1));
        }
    };

    const handleNext = () => {
        if (!date) return;
        if (viewMode === 'day') {
            setDate(addDays(date, 1));
        } else {
            setDate(addMonths(date, 1));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">배포 캘린더</h2>
                    <p className="text-muted-foreground">콘텐츠 배포 일정을 관리하세요.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-7 gap-6">
                <div className="md:col-span-3">
                    <Card>
                        <CardContent className="p-4 flex justify-center">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                month={currentMonth}
                                onMonthChange={setCurrentMonth}
                                className="rounded-md border"
                                modifiers={{
                                    scheduled: scheduledDates,
                                    published: publishedDates,
                                }}
                                modifiersClassNames={{
                                    scheduled: "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-yellow-400 after:rounded-full",
                                    published: "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-blue-500 after:rounded-full",
                                }}
                            />
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-4 space-y-4">
                    <div className="flex justify-between items-center bg-muted/30 p-2 rounded-lg">
                        <div className="flex bg-muted rounded-md p-1 gap-1">
                            <Button
                                variant={viewMode === 'day' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('day')}
                                className="h-7 text-xs"
                            >
                                일간 보기
                            </Button>
                            <Button
                                variant={viewMode === 'month' ? 'default' : 'ghost'}
                                size="sm"
                                onClick={() => setViewMode('month')}
                                className="h-7 text-xs"
                            >
                                월간 보기
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={handlePrev} className="h-8 w-8">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <h3 className="text-xl font-semibold min-w-[140px] text-center">
                                {date ? format(date, viewMode === 'day' ? "yyyy년 MM월 dd일" : "yyyy년 MM월", { locale: ko }) : "날짜를 선택하세요"}
                            </h3>
                            <Button variant="ghost" size="icon" onClick={handleNext} className="h-8 w-8">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>

                        <Dialog open={newEventOpen} onOpenChange={setNewEventOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm"><Plus className="w-4 h-4 mr-2" /> 일정 추가</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>새 배포 일정 등록</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>제목</Label>
                                        <Input
                                            value={newEventTitle}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewEventTitle(e.target.value)}
                                            placeholder="예: 신기능 출시 공지"
                                        />
                                    </div>
                                    <Button onClick={handleCreateEvent} className="w-full">등록하기</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {viewMode === 'day' ? (
                        selectedDateEvents.length === 0 ? (
                            <div className="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
                                <p className="text-muted-foreground">이 날짜에 예정된 일정이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedDateEvents.map(event => (
                                    <Card
                                        key={event.id}
                                        className="cursor-pointer hover:border-primary/50 transition-colors"
                                        onClick={() => setSelectedDetailEvent(event)}
                                    >
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-base font-medium">{event.title}</CardTitle>
                                                <Badge
                                                    className={event.status === '배포됨' || event.date < today ? "bg-blue-500 hover:bg-blue-600" : "bg-yellow-400 text-black hover:bg-yellow-500"}
                                                >
                                                    {event.status === '배포됨' || event.date < today ? '배포됨' : '예정됨'}
                                                </Badge>
                                            </div>
                                            <CardDescription>{event.type}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        )
                    ) : (
                        selectedMonthEvents.length === 0 ? (
                            <div className="text-center py-12 border rounded-lg bg-muted/20 border-dashed">
                                <p className="text-muted-foreground">이번 달에 예정된 일정이 없습니다.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {selectedMonthEvents.map(event => (
                                    <Card
                                        key={event.id}
                                        className="cursor-pointer hover:border-primary/50 transition-colors"
                                        onClick={() => setSelectedDetailEvent(event)}
                                    >
                                        <CardHeader className="p-4 pb-2">
                                            <div className="flex justify-between items-start">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs font-bold text-muted-foreground">
                                                        {format(event.date, "MM/dd (eee)", { locale: ko })}
                                                    </span>
                                                    <CardTitle className="text-base font-medium">{event.title}</CardTitle>
                                                </div>
                                                <Badge
                                                    className={event.status === '배포됨' || event.date < today ? "bg-blue-500 hover:bg-blue-600" : "bg-yellow-400 text-black hover:bg-yellow-500"}
                                                >
                                                    {event.status === '배포됨' || event.date < today ? '배포됨' : '예정됨'}
                                                </Badge>
                                            </div>
                                            <CardDescription>{event.type}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>

            <Dialog
                open={!!selectedDetailEvent}
                onOpenChange={(open: boolean) => {
                    if (!open) {
                        setSelectedDetailEvent(null);
                        setIsEditing(false);
                    }
                }}
            >
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto text-foreground">
                    {selectedDetailEvent && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline">{selectedDetailEvent.type}</Badge>
                                        <Badge
                                            className={selectedDetailEvent.status === '배포됨' || selectedDetailEvent.date < today ? "bg-blue-500" : "bg-yellow-400 text-black"}
                                        >
                                            {selectedDetailEvent.status === '배포됨' || selectedDetailEvent.date < today ? '배포됨' : '예정됨'}
                                        </Badge>
                                    </div>
                                    {!isEditing ? (
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteEvent(selectedDetailEvent.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                            <div className="w-[1px] h-4 bg-border mx-1 self-center" />
                                            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => handleExportToWord(selectedDetailEvent)}>
                                                <Download className="w-3.5 h-3.5" /> Word 추출
                                            </Button>
                                            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => handleStartEdit(selectedDetailEvent)}>
                                                <Edit className="w-3.5 h-3.5" /> 수정하기
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground" onClick={handleCancelEdit}>
                                                <X className="w-3.5 h-3.5" /> 취소
                                            </Button>
                                            <Button variant="default" size="sm" className="h-8 gap-1 bg-green-600 hover:bg-green-700" onClick={handleSaveEdit}>
                                                <Check className="w-3.5 h-3.5" /> 저장
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                {isEditing ? (
                                    <div className="space-y-2 mt-2">
                                        <Label className="text-xs text-muted-foreground">일정 제목</Label>
                                        <Input
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="text-xl font-bold h-11"
                                        />
                                    </div>
                                ) : (
                                    <DialogTitle className="text-2xl mt-1">{selectedDetailEvent.title}</DialogTitle>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-muted-foreground">배포 예정일:</span>
                                    {isEditing ? (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    size="sm"
                                                    className={cn(
                                                        "h-8 justify-start text-left font-normal px-2 bg-background",
                                                        !editDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-1 h-3.5 w-3.5" />
                                                    {editDate ? format(editDate, "yyyy년 MM월 dd일", { locale: ko }) : <span>날짜 선택</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={editDate}
                                                    onSelect={setEditDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    ) : (
                                        <p className="text-sm font-medium">
                                            {format(selectedDetailEvent.date, "yyyy년 MM월 dd일", { locale: ko })}
                                        </p>
                                    )}
                                </div>
                            </DialogHeader>

                            <div className="space-y-6 pt-4">
                                {selectedDetailEvent.image && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-muted-foreground">첨부 이미지</Label>
                                            {!isEditing && selectedDetailEvent.imageContent && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-xs gap-1"
                                                    onClick={() => handleDownloadImage(selectedDetailEvent.image!, selectedDetailEvent.imageContent!)}
                                                >
                                                    <Download className="w-3 h-3" /> 다운로드
                                                </Button>
                                            )}
                                        </div>
                                        <div className="p-4 bg-muted/20 rounded-lg flex items-center justify-center border-dashed border-2">
                                            <div className="text-center">
                                                {selectedDetailEvent.imageContent ? (
                                                    <img src={selectedDetailEvent.imageContent} alt={selectedDetailEvent.image} className="max-h-48 rounded mb-2 shadow-sm" />
                                                ) : (
                                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-2 text-muted-foreground">
                                                        <Upload className="w-6 h-6" />
                                                    </div>
                                                )}
                                                <p className="text-sm font-medium">{selectedDetailEvent.image}</p>
                                                <p className="text-xs text-muted-foreground">보도자료 메인 이미지</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-muted-foreground">보도자료 본문</Label>
                                        {!isEditing && selectedDetailEvent.content && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-xs gap-1"
                                                onClick={() => handleDownloadText(selectedDetailEvent.title, selectedDetailEvent.content!)}
                                            >
                                                <Download className="w-3 h-3" /> PR 파일(.txt) 저장
                                            </Button>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <Textarea
                                            className="min-h-[400px] font-serif text-lg leading-relaxed p-6 bg-white text-black resize-none focus-visible:ring-1"
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                        />
                                    ) : (
                                        <div className="p-6 bg-white rounded-lg border font-serif text-lg leading-relaxed whitespace-pre-wrap shadow-inner text-black">
                                            {selectedDetailEvent.content || "저장된 보도자료 내용이 없습니다."}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function CalendarPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <CalendarContent />
        </Suspense>
    );
}
