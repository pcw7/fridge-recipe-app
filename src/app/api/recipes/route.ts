import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const recipes = await prisma.savedRecipe.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    recipes: recipes.map((recipe) => ({
      id: recipe.id,
      name: recipe.name,
      ingredients: JSON.parse(recipe.ingredients) as string[],
      missingIngredients: JSON.parse(recipe.missingIngredients) as string[],
      steps: JSON.parse(recipe.steps) as string[],
      cookTimeMinutes: recipe.cookTimeMinutes,
      difficulty: recipe.difficulty,
      createdAt: recipe.createdAt,
    })),
  });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const { name, ingredients, missingIngredients, steps, cookTimeMinutes, difficulty } = body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "레시피 이름이 필요합니다." }, { status: 400 });
  }

  const recipe = await prisma.savedRecipe.create({
    data: {
      userId: user.id,
      name,
      ingredients: JSON.stringify(Array.isArray(ingredients) ? ingredients : []),
      missingIngredients: JSON.stringify(Array.isArray(missingIngredients) ? missingIngredients : []),
      steps: JSON.stringify(Array.isArray(steps) ? steps : []),
      cookTimeMinutes: typeof cookTimeMinutes === "number" ? cookTimeMinutes : 0,
      difficulty: typeof difficulty === "string" ? difficulty : "정보 없음",
    },
  });

  return NextResponse.json({ id: recipe.id });
}
