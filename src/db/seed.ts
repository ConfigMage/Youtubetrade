import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { familyMembers } from "./schema";
import "dotenv/config";

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("🌱 Seeding family members...");

  await db.insert(familyMembers).values([
    { name: "Chris", email: "chris@example.com", avatarEmoji: "🎣", isAdmin: true },
    { name: "Savanah", email: "savanah@example.com", avatarEmoji: "🌸", isAdmin: false },
    // Add more family members here
  ]);

  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
