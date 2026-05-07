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
        <header className="sticky top-0 z-40 border-b border-lime-100 bg-white/90 px-5 py-3 backdrop-blur sm:px-8">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <Link href="/" className="text-sm font-black text-lime-700">
              AI Study Maker
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-2xl bg-lime-500 px-4 py-2 text-sm font-black text-white shadow-[0_4px_0_#46a302]"
              >
                홈으로
              </Link>
              <Link
                href="/wrong-notes"
                className="rounded-2xl bg-orange-100 px-4 py-2 text-sm font-black text-orange-800"
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
