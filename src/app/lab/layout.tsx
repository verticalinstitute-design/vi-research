import type { Metadata } from "next";

// Internal design exploration — not linked from any nav, kept out of search
// indexing. Reachable only by someone who already has the direct URL.
export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
