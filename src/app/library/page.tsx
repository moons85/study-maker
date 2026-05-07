import Link from "next/link";

import { LibraryView } from "@/components/library/LibraryView";

export default function LibraryPage() {
  return (
    <main className="min-h-screen bg-lime-50 px-5 py-8 text-slate-950 sm:px-8">
      <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between gap-3">
        <Link href="/" className="text-sm font-black text-lime-800">
          AI Study Maker
        </Link>
      </div>
      <LibraryView />
    </main>
  );
}
