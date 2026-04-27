"use client";

import { useCallback, useEffect, useState } from "react";
import VideoCard from "@/components/cards/VideoCard";
import AddCardForm from "@/components/cards/AddCardForm";
import CardDetailModal from "@/components/cards/CardDetailModal";
import { useCurrentMember } from "@/components/layout/CurrentMemberContext";
import {
  fetchAllReactions,
  fetchCards,
  groupReactionsByCard,
} from "@/lib/api-client";
import type { VideoCard as VideoCardType, WatchReaction } from "@/types";

export default function MyShowcasePage() {
  const { currentMember, members, loading: membersLoading } = useCurrentMember();
  const [cards, setCards] = useState<VideoCardType[]>([]);
  const [reactionsByCard, setReactionsByCard] = useState<
    Map<number, WatchReaction[]>
  >(new Map());
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [openCard, setOpenCard] = useState<VideoCardType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!currentMember) return;
    setLoading(true);
    setError(null);
    try {
      const [c, r] = await Promise.all([
        fetchCards(currentMember.id),
        fetchAllReactions(),
      ]);
      setCards(c);
      setReactionsByCard(groupReactionsByCard(r));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [currentMember]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (membersLoading) {
    return (
      <main className="min-h-screen p-4 md:p-8">
        <p className="text-stone-500">Loading…</p>
      </main>
    );
  }

  if (!currentMember) {
    return (
      <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">My Showcase</h1>
        <p className="text-stone-600">
          Pick a family member from the dropdown above to start your showcase.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-3xl" aria-hidden>
            {currentMember.avatarEmoji}
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {currentMember.name}'s Showcase
            </h1>
            <p className="text-sm text-stone-500">
              Your collection of video cards
            </p>
          </div>
        </div>
        {!showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 rounded-lg bg-trade-500 text-white font-medium hover:bg-trade-600 shadow-sm"
          >
            + Add a Card
          </button>
        )}
      </div>

      {showAdd && (
        <div className="mb-6">
          <AddCardForm
            ownerId={currentMember.id}
            onCancel={() => setShowAdd(false)}
            onCreated={(card) => {
              setCards((prev) => [card, ...prev]);
              setShowAdd(false);
            }}
          />
        </div>
      )}

      {error && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-stone-500">Loading cards…</p>
      ) : cards.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-stone-300 bg-white">
          <p className="text-stone-600">
            Your showcase is empty. Add your first card above!
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
          owner={currentMember}
          members={members}
          currentMember={currentMember}
          onClose={() => setOpenCard(null)}
          onDeleted={() => {
            setCards((prev) => prev.filter((c) => c.id !== openCard.id));
          }}
        />
      )}
    </main>
  );
}
