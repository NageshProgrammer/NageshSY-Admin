import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.NEON_DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("❌ NEON_DATABASE_URL is not set");
}

const sql = neon(DATABASE_URL, {
  fetchOptions: {
    cache: "no-store",
  },
});

export const db = drizzle(sql);
