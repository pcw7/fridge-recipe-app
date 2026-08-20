"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Nav({ userEmail }: { userEmail: string | null }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between border-b border-cyan-900/10 bg-white/50 px-4 py-3 backdrop-blur-md dark:border-cyan-300/10 dark:bg-slate-950/40">
      <Link href="/" className="font-semibold tracking-tight text-slate-800 dark:text-cyan-50">
        ❄️ 냉장고 재료 인식
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {userEmail ? (
          <>
            <Link
              href="/recipes"
              className="text-slate-600 hover:text-cyan-700 dark:text-cyan-100/80 dark:hover:text-cyan-200"
            >
              내 레시피
            </Link>
            <span className="text-slate-500 dark:text-cyan-200/50">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="rounded-full border border-cyan-900/15 px-3 py-1.5 text-slate-700 transition-colors hover:bg-white/60 dark:border-cyan-300/20 dark:text-cyan-100 dark:hover:bg-cyan-400/10"
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="text-slate-600 hover:text-cyan-700 dark:text-cyan-100/80 dark:hover:text-cyan-200"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-cyan-600 px-3 py-1.5 text-white shadow-sm shadow-cyan-900/20 transition-colors hover:bg-cyan-500 dark:bg-cyan-400 dark:text-slate-900 dark:hover:bg-cyan-300"
            >
              회원가입
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
