import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemma-4-26b-a4b-it:free";
const RECIPE_COUNT = 3;

export interface Recipe {
  name: string;
  missing_ingredients: string[];
  steps: string[];
  cook_time_minutes: number;
  difficulty: string;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "서버에 OPENROUTER_API_KEY가 설정되어 있지 않습니다." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const ingredients = body?.ingredients;
  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return NextResponse.json(
      { error: "재료 목록이 필요합니다." },
      { status: 400 }
    );
  }

  const prompt = buildPrompt(ingredients);

  let response: Response;
  try {
    response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "OpenRouter API 호출 중 네트워크 오류가 발생했습니다." },
      { status: 502 }
    );
  }

  if (!response.ok) {
    const errText = await response.text();
    return NextResponse.json(
      { error: `레시피 생성에 실패했습니다: ${errText}` },
      { status: 502 }
    );
  }

  const data = await response.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    return NextResponse.json({ error: "모델 응답이 비어 있습니다." }, { status: 502 });
  }

  const recipes = parseRecipes(content);
  if (!recipes) {
    return NextResponse.json({ recipes: null, raw: content });
  }

  return NextResponse.json({ recipes, raw: content });
}

function buildPrompt(ingredients: string[]): string {
  return (
    `다음 재료로 만들 수 있는 요리 ${RECIPE_COUNT}가지를 추천해줘: ${ingredients.join(", ")}.\n` +
    `다른 설명 없이 아래 JSON 배열 형식으로만 답해줘. 마크다운 코드블록도 쓰지 마.\n` +
    `[{"name": "요리명", "missing_ingredients": ["보유하지 않은 재료"], "steps": ["조리 순서 1", "조리 순서 2"], "cook_time_minutes": 15, "difficulty": "쉬움"}]`
  );
}

function parseRecipes(text: string): Recipe[] | null {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) return null;

  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (!Array.isArray(parsed)) return null;

    return parsed
      .filter((item) => item && typeof item.name === "string")
      .map((item) => ({
        name: item.name,
        missing_ingredients: Array.isArray(item.missing_ingredients)
          ? item.missing_ingredients.filter((v: unknown) => typeof v === "string")
          : [],
        steps: Array.isArray(item.steps)
          ? item.steps.filter((v: unknown) => typeof v === "string")
          : [],
        cook_time_minutes:
          typeof item.cook_time_minutes === "number" ? item.cook_time_minutes : 0,
        difficulty: typeof item.difficulty === "string" ? item.difficulty : "정보 없음",
      }));
  } catch {
    return null;
  }
}
