"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Guest {
  id: number;
  name: string;
  isHeadGuest: boolean;
  attending: boolean | null;
}

interface GuestGroup {
  id: number;
  headGuestName: string;
  email: string | null;
  phone: string | null;
  maxGuests: number;
  token: string;
  saveTheDateSent: boolean;
  inviteSent: boolean;
  responded: boolean;
  respondedAt: string | null;
  guests: Guest[];
}

interface EventData {
  id: number;
  title: string;
  eventType: string;
  hostNames: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  venueAddress: string | null;
  rsvpDeadline: string;
  message: string | null;
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [groups, setGroups] = useState<GuestGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);
  const [sendingType, setSendingType] = useState<"save_the_date" | "rsvp" | null>(null);
  const [sendResults, setSendResults] = useState<
    { groupId: number; email: boolean; whatsappLink: string | null }[] | null
  >(null);
  const [tab, setTab] = useState<"guests" | "stats">("guests");

  const loadEvent = useCallback(async () => {
    const res = await fetch(`/api/events/${id}`);
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    if (res.status === 404) {
      router.push("/dashboard");
      return;
    }
    const data = await res.json();
    setEvent(data.event);
    setGroups(data.groups);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  async function deleteEvent() {
    if (!confirm("Are you sure you want to delete this event and all its guests?")) return;
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  async function deleteGroup(groupId: number) {
    if (!confirm("Remove this guest group?")) return;
    await fetch(`/api/events/${id}/groups/${groupId}`, { method: "DELETE" });
    loadEvent();
  }

  function toggleSelect(groupId: number) {
    setSelectedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((x) => x !== groupId) : [...prev, groupId]
    );
  }

  function selectAll() {
    if (selectedGroups.length === groups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(groups.map((g) => g.id));
    }
  }

  async function bulkSend(type: "save_the_date" | "rsvp") {
    if (selectedGroups.length === 0) return;
    setSendingType(type);
    setSendResults(null);

    try {
      const res = await fetch(`/api/events/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, groupIds: selectedGroups }),
      });
      const data = await res.json();
      setSendResults(data.results);
      loadEvent();
    } catch {
      alert("Failed to send");
    } finally {
      setSendingType(null);
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/invite/${token}`;
    navigator.clipboard.writeText(url);
    alert("Invite link copied!");
  }

  // Stats calculations
  const totalGuests = groups.reduce((sum, g) => sum + g.guests.length, 0);
  const attending = groups.reduce(
    (sum, g) => sum + g.guests.filter((x) => x.attending === true).length,
    0
  );
  const declined = groups.reduce(
    (sum, g) => sum + g.guests.filter((x) => x.attending === false).length,
    0
  );
  const pending = totalGuests - attending - declined;
  const respondedGroups = groups.filter((g) => g.responded).length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-warm-gray">
        Loading…
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-champagne/50 bg-ivory/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="font-display text-2xl text-gold-dark tracking-wide">
            RSVP
          </Link>
          <Link href="/dashboard" className="text-sm text-warm-gray hover:text-charcoal transition-colors">
            ← Back
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Event Header */}
        <div className="bg-white rounded-2xl p-8 border border-champagne/40 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <span className="text-xs font-medium text-gold-dark bg-champagne/30 px-3 py-1 rounded-full">
                {event.eventType}
              </span>
              <h1 className="font-display text-3xl text-charcoal mt-3 mb-1">{event.title}</h1>
              <p className="text-warm-gray">{event.hostNames}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-warm-gray">
                <span>📅 {formatDate(event.eventDate)}</span>
                <span>🕐 {event.eventTime}</span>
                <span>📍 {event.venue}</span>
              </div>
              {event.venueAddress && (
                <p className="text-sm text-warm-gray mt-1">{event.venueAddress}</p>
              )}
              <p className="text-sm mt-2">
                <span className="text-warm-gray">RSVP Deadline: </span>
                <span
                  className={
                    new Date(event.rsvpDeadline) < new Date()
                      ? "text-red-500 font-medium"
                      : "text-charcoal font-medium"
                  }
                >
                  {formatDate(event.rsvpDeadline)}
                </span>
              </p>
            </div>
            <button
              onClick={deleteEvent}
              className="text-sm text-red-500 hover:text-red-700 border border-red-200 px-4 py-2 rounded-full transition-colors self-start"
            >
              Delete Event
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Guests", value: totalGuests, color: "text-charcoal" },
            { label: "Attending", value: attending, color: "text-deep-green" },
            { label: "Declined", value: declined, color: "text-red-500" },
            { label: "Pending", value: pending, color: "text-gold-dark" },
            { label: "Groups Responded", value: `${respondedGroups}/${groups.length}`, color: "text-charcoal" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl p-5 border border-champagne/40 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-warm-gray mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-full p-1 border border-champagne/40 w-fit">
          <button
            onClick={() => setTab("guests")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === "guests" ? "bg-charcoal text-ivory" : "text-warm-gray hover:text-charcoal"
            }`}
          >
            Guest Groups
          </button>
          <button
            onClick={() => setTab("stats")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              tab === "stats" ? "bg-charcoal text-ivory" : "text-warm-gray hover:text-charcoal"
            }`}
          >
            Attendance Detail
          </button>
        </div>

        {tab === "guests" && (
          <>
            {/* Actions bar */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <button
                onClick={() => setShowAddGroup(true)}
                className="bg-charcoal text-ivory px-5 py-2 rounded-full text-sm font-semibold hover:bg-charcoal/90 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Guest Group
              </button>

              {groups.length > 0 && (
                <>
                  <button
                    onClick={selectAll}
                    className="border border-charcoal/20 px-4 py-2 rounded-full text-sm font-medium text-charcoal hover:border-charcoal/40 transition-colors"
                  >
                    {selectedGroups.length === groups.length ? "Deselect All" : "Select All"}
                  </button>

                  {selectedGroups.length > 0 && (
                    <>
                      <button
                        onClick={() => bulkSend("save_the_date")}
                        disabled={sendingType !== null}
                        className="bg-sage text-deep-green px-5 py-2 rounded-full text-sm font-semibold hover:bg-sage/80 transition-colors disabled:opacity-50"
                      >
                        {sendingType === "save_the_date"
                          ? "Sending…"
                          : `Send Save the Date (${selectedGroups.length})`}
                      </button>
                      <button
                        onClick={() => bulkSend("rsvp")}
                        disabled={sendingType !== null}
                        className="bg-gold text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50"
                      >
                        {sendingType === "rsvp"
                          ? "Sending…"
                          : `Send RSVP Invite (${selectedGroups.length})`}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Send Results */}
            {sendResults && (
              <div className="mb-6 bg-white rounded-xl p-6 border border-champagne/40">
                <h3 className="font-display text-lg mb-3 text-charcoal">Send Results</h3>
                <div className="space-y-2">
                  {sendResults.map((r) => {
                    const group = groups.find((g) => g.id === r.groupId);
                    return (
                      <div key={r.groupId} className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="font-medium text-charcoal">{group?.headGuestName}</span>
                        {r.email && (
                          <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded-full text-xs">
                            ✓ Email sent
                          </span>
                        )}
                        {!r.email && group?.email && (
                          <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-xs">
                            ✗ Email failed
                          </span>
                        )}
                        {r.whatsappLink && (
                          <a
                            href={r.whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-green-500 text-white px-3 py-0.5 rounded-full text-xs hover:bg-green-600 transition-colors"
                          >
                            Open WhatsApp →
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setSendResults(null)}
                  className="text-sm text-warm-gray mt-3 hover:text-charcoal"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Guest Groups List */}
            {groups.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-champagne/40">
                <div className="text-4xl mb-3">👥</div>
                <p className="text-warm-gray mb-3">No guest groups yet.</p>
                <button
                  onClick={() => setShowAddGroup(true)}
                  className="bg-charcoal text-ivory px-6 py-2.5 rounded-full text-sm font-semibold"
                >
                  Add Your First Group
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className={`bg-white rounded-xl p-6 border transition-colors ${
                      selectedGroups.includes(group.id)
                        ? "border-gold shadow-sm"
                        : "border-champagne/40"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <label className="mt-1 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedGroups.includes(group.id)}
                          onChange={() => toggleSelect(group.id)}
                          className="w-4 h-4 accent-gold rounded"
                        />
                      </label>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-medium text-charcoal">{group.headGuestName}</h3>
                          <span className="text-xs text-warm-gray bg-ivory px-2 py-0.5 rounded-full">
                            {group.maxGuests} guest(s)
                          </span>
                          {group.responded && (
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">
                              Responded
                            </span>
                          )}
                          {group.inviteSent && !group.responded && (
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                              Invite Sent
                            </span>
                          )}
                          {group.saveTheDateSent && !group.inviteSent && (
                            <span className="text-xs bg-champagne text-gold-dark px-2 py-0.5 rounded-full">
                              Save the Date Sent
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-3 text-xs text-warm-gray mb-3">
                          {group.email && <span>✉️ {group.email}</span>}
                          {group.phone && <span>📱 {group.phone}</span>}
                        </div>

                        {/* Guest list */}
                        <div className="flex flex-wrap gap-2">
                          {group.guests.map((guest) => (
                            <span
                              key={guest.id}
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                guest.attending === true
                                  ? "bg-green-50 text-green-700"
                                  : guest.attending === false
                                  ? "bg-red-50 text-red-500 line-through"
                                  : "bg-gray-50 text-warm-gray"
                              }`}
                            >
                              {guest.isHeadGuest && "★ "}
                              {guest.name}
                              {guest.attending === true && " ✓"}
                              {guest.attending === false && " ✗"}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => copyLink(group.token)}
                          title="Copy invite link"
                          className="text-warm-gray hover:text-charcoal p-2 rounded-lg hover:bg-ivory transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteGroup(group.id)}
                          title="Remove group"
                          className="text-warm-gray hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "stats" && (
          <div className="bg-white rounded-2xl border border-champagne/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-champagne/40 bg-ivory/50">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-warm-gray uppercase tracking-wider">
                      Group
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-warm-gray uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-warm-gray uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {groups.map((group) =>
                    group.guests.map((guest, i) => (
                      <tr
                        key={guest.id}
                        className="border-b border-champagne/20 last:border-0 hover:bg-ivory/30"
                      >
                        <td className="px-6 py-3 text-charcoal">
                          {i === 0 ? group.headGuestName : ""}
                        </td>
                        <td className="px-6 py-3 text-charcoal">
                          {guest.isHeadGuest ? `★ ${guest.name}` : guest.name}
                        </td>
                        <td className="px-6 py-3 text-center">
                          {guest.attending === true ? (
                            <span className="inline-block bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                              Attending
                            </span>
                          ) : guest.attending === false ? (
                            <span className="inline-block bg-red-50 text-red-500 px-3 py-1 rounded-full text-xs font-medium">
                              Declined
                            </span>
                          ) : (
                            <span className="inline-block bg-gray-50 text-warm-gray px-3 py-1 rounded-full text-xs font-medium">
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showAddGroup && (
        <AddGroupModal
          eventId={id}
          onClose={() => setShowAddGroup(false)}
          onAdded={() => {
            setShowAddGroup(false);
            loadEvent();
          }}
        />
      )}
    </div>
  );
}

function AddGroupModal({
  eventId,
  onClose,
  onAdded,
}: {
  eventId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [headGuestName, setHeadGuestName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [maxGuests, setMaxGuests] = useState(1);
  const [guestNames, setGuestNames] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleMaxChange(val: number) {
    const clamped = Math.max(1, Math.min(20, val));
    setMaxGuests(clamped);
    const newNames = [...guestNames];
    while (newNames.length < clamped - 1) newNames.push("");
    setGuestNames(newNames.slice(0, clamped - 1));
  }

  function updateGuestName(index: number, name: string) {
    const newNames = [...guestNames];
    newNames[index] = name;
    setGuestNames(newNames);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/events/${eventId}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headGuestName,
          email: email || undefined,
          phone: phone || undefined,
          maxGuests,
          guestNames: guestNames.filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add group");
        return;
      }
      onAdded();
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
          <h2 className="font-display text-2xl text-charcoal">Add Guest Group</h2>
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
              Head Guest Name *
            </label>
            <input
              type="text"
              value={headGuestName}
              onChange={(e) => setHeadGuestName(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-ivory text-charcoal text-sm"
              placeholder="John Smith"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-ivory text-charcoal text-sm"
                placeholder="john@email.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wider">
                Phone (with country code)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-ivory text-charcoal text-sm"
                placeholder="+27831234567"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-warm-gray mb-1.5 uppercase tracking-wider">
              Total Party Size (including head guest) *
            </label>
            <input
              type="number"
              value={maxGuests}
              onChange={(e) => handleMaxChange(parseInt(e.target.value, 10) || 1)}
              min={1}
              max={20}
              className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-ivory text-charcoal text-sm"
            />
          </div>

          {maxGuests > 1 && (
            <div>
              <label className="block text-xs font-medium text-warm-gray mb-2 uppercase tracking-wider">
                Additional Guest Names (optional)
              </label>
              <div className="space-y-2">
                {Array.from({ length: maxGuests - 1 }).map((_, i) => (
                  <input
                    key={i}
                    type="text"
                    value={guestNames[i] || ""}
                    onChange={(e) => updateGuestName(i, e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg border border-champagne bg-ivory text-charcoal text-sm"
                    placeholder={`Guest ${i + 2} name`}
                  />
                ))}
              </div>
            </div>
          )}

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
              {loading ? "Adding…" : "Add Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
