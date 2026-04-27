"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/youtube";
import { tagColor } from "@/lib/tags";
import { REACTION_EMOJIS } from "@/types";
import type {
  FamilyMember,
  VideoCard as VideoCardType,
  WatchReaction,
} from "@/types";

type Props = {
  card: VideoCardType;
  owner: FamilyMember | null;
  members: FamilyMember[];
  currentMember: FamilyMember | null;
  onClose: () => void;
  onDeleted?: () => void;
  onUpdated?: (card: VideoCardType) => void;
};

export default function CardDetailModal({
  card,
  owner,
  members,
  currentMember,
  onClose,
  onDeleted,
  onUpdated,
}: Props) {
  const [reactions, setReactions] = useState<WatchReaction[]>([]);
  const [loadingReactions, setLoadingReactions] = useState(true);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [pickedEmoji, setPickedEmoji] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submittingReaction, setSubmittingReaction] = useState(false);

  const [showSuggestPicker, setShowSuggestPicker] = useState(false);
  const [suggestMessage, setSuggestMessage] = useState("");
  const [submittingSuggest, setSubmittingSuggest] = useState(false);
  const [suggestSentTo, setSuggestSentTo] = useState<string | null>(null);

  const isOwner = !!currentMember && currentMember.id === card.ownerId;
  const otherMembers = members.filter(
    (m) => m.id !== card.ownerId && m.id !== currentMember?.id
  );

  // Esc to close.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll while open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/reactions?videoCardId=${card.id}`);
        if (!res.ok) throw new Error();
        const data: WatchReaction[] = await res.json();
        if (!cancelled) setReactions(data);
      } catch {
        if (!cancelled) setReactions([]);
      } finally {
        if (!cancelled) setLoadingReactions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [card.id]);

  async function submitReaction() {
    if (!currentMember || !pickedEmoji) return;
    setSubmittingReaction(true);
    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoCardId: card.id,
          memberId: currentMember.id,
          emoji: pickedEmoji,
          comment,
        }),
      });
      if (!res.ok) throw new Error();
      const reaction: WatchReaction = await res.json();
      setReactions((prev) => [reaction, ...prev]);
      setShowReactionPicker(false);
      setPickedEmoji(null);
      setComment("");
    } catch (err) {
      console.error(err);
      alert("Failed to save reaction");
    } finally {
      setSubmittingReaction(false);
    }
  }

  async function suggestTo(toMember: FamilyMember) {
    if (!currentMember) return;
    setSubmittingSuggest(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromMemberId: currentMember.id,
          toMemberId: toMember.id,
          videoCardId: card.id,
          message: suggestMessage,
        }),
      });
      if (!res.ok) throw new Error();
      setSuggestSentTo(toMember.name);
      setShowSuggestPicker(false);
      setSuggestMessage("");
    } catch (err) {
      console.error(err);
      alert("Failed to send suggestion");
    } finally {
      setSubmittingSuggest(false);
    }
  }

  async function handleDelete() {
    if (!isOwner) return;
    if (!confirm("Delete this card? This can't be undone.")) return;
    try {
      const res = await fetch(`/api/cards/${card.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      onDeleted?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to delete card");
    }
  }

  function nameOf(memberId: number): string {
    return members.find((m) => m.id === memberId)?.name ?? "Someone";
  }
  function avatarOf(memberId: number): string {
    return members.find((m) => m.id === memberId)?.avatarEmoji ?? "👤";
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-stretch sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-3xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-screen sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-3 border-b border-stone-200 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 min-w-0">
            {owner && (
              <span className="text-xl shrink-0" aria-hidden>
                {owner.avatarEmoji}
              </span>
            )}
            <p className="text-sm text-stone-600 truncate">
              {owner ? `${owner.name}'s card` : "Card"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 hover:bg-stone-100 text-stone-600"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="aspect-video bg-black">
            <iframe
              src={`https://www.youtube.com/embed/${card.youtubeVideoId}?rel=0`}
              title={card.title}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold leading-snug">
                  {card.title}
                </h2>
                <p className="text-sm text-stone-500 mt-0.5">
                  {card.channelName}
                  {card.durationSeconds > 0 && (
                    <span className="ml-2 font-mono text-xs text-stone-600">
                      {formatDuration(card.durationSeconds)}
                    </span>
                  )}
                </p>
              </div>
              <a
                href={card.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-xs sm:text-sm text-trade-700 hover:text-trade-800 underline whitespace-nowrap"
              >
                Watch on YouTube ↗
              </a>
            </div>

            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {card.tags.map((t) => (
                  <span key={t} className={`tag-chip ${tagColor(t)}`}>
                    {t}
                  </span>
                ))}
              </div>
            )}

            {card.description && (
              <p className="text-sm text-stone-700 whitespace-pre-wrap">
                {card.description}
              </p>
            )}

            {/* Action row */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
              {currentMember && (
                <button
                  type="button"
                  onClick={() => setShowReactionPicker((v) => !v)}
                  className="px-3 py-2 rounded-lg bg-trade-500 text-white text-sm font-medium hover:bg-trade-600"
                >
                  ✓ I watched this
                </button>
              )}
              {currentMember && otherMembers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSuggestPicker((v) => !v)}
                  className="px-3 py-2 rounded-lg bg-stone-100 text-stone-800 text-sm font-medium hover:bg-stone-200"
                >
                  Suggest to…
                </button>
              )}
              {isOwner && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-sm font-medium hover:bg-rose-100 ml-auto"
                >
                  Delete card
                </button>
              )}
            </div>

            {showReactionPicker && (
              <div className="rounded-xl border border-stone-200 p-3 space-y-3 bg-stone-50">
                <p className="text-sm font-medium">How was it?</p>
                <div className="flex flex-wrap gap-2">
                  {REACTION_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setPickedEmoji(e)}
                      className={`text-2xl rounded-full w-12 h-12 flex items-center justify-center border-2 transition ${
                        pickedEmoji === e
                          ? "border-trade-500 bg-white scale-105"
                          : "border-transparent bg-white hover:border-stone-300"
                      }`}
                      aria-label={`React with ${e}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional comment…"
                  rows={2}
                  className="w-full border border-stone-300 rounded-lg p-2 text-sm bg-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowReactionPicker(false);
                      setPickedEmoji(null);
                      setComment("");
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm text-stone-600 hover:bg-stone-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={submitReaction}
                    disabled={!pickedEmoji || submittingReaction}
                    className="px-3 py-1.5 rounded-lg text-sm bg-trade-500 text-white font-medium hover:bg-trade-600 disabled:opacity-50"
                  >
                    {submittingReaction ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            )}

            {showSuggestPicker && (
              <div className="rounded-xl border border-stone-200 p-3 space-y-3 bg-stone-50">
                <p className="text-sm font-medium">Suggest this video to…</p>
                <textarea
                  value={suggestMessage}
                  onChange={(e) => setSuggestMessage(e.target.value)}
                  placeholder={`Optional note… ("You'll love this")`}
                  rows={2}
                  className="w-full border border-stone-300 rounded-lg p-2 text-sm bg-white"
                />
                <div className="flex flex-wrap gap-2">
                  {otherMembers.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => suggestTo(m)}
                      disabled={submittingSuggest}
                      className="px-3 py-2 rounded-lg bg-white border border-stone-300 text-sm hover:border-trade-400 hover:bg-trade-50 disabled:opacity-50"
                    >
                      <span className="mr-1">{m.avatarEmoji}</span> {m.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {suggestSentTo && (
              <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                ✓ Suggested to {suggestSentTo}
              </div>
            )}

            {/* Reactions list */}
            <div className="pt-3 border-t border-stone-100">
              <h3 className="text-sm font-semibold mb-2">
                Reactions
                {reactions.length > 0 && (
                  <span className="text-stone-500 font-normal ml-1">
                    ({reactions.length})
                  </span>
                )}
              </h3>
              {loadingReactions ? (
                <p className="text-sm text-stone-400">Loading…</p>
              ) : reactions.length === 0 ? (
                <p className="text-sm text-stone-400">
                  No reactions yet — be the first!
                </p>
              ) : (
                <ul className="space-y-2">
                  {reactions.map((r) => (
                    <li
                      key={r.id}
                      className="flex gap-2 items-start text-sm bg-stone-50 rounded-lg p-2"
                    >
                      <span className="text-xl shrink-0" aria-hidden>
                        {avatarOf(r.memberId)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p>
                          <span className="font-medium">{nameOf(r.memberId)}</span>{" "}
                          <span className="text-lg align-middle">{r.emoji}</span>
                        </p>
                        {r.comment && (
                          <p className="text-stone-600 mt-0.5 whitespace-pre-wrap">
                            {r.comment}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
