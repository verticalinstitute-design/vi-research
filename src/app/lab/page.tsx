"use client";

// Design lab — three layout explorations for the single-question screen.
// Static visual mockups only; no data is saved. Flip variants bottom-center.
// Shared constraints: fixed 100vh/100vw, no page scroll, focal point centered.

import { useState } from "react";

const DEMO = {
  code: "B1",
  theme: "Objections & competition",
  themeIndex: 2,
  prompt:
    "What are the top 3 objections you hear — and your current best rebuttals for each?",
  helper:
    "Objection-handling sections and proof priorities on the site come straight from this.",
  index: 5,
  total: 20,
};

type Variant = "A" | "B" | "C";

export default function LabPage() {
  const [variant, setVariant] = useState<Variant>("A");
  const [unsure, setUnsure] = useState(false);
  const [value, setValue] = useState("");

  const shared = { unsure, setUnsure, value, setValue };

  return (
    <div className="h-dvh w-screen overflow-hidden">
      {variant === "A" && <VariantA {...shared} />}
      {variant === "B" && <VariantB {...shared} />}
      {variant === "C" && <VariantC {...shared} />}

      <nav
        aria-label="Layout variant"
        className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-vi-border bg-white/90 p-1 shadow-[0_10px_30px_rgba(20,30,77,0.16)] backdrop-blur"
      >
        {(
          [
            ["A", "Focus stage"],
            ["B", "Split brief"],
            ["C", "Worksheet"],
          ] as [Variant, string][]
        ).map(([v, label]) => (
          <button
            key={v}
            onClick={() => setVariant(v)}
            aria-pressed={variant === v}
            className={`rounded-full px-4 py-1.5 text-[13px] font-semibold transition ${
              variant === v
                ? "bg-vi-primary text-white"
                : "text-vi-muted hover:text-vi-text"
            }`}
          >
            {v} · {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

type SharedProps = {
  unsure: boolean;
  setUnsure: (v: boolean) => void;
  value: string;
  setValue: (v: string) => void;
};

/* ------------------------------------------------------------------ */
/* A · Focus stage — everything on one centered axis, ice ground.      */
/* The question is the hero; chrome recedes to the viewport edges.     */
/* ------------------------------------------------------------------ */

function VariantA({ unsure, setUnsure, value, setValue }: SharedProps) {
  return (
    <main className="relative flex h-full w-full flex-col bg-vi-ice">
      <div
        className="absolute inset-x-0 top-0 h-1 bg-vi-ice-deep"
        role="progressbar"
        aria-valuenow={DEMO.index}
        aria-valuemin={1}
        aria-valuemax={DEMO.total}
      >
        <div
          className="h-full bg-vi-primary"
          style={{ width: `${(DEMO.index / DEMO.total) * 100}%` }}
        />
      </div>

      <header className="flex items-baseline justify-between px-8 pt-6">
        <p className="text-[13px] font-semibold text-vi-muted">
          {DEMO.theme}
        </p>
        <p className="font-heading text-[13px] font-bold tabular-nums text-vi-text">
          {DEMO.index}
          <span className="text-vi-muted"> / {DEMO.total}</span>
        </p>
      </header>

      <section className="flex w-full flex-1 flex-col items-center justify-center px-6">
        <div className="flex w-full max-w-[680px] flex-col items-center text-center">
          <h1 className="font-heading text-[clamp(24px,3.2vw,34px)] leading-[1.25] font-bold tracking-[-0.5px] text-vi-text">
            {DEMO.prompt}
          </h1>
          <p className="mt-3 max-w-[52ch] text-[14.5px] leading-relaxed text-vi-muted">
            {DEMO.helper}
          </p>

          <div className="mt-8 w-full">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type your answer — rough notes are perfect…"
              rows={6}
              className="w-full resize-none rounded-2xl border border-transparent bg-white p-5 text-left text-[15.5px] leading-relaxed text-vi-text caret-vi-primary shadow-[0_16px_40px_rgba(20,30,77,0.10)] transition placeholder:text-vi-muted/70 focus:border-vi-primary focus:outline-none"
            />
          </div>

          <div className="mt-4 flex w-full items-center justify-between">
            <button
              onClick={() => setUnsure(!unsure)}
              aria-pressed={unsure}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition ${
                unsure
                  ? "border-vi-amber bg-white text-vi-text"
                  : "border-vi-border bg-white/60 text-vi-muted hover:border-vi-amber hover:text-vi-text"
              }`}
            >
              <span
                className={`size-2 rounded-full ${unsure ? "bg-vi-amber" : "bg-vi-ice-deep"}`}
                aria-hidden
              />
              Needs checking
            </button>
            <div className="flex items-center gap-5">
              <button className="text-[14px] font-semibold text-vi-muted transition hover:text-vi-text">
                Skip
              </button>
              <button className="rounded-[var(--radius-btn)] bg-vi-primary px-7 py-3 text-[15px] font-semibold text-white shadow-[var(--shadow-glow)] transition hover:bg-vi-primary-dark">
                Next →
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="flex items-center justify-between px-8 pb-6 text-[12px] text-vi-muted">
        <button className="font-semibold transition hover:text-vi-text">
          ← Back
        </button>
        <p>Autosaves as you type · Continue later</p>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* B · Split brief — navy context panel briefs the question like a     */
/* moderator card; the white side is pure answering surface.           */
/* ------------------------------------------------------------------ */

function VariantB({ unsure, setUnsure, value, setValue }: SharedProps) {
  return (
    <main className="grid h-full w-full grid-cols-1 bg-white lg:grid-cols-[5fr_7fr]">
      <section className="relative hidden flex-col justify-center overflow-hidden bg-vi-navy px-12 lg:flex">
        <p className="font-heading text-[64px] leading-none font-bold tracking-[-2px] text-white/25 tabular-nums">
          {String(DEMO.index).padStart(2, "0")}
          <span className="text-[28px] tracking-normal text-white/20">
            {" "}
            / {DEMO.total}
          </span>
        </p>
        <h1 className="mt-6 max-w-[24ch] font-heading text-[clamp(22px,2.4vw,30px)] leading-[1.3] font-bold text-white">
          {DEMO.prompt}
        </h1>
        <p className="mt-5 max-w-[46ch] border-t border-white/15 pt-5 text-[14px] leading-relaxed text-[#AAB6DC]">
          {DEMO.helper}
        </p>

        <div className="absolute inset-x-12 bottom-8">
          <p className="mb-2 text-[12px] font-semibold text-[#AAB6DC]">
            {DEMO.theme}
          </p>
          <div className="flex gap-1.5" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i < DEMO.themeIndex
                    ? "bg-vi-primary"
                    : i === DEMO.themeIndex
                      ? "bg-white/60"
                      : "bg-white/15"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col justify-center px-7 sm:px-14">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="mb-4 lg:hidden">
            <p className="text-[13px] font-semibold text-vi-muted">
              {DEMO.theme} · {DEMO.index}/{DEMO.total}
            </p>
            <h1 className="mt-2 font-heading text-[22px] leading-snug font-bold">
              {DEMO.prompt}
            </h1>
          </div>

          <label
            htmlFor="answer-b"
            className="font-heading text-[15px] font-bold text-vi-text"
          >
            Your answer
          </label>
          <textarea
            id="answer-b"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Objection 1 → your rebuttal…"
            rows={9}
            className="mt-3 w-full resize-none rounded-xl border-[1.5px] border-vi-border bg-vi-ice/50 p-5 text-[15.5px] leading-relaxed text-vi-text caret-vi-primary transition placeholder:text-vi-muted/70 focus:border-vi-primary focus:bg-white focus:outline-none"
          />

          <label className="mt-4 flex w-fit cursor-pointer items-center gap-2.5 text-[14px] text-vi-muted transition hover:text-vi-text">
            <input
              type="checkbox"
              checked={unsure}
              onChange={(e) => setUnsure(e.target.checked)}
              className="size-4 accent-[#F79009]"
            />
            I&apos;m unsure — flag this for checking
          </label>

          <div className="mt-8 flex items-center justify-between border-t border-vi-border pt-5">
            <div className="flex items-center gap-5">
              <button className="text-[14px] font-semibold text-vi-muted transition hover:text-vi-text">
                ← Back
              </button>
              <button className="text-[14px] font-semibold text-vi-muted transition hover:text-vi-text">
                Skip
              </button>
            </div>
            <button className="rounded-[var(--radius-btn)] bg-vi-primary px-8 py-3 text-[15px] font-semibold text-white shadow-[var(--shadow-glow)] transition hover:bg-vi-primary-dark">
              Next →
            </button>
          </div>
          <p className="mt-4 text-[12px] text-vi-muted">
            Autosaves as you type · Continue later
          </p>
        </div>
      </section>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* C · Worksheet — one elevated card holds the whole exchange,         */
/* echoing the VI quiz-card pattern; white ground keeps it clinical.   */
/* ------------------------------------------------------------------ */

function VariantC({ unsure, setUnsure, value, setValue }: SharedProps) {
  return (
    <main className="flex h-full w-full items-center justify-center bg-white px-6 [background-image:radial-gradient(#DFE7FA_1px,transparent_1px)] [background-size:24px_24px]">
      <div className="w-full max-w-[720px] overflow-hidden rounded-[20px] border border-vi-border bg-white shadow-[0_24px_60px_rgba(20,30,77,0.14)]">
        <header className="flex items-center justify-between gap-4 border-b border-vi-border bg-vi-ice px-7 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-vi-primary font-heading text-[14px] font-bold text-white">
              {DEMO.code}
            </span>
            <div>
              <p className="text-[13px] font-semibold text-vi-text">
                {DEMO.theme}
              </p>
              <p className="text-[11.5px] text-vi-muted">
                Question {DEMO.index} of {DEMO.total}
              </p>
            </div>
          </div>
          <div
            className="flex w-32 gap-1"
            role="progressbar"
            aria-valuenow={DEMO.index}
            aria-valuemin={1}
            aria-valuemax={DEMO.total}
          >
            {Array.from({ length: DEMO.total }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i < DEMO.index ? "bg-vi-primary" : "bg-vi-ice-deep"
                }`}
              />
            ))}
          </div>
        </header>

        <div className="px-7 py-6">
          <h1 className="font-heading text-[22px] leading-[1.35] font-bold tracking-[-0.2px] text-vi-text">
            {DEMO.prompt}
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-vi-muted">
            {DEMO.helper}
          </p>

          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your answer — rough notes are perfect…"
            rows={7}
            className="mt-5 w-full resize-none rounded-xl border-[1.5px] border-vi-border p-4 text-[15px] leading-relaxed text-vi-text caret-vi-primary transition placeholder:text-vi-muted/70 focus:border-vi-primary focus:outline-none"
          />
        </div>

        <footer className="flex items-center justify-between border-t border-vi-border px-7 py-4">
          <button
            onClick={() => setUnsure(!unsure)}
            aria-pressed={unsure}
            className={`flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition ${
              unsure
                ? "border-vi-amber bg-amber-50 text-vi-text"
                : "border-vi-border text-vi-muted hover:border-vi-amber hover:text-vi-text"
            }`}
          >
            ⚠ Needs checking
          </button>
          <div className="flex items-center gap-4">
            <button className="text-[13.5px] font-semibold text-vi-muted transition hover:text-vi-text">
              ← Back
            </button>
            <button className="text-[13.5px] font-semibold text-vi-muted transition hover:text-vi-text">
              Skip
            </button>
            <button className="rounded-[var(--radius-btn)] bg-vi-primary px-6 py-2.5 text-[14px] font-semibold text-white transition hover:bg-vi-primary-dark">
              Next →
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}
