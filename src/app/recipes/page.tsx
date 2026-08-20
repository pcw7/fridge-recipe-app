import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DeleteRecipeButton from "@/components/DeleteRecipeButton";

export default async function RecipesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-zinc-50 px-4 py-12 text-center dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">저장한 레시피를 보려면 로그인해주세요.</p>
        <Link
          href="/login"
          className="rounded-full bg-zinc-900 px-5 py-2.5 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
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
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">내 레시피</h1>

        {recipes.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            아직 저장한 레시피가 없어요.{" "}
            <Link href="/" className="underline">
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
                  className="flex flex-col gap-3 rounded-xl border border-zinc-300 p-4 dark:border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">{recipe.name}</p>
                      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                        {recipe.cookTimeMinutes > 0 && `약 ${recipe.cookTimeMinutes}분`}
                        {recipe.cookTimeMinutes > 0 && recipe.difficulty !== "정보 없음" && " · "}
                        {recipe.difficulty !== "정보 없음" && recipe.difficulty}
                      </p>
                    </div>
                    <DeleteRecipeButton recipeId={recipe.id} />
                  </div>

                  {ingredients.length > 0 && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">보유 재료: </span>
                      {ingredients.join(", ")}
                    </p>
                  )}

                  {missingIngredients.length > 0 && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">부족한 재료: </span>
                      {missingIngredients.join(", ")}
                    </p>
                  )}

                  {steps.length > 0 && (
                    <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
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
