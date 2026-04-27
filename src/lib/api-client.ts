import type {
  FamilyMember,
  VideoCard,
  WatchReaction,
} from "@/types";

export async function fetchMembers(): Promise<FamilyMember[]> {
  const res = await fetch("/api/members");
  if (!res.ok) throw new Error(`Failed to load members (${res.status})`);
  return res.json();
}

export async function fetchCards(ownerId?: number): Promise<VideoCard[]> {
  const url = ownerId ? `/api/cards?ownerId=${ownerId}` : "/api/cards";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load cards (${res.status})`);
  return res.json();
}

export async function fetchAllReactions(): Promise<WatchReaction[]> {
  const res = await fetch("/api/reactions");
  if (!res.ok) throw new Error(`Failed to load reactions (${res.status})`);
  return res.json();
}

export function groupReactionsByCard(
  reactions: WatchReaction[]
): Map<number, WatchReaction[]> {
  const map = new Map<number, WatchReaction[]>();
  for (const r of reactions) {
    const arr = map.get(r.videoCardId);
    if (arr) {
      arr.push(r);
    } else {
      map.set(r.videoCardId, [r]);
    }
  }
  return map;
}
