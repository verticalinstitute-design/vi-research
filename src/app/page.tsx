import Link from "next/link";

const THEMES = [
  { code: "A", label: "The buyer & the journey", count: 4 },
  { code: "B", label: "Objections & competition", count: 4 },
  { code: "C", label: "Offer & demand", count: 4 },
  { code: "D", label: "Proof & assets", count: 5 },
  { code: "E", label: "Enablement & forward", count: 3 },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-vi-ice">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
        <p className="eyebrow text-vi-primary">
          Vertical Institute · Internal research
        </p>
        <h1 className="mt-3 text-4xl leading-tight tracking-tight sm:text-5xl">
          Help us rebuild the corporate website around what actually happens in
          your deals.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-vi-muted">
          20 questions about your corporate deals — buyers, objections, proof,
          and what would help you sell. Your answers feed directly into the B2B
          website revamp.
        </p>

        <div className="mt-8 rounded-2xl border border-vi-border bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <span
                key={t.code}
                className="rounded-full border border-vi-border bg-vi-ice px-3 py-1 text-xs font-semibold text-vi-text"
              >
                {t.code} · {t.label}
                <span className="ml-1.5 text-vi-muted">{t.count}</span>
              </span>
            ))}
          </div>
          <ul className="mt-5 space-y-2 text-sm text-vi-muted">
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-vi-green" />
              One question at a time — takes 15–20 minutes, honest and rough
              beats polished.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-vi-green" />
              Everything autosaves. Stop anytime and continue later from any
              device.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-vi-green" />
              Not sure about something? Flag it — knowing what needs checking
              helps too.
            </li>
          </ul>
          <Link
            href="/survey"
            className="mt-6 inline-block rounded-[var(--radius-btn)] bg-vi-primary px-7 py-3 font-semibold text-white shadow-[var(--shadow-glow)] transition hover:bg-vi-primary-dark"
          >
            Start answering →
          </Link>
        </div>

        <p className="mt-8 text-xs text-vi-muted">
          Running the group session?{" "}
          <Link href="/live" className="font-semibold text-vi-primary">
            Open the facilitator console
          </Link>
          <span className="mx-2">·</span>
          UX team:{" "}
          <Link href="/admin" className="font-semibold text-vi-primary">
            Admin
          </Link>
        </p>
      </div>
    </main>
  );
}
