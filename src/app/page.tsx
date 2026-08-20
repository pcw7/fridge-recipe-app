"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Recipe } from "./api/generate-recipes/route";

type SaveStatus = "idle" | "saving" | "saved" | "unauthorized" | "error";

export default function Home() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [rawRecipeText, setRawRecipeText] = useState<string | null>(null);
  const [selectedRecipeIndex, setSelectedRecipeIndex] = useState<number | null>(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeError, setRecipeError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<Record<number, SaveStatus>>({});

  function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있어요.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("이미지 용량은 10MB 이하만 가능해요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUri = reader.result as string;
      setImageDataUri(dataUri);
      setImagePreview(dataUri);
      setIngredients([]);
    };
    reader.readAsDataURL(file);
  }

  async function recognizeIngredients() {
    if (!imageDataUri) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recognize-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageDataUri }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "재료 인식에 실패했어요.");
      }
      setIngredients(data.ingredients as string[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setLoading(false);
    }
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
    setRecipes(null);
    setRawRecipeText(null);
    setSelectedRecipeIndex(null);
  }

  function addIngredient() {
    const trimmed = newIngredient.trim();
    if (!trimmed) return;
    setIngredients((prev) => [...prev, trimmed]);
    setNewIngredient("");
    setRecipes(null);
    setRawRecipeText(null);
    setSelectedRecipeIndex(null);
  }

  async function generateRecipes() {
    if (ingredients.length === 0) return;
    setRecipeLoading(true);
    setRecipeError(null);
    setRecipes(null);
    setRawRecipeText(null);
    setSelectedRecipeIndex(null);
    try {
      const res = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "레시피 생성에 실패했어요.");
      }
      if (data.recipes) {
        setRecipes(data.recipes as Recipe[]);
      } else {
        setRawRecipeText(data.raw as string);
      }
    } catch (e) {
      setRecipeError(e instanceof Error ? e.message : "알 수 없는 오류가 발생했어요.");
    } finally {
      setRecipeLoading(false);
    }
  }

  async function saveRecipe(index: number, recipe: Recipe) {
    setSaveStatus((prev) => ({ ...prev, [index]: "saving" }));
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: recipe.name,
          ingredients,
          missingIngredients: recipe.missing_ingredients,
          steps: recipe.steps,
          cookTimeMinutes: recipe.cook_time_minutes,
          difficulty: recipe.difficulty,
        }),
      });
      if (res.status === 401) {
        setSaveStatus((prev) => ({ ...prev, [index]: "unauthorized" }));
        return;
      }
      if (!res.ok) {
        setSaveStatus((prev) => ({ ...prev, [index]: "error" }));
        return;
      }
      setSaveStatus((prev) => ({ ...prev, [index]: "saved" }));
    } catch {
      setSaveStatus((prev) => ({ ...prev, [index]: "error" }));
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            냉장고 재료 인식
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            냉장고 사진을 올리면 안에 있는 재료를 찾아드려요.
          </p>
        </div>

        <label
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 p-8 text-center transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-500"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
        >
          {imagePreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview}
              alt="업로드한 냉장고 사진"
              className="max-h-64 rounded-lg object-contain"
            />
          ) : (
            <span className="text-zinc-500 dark:text-zinc-400">
              클릭하거나 사진을 끌어다 놓으세요
            </span>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>

        {imageDataUri && (
          <button
            onClick={recognizeIngredients}
            disabled={loading}
            className="rounded-full bg-zinc-900 px-5 py-3 font-medium text-white transition-opacity disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {loading ? "재료를 인식하고 있어요..." : "재료 인식하기"}
          </button>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {ingredients.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">인식된 재료</h2>
            <div className="flex flex-wrap gap-2">
              {ingredients.map((ingredient, index) => (
                <span
                  key={`${ingredient}-${index}`}
                  className="flex items-center gap-1 rounded-full bg-zinc-200 px-3 py-1 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                >
                  {ingredient}
                  <button
                    onClick={() => removeIngredient(index)}
                    className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
                    aria-label={`${ingredient} 삭제`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addIngredient();
                  }
                }}
                placeholder="재료 직접 추가"
                className="flex-1 rounded-full border border-zinc-300 bg-transparent px-4 py-2 text-sm dark:border-zinc-700"
              />
              <button
                onClick={addIngredient}
                className="rounded-full border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
              >
                추가
              </button>
            </div>

            <button
              onClick={generateRecipes}
              disabled={recipeLoading}
              className="rounded-full bg-zinc-900 px-5 py-3 font-medium text-white transition-opacity disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {recipeLoading ? "레시피를 생성하고 있어요..." : "레시피 추천받기"}
            </button>
          </div>
        )}

        {recipeError && <p className="text-sm text-red-600">{recipeError}</p>}

        {rawRecipeText && (
          <div className="flex flex-col gap-2 rounded-xl border border-zinc-300 p-4 dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              모델 응답을 정형화된 형식으로 해석하지 못해 원문을 그대로 보여드려요.
            </p>
            <pre className="whitespace-pre-wrap text-sm text-zinc-900 dark:text-zinc-50">
              {rawRecipeText}
            </pre>
          </div>
        )}

        {recipes && recipes.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="font-medium text-zinc-900 dark:text-zinc-50">추천 레시피</h2>
            <div className="flex flex-col gap-3">
              {recipes.map((recipe, index) => {
                const isSelected = selectedRecipeIndex === index;
                return (
                  <div
                    key={`${recipe.name}-${index}`}
                    className="rounded-xl border border-zinc-300 dark:border-zinc-700"
                  >
                    <button
                      onClick={() => setSelectedRecipeIndex(isSelected ? null : index)}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left"
                    >
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">{recipe.name}</p>
                        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                          {recipe.cook_time_minutes > 0 && `약 ${recipe.cook_time_minutes}분`}
                          {recipe.cook_time_minutes > 0 && recipe.difficulty !== "정보 없음" && " · "}
                          {recipe.difficulty !== "정보 없음" && recipe.difficulty}
                        </p>
                      </div>
                      {recipe.missing_ingredients.length > 0 && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          부족한 재료 {recipe.missing_ingredients.length}개
                        </span>
                      )}
                    </button>

                    {isSelected && (
                      <div className="flex flex-col gap-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
                        {recipe.missing_ingredients.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                              부족한 재료
                            </p>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              {recipe.missing_ingredients.join(", ")}
                            </p>
                          </div>
                        )}
                        {recipe.steps.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                              조리 순서
                            </p>
                            <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                              {recipe.steps.map((step, stepIndex) => (
                                <li key={stepIndex}>{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}

                        <div>
                          {saveStatus[index] === "saved" ? (
                            <p className="text-sm text-emerald-600">저장했어요.</p>
                          ) : saveStatus[index] === "unauthorized" ? (
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">
                              저장하려면{" "}
                              <Link href="/login" className="font-medium underline">
                                로그인
                              </Link>
                              이 필요해요.
                            </p>
                          ) : (
                            <button
                              onClick={() => saveRecipe(index, recipe)}
                              disabled={saveStatus[index] === "saving"}
                              className="rounded-full border border-zinc-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
                            >
                              {saveStatus[index] === "saving" ? "저장 중..." : "레시피 저장"}
                            </button>
                          )}
                          {saveStatus[index] === "error" && (
                            <p className="mt-1 text-sm text-red-600">저장에 실패했어요. 다시 시도해주세요.</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
