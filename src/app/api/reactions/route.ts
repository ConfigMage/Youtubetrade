import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { watchReactions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const cardIdParam = req.nextUrl.searchParams.get("videoCardId");
  if (!cardIdParam) {
    const all = await db
      .select()
      .from(watchReactions)
      .orderBy(desc(watchReactions.createdAt));
    return NextResponse.json(all);
  }
  const id = parseInt(cardIdParam, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid videoCardId" }, { status: 400 });
  }
  const reactions = await db
    .select()
    .from(watchReactions)
    .where(eq(watchReactions.videoCardId, id))
    .orderBy(desc(watchReactions.createdAt));
  return NextResponse.json(reactions);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoCardId, memberId, emoji = "🔥", comment = "" } = body ?? {};
    if (!videoCardId || !memberId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const [reaction] = await db
      .insert(watchReactions)
      .values({ videoCardId, memberId, emoji, comment })
      .returning();
    return NextResponse.json(reaction);
  } catch (error) {
    console.error("Create reaction error:", error);
    return NextResponse.json(
      { error: "Failed to create reaction" },
      { status: 500 }
    );
  }
}
