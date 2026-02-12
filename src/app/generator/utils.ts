import { FactSheetData, SpecItem } from "./page";

// --- 1. Spec-to-Story Engine (Rule-based) ---
// Maps physical specs to lifestyle benefits
const mapSpecToStory = (specs: SpecItem[]): string[] => {
    return specs.map(spec => {
        const val = spec.value.toLowerCase();

        // Dimensions Logic
        if (spec.category === 'dimensions') {
            if (val.includes('1200') || val.includes('1000')) return `${spec.value} 사이즈로 콤팩트한 공간에도 여유롭게 배치하여 나만의 홈오피스를 완성할 수 있다.`;
            if (val.includes('1400') || val.includes('1600') || val.includes('1800')) return `${spec.value}의 넉넉한 사이즈로 멀티태스킹에 최적화된 넓은 작업 공간을 제공한다.`;
            return `${spec.value}의 효율적인 규격으로 공간 활용성을 극대화했다.`;
        }

        // Material Logic
        if (spec.category === 'material') {
            if (val.includes('e0') || val.includes('친환경')) return `엄격한 품질 관리를 거친 ${spec.value} 자재를 사용하여 건강한 학습 및 업무 환경을 조성한다. 이는 ESG 경영을 실천하는 브랜드의 철학을 담고 있다.`;
            if (val.includes('lpm') || val.includes('강화')) return `스크래치와 오염에 강한 ${spec.value} 마감을 적용하여, 오랜 사용에도 변함없는 내구성을 자랑한다.`;
        }

        // Function Logic
        if (spec.category === 'function') {
            if (val.includes('모터') || val.includes('높이')) return `${spec.value} 기능을 통해 사용자의 체형과 컨디션에 맞춘 최적의 높이를 제공, 업무 몰입도를 비약적으로 높여준다.`;
            if (val.includes('조명') || val.includes('led')) return `${spec.value} 기능은 눈의 피로를 최소화하여 장시간 집중이 필요한 작업에 도움을 준다.`;
            if (val.includes('수납') || val.includes('배선')) return `${spec.value} 솔루션을 통해 복잡한 데스크 위를 깔끔하게 정리, 심리적 안정감을 주는 인테리어 효과까지 누릴 수 있다.`;
        }

        // Default Fallback
        return spec.detail ? `${spec.value} - ${spec.detail}` : `${spec.value}를 통해 사용자 편의성을 높였다.`;
    });
};

// --- 2. Brand Voice & Keywords ---
const BRAND_KEYWORDS = {
    growth: ["가능성", "성장", "도전", "몰입", "워크 앤 라이프스타일", "일잘러", "주체적인 삶"],
    voice: "전문적이지만 권위적이지 않고, 사용자의 성장을 응원하는 톤"
};

// --- 3. Template Generators ---

// A. New Product Launch (신제품 출시)
const templateNewProduct = (data: FactSheetData, stories: string[]) => {
    return `[신제품 출시]
    
${data.brandName}, ${data.usageContext}에 최적화된 '${data.productName}' 출시... "${data.definition}"

- ${data.coreMessages[0]}
- ${data.coreMessages[1]}

(서울=00월 00일) ${data.brandName}가 ${data.usageContext}를 위한 신제품 '${data.productName}'을(를) ${data.launchDate} 정식 출시한다고 밝혔다. 이번 신제품은 "${data.definition}"을 핵심 가치로 내세우며, 단순한 가구를 넘어 사용자의 성장을 돕는 파트너로서 기획되었다.

최근 '하이브리드 워크'가 보편화되면서 공간의 역할이 중요해지는 가운데, ${data.brandName}는 사용자의 실제 행동 데이터를 심층 분석하여 몰입을 방해하는 요소를 제거하고 집중력을 높여주는 솔루션을 개발했다.

신제품 '${data.productName}'의 차별화된 특징은 다음과 같다.

첫째, ${stories[0] || `${data.features[0]} 기능을 탑재하여 사용성을 강화했다.`}
둘째, ${stories[1] || `${data.features[1]}을(를) 통해 차별화된 경험을 제공한다.`}
셋째, ${stories[2] || `${data.features[2]} 적용으로 디테일한 부분까지 완성도를 높였다.`}

${data.brandName} CXM팀 관계자는 "${data.commentIntent}"라며 "앞으로도 ${data.brandName}는 '가능성'을 응원하는 워크 앤 라이프스타일 브랜드로서 고객의 삶에 긍정적인 변화를 주는 제품을 지속적으로 선보일 것"이라고 전했다.

${data.discountPromo ? `한편, 이번 출시를 기념하여 ${data.discountPromo} 혜택을 제공한다.` : ""} 제품에 대한 자세한 정보는 ${data.channels}에서 확인할 수 있다.

# # #

[브랜드 소개: ${data.brandName}]
퍼시스그룹의 ${data.brandName}는 도전하고 성장하는 사람들을 위한 워크 앤 라이프스타일 브랜드입니다. 단순히 가구를 만드는 것을 넘어, 사용자가 자신의 가능성을 발견하고 몰입할 수 있는 최적의 환경을 제안합니다.`;
};

// B. Brand Campaign (브랜드 캠페인)
const templateCampaign = (data: FactSheetData) => {
    return `[브랜드 캠페인]

${data.brandName}, "${data.definition}" 테마로 신규 캠페인 전개... ${data.coreMessages[0]}

- ${data.productName} 캠페인 통해 '${BRAND_KEYWORDS.growth[1]}'과 '${BRAND_KEYWORDS.growth[3]}' 메시지 전달
- ${data.usageContext} 속 '나다운 성장'을 응원하는 브랜드 철학 담아

(서울=00월 00일) 워크 앤 라이프스타일 브랜드 ${data.brandName}가 새로운 브랜드 캠페인 '${data.productName}'을 공개하며 고객 소통 강화에 나선다. 이번 캠페인은 "${data.definition}"이라는 슬로건 아래, 주체적인 삶을 살아가는 모든 이들의 '${BRAND_KEYWORDS.growth[0]}'을 응원하기 위해 기획되었다.

캠페인의 핵심 메시지는 두 가지다. 첫째, ${data.coreMessages[0]}이다. 이는 단순한 응원을 넘어 실질적인 변화를 이끌어내겠다는 의지를 담고 있다. 둘째, ${data.coreMessages[1]}을(를) 통해 ${data.brandName}만의 진정성 있는 브랜드 가치를 전달한다.

특히 이번 캠페인에서는 ${data.features[0]} 등 소비자가 직접 참여할 수 있는 다양한 프로그램을 마련하여 '소통'과 '경험'을 중시하는 MZ세대 '일잘러'들의 높은 호응이 기대된다.

${data.brandName} 브랜드 관계자는 "${data.commentIntent}"라며 "가구가 놓인 공간이 단순한 물리적 장소가 아니라, 꿈을 키우고 성장을 도모하는 인큐베이팅 공간이 되기를 바란다"고 밝혔다.

한편, ${data.brandName}는 이번 캠페인 런칭을 기념해 ${data.discountPromo || "다양한 온/오프라인 이벤트"}를 진행한다. 자세한 내용은 ${data.channels}에서 확인할 수 있다.

# # #

[브랜드 소개: ${data.brandName}]
(보일러플레이트 자동 삽입)`;
};


// C. Trend Report (트렌드 리포트)
const templateTrend = (data: FactSheetData) => {
    return `[업계 트렌드]

"오피스의 변화, 가구가 주도한다"... ${data.brandName}가 제안하는 ${data.usageContext} 트렌드

- ${data.productName} 키워드로 본 2024년 라이프스타일 전망
- ${data.coreMessages[0]}

(서울=00월 00일) 팬데믹 이후 업무와 휴식의 경계가 희미해지는 '블러(Blur)' 현상이 가속화되면서 가구 트렌드 또한 급변하고 있다. 워크 앤 라이프스타일 브랜드 ${data.brandName}는 빅데이터 분석을 통해 올해의 핵심 키워드로 '${data.productName}'을(를) 선정하고 새로운 공간 솔루션을 제안했다.

${data.brandName}가 주목한 트렌드는 '${data.definition}'이다. 과거에는 획일화된 사무 공간이 주를 이뤘다면, 이제는 개개인의 업무 패턴과 취향을 반영한 '커스터마이징' 공간이 대세로 자리 잡았다.

이에 발맞춰 ${data.brandName}는 ▲${data.features[0]} ▲${data.features[1]} ▲${data.features[2]} 등 변화하는 라이프스타일에 유연하게 대응할 수 있는 기능을 제품에 적극 반영하고 있다.

특히 ${data.coreMessages[0]}에 대한 소비자 니즈가 증가함에 따라, 관련 제품군의 매출이 전년 대비 급성장하는 추세다. ${data.usageContext}에서의 활용도를 높인 점이 주효했다는 분석이다.

${data.brandName} 관계자는 "${data.commentIntent}"라며 "급변하는 트렌드 속에서도 변하지 않는 본질은 '사용자에 대한 이해'다. 앞으로도 데이터를 기반으로 한 ${data.coreMessages[1]} 가치를 지속적으로 전달할 것"이라고 전했다.

자세한 트렌드 리포트 및 관련 제품 정보는 ${data.channels}에서 확인할 수 있다.

# # #`;
};

// D. Promotion (기획전/프로모션)
const templatePromotion = (data: FactSheetData) => {
    return `[프로모션]
    
${data.brandName}, ${data.productName} 진행... "최대 혜택으로 만나는 기회"

- ${data.definition}
- ${data.discountPromo}

(서울=00월 00일) ${data.brandName}가 고객 성원에 보답하기 위해 역대급 혜택을 담은 '${data.productName}' 프로모션을 진행한다고 ${data.launchDate} 밝혔다.

이번 행사는 "${data.definition}"을 테마로 기획되었으며, ${data.usageContext} 꾸미기를 준비하는 고객들에게 합리적인 쇼핑 기회를 제공한다.

주요 혜택으로 ${data.discountPromo} 등이 마련되었다. 특히 베스트셀러 제품에 대해 ▲${data.features[0]} ▲${data.features[1]} 등의 추가 혜택을 제공하여 실속을 챙기려는 소비자들의 이목을 끈다.

${data.brandName} 관계자는 "${data.commentIntent}"라며 "가격 혜택뿐만 아니라 ${data.coreMessages[0]} 등 브랜드 경험을 강화할 수 있는 풍성한 콘텐츠도 함께 준비했다"고 전했다.

행사에 대한 자세한 내용은 ${data.channels}에서 확인할 수 있다.

# # #`;
};


// E. Brand Issue (브랜드 이슈 - 매장 오픈, 협업 등)
const templateIssue = (data: FactSheetData) => {
    return `[브랜드 이슈]

${data.brandName}, ${data.productName} 공개... "${data.definition}"

- ${data.coreMessages[0]}
- ${data.usageContext}에서의 새로운 고객 경험 제안

(서울=00월 00일) ${data.brandName}가 ${data.productName} 소식을 전하며 브랜드 외연 확장에 나섰다. 

이번 ${data.productName}은 "${data.definition}"이라는 목표 아래 추진되었으며, ${data.brandName}가 지향하는 '${BRAND_KEYWORDS.growth.join(', ')}'의 가치를 고객들이 ${data.usageContext}에서 직접 경험할 수 있도록 하는 데 중점을 두었다.

주요 포인트는 세 가지다.
첫째, ${data.features[0]}이다.
둘째, ${data.features[1]}을 통해 차별화를 꾀했다.
셋째, ${data.features[2]}으로 진정성을 더했다.

이를 통해 고객들에게 ${data.coreMessages[0]} 메시지를 전달하고, 궁극적으로는 ${data.coreMessages[1]} 효과를 창출할 것으로 기대된다.

${data.brandName} 관계자는 "${data.commentIntent}"라며 "이번 이슈를 통해 더 많은 분들이 ${data.brandName}의 철학을 공감하고 공유할 수 있기를 바란다"고 밝혔다.

자세한 내용은 ${data.channels}에서 확인 가능하다.

# # #`;
};


// --- Main Handler ---
export const generateDraft = (data: FactSheetData, specs: SpecItem[]): string => {
    // 1. Convert specs to stories
    const specStories = mapSpecToStory(specs);

    // 2. Select Template
    switch (data.prType) {
        case 'new_product':
            return templateNewProduct(data, specStories);
        case 'campaign':
            return templateCampaign(data);
        case 'trend':
            return templateTrend(data);
        case 'promotion':
            return templatePromotion(data);
        case 'issue':
        case 'activity':
            return templateIssue(data);
        default:
            return templateNewProduct(data, specStories); // Default fallback
    }
};
