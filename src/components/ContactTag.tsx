const EMAIL = "paul@verticalinstitute.com";
const SLACK_URL = "https://vertical-institute.slack.com/archives/C04QQDQ54B0";

/**
 * "Reach us" line: a one-line invite plus Email/Slack buttons. Sits plain
 * on the page's own background, no card/border/shadow around it, in-flow
 * near the bottom of the page (not a floating overlay).
 */
export function ContactTag({ tone = "light" }: { tone?: "light" | "dark" }) {
  const isDark = tone === "dark";
  return (
    <div className="flex flex-col items-center gap-2.5">
      <p
        className={`text-[12.5px] ${isDark ? "text-white/50" : "text-vi-muted/80"}`}
      >
        Need help or want to chat? Contact us directly.
      </p>
      <div className="flex items-center gap-2">
        <a
          href={`mailto:${EMAIL}`}
          className={`rounded-full border px-3.5 py-1 text-[12px] font-semibold transition ${
            isDark
              ? "border-white/20 text-white/80 hover:border-white/50 hover:text-white"
              : "border-vi-border/80 text-vi-muted hover:border-vi-primary hover:text-vi-primary"
          }`}
        >
          Email
        </a>
        <a
          href={SLACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`rounded-full border px-3.5 py-1 text-[12px] font-semibold transition ${
            isDark
              ? "border-white/20 text-white/80 hover:border-white/50 hover:text-white"
              : "border-vi-border/80 text-vi-muted hover:border-vi-primary hover:text-vi-primary"
          }`}
        >
          Slack
        </a>
      </div>
    </div>
  );
}
