"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, RefreshCcw, ArrowRight, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Mock Data
const MOCK_KEYWORDS = ["AI 기술", "혁신", "보도자료", "스타트업", "글로벌 시장", "시리즈 A", "신제품 출시", "업무 효율화"];

const TEMPLATE = (name: string, desc: string, keywords: string[]) => `
[보도자료]

${name.toUpperCase()}, 업계를 선도할 혁신적인 솔루션 출시

[서울, 2025년 5월 20일] — 업계의 선도적 기업인 ${name}은(는) 오늘 기업들이 ${keywords[0] || "운영 방식"}을 혁신할 수 있도록 돕는 획기적인 새로운 솔루션을 출시한다고 발표했습니다.

${name}의 대표이사는 "${desc}"라고 말하며, "이번 출시는 우리가 고객들에게 ${keywords[1] || "최고의 가치"}를 제공하고자 하는 미션에 있어 중요한 이정표가 될 것입니다."라고 강조했습니다.

주요 특징:
- 핵심 기능 1: 최첨단 기술 통합을 통한 ${keywords[2] || "생산성"} 향상.
- 핵심 기능 2: ${keywords[3] || "AI 기반"}의 데이터 분석 및 인사이트 제공.

${name} 소개:
${name}은(는) 현대 비즈니스가 직면한 과제를 해결하기 위해 최상의 솔루션을 제공하는 데 전념하고 있습니다.

언론 문의:
담당자: 홍보팀
이메일: press@${name.toLowerCase().replace(/\s/g, "")}.com
`;

export default function GeneratorPage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        productName: "",
        url: "",
        description: "",
    });
    const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
    const [generatedContent, setGeneratedContent] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleNext = () => {
        if (step === 1) {
            // Analyze (Mock)
            setIsGenerating(true);
            setTimeout(() => {
                setIsGenerating(false);
                setStep(2);
            }, 1500);
        } else if (step === 2) {
            // Generate (Mock)
            setIsGenerating(true);
            setTimeout(() => {
                const content = TEMPLATE(formData.productName, formData.description, selectedKeywords);
                setGeneratedContent(content);
                setIsGenerating(false);
                setStep(3);
            }, 2000);
        }
    };

    const toggleKeyword = (kw: string) => {
        if (selectedKeywords.includes(kw)) {
            setSelectedKeywords(selectedKeywords.filter(k => k !== kw));
        } else {
            if (selectedKeywords.length < 5) {
                setSelectedKeywords([...selectedKeywords, kw]);
            }
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">AI 보도자료 생성기</h2>
                <p className="text-muted-foreground">전문적인 보도자료를 몇 분 만에 작성하세요.</p>
            </div>

            {/* Stepper */}
            <div className="flex justify-center items-center gap-4 mb-8">
                {[1, 2, 3].map((s) => (
                    <div key={s} className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                            {step > s ? <Check className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && <div className={`w-12 h-1 bg-muted ${step > s ? 'bg-primary' : ''}`} />}
                    </div>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>기본 정보</CardTitle>
                                <CardDescription>보도자료의 주제와 핵심 내용을 입력해주세요.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>제품/서비스 또는 회사명</Label>
                                    <Input
                                        placeholder="예: PressCraft AI"
                                        value={formData.productName}
                                        onChange={e => setFormData({ ...formData, productName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>웹사이트 URL (선택)</Label>
                                    <Input
                                        placeholder="https://..."
                                        value={formData.url}
                                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>핵심 메시지 / 상세 설명</Label>
                                    <Textarea
                                        placeholder="보도자료에 들어갈 주요 내용을 서술해주세요..."
                                        className="h-32"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button onClick={handleNext} disabled={!formData.productName || !formData.description || isGenerating}>
                                    {isGenerating ? "분석 중..." : "다음: 키워드 선택"}
                                    {!isGenerating && <ArrowRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>키워드 선택</CardTitle>
                                <CardDescription>보도자료에 강조할 키워드를 최대 5개 선택하세요.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {MOCK_KEYWORDS.map(kw => (
                                        <Badge
                                            key={kw}
                                            variant={selectedKeywords.includes(kw) ? "default" : "outline"}
                                            className="cursor-pointer text-sm py-1 px-3"
                                            onClick={() => toggleKeyword(kw)}
                                        >
                                            {kw}
                                        </Badge>
                                    ))}
                                </div>
                                <p className="text-xs text-muted-foreground mt-4">선택됨: {selectedKeywords.length}/5</p>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="ghost" onClick={() => setStep(1)}>이전</Button>
                                <Button onClick={handleNext} disabled={selectedKeywords.length === 0 || isGenerating}>
                                    {isGenerating ? "보도자료 생성 중..." : "보도자료 생성하기"}
                                    {!isGenerating && <ArrowRight className="ml-2 h-4 w-4" />}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle>생성된 보도자료</CardTitle>
                                <CardDescription>초안을 확인하고 복사하거나 저장하세요.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={generatedContent}
                                    onChange={(e) => setGeneratedContent(e.target.value)}
                                    className="min-h-[400px] font-mono text-sm leading-relaxed"
                                />
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(1)}><RefreshCcw className="mr-2 h-4 w-4" /> 다시 시작</Button>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => navigator.clipboard.writeText(generatedContent)}>
                                        <Copy className="mr-2 h-4 w-4" /> 복사하기
                                    </Button>
                                    <Button>임시 저장</Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
