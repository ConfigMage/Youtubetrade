"use client";

import { useCallback, useEffect, useState } from "react";
import CardDetailModal from "@/components/cards/CardDetailModal";
import { useCurrentMember } from "@/components/layout/CurrentMemberContext";
import { formatDuration } from "@/lib/youtube";
import type {
  FamilyMember,
  TradeOffer,
  VideoCard as VideoCardType,
} from "@/types";

type TradeRow = {
  trade: TradeOffer;
  card: VideoCardType;
  fromMember: { id: number; name: string; avatarEmoji: string };
};

export default function TradesPage() {
  const { currentMember, members, loading: membersLoading } = useCurrentMember();
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");
  const [rows, setRows] = useState<TradeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openCard, setOpenCard] = useState<VideoCardType | null>(null);

  const reload = useCallback(async () => {
    if (!currentMember) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trades?memberId=${currentMember.id}`);
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const data: TradeRow[] = await res.json();
      setRows(data);
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
        <h1 className="text-3xl font-bold mb-4">Trades</h1>
        <p className="text-stone-600">
          Pick a family member from the dropdown above to see your trades.
        </p>
      </main>
    );
  }

  const incoming = rows.filter((r) => r.trade.toMemberId === currentMember.id);
  const outgoing = rows.filter((r) => r.trade.fromMemberId === currentMember.id);
  const visible = tab === "incoming" ? incoming : outgoing;

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Trades</h1>

      <div className="inline-flex rounded-full border border-stone-200 bg-white p-1 mb-6 shadow-sm">
        <TabButton
          label={`Incoming (${incoming.length})`}
          active={tab === "incoming"}
          onClick={() => setTab("incoming")}
        />
        <TabButton
          label={`Outgoing (${outgoing.length})`}
          active={tab === "outgoing"}
          onClick={() => setTab("outgoing")}
        />
      </div>

      {error && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2 mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-stone-500">Loading trades…</p>
      ) : visible.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-stone-300 bg-white">
          <p className="text-stone-600">
            {tab === "incoming"
              ? "No suggestions for you yet."
              : "You haven't suggested any cards yet."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((row) => (
            <TradeRowItem
              key={row.trade.id}
              row={row}
              members={members}
              currentMemberId={currentMember.id}
              tab={tab}
              onOpen={() => setOpenCard(row.card)}
              onChanged={reload}
            />
          ))}
        </ul>
      )}

      {openCard && (
        <CardDetailModal
          card={openCard}
          owner={members.find((m) => m.id === openCard.ownerId) ?? null}
          members={members}
          currentMember={currentMember}
          onClose={() => setOpenCard(null)}
        />
      )}
    </main>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
        active
          ? "bg-trade-500 text-white shadow"
          : "text-stone-600 hover:bg-stone-100"
      }`}
    >
      {label}
    </button>
  );
}

function TradeRowItem({
  row,
  members,
  currentMemberId,
  tab,
  onOpen,
  onChanged,
}: {
  row: TradeRow;
  members: FamilyMember[];
  currentMemberId: number;
  tab: "incoming" | "outgoing";
  onOpen: () => void;
  onChanged: () => void;
}) {
  const { trade, card, fromMember } = row;
  const toMember = members.find((m) => m.id === trade.toMemberId);
  const counterparty = tab === "incoming" ? fromMember : toMember;
  const [busy, setBusy] = useState(false);

  async function markWatched() {
    setBusy(true);
    try {
      const res = await fetch(`/api/trades/${trade.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "watched" }),
      });
      if (!res.ok) throw new Error();
      onChanged();
    } catch {
      alert("Failed to update trade");
    } finally {
      setBusy(false);
    }
  }

  const isPending = trade.status === "pending";
  const watchedSuffix = trade.status === "watched" ? " · Watched ✓" : "";

  return (
    <li className="rounded-2xl border-2 border-stone-200 bg-white shadow-sm overflow-hidden flex flex-col sm:flex-row">
      <button
        type="button"
        onClick={onOpen}
        className="relative shrink-0 w-full sm:w-48 aspect-video sm:aspect-auto sm:h-auto bg-stone-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.thumbnailUrl}
          alt={card.title}
          className="w-full h-full object-cover"
        />
        {card.durationSeconds > 0 && (
          <span className="duration-badge">
            {formatDuration(card.durationSeconds)}
          </span>
        )}
      </button>
      <div className="p-3 sm:p-4 flex-1 flex flex-col gap-2 min-w-0">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          {counterparty && (
            <>
              <span className="text-lg" aria-hidden>
                {counterparty.avatarEmoji}
              </span>
              <span>
                {tab === "incoming"
                  ? `From ${counterparty.name}`
                  : `To ${counterparty.name}`}
              </span>
            </>
          )}
          <span
            className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
              isPending
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {trade.status}
            {watchedSuffix && ""}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="text-left font-semibold leading-snug hover:text-trade-700 line-clamp-2"
        >
          {card.title}
        </button>
        <p className="text-xs text-stone-500 line-clamp-1">{card.channelName}</p>
        {trade.message && (
          <p className="text-sm text-stone-700 italic border-l-2 border-trade-300 pl-2">
            &ldquo;{trade.message}&rdquo;
          </p>
        )}
        <div className="flex flex-wrap gap-2 mt-auto pt-1">
          <button
            type="button"
            onClick={onOpen}
            className="px-3 py-1.5 rounded-lg bg-trade-500 text-white text-sm font-medium hover:bg-trade-600"
          >
            Watch
          </button>
          {tab === "incoming" && isPending && (
            <button
              type="button"
              onClick={markWatched}
              disabled={busy}
              className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-800 text-sm font-medium hover:bg-stone-200 disabled:opacity-50"
            >
              {busy ? "…" : "Mark watched"}
            </button>
          )}
          {trade.toMemberId === currentMemberId && trade.status === "watched" && (
            <span className="text-xs text-stone-500 self-center">
              Reactions appear in the card detail.
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
