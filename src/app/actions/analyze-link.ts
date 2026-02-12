"use server";

import { ApifyClient } from "apify-client";
import { GoogleGenerativeAI } from "@google/generative-ai";

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface AnalysisResult {
    success: boolean;
    data?: any;
    message?: string;
}

/**
 * Gemini API 호출 (재시도 로직 포함)
 */
async function callGeminiWithRetry(
    genAI: GoogleGenerativeAI,
    prompt: string,
    maxRetries: number = 2
): Promise<string | null> {
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"];

    for (const modelName of models) {
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                console.log(`[Gemini] 시도: ${modelName} (${attempt + 1}/${maxRetries + 1})`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const text = result.response.text();
                console.log(`[Gemini] ✅ ${modelName} 성공`);
                return text;
            } catch (e: any) {
                const msg = e.message || "";
                if (msg.includes("429") && attempt < maxRetries) {
                    const waitSec = 15 * (attempt + 1);
                    console.log(`[Gemini] ⏳ 429 Quota 초과. ${waitSec}초 대기 후 재시도...`);
                    await new Promise(r => setTimeout(r, waitSec * 1000));
                    continue;
                }
                if (msg.includes("404")) {
                    console.log(`[Gemini] ❌ ${modelName} 404 — 다음 모델 시도`);
                    break; // 다음 모델로
                }
                console.error(`[Gemini] ❌ ${modelName} 실패:`, msg);
                break;
            }
        }
    }
    return null;
}

/**
 * Gemini 없이 크롤링 데이터에서 직접 추출하는 Fallback 파서
 */
function parseTextFallback(rawText: string, metaTitle: string, url: string) {
    // 브랜드 감지
    let brandName = "정보 없음";
    if (url.includes("desker") || rawText.toLowerCase().includes("desker") || rawText.includes("데스커")) {
        brandName = "데스커(DESKER)";
    }

    // 제목에서 제품명 추출 — "제품명 | 사이트명" 패턴
    let productName = metaTitle;
    if (metaTitle.includes("|")) {
        productName = metaTitle.split("|")[0].trim();
    } else if (metaTitle.includes("-")) {
        productName = metaTitle.split("-")[0].trim();
    }

    // 텍스트에서 특징 추출 시도 — 줄 단위로 의미 있는 문장 필터
    const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 5 && l.length < 150);
    const features: string[] = [];
    const keywords = ["적용", "지원", "기능", "소재", "모터", "높이", "사이즈", "컬러", "설치", "조절", "수납"];

    for (const line of lines) {
        if (features.length >= 3) break;
        if (keywords.some(k => line.includes(k))) {
            features.push(line);
        }
    }

    // 부족하면 일반 줄에서 보충
    if (features.length < 3) {
        for (const line of lines) {
            if (features.length >= 3) break;
            if (!features.includes(line) && line.length > 10 && line.length < 80) {
                features.push(line);
            }
        }
    }

    return {
        brandName,
        productName: productName || "상품 정보 없음",
        definition: `${brandName} ${productName}`,
        features: features.slice(0, 3),
        coreMessages: [productName || "정보 없음"],
        usageContext: "정보 없음",
        launchDate: "",
        discountPromo: "",
        channels: url.includes("desker") ? "데스커 공식몰" : "공식 홈페이지",
        commentIntent: ""
    };
}

export async function analyzeLink(url: string): Promise<AnalysisResult> {
    if (!url) {
        return { success: false, message: "URL is required" };
    }

    console.log("[analyzeLink] 분석 시작:", url);

    try {
        // --- APIFY TOKEN 없을 때 Mock 데이터 ---
        if (!APIFY_TOKEN || APIFY_TOKEN === "apify_api_token_placeholder") {
            console.log("[analyzeLink] APIFY 토큰 없음. Mock 데이터 반환.");
            await new Promise(r => setTimeout(r, 1500));

            if (url.includes("desker") || url.includes("612")) {
                return {
                    success: true,
                    data: {
                        brandName: "데스커(DESKER)",
                        productName: "컴퓨터 데스크 1200",
                        definition: "기본에 충실한 저소음 1인용 컴퓨터 책상",
                        features: ["28mm 고밀도 상판", "빌트인 멀티탭", "친환경 자재"],
                        coreMessages: ["몰입하는 환경", "깔끔한 정리"],
                        usageContext: "재택근무 홈오피스",
                        launchDate: "상시 판매",
                        discountPromo: "신규회원 5% 할인",
                        channels: "공식 홈페이지",
                        commentIntent: "기본기 강조"
                    }
                };
            }
            return { success: false, message: "API Token 없음." };
        }

        // --- Apify 크롤링 ---
        const client = new ApifyClient({ token: APIFY_TOKEN });

        const input = {
            startUrls: [{ url }],
            maxCrawlDepth: 0,
            maxCrawlPages: 1,
            initialConcurrency: 1,
            maxConcurrency: 1,
            crawlerType: "playwright:firefox",
            dynamicContentWaitSecs: 15,
            proxyConfiguration: { useApifyProxy: true },
            removeElementsCssSelector: "nav, footer, script, style, noscript, .ad, .banner",
        };

        console.log("[analyzeLink] Apify 크롤 시작...");
        const run = await client.actor("apify/website-content-crawler").call(input);
        console.log(`[analyzeLink] Run ID: ${run.id}`);

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        interface ApifyResult {
            text?: string;
            markdown?: string;
            title?: string;
            metadata?: { title?: string; description?: string };
            [key: string]: any;
        }

        const crawlResult = (items[0] || {}) as ApifyResult;
        const rawText = crawlResult.text || crawlResult.markdown || "";
        const metaTitle = crawlResult.metadata?.title || crawlResult.title || "";

        console.log(`[analyzeLink] 텍스트 길이: ${rawText.length}, 타이틀: ${metaTitle}`);

        if (rawText.length < 200) {
            console.log("[analyzeLink] ⚠️ 텍스트가 짧음:", rawText.substring(0, 300));
        }

        if (!rawText && !metaTitle) {
            return { success: false, message: "페이지 내용을 가져오지 못했습니다." };
        }

        // --- Gemini 처리 (재시도 + 다중 모델 폴백) ---
        let analyzedData: any = null;

        if (GEMINI_API_KEY && (rawText.length > 50 || metaTitle)) {
            const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
            const brandHint = url.includes("desker") ? "데스커(DESKER)" : "정보 없음";

            const prompt = `
당신은 보도자료 작성 전문가입니다.
아래 제품 페이지 내용을 분석하여 보도자료 팩트 시트를 작성해주세요.
정보가 없는 항목은 "정보 없음"으로 표기하세요.

반드시 아래 JSON 구조로만 응답하세요 (JSON만, 다른 텍스트 없이):

{
  "brandName": "브랜드명",
  "productName": "제품명",
  "definition": "한 줄 정의 (슬로건/테마)",
  "features": ["특징1", "특징2", "특징3"],
  "coreMessages": ["핵심 메시지1", "핵심 메시지2"],
  "usageContext": "타겟 사용자/사용 맥락",
  "launchDate": "출시일",
  "discountPromo": "프로모션/할인 정보",
  "channels": "판매 채널",
  "commentIntent": "관계자 코멘트 요약"
}

브랜드 힌트: ${brandHint}
페이지 타이틀: ${metaTitle}
페이지 내용:
---
${rawText.substring(0, 18000)}
---
`;

            const responseText = await callGeminiWithRetry(genAI, prompt);

            if (responseText) {
                try {
                    const cleaned = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
                    analyzedData = JSON.parse(cleaned);
                    console.log("[analyzeLink] ✅ Gemini 추출 성공:", analyzedData.productName);
                } catch {
                    console.error("[analyzeLink] JSON 파싱 실패");
                }
            }
        }

        // --- Gemini 실패 시 Fallback 파서 사용 ---
        if (!analyzedData) {
            console.log("[analyzeLink] ⚠️ Gemini 사용 불가. Fallback 텍스트 파서 사용.");
            analyzedData = parseTextFallback(rawText, metaTitle, url);
        }

        // 배열 안전 처리
        if (!Array.isArray(analyzedData.features)) analyzedData.features = [];
        if (!Array.isArray(analyzedData.coreMessages)) analyzedData.coreMessages = [];

        return { success: true, data: analyzedData };

    } catch (error: any) {
        console.error("[analyzeLink] 오류:", error);
        return { success: false, message: error.message };
    }
}
