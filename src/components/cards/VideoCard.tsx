"use client";

import { formatDuration } from "@/lib/youtube";
import { tagColor } from "@/lib/tags";
import type { VideoCard as VideoCardType, WatchReaction } from "@/types";

type Props = {
  card: VideoCardType;
  reactions?: WatchReaction[];
  onClick?: () => void;
  className?: string;
};

export default function VideoCard({
  card,
  reactions = [],
  onClick,
  className = "",
}: Props) {
  const previewReactions = reactions.slice(0, 4);
  const extra = reactions.length - previewReactions.length;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`video-card group cursor-pointer overflow-hidden text-left flex flex-col w-full ${className}`}
    >
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.thumbnailUrl}
          alt={card.title}
          loading="lazy"
          className="w-full aspect-video object-cover transition-transform duration-200 group-hover:scale-[1.02]"
        />
        {card.durationSeconds > 0 && (
          <span className="duration-badge">
            {formatDuration(card.durationSeconds)}
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-sm line-clamp-2 leading-snug">
          {card.title}
        </h3>
        <p className="text-xs text-stone-500 line-clamp-1">
          {card.channelName}
        </p>
        {card.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {card.tags.slice(0, 3).map((t) => (
              <span key={t} className={`tag-chip ${tagColor(t)}`}>
                {t}
              </span>
            ))}
            {card.tags.length > 3 && (
              <span className="tag-chip bg-stone-100 text-stone-600">
                +{card.tags.length - 3}
              </span>
            )}
          </div>
        )}
        {reactions.length > 0 && (
          <div className="mt-auto pt-1 flex items-center gap-1 text-sm">
            {previewReactions.map((r) => (
              <span key={r.id} aria-hidden>
                {r.emoji}
              </span>
            ))}
            {extra > 0 && (
              <span className="text-xs text-stone-500">+{extra}</span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
