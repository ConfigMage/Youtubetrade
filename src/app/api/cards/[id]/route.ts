import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { videoCards } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  const body = await req.json();
  const { description, tags } = body ?? {};

  const updateData: Record<string, unknown> = {};
  if (typeof description === "string") updateData.description = description;
  if (Array.isArray(tags)) updateData.tags = tags;

  const [card] = await db
    .update(videoCards)
    .set(updateData)
    .where(eq(videoCards.id, id))
    .returning();

  if (!card) {
    return NextResponse.json({ error: "Card not found" }, { status: 404 });
  }
  return NextResponse.json(card);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await db.delete(videoCards).where(eq(videoCards.id, id));
  return NextResponse.json({ success: true });
}
