import { RequestHandler } from "express";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db";
import { usersTable } from "../src/config/schema";

/**
 * 🔐 APP: Sync user after Clerk login/signup
 * POST /api/users/sync
 */
export const handleUserSync: RequestHandler = async (req, res) => {
  try {
    const { clerkId, email, name } = req.body;

    if (!clerkId || !email) {
      return res.status(400).json({ error: "Missing user data" });
    }

    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, clerkId))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(usersTable).values({
        id: clerkId,
        email,
        name,
        credits: 100, // fixed default (trial)
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("User sync error:", err);
    res.status(500).json({ error: "User sync failed" });
  }
};
