import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, guestGroups, guests } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  req: NextRequest,
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

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    const body = await req.json();
    const { headGuestName, email, phone, maxGuests, guestNames } = body;

    if (!headGuestName || !maxGuests || maxGuests < 1) {
      return NextResponse.json({ error: "Head guest name and valid max guests are required" }, { status: 400 });
    }

    const token = uuidv4();

    const [group] = await db
      .insert(guestGroups)
      .values({
        eventId,
        headGuestName,
        email: email || null,
        phone: phone || null,
        maxGuests,
        token,
      })
      .returning();

    // Create the head guest
    await db.insert(guests).values({
      groupId: group.id,
      name: headGuestName,
      isHeadGuest: true,
    });

    // Create additional guest slots
    const additionalNames: string[] = guestNames || [];
    for (let i = 0; i < maxGuests - 1; i++) {
      await db.insert(guests).values({
        groupId: group.id,
        name: additionalNames[i] || `Guest ${i + 2}`,
        isHeadGuest: false,
      });
    }

    return NextResponse.json(group);
  } catch (e) {
    console.error("Group POST error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
