import { StudySource } from "@/types/study";

type WikipediaSearchResponse = {
  pages?: Array<{
    title: string;
    key: string;
    excerpt?: string;
  }>;
};

type WikipediaSummaryResponse = {
  title?: string;
  extract?: string;
  content_urls?: {
    desktop?: {
      page?: string;
    };
  };
};

const officialSources: Array<{
  keywords: string[];
  title: string;
  url: string;
  summary: string;
}> = [
  {
    keywords: ["react", "react hooks", "hooks", "리액트", "리엑트"],
    title: "React Documentation",
    url: "https://react.dev/",
    summary: "React 공식 문서입니다. React 개념과 Hooks 설명을 확인할 수 있습니다.",
  },
  {
    keywords: ["next.js", "nextjs", "next", "넥스트"],
    title: "Next.js Documentation",
    url: "https://nextjs.org/docs",
    summary: "Next.js 공식 문서입니다. App Router와 서버 기능을 확인할 수 있습니다.",
  },
  {
    keywords: ["javascript", "자바스크립트", "js"],
    title: "MDN JavaScript Guide",
    url: "https://developer.mozilla.org/docs/Web/JavaScript",
    summary: "JavaScript 문법과 웹 표준 동작을 확인할 수 있는 MDN 문서입니다.",
  },
  {
    keywords: ["typescript", "타입스크립트", "ts"],
    title: "TypeScript Handbook",
    url: "https://www.typescriptlang.org/docs/",
    summary: "TypeScript 공식 핸드북입니다. 타입 시스템과 문법을 확인할 수 있습니다.",
  },
  {
    keywords: ["supabase", "슈파베이스"],
    title: "Supabase Documentation",
    url: "https://supabase.com/docs",
    summary: "Supabase 공식 문서입니다. 데이터베이스와 인증, API 사용법을 확인할 수 있습니다.",
  },
  {
    keywords: ["openai", "gpt", "chatgpt"],
    title: "OpenAI API Documentation",
    url: "https://platform.openai.com/docs",
    summary: "OpenAI API 공식 문서입니다. 모델 사용법과 API 가이드를 확인할 수 있습니다.",
  },
  {
    keywords: ["python", "파이썬"],
    title: "Python Documentation",
    url: "https://docs.python.org/3/",
    summary: "Python 공식 문서입니다. 표준 라이브러리와 언어 문법을 확인할 수 있습니다.",
  },
];

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function createNamuwikiSearchUrl(topic: string) {
  return `https://namu.wiki/Search?q=${encodeURIComponent(topic)}`;
}

function pickOfficialSources(topic: string): StudySource[] {
  const key = topic.toLowerCase();

  return officialSources
    .filter((source) =>
      source.keywords.some((keyword) => key.includes(keyword.toLowerCase())),
    )
    .slice(0, 2)
    .map((source) => ({
      topic,
      title: source.title,
      url: source.url,
      sourceType: "official",
      reliability: "high",
      summary: source.summary,
      usedFor: ["공식 개념 확인", "용어 기준"],
    }));
}

async function fetchWikipediaSource(topic: string): Promise<StudySource | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const searchUrl = `https://ko.wikipedia.org/w/rest.php/v1/search/page?q=${encodeURIComponent(
      topic,
    )}&limit=1`;
    const searchResponse = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        accept: "application/json",
      },
    });

    if (!searchResponse.ok) return null;

    const searchData = (await searchResponse.json()) as WikipediaSearchResponse;
    const page = searchData.pages?.[0];

    if (!page) return null;

    const summaryResponse = await fetch(
      `https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        page.key,
      )}`,
      {
        signal: controller.signal,
        headers: {
          accept: "application/json",
        },
      },
    );
    const summaryData = summaryResponse.ok
      ? ((await summaryResponse.json()) as WikipediaSummaryResponse)
      : null;

    return {
      topic,
      title: summaryData?.title ?? page.title,
      url:
        summaryData?.content_urls?.desktop?.page ??
        `https://ko.wikipedia.org/wiki/${encodeURIComponent(page.key)}`,
      sourceType: "encyclopedia",
      reliability: "medium",
      summary: summaryData?.extract ?? stripHtml(page.excerpt ?? ""),
      usedFor: ["배경지식", "개요 확인"],
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function collectSourceCandidates(topic: string) {
  const sources = pickOfficialSources(topic);
  const wikipedia = await fetchWikipediaSource(topic);

  if (wikipedia) sources.push(wikipedia);

  sources.push({
    topic,
    title: "나무위키 검색 결과",
    url: createNamuwikiSearchUrl(topic),
    sourceType: "community",
    reliability: "low",
    summary: "커뮤니티 기반 자료입니다. 배경 이해용 보조 출처로만 사용합니다.",
    usedFor: ["보조 배경 확인"],
  });

  return sources.slice(0, 5);
}

export function toSourceRows({
  sessionId,
  sources,
}: {
  sessionId: string;
  sources: StudySource[];
}) {
  return sources.map((source) => ({
    session_id: sessionId,
    topic: source.topic,
    title: source.title,
    url: source.url,
    source_type: source.sourceType,
    reliability: source.reliability,
    summary: source.summary ?? null,
    used_for: source.usedFor,
  }));
}
