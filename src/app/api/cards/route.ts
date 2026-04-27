import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videoCards } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const ownerIdParam = req.nextUrl.searchParams.get("ownerId");

  if (ownerIdParam) {
    const ownerId = parseInt(ownerIdParam, 10);
    if (Number.isNaN(ownerId)) {
      return NextResponse.json({ error: "Invalid ownerId" }, { status: 400 });
    }
    const cards = await db
      .select()
      .from(videoCards)
      .where(eq(videoCards.ownerId, ownerId))
      .orderBy(desc(videoCards.createdAt));
    return NextResponse.json(cards);
  }

  const cards = await db
    .select()
    .from(videoCards)
    .orderBy(desc(videoCards.createdAt));
  return NextResponse.json(cards);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      ownerId,
      youtubeUrl,
      youtubeVideoId,
      title,
      channelName,
      thumbnailUrl,
      durationSeconds = 0,
      description = "",
      tags = [],
    } = body ?? {};

    if (!ownerId || !youtubeVideoId || !title || !youtubeUrl) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [card] = await db
      .insert(videoCards)
      .values({
        ownerId,
        youtubeUrl,
        youtubeVideoId,
        title,
        channelName: channelName ?? "",
        thumbnailUrl:
          thumbnailUrl ?? `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`,
        durationSeconds,
        description,
        tags,
      })
      .returning();

    return NextResponse.json(card);
  } catch (error) {
    console.error("Create card error:", error);
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}
