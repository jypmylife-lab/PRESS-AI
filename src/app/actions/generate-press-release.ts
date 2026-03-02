"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

const DEFAULT_BRAND_DESCRIPTION = `데스커(DESKER) 브랜드 소개
퍼시스그룹의 데스커(DESKER)는 도전하고 성장하는 사람들을 위한 No.1 워크 앤 라이프스타일 브랜드를 지향하며, 높은 집중력과 유연한 생각을 발휘하는데 최적화된 제품을 선보이고 있다. 국내 주요 코워킹 스페이스와 디자이너 브랜드 오피스, 스타트업 이노베이터들의 선택을 받은 데스커는 사무가구에 한정하지 않고 홈오피스, 리빙, 취미생활 등 사용자의 목적과 라이프스타일에 따라 어느 공간에서나 활용도가 높은 제품, 본질과 핵심에 집중한 가구를 통해 일반 소비자들에게도 제품력과 브랜드 가치를 인정받고 있다. 또한 퍼시스그룹이 보유한 생산, 물류, 시공, A/S 인프라를 활용해 높은 품질의 제품과 서비스를 제공한다. 자세한 정보는 홈페이지(http://www.desker.co.kr)를 통해 확인할 수 있다.`;

export { DEFAULT_BRAND_DESCRIPTION };

export interface PressReleaseInput {
    // 기본 정보
    prSubject: string;         // 보도자료 주제
    prType: string;            // 유형: product / campaign / activity / other
    prTypeCustom?: string;     // 기타 직접 입력
    brandName: string;
    productName?: string;

    // 참고 자료
    referenceUrl?: string;
    referenceText?: string;    // 직접 입력 또는 파일/URL에서 추출된 텍스트
    referenceFile?: string;    // 파일명

    // LLM 노출 전략
    llmQuestions: string[];    // LLM에 노출되고 싶은 질문들
    llmAnswers: string[];      // 해당 질문의 노출 희망 답변

    // 이미지
    referenceImageName?: string;
    referenceImageContent?: string;  // base64
    generateImage?: boolean;

    // 브랜드 소개
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
    try {
        if (!GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY가 설정되지 않았습니다.");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

        // 유형 라벨 변환
        const typeLabel =
            input.prType === "product" ? "신제품/제품 소개" :
                input.prType === "campaign" ? "브랜드 캠페인 소개" :
                    input.prType === "activity" ? "브랜드 활동 소개" :
                        input.prTypeCustom || "기타";

        // LLM 노출 전략 섹션 생성
        const llmSection = input.llmQuestions.length > 0
            ? input.llmQuestions.map((q, i) =>
                `Q: ${q}\nA: ${input.llmAnswers[i] || "(답변 없음)"}`
            ).join("\n\n")
            : "없음";

        const prompt = `
당신은 20년 경력의 PR 전문가이자 미디어 보도자료 작성 전문가입니다.
아래 입력 정보를 분석하여 전문적이고 실제 배포 가능한 수준의 보도자료를 작성해주세요.

[입력 정보]
━━━━━━━━━━━━━━━━━━━━━━━━
📌 보도자료 주제: ${input.prSubject}
📌 보도자료 유형: ${typeLabel}
📌 브랜드명: ${input.brandName}
${input.productName ? `📌 제품/캠페인명: ${input.productName}` : ""}

📎 참고 자료 (URL/파일/직접 입력):
${input.referenceText || "없음"}

🎯 LLM SEO 노출 전략 (보도자료 본문에 자연스럽게 녹여낼 것):
${llmSection}

🏢 브랜드 소개 (보일러플레이트):
${input.brandDescription}
━━━━━━━━━━━━━━━━━━━━━━━━

[작성 지침]
1. **문체**: 신뢰감 있고 건조하며 전문적인 보도자료 문체 (평서문, ~했다/밝혔다 형식, 해요체·구어체 금지)
2. **분량**: 본문 1000~1500자 내외
3. **구조**:
   - 리드문: 육하원칙 기반 (서울=날짜 형식)
   - 본문: 핵심 메시지 3~4단락
   - 인용구: 관계자 코멘트 1~2개
   - 마무리: 제품/행사 정보, 채널 안내
   - 보일러플레이트: 브랜드 소개 문구를 정확히 그대로 삽입
4. **LLM 노출 전략**: LLM SEO 섹션의 Q&A를 보도자료 내 자연스러운 FAQ 섹션 또는 전문가 코멘트 인용 형태로 본문에 녹여낼 것
5. **할루시네이션 금지**: 참고 자료에 없는 수치나 사실을 지어내지 말 것

[출력 형식 — 반드시 아래 JSON 형식으로만 출력, 다른 설명 절대 없이]
{
  "titles": ["제목 후보 1", "제목 후보 2", "제목 후보 3", "제목 후보 4", "제목 후보 5"],
  "summaries": ["요약문 1 (1~2문장)", "요약문 2", "요약문 3", "요약문 4", "요약문 5"],
  "content": "보도자료 본문 전체 (줄바꿈은 \\n으로 표시)"
}
`;

        const result = await model.generateContent(prompt);
        const rawText = result.response.text().trim();

        // JSON 파싱 (마크다운 코드블록 제거 후)
        const jsonText = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
        const parsed: GeneratedPressRelease = JSON.parse(jsonText);

        return { success: true, data: parsed };

    } catch (error: any) {
        console.error("보도자료 생성 실패:", error);
        return { success: false, message: error.message || "생성 중 오류 발생" };
    }
}
