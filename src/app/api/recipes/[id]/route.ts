import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  ctx: RouteContext<"/api/recipes/[id]">
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const recipe = await prisma.savedRecipe.findUnique({ where: { id } });

  if (!recipe || recipe.userId !== user.id) {
    return NextResponse.json({ error: "레시피를 찾을 수 없습니다." }, { status: 404 });
  }

  await prisma.savedRecipe.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
