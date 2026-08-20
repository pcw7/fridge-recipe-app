import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DeleteRecipeButton from "@/components/DeleteRecipeButton";

export default async function RecipesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
        <p className="text-slate-600 dark:text-cyan-100/70">저장한 레시피를 보려면 로그인해주세요.</p>
        <Link
          href="/login"
          className="rounded-full bg-cyan-600 px-5 py-2.5 font-medium text-white shadow-sm shadow-cyan-900/20 hover:bg-cyan-500 dark:bg-cyan-400 dark:text-slate-900 dark:hover:bg-cyan-300"
        >
          로그인하기
        </Link>
      </div>
    );
  }

  const recipes = await prisma.savedRecipe.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-12">
      <main className="flex w-full max-w-xl flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-cyan-50">내 레시피</h1>

        {recipes.length === 0 ? (
          <p className="text-slate-600 dark:text-cyan-100/70">
            아직 저장한 레시피가 없어요.{" "}
            <Link href="/" className="text-cyan-700 underline dark:text-cyan-300">
              홈에서 레시피를 추천받고 저장해보세요.
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {recipes.map((recipe) => {
              const missingIngredients = JSON.parse(recipe.missingIngredients) as string[];
              const steps = JSON.parse(recipe.steps) as string[];
              const ingredients = JSON.parse(recipe.ingredients) as string[];

              return (
                <div
                  key={recipe.id}
                  className="flex flex-col gap-3 rounded-2xl border border-cyan-900/10 bg-white/40 p-4 backdrop-blur-md dark:border-cyan-300/10 dark:bg-slate-900/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-cyan-50">{recipe.name}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-cyan-100/60">
                        {recipe.cookTimeMinutes > 0 && `약 ${recipe.cookTimeMinutes}분`}
                        {recipe.cookTimeMinutes > 0 && recipe.difficulty !== "정보 없음" && " · "}
                        {recipe.difficulty !== "정보 없음" && recipe.difficulty}
                      </p>
                    </div>
                    <DeleteRecipeButton recipeId={recipe.id} />
                  </div>

                  {ingredients.length > 0 && (
                    <p className="text-sm text-slate-600 dark:text-cyan-100/70">
                      <span className="font-medium text-slate-800 dark:text-cyan-50">보유 재료: </span>
                      {ingredients.join(", ")}
                    </p>
                  )}

                  {missingIngredients.length > 0 && (
                    <p className="text-sm text-slate-600 dark:text-cyan-100/70">
                      <span className="font-medium text-slate-800 dark:text-cyan-50">부족한 재료: </span>
                      {missingIngredients.join(", ")}
                    </p>
                  )}

                  {steps.length > 0 && (
                    <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-600 dark:text-cyan-100/70">
                      {steps.map((step, index) => (
                        <li key={index}>{step}</li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
