"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import VideoCard from "@/components/cards/VideoCard";
import CardDetailModal from "@/components/cards/CardDetailModal";
import { useCurrentMember } from "@/components/layout/CurrentMemberContext";
import {
  fetchAllReactions,
  fetchCards,
  groupReactionsByCard,
} from "@/lib/api-client";
import type {
  FamilyMember,
  VideoCard as VideoCardType,
  WatchReaction,
} from "@/types";

export default function MemberShowcasePage({
  params,
}: {
  params: { memberId: string };
}) {
  const memberId = parseInt(params.memberId, 10);
  const { members, currentMember, loading: membersLoading } = useCurrentMember();
  const [cards, setCards] = useState<VideoCardType[]>([]);
  const [reactionsByCard, setReactionsByCard] = useState<
    Map<number, WatchReaction[]>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [openCard, setOpenCard] = useState<VideoCardType | null>(null);

  const owner: FamilyMember | undefined = members.find((m) => m.id === memberId);

  useEffect(() => {
    if (Number.isNaN(memberId)) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [c, r] = await Promise.all([
          fetchCards(memberId),
          fetchAllReactions(),
        ]);
        if (cancelled) return;
        setCards(c);
        setReactionsByCard(groupReactionsByCard(r));
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  if (Number.isNaN(memberId)) {
    return (
      <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
        <p className="text-stone-600">Invalid member.</p>
        <Link href="/" className="text-trade-700 underline mt-2 inline-block">
          ← Back home
        </Link>
      </main>
    );
  }

  if (membersLoading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <p className="text-stone-500">Loading…</p>
      </main>
    );
  }

  if (!owner) {
    return (
      <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
        <p className="text-stone-600">Member not found.</p>
        <Link href="/" className="text-trade-700 underline mt-2 inline-block">
          ← Back home
        </Link>
      </main>
    );
  }

  // If the user lands on their own showcase via this URL, redirect-style nudge.
  const isOwn = currentMember?.id === owner.id;

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <Link
        href="/"
        className="text-stone-500 hover:text-trade-700 text-sm inline-block mb-3"
      >
        ← All showcases
      </Link>
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <span className="text-3xl sm:text-4xl" aria-hidden>
          {owner.avatarEmoji}
        </span>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {owner.name}'s Showcase
          </h1>
          <p className="text-sm text-stone-500">
            {isOwn ? "(this is you)" : `${cards.length} cards`}
          </p>
        </div>
        {isOwn && (
          <Link
            href="/showcase"
            className="ml-auto px-3 py-1.5 rounded-lg bg-trade-100 text-trade-800 text-sm font-medium hover:bg-trade-200"
          >
            Edit your showcase →
          </Link>
        )}
      </div>

      {loading ? (
        <p className="text-stone-500">Loading cards…</p>
      ) : cards.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-stone-300 bg-white">
          <p className="text-stone-600">
            {owner.name} hasn't added any cards yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {cards.map((card) => (
            <VideoCard
              key={card.id}
              card={card}
              reactions={reactionsByCard.get(card.id) ?? []}
              onClick={() => setOpenCard(card)}
            />
          ))}
        </div>
      )}

      {openCard && (
        <CardDetailModal
          card={openCard}
          owner={owner}
          members={members}
          currentMember={currentMember}
          onClose={() => setOpenCard(null)}
        />
      )}
    </main>
  );
}
