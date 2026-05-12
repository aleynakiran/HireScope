/** Rotating interview angles for extra prompts beyond seed questions. */
const EXTRA_ANGLES = [
  "What metrics would you define to prove the change worked?",
  "How does your answer change at 10× scale (traffic, data, or team size)?",
  "Name a realistic failure mode and how you would detect it early.",
  "What would you cut from scope for an MVP, and what is non-negotiable?",
  "How would you explain the trade-offs to a non-technical stakeholder?",
  "Sketch the testing strategy: unit, integration, and one E2E scenario.",
  "What observability signals (logs, metrics, traces) would you require?",
  "Compare two viable approaches and when you would pick each.",
  "How do you roll out safely (feature flags, canaries, backwards compatibility)?",
  "What documentation or runbooks would you leave for the next engineer?",
  "Where could tech debt accumulate, and how would you contain it?",
  "How does security or privacy constrain your design here?",
  "What latency or cost budget would you negotiate with the team?",
  "How would you validate the design in a 45-minute interview loop?",
  "What follow-up would a senior interviewer likely ask next?",
  "How do you keep developer experience from regressing?",
  "What compatibility concerns matter for existing users or clients?",
  "How would you handle a partial outage in this subsystem?",
  "What data consistency guarantees do you need, and why?",
  "How do you split ownership between frontend, backend, and platform?",
  "What would an on-call playbook include for this area?",
  "How do you approach accessibility or internationalization implications?",
  "What automated checks would gate a merge for this work?",
  "How would you revisit this decision six months after launch?",
];

function shorten(text, maxLen) {
  const t = String(text || "").trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1)}…`;
}

/**
 * Build exactly `set.questions` strings: seed items first, then themed drills.
 * @param {{ questions: number, items: string[], title?: string }} set
 * @returns {string[]}
 */
export function expandLibraryQuestions(set) {
  const rawTotal = Math.floor(Number(set.questions));
  const total = Number.isFinite(rawTotal) ? Math.max(0, Math.min(200, rawTotal)) : 0;
  const seeds = Array.isArray(set.items) ? set.items : [];
  if (total === 0) return [];

  const out = [];
  for (let i = 0; i < total; i++) {
    if (i < seeds.length) {
      out.push(seeds[i]);
      continue;
    }
    const k = i - seeds.length;
    const angle = EXTRA_ANGLES[k % EXTRA_ANGLES.length];
    const anchor = seeds[k % seeds.length];
    const theme = set.title ? ` (${set.title})` : "";
    out.push(
      `${angle}${theme} Anchor with: ${shorten(anchor, 100)}`
    );
  }
  return out;
}
