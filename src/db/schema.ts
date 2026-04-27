import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const familyMembers = pgTable("family_members", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatarEmoji: text("avatar_emoji").notNull().default("🎬"),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const videoCards = pgTable("video_cards", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => familyMembers.id, { onDelete: "cascade" }),
  youtubeUrl: text("youtube_url").notNull(),
  youtubeVideoId: text("youtube_video_id").notNull(),
  title: text("title").notNull(),
  channelName: text("channel_name").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  description: text("description").notNull().default(""),
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const tradeOffers = pgTable("trade_offers", {
  id: serial("id").primaryKey(),
  fromMemberId: integer("from_member_id")
    .notNull()
    .references(() => familyMembers.id, { onDelete: "cascade" }),
  toMemberId: integer("to_member_id")
    .notNull()
    .references(() => familyMembers.id, { onDelete: "cascade" }),
  videoCardId: integer("video_card_id")
    .notNull()
    .references(() => videoCards.id, { onDelete: "cascade" }),
  message: text("message").default(""),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const watchReactions = pgTable("watch_reactions", {
  id: serial("id").primaryKey(),
  videoCardId: integer("video_card_id")
    .notNull()
    .references(() => videoCards.id, { onDelete: "cascade" }),
  memberId: integer("member_id")
    .notNull()
    .references(() => familyMembers.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull().default("🔥"),
  comment: text("comment").default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
