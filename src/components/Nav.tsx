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
    <nav className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
      <Link href="/" className="font-semibold text-zinc-900 dark:text-zinc-50">
        냉장고 재료 인식
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {userEmail ? (
          <>
            <Link href="/recipes" className="text-zinc-700 hover:underline dark:text-zinc-300">
              내 레시피
            </Link>
            <span className="text-zinc-500 dark:text-zinc-400">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="rounded-full border border-zinc-300 px-3 py-1.5 dark:border-zinc-700"
            >
              로그아웃
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-zinc-700 hover:underline dark:text-zinc-300">
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-zinc-900 px-3 py-1.5 text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              회원가입
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
