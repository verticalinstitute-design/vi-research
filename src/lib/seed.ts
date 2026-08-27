// Question set v1 — merged & deduplicated from the B2B Website Research report
// (26 Aug 2026), Sections 6 (S1–S12) and 8 (Q1–Q20). Editable in /admin after seeding.

export const THEMES = {
  A: "A · The buyer & the journey",
  B: "B · Objections & competition",
  C: "C · Offer & demand",
  D: "D · Proof & assets",
  E: "E · Enablement & forward",
} as const;

export type SeedQuestion = {
  code: string;
  theme: string;
  prompt: string;
  helper: string;
  source_refs: string[];
};

export const SEED_QUESTIONS: SeedQuestion[] = [
  {
    code: "A1",
    theme: THEMES.A,
    prompt:
      "Walk us through the last 3 corporate deals, from first touch to signed. Where did the website appear, if at all?",
    helper:
      "Tells us whether the website's B2B job is inbound capture or credibility validation around a sales touch. This decides what we optimise for.",
    source_refs: ["S1", "Q1"],
  },
  {
    code: "A2",
    theme: THEMES.A,
    prompt:
      "Who's in the room on the buyer side: HR, L&D, department heads, finance, C-level? Who champions, who blocks, and who signs off?",
    helper:
      "Buying-committee roles shape who each page must convince, and which value props go where.",
    source_refs: ["Q2", "S11"],
  },
  {
    code: "A3",
    theme: THEMES.A,
    prompt:
      "What do prospects ask in the first call, every single time? List as many as you can remember.",
    helper:
      "The most common questions set the content hierarchy and FAQ of the new corporate hub.",
    source_refs: ["S2", "Q3"],
  },
  {
    code: "A4",
    theme: THEMES.A,
    prompt:
      "What have prospects said they looked for on our website but couldn't find?",
    helper: "A direct backlog of content gaps, in the buyer's own words.",
    source_refs: ["S10", "Q4"],
  },
  {
    code: "B1",
    theme: THEMES.B,
    prompt:
      "What are the top 3 objections you hear, and your current best rebuttals for each?",
    helper:
      "Objection-handling sections and proof priorities on the site come straight from this.",
    source_refs: ["S3", "Q5"],
  },
  {
    code: "B2",
    theme: THEMES.B,
    prompt: "When we lose a deal, who do we lose to, and what reason is given?",
    helper: "Real differentiation and a named competitor watchlist.",
    source_refs: ["S6", "Q6"],
  },
  {
    code: "B3",
    theme: THEMES.B,
    prompt:
      "When we win, what's the stated reason? Honestly, how much of it is subsidy economics?",
    helper:
      "Sets the hero and differentiation honestly: outcome-led vs subsidy-led framing.",
    source_refs: ["S4", "Q7"],
  },
  {
    code: "B4",
    theme: THEMES.B,
    prompt:
      "Which competitors' websites or materials do prospects reference or compare us against?",
    helper: "Shows what buyers actually benchmark us against.",
    source_refs: ["S6", "Q8"],
  },
  {
    code: "C1",
    theme: THEMES.C,
    prompt:
      "What are the most-requested programmes right now? Is anything being requested that we don't currently offer?",
    helper: "Validates or kills the new-page candidates in the report.",
    source_refs: ["S5", "Q9"],
  },
  {
    code: "C2",
    theme: THEMES.C,
    prompt:
      "How much real customisation do we do for corporate clients? Describe one concrete example, start to finish.",
    helper:
      "Concrete customisation is a proven differentiator we currently assert but never show.",
    source_refs: ["Q10"],
  },
  {
    code: "C3",
    theme: THEMES.C,
    prompt:
      "Describe the typical deal profile: company size, industry, group size, format split (online / LLI / on-site), lead time, cycle length, and who signs off.",
    helper: "Drives segmentation and the corporate enquiry form fields.",
    source_refs: ["S11", "Q11"],
  },
  {
    code: "C4",
    theme: THEMES.C,
    prompt:
      "Do we deliver any post-training reporting to clients today? What does it look like?",
    helper:
      "A measurement/reporting block is a best-practice pattern. We need to know current practice before promising it.",
    source_refs: ["Q12"],
  },
  {
    code: "D1",
    theme: THEMES.D,
    prompt:
      "Which 3 past clients would make a strong story AND would likely say yes? Can you name a sponsor contact for each?",
    helper: "The pipeline for the case-study hub (target 2–3 named stories).",
    source_refs: ["S7", "Q13"],
  },
  {
    code: "D2",
    theme: THEMES.D,
    prompt:
      "Has any client ever shared a measurable result from our training? What was it, and where is it recorded?",
    helper: "The only legitimate source of quantified claims for the website.",
    source_refs: ["S8", "Q14"],
  },
  {
    code: "D3",
    theme: THEMES.D,
    prompt:
      "What's the exact logo/testimonial permission status, and are the deck logos (Singtel, Meta, IBM, DBS, JPM, Samsung, LinkedIn, Citi, Micron) corporate clients or alumni employers?",
    helper: "Determines the client logo wall we can ship.",
    source_refs: ["S9", "Q15"],
  },
  {
    code: "D4",
    theme: THEMES.D,
    prompt:
      "What are the correct facts for the GovTech and CDL engagements (programme + headcount)? Our website surfaces currently disagree.",
    helper:
      "Trust-critical: at least one page has swapped client content. Same-week fix once confirmed.",
    source_refs: ["S12", "Q16"],
  },
  {
    code: "D5",
    theme: THEMES.D,
    prompt:
      "Would you adopt a \"Client Story Kit\" (consent clause in the agreement + 10-minute capture at 3 deal stages)? What would make it painless?",
    helper: "BD buy-in decides whether story collection becomes routine.",
    source_refs: ["Q17"],
  },
  {
    code: "E1",
    theme: THEMES.E,
    prompt:
      "What page or asset, if it existed today, would you send to every prospect tomorrow?",
    helper: "The strongest signal for what to build first for sales enablement.",
    source_refs: ["Q18"],
  },
  {
    code: "E2",
    theme: THEMES.E,
    prompt: "Which qualifying fields would make you trust website leads more?",
    helper: "The field list for the new corporate enquiry form.",
    source_refs: ["Q19"],
  },
  {
    code: "E3",
    theme: THEMES.E,
    prompt:
      "SFEC refresh H2 2026: how do we plan to use it, and when should the website be ready?",
    helper: "Times the funding guide and calculator work.",
    source_refs: ["Q20"],
  },
];
