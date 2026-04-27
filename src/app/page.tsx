"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import VideoCard from "@/components/cards/VideoCard";
import Carousel from "@/components/cards/Carousel";
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

export default function HomePage() {
  const { members, currentMember, loading: membersLoading } = useCurrentMember();
  const [cards, setCards] = useState<VideoCardType[]>([]);
  const [reactionsByCard, setReactionsByCard] = useState<
    Map<number, WatchReaction[]>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [openCard, setOpenCard] = useState<VideoCardType | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [c, r] = await Promise.all([fetchCards(), fetchAllReactions()]);
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
  }, []);

  const cardsByOwner = new Map<number, VideoCardType[]>();
  for (const card of cards) {
    const arr = cardsByOwner.get(card.ownerId);
    if (arr) arr.push(card);
    else cardsByOwner.set(card.ownerId, [card]);
  }

  const owner = openCard
    ? members.find((m) => m.id === openCard.ownerId) ?? null
    : null;

  return (
    <main className="min-h-screen pb-12 max-w-6xl mx-auto px-4 md:px-8 pt-4 md:pt-8">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
          🎬 The Family Video Trade
        </h1>
        <p className="text-stone-600 text-sm sm:text-base mt-1">
          Browse everyone's showcases. Tap a card to watch.
        </p>
      </header>

      {membersLoading || loading ? (
        <p className="text-stone-500">Loading…</p>
      ) : members.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-stone-300 bg-white">
          <p className="text-stone-600">
            No family members yet. Visit the admin page to add some.
          </p>
        </div>
      ) : (
        <div className="space-y-8 sm:space-y-10">
          {members.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              cards={cardsByOwner.get(member.id) ?? []}
              reactionsByCard={reactionsByCard}
              isCurrent={currentMember?.id === member.id}
              onCardClick={(card) => setOpenCard(card)}
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

function MemberRow({
  member,
  cards,
  reactionsByCard,
  isCurrent,
  onCardClick,
}: {
  member: FamilyMember;
  cards: VideoCardType[];
  reactionsByCard: Map<number, WatchReaction[]>;
  isCurrent: boolean;
  onCardClick: (card: VideoCardType) => void;
}) {
  const showcaseHref = isCurrent ? "/showcase" : `/showcase/${member.id}`;
  return (
    <section>
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <Link
          href={showcaseHref}
          className="flex items-center gap-2 group"
        >
          <span className="text-2xl sm:text-3xl" aria-hidden>
            {member.avatarEmoji}
          </span>
          <h2 className="text-lg sm:text-xl font-bold group-hover:text-trade-700 transition-colors">
            {member.name}'s Showcase
          </h2>
          <span className="text-stone-400 text-sm group-hover:text-trade-600 transition-colors">
            {cards.length > 0 ? `(${cards.length})` : ""}
          </span>
          <span className="text-stone-400 text-sm ml-1 group-hover:text-trade-600 transition-colors">
            →
          </span>
        </Link>
      </div>
      {cards.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-stone-200 bg-white px-4 py-6 text-sm text-stone-500">
          No cards yet.
        </div>
      ) : (
        <Carousel>
          {cards.map((card) => (
            <div
              key={card.id}
              className="snap-start shrink-0 w-44 sm:w-52 md:w-56"
            >
              <VideoCard
                card={card}
                reactions={reactionsByCard.get(card.id) ?? []}
                onClick={() => onCardClick(card)}
              />
            </div>
          ))}
        </Carousel>
      )}
    </section>
  );
}
