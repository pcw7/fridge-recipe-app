"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DeleteRecipeButton({
  recipeId,
  recipeName,
}: {
  recipeId: string;
  recipeName: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!confirming) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setConfirming(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirming]);

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/recipes/${recipeId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setConfirming(true)}
        className="text-sm text-red-600 hover:underline dark:text-red-400"
      >
        삭제
      </button>

      {confirming && (
        <div
          className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm"
          onClick={() => setConfirming(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-cyan-900/10 bg-white/90 p-6 shadow-xl backdrop-blur-md dark:border-cyan-300/10 dark:bg-slate-900/90"
          >
            <div>
              <h2 className="font-medium text-slate-800 dark:text-cyan-50">레시피를 삭제할까요?</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-cyan-100/70">
                &lsquo;{recipeName}&rsquo;을(를) 삭제하면 다시 되돌릴 수 없어요.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirming(false)}
                disabled={deleting}
                className="rounded-full border border-cyan-900/15 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-white/60 disabled:opacity-50 dark:border-cyan-300/20 dark:text-cyan-100 dark:hover:bg-cyan-400/10"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50 dark:bg-red-500 dark:hover:bg-red-400"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
