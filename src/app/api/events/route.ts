import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await db.select().from(events).where(eq(events.userId, user.id)).orderBy(events.createdAt);
    return NextResponse.json(result);
  } catch (e) {
    console.error("Events GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, eventType, hostNames, eventDate, eventTime, venue, venueAddress, rsvpDeadline, message } = body;

    if (!title || !eventType || !hostNames || !eventDate || !eventTime || !venue || !rsvpDeadline) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [event] = await db
      .insert(events)
      .values({
        userId: user.id,
        title,
        eventType,
        hostNames,
        eventDate: new Date(eventDate),
        eventTime,
        venue,
        venueAddress: venueAddress || null,
        rsvpDeadline: new Date(rsvpDeadline),
        message: message || null,
      })
      .returning();

    return NextResponse.json(event);
  } catch (e) {
    console.error("Events POST error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
