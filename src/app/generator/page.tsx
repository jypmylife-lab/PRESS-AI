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
const MOCK_KEYWORDS = ["AI Technology", "Innovation", "Press Release", "Startup", "Global Market", "Series A", "Product Launch", "Efficiency"];

const TEMPLATE = (name: string, desc: string, keywords: string[]) => `
FOR IMMEDIATE RELEASE

${name.toUpperCase()} REVOLUTIONIZES THE INDUSTRY WITH NEW LAUNCH

[CITY, Date] — ${name}, a leading innovator in the field, today announced the launch of its groundbreaking new solution designed to transform how businesses approach ${keywords[0] || "their operations"}.

"${desc}" says the CEO of ${name}. "This launch marks a significant milestone in our mission to deliver ${keywords[1] || "excellence"}."

Key Features:
- Feature 1: Cutting-edge integration.
- Feature 2: Enhanced performance driven by ${keywords[2] || "AI"}.

About ${name}:
${name} is dedicated to providing top-tier solutions for modern challenges.

Media Contact:
Name: Media Team
Email: press@${name.toLowerCase().replace(/\s/g, "")}.com
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
                <h2 className="text-3xl font-bold tracking-tight">AI Press Release Generator</h2>
                <p className="text-muted-foreground">Create professional press releases in minutes.</p>
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
                                <CardTitle>Basics</CardTitle>
                                <CardDescription>Tell us about what you want to announce.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Product / Company Name</Label>
                                    <Input
                                        placeholder="e.g. PressCraft AI"
                                        value={formData.productName}
                                        onChange={e => setFormData({ ...formData, productName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Website URL (Optional)</Label>
                                    <Input
                                        placeholder="https://..."
                                        value={formData.url}
                                        onChange={e => setFormData({ ...formData, url: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Key Message / Description</Label>
                                    <Textarea
                                        placeholder="Describe the main announcement..."
                                        className="h-32"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                <Button onClick={handleNext} disabled={!formData.productName || !formData.description || isGenerating}>
                                    {isGenerating ? "Analyzing..." : "Next: Select Keywords"}
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
                                <CardTitle>Keywords</CardTitle>
                                <CardDescription>Select up to 5 keywords related to your announcement.</CardDescription>
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
                                <p className="text-xs text-muted-foreground mt-4">Selected: {selectedKeywords.length}/5</p>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                                <Button onClick={handleNext} disabled={selectedKeywords.length === 0 || isGenerating}>
                                    {isGenerating ? "Generating Draft..." : "Generate Press Release"}
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
                                <CardTitle>Your Press Release</CardTitle>
                                <CardDescription>Review and copy your draft.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={generatedContent}
                                    onChange={(e) => setGeneratedContent(e.target.value)}
                                    className="min-h-[400px] font-mono text-sm leading-relaxed"
                                />
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(1)}><RefreshCcw className="mr-2 h-4 w-4" /> Start Over</Button>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => navigator.clipboard.writeText(generatedContent)}>
                                        <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
                                    </Button>
                                    <Button>Save to Drafts</Button>
                                </div>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
