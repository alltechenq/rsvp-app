import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, guestGroups } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getSessionUser, getBaseUrl } from "@/lib/auth";
import nodemailer from "nodemailer";

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return null;

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

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
    const { type, groupIds } = body as { type: "save_the_date" | "rsvp"; groupIds: number[] };

    if (!type || !groupIds || groupIds.length === 0) {
      return NextResponse.json({ error: "Type and group IDs are required" }, { status: 400 });
    }

    const groups = await db
      .select()
      .from(guestGroups)
      .where(and(eq(guestGroups.eventId, eventId), inArray(guestGroups.id, groupIds)));

    const transporter = buildTransporter();
    const baseUrl = getBaseUrl();
    const results: { groupId: number; email: boolean; whatsappLink: string | null }[] = [];

    for (const group of groups) {
      const inviteUrl = `${baseUrl}/invite/${group.token}`;
      let emailSent = false;
      let whatsappLink: string | null = null;

      if (type === "save_the_date") {
        const subject = `Save the Date — ${event.title}`;
        const text = `Dear ${group.headGuestName},\n\nPlease save the date for the ${event.eventType} of ${event.hostNames} on ${formatDate(new Date(event.eventDate))} at ${event.eventTime}.\n\nVenue: ${event.venue}\n\nFormal invitation to follow.\n\nWarm regards`;
        const html = `
          <div style="font-family:Georgia,serif;max-width:500px;margin:0 auto;padding:40px;background:#FFFDF7;border:1px solid #F7E7CE;border-radius:12px;">
            <h2 style="color:#C5975B;text-align:center;margin-bottom:8px;">Save the Date</h2>
            <p style="text-align:center;color:#6B6B6B;font-size:14px;">You are invited</p>
            <hr style="border:none;border-top:1px solid #F7E7CE;margin:20px 0;">
            <p style="color:#2D2D2D;">Dear <strong>${group.headGuestName}</strong>,</p>
            <p style="color:#2D2D2D;">Please save the date for the <strong>${event.eventType}</strong> of <strong>${event.hostNames}</strong>.</p>
            <div style="background:#F7E7CE;padding:20px;border-radius:8px;text-align:center;margin:20px 0;">
              <p style="font-size:18px;color:#2D2D2D;margin:0;">${formatDate(new Date(event.eventDate))}</p>
              <p style="color:#6B6B6B;margin:4px 0 0;">${event.eventTime} · ${event.venue}</p>
            </div>
            <p style="color:#6B6B6B;font-size:13px;text-align:center;">Formal invitation to follow.</p>
          </div>`;

        if (transporter && group.email) {
          try {
            await transporter.sendMail({
              from: process.env.SMTP_FROM || process.env.SMTP_USER,
              to: group.email,
              subject,
              text,
              html,
            });
            emailSent = true;
          } catch (err) {
            console.error("Email send error:", err);
          }
        }

        if (group.phone) {
          const phone = group.phone.replace(/\D/g, "");
          const msg = encodeURIComponent(`Save the Date ✨\n\nDear ${group.headGuestName},\n\nPlease save the date for the ${event.eventType} of ${event.hostNames} on ${formatDate(new Date(event.eventDate))} at ${event.eventTime}.\n\nVenue: ${event.venue}\n\nFormal invitation to follow.`);
          whatsappLink = `https://wa.me/${phone}?text=${msg}`;
        }

        await db
          .update(guestGroups)
          .set({ saveTheDateSent: true })
          .where(eq(guestGroups.id, group.id));
      } else {
        const subject = `You're Invited — ${event.title}`;
        const text = `Dear ${group.headGuestName},\n\nYou are invited to the ${event.eventType} of ${event.hostNames} on ${formatDate(new Date(event.eventDate))} at ${event.eventTime}.\n\nVenue: ${event.venue}\n\nYour party size: ${group.maxGuests} guest(s)\n\nPlease RSVP by ${formatDate(new Date(event.rsvpDeadline))}.\n\nClick here to respond: ${inviteUrl}`;
        const html = `
          <div style="font-family:Georgia,serif;max-width:500px;margin:0 auto;padding:40px;background:#FFFDF7;border:1px solid #F7E7CE;border-radius:12px;">
            <h2 style="color:#C5975B;text-align:center;margin-bottom:8px;">You're Invited</h2>
            <p style="text-align:center;color:#6B6B6B;font-size:14px;">to the ${event.eventType} of ${event.hostNames}</p>
            <hr style="border:none;border-top:1px solid #F7E7CE;margin:20px 0;">
            <p style="color:#2D2D2D;">Dear <strong>${group.headGuestName}</strong>,</p>
            <p style="color:#2D2D2D;">We would be honoured by your presence at the <strong>${event.eventType}</strong> of <strong>${event.hostNames}</strong>.</p>
            <div style="background:#F7E7CE;padding:20px;border-radius:8px;text-align:center;margin:20px 0;">
              <p style="font-size:18px;color:#2D2D2D;margin:0;">${formatDate(new Date(event.eventDate))}</p>
              <p style="color:#6B6B6B;margin:4px 0 0;">${event.eventTime} · ${event.venue}</p>
              <p style="color:#C5975B;margin:12px 0 0;font-size:14px;">Party size: ${group.maxGuests} guest(s)</p>
            </div>
            <div style="text-align:center;margin:24px 0;">
              <a href="${inviteUrl}" style="display:inline-block;background:#2D2D2D;color:#FFFDF7;padding:14px 32px;border-radius:50px;text-decoration:none;font-size:14px;font-weight:600;">RSVP Now</a>
            </div>
            <p style="color:#6B6B6B;font-size:12px;text-align:center;">Please respond by ${formatDate(new Date(event.rsvpDeadline))}</p>
          </div>`;

        if (transporter && group.email) {
          try {
            await transporter.sendMail({
              from: process.env.SMTP_FROM || process.env.SMTP_USER,
              to: group.email,
              subject,
              text,
              html,
            });
            emailSent = true;
          } catch (err) {
            console.error("Email send error:", err);
          }
        }

        if (group.phone) {
          const phone = group.phone.replace(/\D/g, "");
          const msg = encodeURIComponent(`You're Invited! ✨\n\nDear ${group.headGuestName},\n\nYou are invited to the ${event.eventType} of ${event.hostNames} on ${formatDate(new Date(event.eventDate))} at ${event.eventTime}.\n\nVenue: ${event.venue}\nParty size: ${group.maxGuests} guest(s)\n\nPlease RSVP by ${formatDate(new Date(event.rsvpDeadline))}:\n${inviteUrl}`);
          whatsappLink = `https://wa.me/${phone}?text=${msg}`;
        }

        await db
          .update(guestGroups)
          .set({ inviteSent: true })
          .where(eq(guestGroups.id, group.id));
      }

      results.push({ groupId: group.id, email: emailSent, whatsappLink });
    }

    return NextResponse.json({ results });
  } catch (e) {
    console.error("Send error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
