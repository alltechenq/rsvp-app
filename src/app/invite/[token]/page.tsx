"use client";

import { useState, useEffect, use } from "react";

interface GuestData {
  id: number;
  name: string;
  isHeadGuest: boolean;
  attending: boolean | null;
}

interface InviteData {
  event: {
    title: string;
    eventType: string;
    hostNames: string;
    eventDate: string;
    eventTime: string;
    venue: string;
    venueAddress: string | null;
    rsvpDeadline: string;
    message: string | null;
  };
  group: {
    headGuestName: string;
    maxGuests: number;
    responded: boolean;
    respondedAt: string | null;
  };
  guests: GuestData[];
  deadlinePassed: boolean;
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cardOpened, setCardOpened] = useState(false);
  const [showRsvp, setShowRsvp] = useState(false);
  const [responses, setResponses] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/rsvp/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setData(d);
          // Pre-fill responses if already responded
          if (d.group.responded) {
            const resps: Record<number, boolean> = {};
            d.guests.forEach((g: GuestData) => {
              resps[g.id] = g.attending ?? false;
            });
            setResponses(resps);
          } else {
            // Default all to true
            const resps: Record<number, boolean> = {};
            d.guests.forEach((g: GuestData) => {
              resps[g.id] = true;
            });
            setResponses(resps);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load invitation");
        setLoading(false);
      });
  }, [token]);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  function formatDateLong(d: string) {
    return new Date(d).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(t: string) {
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const payload = Object.entries(responses).map(([id, attending]) => ({
        guestId: parseInt(id, 10),
        attending,
      }));

      const res = await fetch(`/api/rsvp/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: payload }),
      });

      const result = await res.json();
      if (!res.ok) {
        alert(result.error || "Failed to submit RSVP");
      } else {
        setSubmitted(true);
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory">
        <div className="text-warm-gray animate-pulse-soft font-display text-xl">
          Opening your invitation…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ivory px-6">
        <div className="text-center">
          <div className="text-4xl mb-4">😔</div>
          <p className="text-charcoal font-display text-xl">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { event, group, guests } = data;

  // Landing page (envelope)
  if (!cardOpened) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-6 py-12">
        <div className="text-center max-w-md w-full animate-fade-in-up">
          {/* Decorative top ornament */}
          <div className="text-gold text-3xl mb-6 tracking-[0.5em]">✦ ✦ ✦</div>

          <h1 className="font-display text-4xl md:text-5xl text-charcoal mb-3">
            {event.title}
          </h1>

          <p className="text-warm-gray mb-2 text-lg">{event.hostNames}</p>

          <div className="my-8 py-6 border-t border-b border-champagne">
            <p className="font-display text-2xl text-charcoal mb-1">
              {formatDateLong(event.eventDate)}
            </p>
            <p className="text-gold-dark text-lg">{formatTime(event.eventTime)}</p>
            <p className="text-warm-gray mt-3">{event.venue}</p>
            {event.venueAddress && (
              <p className="text-warm-gray text-sm mt-1">{event.venueAddress}</p>
            )}
          </div>

          <button
            onClick={() => setCardOpened(true)}
            className="group inline-flex items-center gap-3 bg-charcoal text-ivory px-10 py-4 rounded-full text-sm font-semibold hover:bg-charcoal/90 transition-all hover:shadow-xl hover:scale-[1.02]"
          >
            Open Invitation
            <svg
              className="w-4 h-4 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </button>

          <div className="mt-8 text-gold text-3xl tracking-[0.5em]">✦ ✦ ✦</div>
        </div>
      </div>
    );
  }

  // Card opened — show animated invitation + RSVP
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Animated Card */}
        <div className="animate-card-open bg-white rounded-2xl border border-champagne overflow-hidden shadow-lg">
          {/* Gold shimmer header */}
          <div className="bg-gradient-to-r from-champagne via-gold/20 to-champagne p-1">
            <div className="animate-shimmer h-1" />
          </div>

          <div className="px-8 py-10 md:px-12 md:py-14 text-center">
            {/* Ornament */}
            <div className="text-gold text-2xl tracking-[0.5em] mb-8 opacity-0 animate-fade-in-up delay-300">
              ❋
            </div>

            {/* Greeting */}
            <p className="text-warm-gray text-sm uppercase tracking-[0.3em] mb-3 opacity-0 animate-fade-in-up delay-400">
              Dear
            </p>
            <h2 className="font-display text-3xl text-charcoal mb-6 opacity-0 animate-fade-in-up delay-500">
              {group.headGuestName}
            </h2>

            {/* Invitation text */}
            <div className="opacity-0 animate-fade-in-up delay-600">
              <p className="text-charcoal leading-relaxed mb-6">
                We invite you to the{" "}
                <span className="font-semibold">{event.eventType.toLowerCase()}</span> of{" "}\n
                <span className="font-display text-gold-dark text-lg">{event.hostNames}</span>
              </p>
            </div>

            {/* Date, time, venue block */}
            <div className="opacity-0 animate-fade-in-up delay-800 my-8 py-6 border-t border-b border-champagne/60">
              <p className="font-display text-xl text-charcoal">
                on {formatDate(event.eventDate)}
              </p>
              <p className="text-gold-dark font-medium mt-1">
                at {formatTime(event.eventTime)}
              </p>
              <p className="text-warm-gray mt-3">{event.venue}</p>
              {event.venueAddress && (
                <p className="text-warm-gray text-sm mt-1">{event.venueAddress}</p>
              )}
            </div>

            {/* Party size */}
            <div className="opacity-0 animate-fade-in-up delay-1000 mb-6">
              <p className="text-sm text-warm-gray">
                Your party of{" "}
                <span className="font-semibold text-charcoal">{group.maxGuests}</span>{" "}
                {group.maxGuests === 1 ? "guest" : "guests"}
              </p>
            </div>

            {/* Custom message */}
            {event.message && (
              <div className="opacity-0 animate-fade-in-up delay-1000 mb-6 px-4 py-3 bg-ivory rounded-lg">
                <p className="text-sm text-warm-gray italic">&ldquo;{event.message}&rdquo;</p>
              </div>
            )}

            {/* RSVP Deadline */}
            <div className="opacity-0 animate-fade-in-up delay-1000 mb-8">
              <p className="text-xs text-warm-gray uppercase tracking-wider">
                Kindly respond by{" "}
                <span className="font-semibold text-gold-dark">
                  {formatDate(event.rsvpDeadline)}
                </span>
              </p>
            </div>

            {/* RSVP section */}
            {submitted ? (
              <div className="opacity-0 animate-fade-in-up delay-100 bg-ivory rounded-xl p-8">
                <div className="text-4xl mb-3">🎉</div>
                <p className="font-display text-xl text-charcoal mb-2">Thank you!</p>
                <p className="text-sm text-warm-gray">Your response has been recorded.</p>
                <div className="mt-4 space-y-1">
                  {guests.map((g) => (
                    <p
                      key={g.id}
                      className={`text-sm ${
                        responses[g.id] ? "text-deep-green" : "text-red-500"
                      }`}
                    >
                      {g.name} — {responses[g.id] ? "Attending ✓" : "Not attending ✗"}
                    </p>
                  ))}
                </div>
              </div>
            ) : data.deadlinePassed ? (
              <div className="bg-red-50 rounded-xl p-6">
                <p className="text-red-600 font-medium">The RSVP deadline has passed.</p>
                {group.responded && (
                  <div className="mt-3 space-y-1">
                    {guests.map((g) => (
                      <p
                        key={g.id}
                        className={`text-sm ${
                          g.attending ? "text-deep-green" : "text-red-500"
                        }`}
                      >
                        {g.name} — {g.attending ? "Attending ✓" : "Not attending ✗"}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ) : !showRsvp ? (
              <div className="opacity-0 animate-fade-in-up delay-1000">
                <button
                  onClick={() => setShowRsvp(true)}
                  className="bg-charcoal text-ivory px-10 py-4 rounded-full text-sm font-semibold hover:bg-charcoal/90 transition-all hover:shadow-lg hover:scale-[1.02]"
                >
                  RSVP Now
                </button>
                {group.responded && (
                  <p className="text-xs text-warm-gray mt-3">
                    You&apos;ve already responded. Click to update.
                  </p>
                )}
              </div>
            ) : (
              <div className="animate-slide-up bg-ivory rounded-xl p-6">
                <h3 className="font-display text-lg text-charcoal mb-4">
                  Who will be attending?
                </h3>
                <div className="space-y-3 mb-6">
                  {guests.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-champagne/40"
                    >
                      <div className="flex items-center gap-2">
                        {g.isHeadGuest && (
                          <span className="text-gold text-xs">★</span>
                        )}
                        <span className="text-sm text-charcoal font-medium">
                          {g.name}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setResponses((r) => ({ ...r, [g.id]: true }))
                          }
                          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            responses[g.id] === true
                              ? "bg-deep-green text-white"
                              : "bg-gray-100 text-warm-gray hover:bg-green-50 hover:text-deep-green"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          onClick={() =>
                            setResponses((r) => ({ ...r, [g.id]: false }))
                          }
                          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            responses[g.id] === false
                              ? "bg-red-500 text-white"
                              : "bg-gray-100 text-warm-gray hover:bg-red-50 hover:text-red-500"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowRsvp(false)}
                    className="flex-1 py-3 border border-charcoal/20 rounded-full text-sm font-medium text-charcoal"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 py-3 bg-charcoal text-ivory rounded-full text-sm font-semibold hover:bg-charcoal/90 transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Submitting…" : "Submit RSVP"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Gold shimmer footer */}
          <div className="bg-gradient-to-r from-champagne via-gold/20 to-champagne p-1">
            <div className="animate-shimmer h-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
