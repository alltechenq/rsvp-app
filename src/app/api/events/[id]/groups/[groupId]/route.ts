import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, guestGroups } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, groupId } = await params;
    const eventId = parseInt(id, 10);
    const gId = parseInt(groupId, 10);

    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, eventId), eq(events.userId, user.id)))
      .limit(1);

    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    await db.delete(guestGroups).where(and(eq(guestGroups.id, gId), eq(guestGroups.eventId, eventId)));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Group DELETE error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
