"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Event {
  id: number;
  title: string;
  eventType: string;
  hostNames: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  rsvpDeadline: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const loadEvents = useCallback(async () => {
    const res = await fetch("/api/events");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setEvents(data);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-champagne/50 bg-ivory/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-2xl text-gold-dark tracking-wide">
            RSVP
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-warm-gray hover:text-charcoal transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl text-charcoal">Your Events</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-charcoal text-ivory px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-charcoal/90 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Event
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-warm-gray">Loading…</div>
        ) : events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-champagne/40">
            <div className="text-5xl mb-4">🎉</div>
            <p className="text-warm-gray mb-4">No events yet. Create your first one!</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-charcoal text-ivory px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-charcoal/90 transition-colors"
            >
              Create Event
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => {
              const isPast = new Date(ev.rsvpDeadline) < new Date();
              return (
                <Link
                  key={ev.id}
                  href={`/dashboard/event/${ev.id}`}
                  className="group bg-white rounded-2xl p-6 border border-champagne/40 hover:border-gold/30 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium text-gold-dark bg-champagne/30 px-3 py-1 rounded-full">
                      {ev.eventType}
                    </span>
                    {isPast && (
                      <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">
                        Closed
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg text-charcoal mb-1 group-hover:text-gold-dark transition-colors">
                    {ev.title}
                  </h3>
                  <p className="text-sm text-warm-gray mb-3">{ev.hostNames}</p>
                  <div className="flex items-center gap-4 text-xs text-warm-gray">
                    <span>📅 {formatDate(ev.eventDate)}</span>
                    <span>🕐 {ev.eventTime}</span>
                  </div>
                  <p className="text-xs text-warm-gray mt-2">📍 {ev.venue}</p>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadEvents();
          }}
        />
      )}
    </div>
  );
}

function CreateEventModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    title: "",
    eventType: "Wedding",
    hostNames: "",
    eventDate: "",
    eventTime: "",
    venue: "",
    venueAddress: "",
    rsvpDeadline: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create event");
        return;
      }
      onCreated();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-8 border border-champagne/40 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-charcoal">New Event</h2>
          <button onClick={onClose} className="text-warm-gray hover:text-charcoal text-xl">
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wider">
              Event Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-ivory text-charcoal text-sm"
              placeholder="The Smith Wedding"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wider">
                Event Type
              </label>
              <select
                value={form.eventType}
                onChange={(e) => update("eventType", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-ivory text-charcoal text-sm"
              >
                <option>Wedding</option>
                <option>Wedding Reception</option>
                <option>Birthday</option>
                <option>Anniversary</option>
                <option>Engagement</option>
                <option>Baby Shower</option>
                <option>Corporate Event</option>
                <option>Graduation</option>
                <option>Dinner Party</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wider">
                Host Name(s)
              </label>
              <input
                type="text"
                value={form.hostNames}
                onChange={(e) => update("hostNames", e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-ivory text-charcoal text-sm"
                placeholder="John & Jane"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wider">
                Event Date
              </label>
              <input
                type="date"
                value={form.eventDate}
                onChange={(e) => update("eventDate", e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-ivory text-charcoal text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wider">
                Event Time
              </label>
              <input
                type="time"
                value={form.eventTime}
                onChange={(e) => update("eventTime", e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-ivory text-charcoal text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wider">
              Venue Name
            </label>
            <input
              type="text"
              value={form.venue}
              onChange={(e) => update("venue", e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-ivory text-charcoal text-sm"
              placeholder="The Grand Ballroom"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wider">
              Venue Address (optional)
            </label>
            <input
              type="text"
              value={form.venueAddress}
              onChange={(e) => update("venueAddress", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-ivory text-charcoal text-sm"
              placeholder="123 Main Street, City"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wider">
              RSVP Deadline
            </label>
            <input
              type="date"
              value={form.rsvpDeadline}
              onChange={(e) => update("rsvpDeadline", e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-ivory text-charcoal text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wider">
              Personal Message (optional)
            </label>
            <textarea
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-ivory text-charcoal text-sm resize-none"
              placeholder="We would love to celebrate with you…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-charcoal/20 rounded-full text-sm font-medium text-charcoal hover:border-charcoal/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-charcoal text-ivory rounded-full text-sm font-semibold hover:bg-charcoal/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
