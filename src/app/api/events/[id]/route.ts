import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, guestGroups, guests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const eventId = parseInt(id, 10);

    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.userId, user.id)))
      .limit(1);

    if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const groups = await db
      .select()
      .from(guestGroups)
      .where(eq(guestGroups.eventId, eventId))
      .orderBy(guestGroups.createdAt);

    const groupsWithGuests = await Promise.all(
      groups.map(async (g) => {
        const guestList = await db
          .select()
          .from(guests)
          .where(eq(guests.groupId, g.id))
          .orderBy(guests.id);
        return { ...g, guests: guestList };
      })
    );

    return NextResponse.json({ event, groups: groupsWithGuests });
  } catch (e) {
    console.error("Event GET error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const eventId = parseInt(id, 10);

    await db.delete(events).where(and(eq(events.id, eventId), eq(events.userId, user.id)));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Event DELETE error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
