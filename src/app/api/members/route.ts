import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { familyMembers } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  const members = await db
    .select()
    .from(familyMembers)
    .orderBy(asc(familyMembers.createdAt));
  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, avatarEmoji = "🎬", isAdmin = false } = body ?? {};
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email required" },
        { status: 400 }
      );
    }
    const [member] = await db
      .insert(familyMembers)
      .values({ name, email, avatarEmoji, isAdmin })
      .returning();
    return NextResponse.json(member);
  } catch (error) {
    console.error("Create member error:", error);
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body ?? {};
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  const [member] = await db
    .update(familyMembers)
    .set(data)
    .where(eq(familyMembers.id, id))
    .returning();
  if (!member) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }
  return NextResponse.json(member);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }
  await db.delete(familyMembers).where(eq(familyMembers.id, id));
  return NextResponse.json({ success: true });
}
