import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Study Maker",
  description: "AI 기반 맞춤 학습 콘텐츠와 문제 생성 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-40 border-b border-white/70 bg-white/82 px-5 py-3 backdrop-blur sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2 text-sm font-black text-lime-700">
              <span className="grid h-9 w-9 place-items-center rounded-2xl border-2 border-lime-200 bg-lime-200 shadow-[0_4px_0_#a9dc55]">
                <span className="relative h-5 w-5">
                  <span className="absolute left-0 top-1 h-4 w-3 rounded-l border-2 border-white" />
                  <span className="absolute right-0 top-1 h-4 w-3 rounded-r border-2 border-white" />
                </span>
              </span>
              AI Study Maker
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/"
                className="app-primary-button rounded-full px-4 py-2 text-sm font-black"
              >
                홈으로
              </Link>
              <Link
                href="/wrong-notes"
                className="rounded-full border-2 border-orange-100 bg-orange-50 px-4 py-2 text-sm font-black text-orange-700 shadow-sm hover:border-orange-200"
              >
                오답노트
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
