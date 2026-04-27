import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tradeOffers, familyMembers, videoCards } from "@/db/schema";
import { and, desc, eq, or } from "drizzle-orm";
import { Resend } from "resend";

export async function GET(req: NextRequest) {
  const fromMemberId = req.nextUrl.searchParams.get("fromMemberId");
  const toMemberId = req.nextUrl.searchParams.get("toMemberId");
  const memberId = req.nextUrl.searchParams.get("memberId");

  // Join the related card + members so the UI can render in one trip.
  const fromMember = familyMembers;
  const baseQuery = db
    .select({
      trade: tradeOffers,
      card: videoCards,
      fromMember: {
        id: fromMember.id,
        name: fromMember.name,
        avatarEmoji: fromMember.avatarEmoji,
      },
    })
    .from(tradeOffers)
    .innerJoin(videoCards, eq(tradeOffers.videoCardId, videoCards.id))
    .innerJoin(fromMember, eq(tradeOffers.fromMemberId, fromMember.id));

  let where;
  if (memberId) {
    const id = parseInt(memberId, 10);
    where = or(
      eq(tradeOffers.fromMemberId, id),
      eq(tradeOffers.toMemberId, id)
    );
  } else if (fromMemberId) {
    where = eq(tradeOffers.fromMemberId, parseInt(fromMemberId, 10));
  } else if (toMemberId) {
    where = eq(tradeOffers.toMemberId, parseInt(toMemberId, 10));
  }

  const rows = where
    ? await baseQuery.where(where).orderBy(desc(tradeOffers.createdAt))
    : await baseQuery.orderBy(desc(tradeOffers.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromMemberId, toMemberId, videoCardId, message = "" } = body ?? {};

    if (!fromMemberId || !toMemberId || !videoCardId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (fromMemberId === toMemberId) {
      return NextResponse.json(
        { error: "Can't suggest a card to yourself" },
        { status: 400 }
      );
    }

    const [trade] = await db
      .insert(tradeOffers)
      .values({ fromMemberId, toMemberId, videoCardId, message })
      .returning();

    // Best-effort email notification — never block trade creation on it.
    if (process.env.RESEND_API_KEY) {
      try {
        const [toMember] = await db
          .select()
          .from(familyMembers)
          .where(eq(familyMembers.id, toMemberId));
        const [fromMember] = await db
          .select()
          .from(familyMembers)
          .where(eq(familyMembers.id, fromMemberId));
        const [card] = await db
          .select()
          .from(videoCards)
          .where(eq(videoCards.id, videoCardId));

        if (toMember?.email && fromMember && card) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
          await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || "trades@videotrade.app",
            to: toMember.email,
            subject: `${fromMember.name} suggested a video for you 🎬`,
            html: `
              <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>${fromMember.avatarEmoji} ${fromMember.name} suggested a video!</h2>
                <p style="color:#666;">"${card.title}" by ${card.channelName}</p>
                ${message ? `<blockquote style="border-left: 3px solid #f19333; padding-left: 12px; color: #444;">${escapeHtml(message)}</blockquote>` : ""}
                <p>
                  <a href="${appUrl}/trades" style="display:inline-block;background:#ee7711;color:white;padding:10px 16px;border-radius:8px;text-decoration:none;">Open Video Trade</a>
                </p>
              </div>
            `,
          });
        }
      } catch (mailErr) {
        console.error("Resend email failed:", mailErr);
      }
    }

    return NextResponse.json(trade);
  } catch (error) {
    console.error("Create trade error:", error);
    return NextResponse.json({ error: "Failed to create trade" }, { status: 500 });
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
