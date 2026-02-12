"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface AnalysisResult {
    success: boolean;
    data?: any;
    message?: string;
}

/**
 * Gemini API 호출 (재시도 + 다중 모델 폴백)
 */
async function callGeminiWithRetry(
    prompt: string,
    maxRetries: number = 2
): Promise<string | null> {
    if (!GEMINI_API_KEY) return null;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];

    for (const modelName of models) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[analyzeFile/Gemini] 시도: ${modelName} (${attempt + 1}/${maxRetries + 1})`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const text = result.response.text();
                console.log(`[analyzeFile/Gemini] ✅ ${modelName} 성공`);
                return text;
            } catch (e: any) {
                const msg = e.message || "";
                if (msg.includes("429") && attempt < maxRetries) {
                    const waitSec = 15 * (attempt + 1);
                    console.log(`[analyzeFile/Gemini] ⏳ 429 Quota 초과. ${waitSec}초 대기...`);
                    await new Promise(r => setTimeout(r, waitSec * 1000));
                    continue;
                }
                if (msg.includes("404")) {
                    console.log(`[analyzeFile/Gemini] ❌ ${modelName} 404 — 다음 모델`);
                    break;
                }
                console.error(`[analyzeFile/Gemini] ❌ ${modelName} 실패:`, msg);
                break;
            }
        }
    }
    return null;
}

/**
 * 파일에서 추출된 텍스트를 Gemini로 분석하여 팩트 시트 데이터 생성
 */
export async function analyzeFileContent(
    text: string,
    fileName: string
): Promise<AnalysisResult> {
    if (!text || text.trim().length < 20) {
        return { success: false, message: "파일에서 충분한 텍스트를 추출하지 못했습니다." };
    }

    console.log(`[analyzeFile] 파일 분석 시작: ${fileName}, 텍스트 길이: ${text.length}`);

    const prompt = `
당신은 보도자료 작성 전문가입니다.
아래 문서에서 제품/브랜드 정보를 추출하여 보도자료 팩트 시트를 작성해주세요.
정보가 없는 항목은 "정보 없음"으로 표기하세요.

반드시 아래 JSON 구조로만 응답하세요 (JSON만, 다른 텍스트 없이):

{
  "brandName": "브랜드명",
  "productName": "제품명 또는 캠페인명",
  "definition": "한 줄 정의 (슬로건/테마)",
  "features": ["특징1", "특징2", "특징3"],
  "coreMessages": ["핵심 메시지1", "핵심 메시지2"],
  "usageContext": "타겟 사용자/사용 맥락",
  "launchDate": "출시일/배포일",
  "discountPromo": "프로모션/할인 정보",
  "channels": "판매 채널",
  "commentIntent": "관계자 코멘트 요약"
}

문서 내용:
---
${text.substring(0, 20000)}
---
`;

    const responseText = await callGeminiWithRetry(prompt);

    if (responseText) {
        try {
            const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleaned);
            console.log(`[analyzeFile] ✅ Gemini 분석 성공: ${parsed.productName}`);

            if (!Array.isArray(parsed.features)) parsed.features = [];
            if (!Array.isArray(parsed.coreMessages)) parsed.coreMessages = [];

            return { success: true, data: parsed };
        } catch {
            console.error("[analyzeFile] JSON 파싱 실패");
        }
    }

    // Gemini 완전 실패 시 — 간단한 텍스트 파싱 폴백
    console.log("[analyzeFile] ⚠️ Gemini 사용 불가. 기본 파싱 시도.");
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 5 && l.length < 150);
    const firstMeaningfulLine = lines.find(l => l.length > 10) || fileName;

    return {
        success: true,
        data: {
            brandName: "정보 없음",
            productName: firstMeaningfulLine,
            definition: "정보 없음 (Gemini API 할당량 초과)",
            features: lines.slice(0, 3),
            coreMessages: [],
            usageContext: "정보 없음",
            launchDate: "",
            discountPromo: "",
            channels: "",
            commentIntent: ""
        },
        message: "⚠️ AI 할당량 초과로 기본 파싱만 적용됨. 수동으로 보완해주세요."
    };
}
