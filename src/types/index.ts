export type FamilyMember = {
  id: number;
  name: string;
  email: string;
  avatarEmoji: string;
  isAdmin: boolean;
};

export type VideoCard = {
  id: number;
  ownerId: number;
  youtubeUrl: string;
  youtubeVideoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  durationSeconds: number;
  description: string;
  tags: string[];
  createdAt: Date;
};

export type TradeOffer = {
  id: number;
  fromMemberId: number;
  toMemberId: number;
  videoCardId: number;
  message: string;
  status: "pending" | "watched";
  createdAt: Date;
};

export type WatchReaction = {
  id: number;
  videoCardId: number;
  memberId: number;
  emoji: string;
  comment: string;
  createdAt: Date;
};

export const REACTION_EMOJIS = ["🔥", "😂", "💀", "🥱", "🤯", "❤️"] as const;

export const DEFAULT_TAGS = [
  "funny",
  "music",
  "documentary",
  "short",
  "educational",
  "wholesome",
  "scary",
  "cooking",
  "sports",
  "gaming",
] as const;
