"use client";

import { useState } from "react";
import { formatDuration } from "@/lib/youtube";
import { parseTagsInput, tagColor } from "@/lib/tags";
import { DEFAULT_TAGS } from "@/types";
import type { VideoCard } from "@/types";

type Metadata = {
  videoId: string;
  youtubeVideoId: string;
  youtubeUrl: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  durationSeconds: number;
};

type Props = {
  ownerId: number;
  onCancel: () => void;
  onCreated: (card: VideoCard) => void;
};

export default function AddCardForm({ ownerId, onCancel, onCreated }: Props) {
  const [url, setUrl] = useState("");
  const [meta, setMeta] = useState<Metadata | null>(null);
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tags = parseTagsInput(tagsInput);

  function toggleTag(tag: string) {
    const set = new Set(tags);
    if (set.has(tag)) {
      set.delete(tag);
    } else {
      set.add(tag);
    }
    setTagsInput(Array.from(set).join(", "));
  }

  async function fetchMeta() {
    setError(null);
    setFetching(true);
    try {
      const res = await fetch("/api/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to look up video");
      }
      setMeta(data);
    } catch (err) {
      setError((err as Error).message);
      setMeta(null);
    } finally {
      setFetching(false);
    }
  }

  async function save() {
    if (!meta) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerId,
          youtubeUrl: meta.youtubeUrl,
          youtubeVideoId: meta.youtubeVideoId,
          title: meta.title,
          channelName: meta.channelName,
          thumbnailUrl: meta.thumbnailUrl,
          durationSeconds: meta.durationSeconds,
          description,
          tags,
        }),
      });
      const card = await res.json();
      if (!res.ok) {
        throw new Error(card.error || "Failed to save card");
      }
      onCreated(card);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-trade-200 bg-white p-4 sm:p-6 shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Add a Card</h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-stone-500 hover:text-stone-800 text-sm"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">YouTube URL</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (url) fetchMeta();
              }
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-trade-500"
          />
          <button
            type="button"
            onClick={fetchMeta}
            disabled={!url || fetching}
            className="px-4 py-2 rounded-lg bg-trade-500 text-white text-sm font-medium hover:bg-trade-600 disabled:opacity-50"
          >
            {fetching ? "Looking up…" : "Look up"}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-2">
          {error}
        </div>
      )}

      {meta && (
        <div className="space-y-4">
          <div className="rounded-xl border border-stone-200 overflow-hidden">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={meta.thumbnailUrl}
                alt={meta.title}
                className="w-full aspect-video object-cover"
              />
              {meta.durationSeconds > 0 && (
                <span className="duration-badge">
                  {formatDuration(meta.durationSeconds)}
                </span>
              )}
            </div>
            <div className="p-3">
              <p className="font-semibold text-sm">{meta.title}</p>
              <p className="text-xs text-stone-500">{meta.channelName}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Why you love it</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="A few words about why this is in your showcase…"
              className="w-full border border-stone-300 rounded-lg p-2 text-sm focus:outline-none focus:border-trade-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Tags{" "}
              <span className="text-stone-400 font-normal">
                (comma separated)
              </span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="funny, music, short"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-trade-500"
            />
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_TAGS.map((t) => {
                const active = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`tag-chip border transition ${
                      active
                        ? `${tagColor(t)} border-current`
                        : "bg-white text-stone-600 border-stone-300 hover:border-stone-400"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm text-stone-600 hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-trade-500 text-white text-sm font-medium hover:bg-trade-600 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add to my showcase"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
