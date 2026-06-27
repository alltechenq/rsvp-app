import { cookies } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session_user_id");
  if (!sessionCookie) return null;

  const userId = parseInt(sessionCookie.value, 10);
  if (isNaN(userId)) return null;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user || null;
}

export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
