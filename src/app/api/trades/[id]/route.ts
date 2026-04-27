import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tradeOffers } from "@/db/schema";
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
  const { status } = body ?? {};
  if (status !== "pending" && status !== "watched") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  const [trade] = await db
    .update(tradeOffers)
    .set({ status })
    .where(eq(tradeOffers.id, id))
    .returning();
  if (!trade) {
    return NextResponse.json({ error: "Trade not found" }, { status: 404 });
  }
  return NextResponse.json(trade);
}
