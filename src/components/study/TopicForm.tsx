"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { getAnonymousId } from "@/lib/anonymous-id";

import { StudyGenerationLoading } from "./StudyGenerationLoading";

type Folder = {
  id: string;
  name: string;
  color: string;
  icon: string;
  system_type: string;
};

type TopicValidation = {
  status: "ok" | "needs_confirmation" | "too_broad" | "blocked";
  normalizedTopic: string;
  suggestions: string[];
  message: string;
};

export function TopicForm() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [validation, setValidation] = useState<TopicValidation | null>(null);
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const anonymousId = getAnonymousId();

    fetch(`/api/folders?anonymousId=${encodeURIComponent(anonymousId)}`)
      .then((response) => response.json())
      .then((data: { folders?: Folder[] }) => {
        const nextFolders = data.folders ?? [];
        setFolders(nextFolders);
        setFolderId(nextFolders[0]?.id ?? null);
      })
      .catch(() => {
        setFolders([]);
      });
  }, []);

  async function validateTopic(nextTopic: string) {
    const response = await fetch("/api/topics/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic: nextTopic }),
    });
    const data = (await response.json()) as TopicValidation;
    setValidation(data);
    return data;
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;

    const response = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anonymousId: getAnonymousId(),
        name: newFolderName,
      }),
    });
    const data = (await response.json()) as { folder?: Folder; message?: string };

    if (!response.ok || !data.folder) {
      setError(data.message ?? "폴더를 만들지 못했습니다.");
      return;
    }

    setFolders((current) => [...current, data.folder as Folder]);
    setFolderId(data.folder.id);
    setNewFolderName("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsGenerating(true);

    try {
      const topicValidation = validation ?? (await validateTopic(topic));

      if (topicValidation.status === "blocked") {
        throw new Error(topicValidation.message);
      }

      if (topicValidation.status === "too_broad") {
        throw new Error(topicValidation.message);
      }

      const response = await fetch("/api/study/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          normalizedTopic: topicValidation.normalizedTopic,
          stage: "beginner",
          folderId,
          idempotencyKey: window.crypto.randomUUID(),
          anonymousId: getAnonymousId(),
        }),
      });

      const data = (await response.json()) as {
        sessionId?: string;
        message?: string;
      };

      if (!response.ok || !data.sessionId) {
        throw new Error(data.message ?? "생성에 실패했습니다.");
      }

      router.push(`/study/${data.sessionId}`);
    } catch (submitError) {
      setIsGenerating(false);
      setError(
        submitError instanceof Error
          ? submitError.message
          : "생성 중 오류가 발생했습니다.",
      );
    }
  }

  return (
    <>
      {isGenerating ? <StudyGenerationLoading topic={topic} /> : null}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
        <label className="mb-3 block text-base font-black text-slate-950">
          오늘은 무엇을 배워볼까요?
        </label>
        <div className="flex gap-2">
          <input
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value);
              setValidation(null);
            }}
            onBlur={() => {
              if (topic.trim().length >= 2) void validateTopic(topic);
            }}
            placeholder="예: 조선 후기, 미분 기초, 영어 관계대명사"
            className="h-14 min-w-0 flex-1 rounded-2xl border-2 border-lime-200 bg-white px-4 text-base outline-none transition focus:border-lime-500"
            required
            minLength={2}
            maxLength={80}
          />
          <button
            type="button"
            onClick={() => validateTopic(topic)}
            className="h-14 rounded-2xl bg-sky-400 px-4 font-black text-white shadow-[0_5px_0_#0b88c3]"
          >
            확인
          </button>
        </div>
      </div>

      {validation ? (
        <div
          className={`rounded-2xl border-2 p-4 text-sm font-bold ${
            validation.status === "ok" || validation.status === "needs_confirmation"
              ? "border-lime-200 bg-lime-50 text-lime-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <p>{validation.message}</p>
          {validation.suggestions.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {validation.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => {
                    setTopic(suggestion);
                    setValidation({
                      status: "ok",
                      normalizedTopic: suggestion,
                      suggestions: [],
                      message: "학습 가능한 주제입니다.",
                    });
                  }}
                  className="rounded-full bg-white px-3 py-2 text-xs shadow-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div>
        <label className="mb-3 block text-base font-black text-slate-950">
          저장 폴더
        </label>
        <select
          value={folderId ?? ""}
          onChange={(event) => setFolderId(event.target.value || null)}
          className="h-14 w-full rounded-2xl border-2 border-lime-200 bg-white px-4 font-bold outline-none focus:border-lime-500"
        >
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
        <div className="mt-3 flex gap-2">
          <input
            value={newFolderName}
            onChange={(event) => setNewFolderName(event.target.value)}
            placeholder="새 폴더 이름"
            className="h-12 min-w-0 flex-1 rounded-2xl border-2 border-slate-200 px-4 outline-none focus:border-sky-400"
          />
          <button
            type="button"
            onClick={createFolder}
            className="h-12 rounded-2xl bg-yellow-300 px-4 font-black text-slate-950 shadow-[0_5px_0_#d9a900]"
          >
            추가
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-lime-50 p-4 text-sm font-bold text-lime-900">
        새 주제는 초급부터 시작합니다. 초급 70점 이상이면 중급, 중급
        70점 이상이면 고급이 열립니다.
      </div>

      {isGenerating ? (
        <div className="rounded-2xl bg-sky-50 p-4 text-sm font-bold text-sky-900">
          AI가 초급 개념과 랜덤 10문제를 만들고 있어요.
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isGenerating}
        className="h-14 w-full rounded-2xl bg-lime-500 px-5 text-base font-black text-white shadow-[0_6px_0_#46a302] transition active:translate-y-1 active:shadow-[0_3px_0_#46a302] disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
      >
        {isGenerating ? "생성 중..." : "초급 랜덤 10문제 만들기"}
      </button>
      </form>
    </>
  );
}
