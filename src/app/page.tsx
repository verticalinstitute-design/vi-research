import Link from "next/link";

const THEMES = [
  "The buyer & the journey",
  "Objections & competition",
  "Offer & demand",
  "Proof & assets",
  "Enablement & forward",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-vi-ice">
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/vi-logo.png"
          alt="Vertical Institute"
          width={121}
          height={36}
        />
        <p className="eyebrow mt-4 text-vi-primary">Internal research</p>
        <h1 className="mt-3 text-4xl leading-tight tracking-tight sm:text-5xl">
          Help us rebuild the corporate website around what actually happens in
          your deals.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-vi-muted">
          About your corporate deals: buyers, objections, proof, and what
          would help you sell. Your answers shape a website built to bring
          in more, better-qualified leads.
        </p>

        <div className="mt-8 rounded-2xl border border-vi-border bg-white p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap gap-2">
            {THEMES.map((label) => (
              <span
                key={label}
                className="rounded-full border border-vi-border bg-vi-ice px-3 py-1 text-xs font-semibold text-vi-text"
              >
                {label}
              </span>
            ))}
          </div>
          <ul className="mt-5 space-y-2 text-sm text-vi-muted">
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-vi-green" />
              One question at a time. Honest and rough beats polished.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-vi-green" />
              Everything autosaves. Stop anytime and continue later from any
              device.
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
          UX team:{" "}
          <Link href="/admin" className="font-semibold text-vi-primary">
            Admin
          </Link>
        </p>
      </div>
    </main>
  );
}
