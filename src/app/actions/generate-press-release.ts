"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY || "");

export interface GenerateDraftParams {
    formData: any;
    specs: any[];
    referenceContent?: string; // 분석된 원본 데이터 (Markdown)
}

export async function generatePressReleaseAction({ formData, specs, referenceContent }: GenerateDraftParams) {
    try {
        if (!GEMINI_API_KEY) {
            throw new Error("API Key가 설정되지 않았습니다.");
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

        // 스펙 정보를 문자열로 변환
        const specText = specs.map(s => `- ${s.category}: ${s.value} (${s.detail || ""})`).join("\n");

        // 팩트 시트 정보를 문자열로 변환
        const factSheetText = JSON.stringify(formData, null, 2);

        const prompt = `
당신은 20년 경력의 베테랑 IT/라이프스타일 전문 기자이자 보도자료 작성가입니다.
아래 제공된 [팩트 시트]와 [제품 스펙]을 바탕으로, 미디어에 배포할 전문적인 보도자료 초안을 작성해주세요.

[입력 데이터]
1. 팩트 시트 (사용자 입력):
${factSheetText}

2. 제품 스펙:
${specText}

3. 참고 자료 (웹사이트/파일 분석 원본):
${referenceContent || "참고 자료 없음"}

[작성 지침]
1. **Tone & Manner**: 신뢰감 있고 건조하며 전문적인 어조 (해요체 금지, 하십시오체 금지, ~했다/밝혔다 등 평서문 사용).
2. **구조**:
   - **헤드라인**: 독자의 호기심을 자극하고 핵심 가치를 담은 제목 (메인 타이틀 + 서브 타이틀)
   - **리드문**: 육하원칙에 의거하여 전체 내용을 요약 (서울=날짜 등 형식 준수)
   - **본문**: 
     - 팩트 시트의 '핵심 메시지'와 '주요 특징'을 중심으로 전개.
     - **중요**: 팩트 시트에 내용이 비어있거나 부족한 경우, [참고 자료]의 내용을 적극 활용하여 자연스럽게 문맥을 보완할 것.
     - [제품 스펙]의 내용은 단순 나열하지 말고, 사용자 혜택으로 치환하여 서술 (Spec-to-Story). 예: "1200mm 폭" -> "콤팩트한 공간 활용성 제공"
   - **인용구**: 관계자 코멘트 포함 (브랜드의 비전이나 의도 반영)
   - **마무리**: 출시일, 프로모션, 판매 채널 정보 등
   - **보일러 플레이트**: 브랜드 소개 (간략히)

3. **주의사항**:
   - 거짓된 정보를 지어내지 말 것 (할루시네이션 방지).
   - [참고 자료]가 있더라도 [팩트 시트]의 내용이 우선순위가 높음.
   - 문단 간 연결을 자연스럽게 할 것.

작성된 보도자료 본문만 출력해. (Markdown 형식이나 부가적인 설명 제외)
`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        return { success: true, draft: response.text() };

    } catch (error: any) {
        console.error("보도자료 생성 실패:", error);
        return { success: false, message: error.message || "생성 중 오류 발생" };
    }
}
