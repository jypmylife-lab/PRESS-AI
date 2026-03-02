"use server";

import Groq from "groq-sdk";
import { DEFAULT_BRAND_DESCRIPTION } from "../generator/constants";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile"; // 무료, GPT-4급 품질

export interface PressReleaseInput {
    prSubject: string;
    prType: string;
    prTypeCustom?: string;
    brandName: string;
    productName?: string;
    referenceUrl?: string;
    referenceText?: string;
    referenceFile?: string;
    llmQuestions: string[];
    llmAnswers: string[];
    referenceImageName?: string;
    referenceImageContent?: string;
    generateImage?: boolean;
    brandDescription: string;
}

export interface GeneratedPressRelease {
    titles: string[];
    summaries: string[];
    content: string;
}

export async function generatePressReleaseAction(input: PressReleaseInput): Promise<{
    success: boolean;
    data?: GeneratedPressRelease;
    message?: string;
}> {
    if (!process.env.GROQ_API_KEY) {
        return { success: false, message: "GROQ_API_KEY가 설정되지 않았습니다." };
    }

    const typeLabel =
        input.prType === "product" ? "신제품/제품 소개" :
            input.prType === "campaign" ? "브랜드 캠페인 소개" :
                input.prType === "activity" ? "브랜드 활동 소개" :
                    input.prTypeCustom || "기타";

    const llmSection = input.llmQuestions.filter(Boolean).length > 0
        ? input.llmQuestions.filter(Boolean)
            .map((q, i) => `Q: ${q}\nA: ${input.llmAnswers[i] || "(답변 없음)"}`)
            .join("\n\n")
        : "없음";

    const systemPrompt = `당신은 10년차 PR 전문가이자 산업 전문 기자입니다.
광고성 표현을 배제하고, 언론사에 배포 가능한 기사 문법으로 보도자료를 작성하세요.
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.
{"titles":["제목1","제목2","제목3","제목4","제목5"],"summaries":["요약1","요약2","요약3","요약4","요약5"],"content":"본문 전체(줄바꿈은 \\n)"}`;

    const userPrompt = `아래 정보로 전문 보도자료를 작성해주세요.

[보도자료 주제] ${input.prSubject}
[보도자료 유형] ${typeLabel}
[브랜드명] ${input.brandName}
${input.productName ? `[제품/캠페인명] ${input.productName}` : ""}

[참고 자료]
${input.referenceText || "없음"}

[LLM SEO 노출 전략 (참고용 검색 질문 및 답변)]
다음 질문이 검색될 경우 기사 일부가 답변으로 활용될 수 있도록 문장을 구성하세요.
${llmSection}

[브랜드 소개]
${input.brandDescription}

[작성 구성 - 반드시 다음 순서를 따르세요]
1. 뉴스형 헤드라인
2. 리드문 (2~3문장)
3. 산업/시장 배경과 출시 맥락 (단순 제품 설명이 아닌 산업 트렌드 관점에서 서술)
4. 차별화된 핵심 가치 (구체 수치 포함)
5. 타겟 고객 및 활용 시나리오
6. 브랜드 관계자 인용문 (3~4문장)
7. LLM 검색 질문을 자연스럽게 설명 문장 안에 포함 (위 SEO 질문에 대한 대답이 기사 내용으로 읽히도록 구성)
8. 마무리 및 향후 계획
9. 브랜드 소개 별도 구분 (기사 하단에 제공된 브랜드 소개 그대로 삽입)

[작성 원칙 - 다음 사항을 100% 엄수할 것]
- 분량: 1200~1500자
- [필수] 간결하고 자연스러운 한국어 기사체(평서문)로 작성하되, 문단 내에서 문장 어미와 구조를 다양하게 사용하여 기계적인 느낌을 완전히 없앨 것
- [금지] 어색한 번역투, 영문 직역 투, 지나치게 딱딱한 한자어 사용을 절대 금지함 (예: '~에 있어서', '~함에 따라', '제고하다', '수반하다' 등 배제)
- [금지] 동일한 단어, 동일한 의미의 문장, 유사한 문장 구조가 한 기사 내에서 2회 이상 반복되는 것을 엄격히 금지함
- [필수] 각 문단은 이전 문단과 겹치지 않는 완전히 새로운 정보를 담아야 함
- [금지] '최첨단', '완벽한', '혁신적인', '다양한 경험' 등 진부하고 추상적인 미사여구를 절대 금지하며 오직 구체적 팩트와 수치로 대체할 것
- 단순 기능 나열 금지: 제품 기능 설명만으로 기사를 구성하지 말고, 해당 기능이 시장과 소비자에게 주는 효용과 산업적 배경을 연결하여 서술할 것
- "~할 수 있다", "~가능하다", "~할 예정이다" 어미 반복 금지
- FAQ 형식 (Q&A 질의응답 형태) 사용 절대 금지
- 경제지 산업부 전문 기사 톤 유지
- 경쟁 제품 대비 당사 제품만의 독보적 차별점 1문장 필수 포함
- 할루시네이션(임의 사실 생성) 절대 금지`;

    try {
        console.log(`[generatePR] Groq ${MODEL} 호출`);
        const response = await groq.chat.completions.create({
            model: MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 4096,
        });

        const rawText = response.choices[0].message.content || "";
        const parsed: GeneratedPressRelease = JSON.parse(rawText);
        console.log(`[generatePR] ✅ 성공`);
        return { success: true, data: parsed };

    } catch (error: any) {
        console.error("[generatePR] ❌ 실패:", error.message);
        const msg = error.message || "";
        const userMsg = msg.includes("429")
            ? "요청 한도 초과. 잠시 후 다시 시도해주세요."
            : `생성 실패: ${msg.slice(0, 100)}`;
        return { success: false, message: userMsg };
    }
}
