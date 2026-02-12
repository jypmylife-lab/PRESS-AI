"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Check, Copy, ArrowRight, ArrowLeft, Lightbulb, Wand2, Upload, Calendar as CalendarIcon, Info, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { SpecInput, SpecItem } from "@/components/SpecInput";
import { generateDraft } from "./utils";

// Form State Interface
export interface FactSheetData {
    brandName: string;
    productName: string; // Used as Campaign Name for campaign type
    prType: string; // "new_product", "campaign", "trend", "promotion", "issue"
    definition: string; // One-line definition / Theme / Slogan
    features: string[]; // 3 items (confirmed facts only)
    usageContext: string;
    coreMessages: string[]; // 1-2 items
    launchDate: string;
    discountPromo: string; // "mention_forbidden" if empty
    channels: string; // Hyperlink support
    commentIntent: string; // Draft intent for stakeholder comment
    referenceImage: string; // File name
    referenceImageContent: string; // Base64 data
    referenceLink: string; // Step 1 Auto-fill source
    referenceFile: string; // Step 1 Auto-fill source
}

const INITIAL_DATA: FactSheetData = {
    brandName: "데스커(DESKER)",
    productName: "",
    prType: "new_product",
    definition: "",
    features: ["", "", ""],
    usageContext: "",
    coreMessages: ["", ""],
    launchDate: "",
    discountPromo: "",
    channels: "",
    commentIntent: "",
    referenceImage: "",
    referenceImageContent: "",
    referenceLink: "",
    referenceFile: ""
};

const SAMPLE_SPECS: SpecItem[] = [
    { category: 'dimensions', value: 'W1200*D600', detail: '' },
    { category: 'function', value: '전동 높이 조절 모터', detail: '' },
    { category: 'material', value: 'E0 등급 목재', detail: '' }
];

export default function GeneratorPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Fact Sheet, 2: Draft, 3: Final
    const [formData, setFormData] = useState<FactSheetData>(INITIAL_DATA);
    const [specs, setSpecs] = useState<SpecItem[]>([]);
    const [generatedDraft, setGeneratedDraft] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [publishDate, setPublishDate] = useState<Date | undefined>(new Date());

    // Handlers
    const fillSample = () => {
        setFormData({
            ...INITIAL_DATA,
            productName: "모션데스크 알파",
            prType: "new_product",
            definition: "나에게 딱 맞는 높이로 몰입을 돕는 시작점",
            features: ["저소음 프리미엄 모터", "미세 높이 조절 메모리", "클린 배선 솔루션"],
            usageContext: "재택근무 홈오피스",
            coreMessages: ["건강한 업무 습관 형성", "몰입도 높은 나만의 공간"],
            launchDate: "2024년 10월 15일",
            discountPromo: "런칭 기념 20% 할인",
            channels: "데스커 공식몰",
            commentIntent: "가구의 기본인 본질에 집중하면서도 IT 기술을 접목해 편의성을 높였다"
        });
        setSpecs(SAMPLE_SPECS);
    };

    // AI 링크 분석
    const handleAnalyzeReference = async () => {
        if (!formData.referenceLink) {
            alert("분석할 링크를 입력해주세요.");
            return;
        }

        setIsProcessing(true);
        try {
            const { analyzeLink } = await import("../actions/analyze-link");
            const result = await analyzeLink(formData.referenceLink);

            if (result.success && result.data) {
                applyAnalysisData(result.data);
                alert("✅ 링크 분석 완료! 팩트 시트가 채워졌습니다.");
            } else {
                alert(`분석 실패: ${result.message}`);
            }
        } catch (error) {
            console.error("Analysis failed", error);
            alert("분석 중 오류가 발생했습니다.");
        } finally {
            setIsProcessing(false);
        }
    };

    // AI 파일 분석 (PDF, Word, TXT)
    const handleFileAnalyze = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        setFormData(prev => ({ ...prev, referenceFile: file.name }));

        try {
            const { extractTextFromFile } = await import("@/lib/file-parser");
            const text = await extractTextFromFile(file);

            if (!text || text.trim().length < 20) {
                alert("파일에서 충분한 텍스트를 추출하지 못했습니다.");
                setIsProcessing(false);
                return;
            }

            const { analyzeFileContent } = await import("../actions/analyze-file");
            const result = await analyzeFileContent(text, file.name);

            if (result.success && result.data) {
                applyAnalysisData(result.data);
                alert(`✅ 파일 분석 완료! (${file.name})`);
            } else {
                alert(`파일 분석 실패: ${result.message}`);
            }
        } catch (error: any) {
            console.error("File analysis failed:", error);
            alert(`파일 분석 오류: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    // 분석 결과를 팩트 시트에 적용
    const applyAnalysisData = (data: any) => {
        setFormData(prev => ({
            ...prev,
            brandName: data.brandName && data.brandName !== "정보 없음" ? data.brandName : prev.brandName,
            productName: data.productName && data.productName !== "정보 없음" ? data.productName : prev.productName,
            definition: data.definition && data.definition !== "정보 없음" ? data.definition : prev.definition,
            features: Array.isArray(data.features) && data.features.length > 0
                ? [...data.features, "", "", ""].slice(0, 3)
                : prev.features,
            coreMessages: Array.isArray(data.coreMessages) && data.coreMessages.length > 0
                ? [...data.coreMessages, ""].slice(0, 2)
                : prev.coreMessages,
            usageContext: data.usageContext && data.usageContext !== "정보 없음" ? data.usageContext : prev.usageContext,
            launchDate: data.launchDate || prev.launchDate,
            discountPromo: data.discountPromo || prev.discountPromo,
            channels: data.channels || prev.channels,
            commentIntent: data.commentIntent || prev.commentIntent,
        }));
    };

    const handleArrayChange = (field: "features" | "coreMessages", index: number, value: string) => {
        const arr = [...formData[field]];
        arr[index] = value;
        setFormData({ ...formData, [field]: arr });
    };

    const handleNext = () => {
        setIsProcessing(true);
        if (step === 1) {
            // Generate Draft using the new logic
            setTimeout(() => {
                const draft = generateDraft(formData, specs);
                setGeneratedDraft(draft);
                setStep(2);
                setIsProcessing(false);
            }, 1000);
        } else if (step === 2) {
            // Move to Final Manual Edit
            setStep(3);
            setIsProcessing(false);
        }
    };

    const handleAddToCalendar = () => {
        const newEvent = {
            id: Date.now(),
            title: `[${formData.prType === 'new_product' ? '신제품' : 'PR'}] ${formData.brandName} ${formData.productName}`,
            date: publishDate || new Date(),
            status: "예정됨",
            type: "보도자료",
            content: generatedDraft,
            image: formData.referenceImage,
            imageContent: formData.referenceImageContent
        };
        const events = JSON.parse(localStorage.getItem("presscraft-events") || "[]");
        events.push({ ...newEvent, date: newEvent.date.toISOString() });
        localStorage.setItem("presscraft-events", JSON.stringify(events));
        alert(`${format(newEvent.date, "yyyy년 MM월 dd일", { locale: ko })} 일정으로 캘린더에 저장되었습니다.`);
        router.push("/calendar");
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({
                    ...formData,
                    referenceImage: file.name,
                    referenceImageContent: reader.result as string
                });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">전문가형 보도자료 생성</h2>
                <p className="text-muted-foreground">브랜드 맞춤형 로직과 5가지 앵글로 최적화된 보도자료를 만듭니다.</p>
            </div>

            {/* Stepper UI */}
            <div className="flex justify-center">
                <div className="flex items-center gap-4 text-sm font-medium">
                    {[
                        { id: 1, label: "팩트 시트 & 스펙" },
                        { id: 2, label: "AI 초안 생성" },
                        { id: 3, label: "최종 검수" }
                    ].map((s) => (
                        <div key={s.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${step === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                            <span className="w-5 h-5 flex items-center justify-center bg-background/20 rounded-full text-xs">{s.id}</span>
                            {s.label}
                        </div>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* STEP 1: FACT SHEET */}
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <Card className="border-t-4 border-t-primary">
                            <CardHeader className="flex flex-row justify-between items-center bg-slate-50 border-b">
                                <div>
                                    <CardTitle className="flex items-center gap-2">STEP 1. 팩트 시트 (Fact Sheet)</CardTitle>
                                    <CardDescription>보도자료의 재료가 되는 핵심 정보를 입력하세요.</CardDescription>
                                </div>
                                <Button variant="outline" size="sm" onClick={fillSample}><Lightbulb className="w-4 h-4 mr-1 text-yellow-500" /> 샘플 데이터 채우기</Button>
                            </CardHeader>
                            <CardContent className="space-y-8 pt-6">
                                {/* Reference Section */}
                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="font-bold text-blue-800 flex items-center text-sm">
                                            <Wand2 className="w-4 h-4 mr-2" />AI 자동 분석 (참고 자료)
                                        </Label>
                                        {isProcessing && <span className="text-xs text-blue-600 animate-pulse">분석 중... (최대 1분 소요)</span>}
                                    </div>
                                    {/* URL 분석 */}
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="참고 URL (제품 상세페이지, 기사 등)"
                                            value={formData.referenceLink}
                                            onChange={e => setFormData({ ...formData, referenceLink: e.target.value })}
                                            className="bg-white"
                                            disabled={isProcessing}
                                        />
                                        <Button onClick={handleAnalyzeReference} disabled={isProcessing} className="shrink-0 bg-blue-700 text-white hover:bg-blue-800">
                                            {isProcessing ? <Wand2 className="w-4 h-4 animate-spin" /> : "분석하기"}
                                        </Button>
                                    </div>
                                    {/* 파일 업로드 분석 */}
                                    <div className="flex items-center gap-3">
                                        <div className="text-xs text-muted-foreground">또는</div>
                                        <label className="flex-1 flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-blue-200 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                                            <FileText className="w-4 h-4 text-blue-500" />
                                            <span className="text-sm text-blue-700">
                                                {formData.referenceFile ? formData.referenceFile : "PDF, Word, TXT 파일 업로드"}
                                            </span>
                                            <input
                                                type="file"
                                                accept=".pdf,.docx,.doc,.txt"
                                                onChange={handleFileAnalyze}
                                                className="hidden"
                                                disabled={isProcessing}
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Left Column: Basic Info */}
                                    <div className="space-y-6">
                                        <h3 className="font-semibold text-lg flex items-center border-b pb-2">1. 기본 정보</h3>

                                        <div className="space-y-2">
                                            <Label>보도자료 앵글 선택 <span className="text-red-500">*</span></Label>
                                            <select
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-medium"
                                                value={formData.prType}
                                                onChange={e => setFormData({ ...formData, prType: e.target.value })}
                                            >
                                                <option value="new_product">신제품 출시 (제품 스펙 강조)</option>
                                                <option value="campaign">브랜드 캠페인 (가치/철학 강조)</option>
                                                <option value="trend">트렌드 리포트 (인사이트 강조)</option>
                                                <option value="promotion">기획전/프로모션 (혜택 강조)</option>
                                                <option value="issue">브랜드 이슈 (오픈, 협업 등)</option>
                                            </select>
                                            <p className="text-xs text-muted-foreground">
                                                {formData.prType === 'new_product' && "제품의 하드웨어적 특징과 실용성을 중심으로 작성됩니다."}
                                                {formData.prType === 'campaign' && "아이의 가능성, 일잘러의 성장 등 정서적 가치를 강조합니다."}
                                                {formData.prType === 'trend' && "'W.O.R.K'와 같은 거시적 오피스 트렌드와 연결합니다."}
                                                {formData.prType === 'promotion' && "가격 혜택 및 이벤트 기간, 대상을 명확히 전달합니다."}
                                                {formData.prType === 'issue' && "협업, 매장 오픈 등 브랜드의 새로운 소식을 알립니다."}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>브랜드명</Label>
                                                <Input value={formData.brandName} onChange={e => setFormData({ ...formData, brandName: e.target.value })} placeholder="예: 데스커" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>{formData.prType === 'campaign' ? '캠페인명' : '제품/행사명'}</Label>
                                                <Input value={formData.productName} onChange={e => setFormData({ ...formData, productName: e.target.value })} placeholder="입력하세요" />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>한 줄 정의 (슬로건/테마)</Label>
                                            <Input value={formData.definition} onChange={e => setFormData({ ...formData, definition: e.target.value })} placeholder="보도자료를 관통하는 핵심 문구" />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>사용 맥락 (타겟/공간)</Label>
                                            <Input value={formData.usageContext} onChange={e => setFormData({ ...formData, usageContext: e.target.value })} placeholder="예: 재택근무 하는 스타트업 직장인 홈오피스" />
                                        </div>
                                    </div>

                                    {/* Right Column: Details & Specs */}
                                    <div className="space-y-6">
                                        <h3 className="font-semibold text-lg flex items-center border-b pb-2">2. 상세 내용</h3>

                                        {/* Spec Input Component */}
                                        <div className="bg-slate-50 p-4 rounded-lg border">
                                            <SpecInput specs={specs} onChange={setSpecs} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>주요 특징 (Fact 3가지)</Label>
                                            {formData.features.map((f, i) => (
                                                <Input key={i} value={f} onChange={e => handleArrayChange("features", i, e.target.value)} placeholder={`특징 ${i + 1} (예: 28mm 상판 적용)`} className="mb-2" />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="w-full h-px bg-slate-200 my-4" />

                                {/* Bottom Section: Messages */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>핵심 메시지 (Key Message)</Label>
                                            {formData.coreMessages.map((m, i) => (
                                                <Input key={i} value={m} onChange={e => handleArrayChange("coreMessages", i, e.target.value)} placeholder={`메시지 ${i + 1} (예: 몰입하는 환경 조성)`} className="mb-2" />
                                            ))}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>관계자 코멘트 의도</Label>
                                            <Input value={formData.commentIntent} onChange={e => setFormData({ ...formData, commentIntent: e.target.value })} placeholder="인용구에 담길 내용 요약" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>배포/출시일</Label>
                                                <Input value={formData.launchDate} onChange={e => setFormData({ ...formData, launchDate: e.target.value })} placeholder="YYYY년 MM월 DD일" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>채널/링크</Label>
                                                <Input value={formData.channels} onChange={e => setFormData({ ...formData, channels: e.target.value })} placeholder="판매처 또는 홈페이지" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>프로모션/할인 정보</Label>
                                            <Input value={formData.discountPromo} onChange={e => setFormData({ ...formData, discountPromo: e.target.value })} placeholder="내용 입력 (비워두면 생략)" />
                                        </div>
                                    </div>
                                </div>

                            </CardContent>
                            <CardFooter className="flex justify-end p-6 bg-slate-50 border-t">
                                <Button onClick={handleNext} disabled={!formData.brandName || isProcessing} size="lg" className="px-8">
                                    {isProcessing ? <><Wand2 className="animate-spin w-4 h-4 mr-2" /> 분석 및 생성 중...</> : <>가구 전문 보도자료 생성 <ArrowRight className="ml-2 w-4 h-4" /></>}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}

                {/* STEP 2: DRAFT REVIEW */}
                {step === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <Card className="max-w-4xl mx-auto border-t-4 border-t-blue-600 shadow-lg">
                            <CardHeader className="bg-slate-50 border-b">
                                <CardTitle className="flex items-center text-blue-800"><Wand2 className="w-5 h-5 mr-2" /> STEP 2. 생성 결과 (Spec-to-Story 적용됨)</CardTitle>
                                <CardDescription>스펙 분석 엔진과 브랜드 톤이 반영된 결과물입니다.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-8 bg-white min-h-[600px] whitespace-pre-wrap font-serif text-lg leading-loose text-slate-800">
                                    {generatedDraft}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between p-6 bg-slate-50 border-t">
                                <Button variant="outline" onClick={() => setStep(1)}>
                                    <ArrowLeft className="w-4 h-4 mr-2" /> 수정하기 (팩트 시트)
                                </Button>
                                <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                                    최종 검수 및 배포 (Step 3) <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}

                {/* STEP 3: FINAL INSPECTION */}
                {step === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <Card className="max-w-4xl mx-auto border-t-4 border-t-green-600">
                            <CardHeader>
                                <CardTitle>STEP 3. 최종 검수 및 저장</CardTitle>
                                <CardDescription>내용을 최종 확인하고 이미지를 첨부하여 완료하세요.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center gap-4 p-4 border rounded-lg bg-green-50/50 border-green-100">
                                    <div className="flex-1">
                                        <Label className="mb-2 block font-semibold text-green-900">이미지 첨부 (보도자료 배포용)</Label>
                                        <div className="flex items-center gap-2">
                                            <Input type="file" onChange={handleImageUpload} className="max-w-sm bg-white" />
                                            {formData.referenceImage && <span className="text-sm text-green-700 flex items-center bg-green-200 px-2 py-1 rounded"><Check className="w-3 h-3 mr-1" /> {formData.referenceImage}</span>}
                                        </div>
                                    </div>
                                    <Upload className="text-green-300 w-10 h-10" />
                                </div>

                                <Textarea
                                    className="min-h-[600px] font-serif text-lg leading-loose p-8 bg-white text-black resize-none focus:ring-green-500 shadow-inner"
                                    value={generatedDraft}
                                    onChange={(e) => setGeneratedDraft(e.target.value)}
                                />
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(2)}>
                                    <ArrowLeft className="w-4 h-4 mr-2" /> 이전 단계
                                </Button>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm font-medium whitespace-nowrap">배포 희망일:</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-[160px] justify-start text-left font-normal",
                                                        !publishDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {publishDate ? format(publishDate, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="end">
                                                <Calendar
                                                    mode="single"
                                                    selected={publishDate}
                                                    onSelect={setPublishDate}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="flex gap-2 border-l pl-3 ml-3">
                                        <Button variant="outline" onClick={() => navigator.clipboard.writeText(generatedDraft)}>
                                            <Copy className="w-4 h-4 mr-2" /> 복사
                                        </Button>
                                        <Button onClick={handleAddToCalendar} size="lg" className="bg-green-600 hover:bg-green-700">
                                            <Check className="w-4 h-4 mr-2" /> 배포 완료
                                        </Button>
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
