import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, guestGroups, guests } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const [group] = await db
      .select()
      .from(guestGroups)
      .where(eq(guestGroups.token, token))
      .limit(1);

    if (!group) return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });

    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, group.eventId))
      .limit(1);

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const guestList = await db
      .select()
      .from(guests)
      .where(eq(guests.groupId, group.id))
      .orderBy(guests.id);

    const now = new Date();
    const deadlinePassed = new Date(event.rsvpDeadline) < now;

    return NextResponse.json({
      event: {
        title: event.title,
        eventType: event.eventType,
        hostNames: event.hostNames,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        venue: event.venue,
        venueAddress: event.venueAddress,
        rsvpDeadline: event.rsvpDeadline,
        message: event.message,
      },
      group: {
        headGuestName: group.headGuestName,
        maxGuests: group.maxGuests,
        responded: group.responded,
        respondedAt: group.respondedAt,
      },
      guests: guestList.map((g) => ({
        id: g.id,
        name: g.name,
        isHeadGuest: g.isHeadGuest,
        attending: g.attending,
      })),
      deadlinePassed,
    });
  } catch (e) {
    console.error("RSVP GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const { responses } = body as { responses: { guestId: number; attending: boolean }[] };

    const [group] = await db
      .select()
      .from(guestGroups)
      .where(eq(guestGroups.token, token))
      .limit(1);

    if (!group) return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });

    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, group.eventId))
      .limit(1);

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const now = new Date();
    if (new Date(event.rsvpDeadline) < now) {
      return NextResponse.json({ error: "RSVP deadline has passed" }, { status: 400 });
    }

    // Update each guest's attendance
    for (const r of responses) {
      await db
        .update(guests)
        .set({ attending: r.attending })
        .where(eq(guests.id, r.guestId));
    }

    // Mark group as responded
    await db
      .update(guestGroups)
      .set({ responded: true, respondedAt: now })
      .where(eq(guestGroups.id, group.id));

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("RSVP POST error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
