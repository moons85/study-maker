"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { getAnonymousId } from "@/lib/anonymous-id";
import { Level } from "@/types/study";

import { StudyGenerationLoading } from "./StudyGenerationLoading";

const stageLabels: Record<Level, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

export function NextStageButton({
  topic,
  normalizedTopic,
  stage,
  folderId,
}: {
  topic: string;
  normalizedTopic: string;
  stage: Level;
  folderId?: string | null;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function startNextStage() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/study/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          normalizedTopic,
          stage,
          folderId,
          idempotencyKey: crypto.randomUUID(),
          anonymousId: getAnonymousId(),
        }),
      });
      const data = (await response.json()) as {
        sessionId?: string;
        message?: string;
      };

      if (!response.ok || !data.sessionId) {
        throw new Error(data.message ?? "다음 단계 생성에 실패했습니다.");
      }

      router.push(`/study/${data.sessionId}`);
    } catch (nextStageError) {
      setIsLoading(false);
      setError(
        nextStageError instanceof Error
          ? nextStageError.message
          : "다음 단계 생성 중 오류가 발생했습니다.",
      );
    }
  }

  return (
    <div>
      {isLoading ? <StudyGenerationLoading topic={topic} /> : null}
      <button
        type="button"
        onClick={startNextStage}
        disabled={isLoading}
        className="app-primary-button flex h-12 w-full items-center justify-center font-black disabled:bg-slate-400 disabled:shadow-none"
      >
        {isLoading ? "생성 중..." : `${stageLabels[stage]} 단계 시작`}
      </button>
      {error ? <p className="mt-2 text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
