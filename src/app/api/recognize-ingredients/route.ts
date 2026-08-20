import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemma-4-26b-a4b-it:free";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "서버에 OPENROUTER_API_KEY가 설정되어 있지 않습니다." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const imageDataUri = body?.image;
  if (typeof imageDataUri !== "string" || !imageDataUri.startsWith("data:image/")) {
    return NextResponse.json(
      { error: "유효한 이미지 데이터(base64 data URI)가 필요합니다." },
      { status: 400 }
    );
  }

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
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "이 냉장고 사진에서 보이는 식재료 이름만 한국어로, 쉼표로 구분해서 나열해줘. 다른 설명은 하지 마.",
              },
              { type: "image_url", image_url: { url: imageDataUri } },
            ],
          },
        ],
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
      { error: `이미지 인식에 실패했습니다: ${errText}` },
      { status: 502 }
    );
  }

  const data = await response.json();
  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) {
    return NextResponse.json(
      { error: "모델 응답이 비어 있습니다." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ingredients: parseIngredients(content), raw: content });
}

function parseIngredients(text: string): string[] {
  return text
    .split(/[,\n、]/)
    .map((item) => item.replace(/^[\s\-*•\d.)]+/, "").replace(/[.!?]+$/, "").trim())
    .filter((item) => item.length > 0 && item.length < 30);
}
