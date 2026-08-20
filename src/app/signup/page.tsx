"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "회원가입에 실패했어요.");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-cyan-900/10 bg-white/50 p-6 backdrop-blur-md dark:border-cyan-300/10 dark:bg-slate-900/40"
      >
        <h1 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-cyan-50">회원가입</h1>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일"
          className="rounded-lg border border-cyan-900/15 bg-white/50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 dark:border-cyan-300/20 dark:bg-slate-900/40 dark:text-cyan-50 dark:placeholder:text-cyan-200/40"
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 (8자 이상)"
          className="rounded-lg border border-cyan-900/15 bg-white/50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 dark:border-cyan-300/20 dark:bg-slate-900/40 dark:text-cyan-50 dark:placeholder:text-cyan-200/40"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-full bg-cyan-600 px-5 py-2.5 font-medium text-white shadow-sm shadow-cyan-900/20 transition-colors hover:bg-cyan-500 disabled:opacity-50 dark:bg-cyan-400 dark:text-slate-900 dark:hover:bg-cyan-300"
        >
          {loading ? "가입하는 중..." : "회원가입"}
        </button>
        <p className="text-center text-sm text-slate-600 dark:text-cyan-100/70">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-medium text-cyan-700 underline dark:text-cyan-300">
            로그인
          </Link>
        </p>
      </form>
    </div>
  );
}
