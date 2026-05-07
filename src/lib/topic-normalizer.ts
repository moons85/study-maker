const typoMap = new Map<string, string>([
  ["리엑트 훅스", "React Hooks"],
  ["리액트 훅스", "React Hooks"],
  ["자바스크립", "JavaScript"],
  ["자바스크립트", "JavaScript"],
  ["파이썬", "Python"],
]);

const broadTopicSuggestions = new Map<string, string[]>([
  ["수학", ["분수의 덧셈", "일차방정식", "함수의 기본 개념"]],
  ["영어", ["영어 관계대명사", "현재완료", "영어 문장 5형식"]],
  ["역사", ["조선 후기 사회 변화", "프랑스 혁명", "제2차 세계대전"]],
  ["과학", ["뉴턴의 운동 법칙", "광합성", "전기 회로 기초"]],
]);

const blockedKeywords = [
  "해킹 공격",
  "피싱",
  "악성코드",
  "자해",
  "개인정보",
  "주민등록번호",
  "계좌 비밀번호",
];

export function normalizeTopic(topic: string) {
  return topic.trim().replace(/\s+/g, " ");
}

export function createTopicKey(topic: string) {
  return normalizeTopic(topic).toLowerCase();
}

export function validateTopicLocally(topic: string) {
  const normalized = normalizeTopic(topic);
  const key = createTopicKey(normalized);

  if (/([ㅋㅎㅠㅜㅡ])\1{4,}/.test(normalized) || /^[^\p{L}\p{N}]+$/u.test(normalized)) {
    return {
      status: "blocked" as const,
      normalizedTopic: normalized,
      suggestions: [],
      message: "학습 주제로 보기 어려운 입력입니다. 구체적인 주제를 입력해주세요.",
    };
  }

  if (blockedKeywords.some((keyword) => key.includes(keyword.toLowerCase()))) {
    return {
      status: "blocked" as const,
      normalizedTopic: normalized,
      suggestions: [],
      message: "이 주제는 안전한 학습 콘텐츠로 만들 수 없습니다.",
    };
  }

  const typoSuggestion = typoMap.get(key);

  if (typoSuggestion && typoSuggestion !== normalized) {
    return {
      status: "needs_confirmation" as const,
      normalizedTopic: typoSuggestion,
      suggestions: [typoSuggestion],
      message: `"${normalized}"를 "${typoSuggestion}"로 이해했어요. 이 주제로 학습할까요?`,
    };
  }

  const broadSuggestions = broadTopicSuggestions.get(key);

  if (broadSuggestions) {
    return {
      status: "too_broad" as const,
      normalizedTopic: normalized,
      suggestions: broadSuggestions,
      message: `"${normalized}"은 너무 넓어요. 더 구체적인 주제로 시작해보세요.`,
    };
  }

  return {
    status: "ok" as const,
    normalizedTopic: normalized,
    suggestions: [],
    message: "학습 가능한 주제입니다.",
  };
}

