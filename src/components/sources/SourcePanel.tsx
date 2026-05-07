import { StudySource } from "@/types/study";

const sourceTypeLabels: Record<StudySource["sourceType"], string> = {
  official: "공식",
  encyclopedia: "백과",
  lecture: "강의",
  community: "커뮤니티 보조",
};

const reliabilityLabels: Record<StudySource["reliability"], string> = {
  high: "높음",
  medium: "보통",
  low: "보조",
};

export function SourcePanel({ sources }: { sources: StudySource[] }) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-2xl bg-sky-50 p-4">
      <h2 className="text-lg font-black text-sky-900">참고 출처</h2>
      <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
        개념 설명을 보강하기 위해 사용한 출처 후보입니다. 커뮤니티 자료는
        보조 참고로만 사용합니다.
      </p>
      <div className="mt-4 grid gap-3">
        {sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border-2 border-sky-100 bg-white p-4 transition hover:border-sky-300"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-black text-sky-900">
                {sourceTypeLabels[source.sourceType]}
              </span>
              <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-900">
                신뢰도 {reliabilityLabels[source.reliability]}
              </span>
            </div>
            <h3 className="mt-3 font-black text-slate-950">{source.title}</h3>
            {source.summary ? (
              <p className="mt-2 text-sm font-bold leading-6 text-slate-600">
                {source.summary}
              </p>
            ) : null}
            {source.usedFor.length > 0 ? (
              <p className="mt-2 text-xs font-black text-slate-400">
                참고 영역: {source.usedFor.join(", ")}
              </p>
            ) : null}
          </a>
        ))}
      </div>
    </section>
  );
}
