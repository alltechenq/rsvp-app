import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b border-champagne/50 bg-ivory/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-display text-2xl text-gold-dark tracking-wide">
            RSVP
          </Link>
          <div className="flex gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-warm-gray hover:text-charcoal transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-charcoal text-ivory px-5 py-2 rounded-full hover:bg-charcoal/90 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24">
        <div className="max-w-2xl text-center">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-champagne/40 border border-gold/20">
            <span className="text-xs font-medium text-gold-dark tracking-widest uppercase">
              Elegant Event Management
            </span>
          </div>
          <h1 className="font-display text-5xl md:text-6xl leading-tight mb-6 text-charcoal">
            Beautiful invitations,
            <br />
            <span className="text-gold">effortless</span> RSVPs
          </h1>
          <p className="text-lg text-warm-gray leading-relaxed mb-10 max-w-lg mx-auto">
            Create stunning event invitations, manage guest lists, track responses,
            and send reminders — all from one simple dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-charcoal text-ivory px-8 py-3.5 rounded-full text-sm font-semibold hover:bg-charcoal/90 transition-all hover:shadow-lg"
            >
              Create Your First Event
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-full text-sm font-semibold border border-charcoal/20 text-charcoal hover:border-charcoal/40 transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-28 max-w-5xl w-full grid md:grid-cols-3 gap-8">
          {[
            {
              icon: "✉️",
              title: "Send Invites",
              desc: "Bulk send save-the-dates and RSVPs via email or share WhatsApp links.",
            },
            {
              icon: "👥",
              title: "Guest Groups",
              desc: "Set individual guest limits per group. Track who's attending from each party.",
            },
            {
              icon: "📊",
              title: "Live Dashboard",
              desc: "Real-time attendance tracking with total counts and response deadlines.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-8 border border-champagne/40 hover:border-gold/30 transition-colors"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-display text-lg mb-2 text-charcoal">{f.title}</h3>
              <p className="text-sm text-warm-gray leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-champagne/50 py-8 text-center">
        <p className="text-xs text-warm-gray">Built with care for your special moments.</p>
      </footer>
    </div>
  );
}
