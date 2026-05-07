"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getAnonymousId } from "@/lib/anonymous-id";
import { Level } from "@/types/study";

type Folder = {
  id: string;
  name: string;
  color: string;
  icon: string;
  system_type: string;
};

type StudySession = {
  id: string;
  folder_id: string | null;
  topic: string;
  normalized_topic: string;
  current_stage: Level;
  unlocked_stage: Level;
  created_at: string;
};

const stageLabels: Record<Level, string> = {
  beginner: "초급",
  intermediate: "중급",
  advanced: "고급",
};

export function LibraryView() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId),
    [folders, selectedFolderId],
  );

  useEffect(() => {
    const anonymousId = getAnonymousId();

    fetch(`/api/folders?anonymousId=${encodeURIComponent(anonymousId)}`)
      .then((response) => response.json())
      .then((data: { folders?: Folder[] }) => {
        const nextFolders = data.folders ?? [];
        setFolders(nextFolders);
        setSelectedFolderId(nextFolders[0]?.id ?? null);
      })
      .catch(() => setFolders([]));
  }, []);

  useEffect(() => {
    const anonymousId = getAnonymousId();
    const folder = folders.find((item) => item.id === selectedFolderId);
    const shouldFilter =
      folder?.system_type === "custom" && selectedFolderId
        ? `&folderId=${encodeURIComponent(selectedFolderId)}`
        : "";

    setIsLoading(true);
    fetch(`/api/study/sessions?anonymousId=${encodeURIComponent(anonymousId)}${shouldFilter}`)
      .then((response) => response.json())
      .then((data: { sessions?: StudySession[] }) => setSessions(data.sessions ?? []))
      .catch(() => setSessions([]))
      .finally(() => setIsLoading(false));
  }, [folders, selectedFolderId]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="rounded-[24px] border-2 border-lime-100 bg-white p-4 shadow-[0_8px_0_#d7e7c8]">
        <h2 className="mb-4 text-xl font-black">내 학습 폴더</h2>
        <div className="space-y-2">
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => setSelectedFolderId(folder.id)}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-black ${
                selectedFolderId === folder.id
                  ? "bg-lime-100 text-lime-900"
                  : "bg-slate-50 text-slate-700"
              }`}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: folder.color }}
              />
              {folder.name}
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-[24px] border-2 border-lime-100 bg-white p-5 shadow-[0_8px_0_#d7e7c8]">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-black text-lime-700">
              {selectedFolder?.name ?? "전체 학습"}
            </p>
            <h1 className="text-2xl font-black">저장한 학습</h1>
          </div>
          <Link
            href="/"
            className="rounded-2xl bg-lime-500 px-4 py-3 text-sm font-black text-white shadow-[0_5px_0_#46a302]"
          >
            새 주제 만들기
          </Link>
          <Link
            href="/wrong-notes"
            className="rounded-2xl bg-orange-100 px-4 py-3 text-sm font-black text-orange-800"
          >
            오답노트
          </Link>
        </div>

        {isLoading ? (
          <p className="rounded-2xl bg-sky-50 p-4 font-bold text-sky-900">
            학습 목록을 불러오는 중입니다.
          </p>
        ) : sessions.length === 0 ? (
          <p className="rounded-2xl bg-yellow-50 p-4 font-bold text-yellow-900">
            아직 저장된 학습이 없습니다.
          </p>
        ) : (
          <div className="grid gap-3">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/study/${session.id}`}
                className="rounded-2xl border-2 border-slate-100 p-4 transition hover:border-lime-300"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-lg font-black">{session.topic}</h2>
                  <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-lime-900">
                    {stageLabels[session.current_stage]}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  열린 단계: {stageLabels[session.unlocked_stage]} ·{" "}
                  {new Date(session.created_at).toLocaleDateString("ko-KR")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
