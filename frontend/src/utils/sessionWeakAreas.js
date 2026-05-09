/**
 * Weak-area scoring for one session (aligned with improvement hub: focus below 7, high priority below 6).
 */

export const RUBRIC_LABELS = {
  depth: "Technical depth",
  clarity: "Communication & clarity",
  consistency: "Answer consistency",
  overall: "Overall performance",
};

/** Priority badges shown next to scores */
export const PRIORITY_LABELS = {
  high: "High priority improvement",
  medium: "Worth strengthening",
  low: "Relative focus (maintain strengths elsewhere)",
};

const GUIDANCE = {
  depth: {
    high:
      "Across this interview, your answers stayed shallow compared with what strong hire-bar signals look like. " +
      "Depth means naming mechanisms (why something works), constraints (what breaks first), and trade-offs between plausible alternatives—not vocabulary lists. " +
      "Practice expanding each claim with one concrete example (latency budget, consistency guarantee, failure mode), then explicitly contrast why you would reject the tempting-but-wrong option.",
    medium:
      "You demonstrated workable familiarity but stopped short of the layered reasoning interviewers reward at senior-ish bars. " +
      "Push each technical answer through three beats: (1) clarify assumptions and boundaries of the problem; (2) explain causal internals—queues, caches, consensus, whatever fits—not product slogans; (3) close with operational realities—metrics, rollout risk, or how you'd validate correctness.",
    low:
      "Depth looks comparatively healthy versus your other axes here—keep that habit. " +
      "Still tighten rehearsal around comparative benchmarks so stronger interviews can't poke gaps between adjacent answers.",
  },
  clarity: {
    high:
      "Listeners struggled to follow how your reasoning progressed question-to-question or paragraph-to-paragraph. " +
      "Rebuild habits around verbal scaffolding: a single thesis sentence up front, then numbered beats (“First… Second… Therefore…”). " +
      "Avoid burying the takeaway—assume distracted reviewers and repeat the conclusion once after the evidence.",
    medium:
      "Some answers were understandable but denser than they needed to be, which increases perceived rambling even when you're correct. " +
      "Practice writing two versions of each answer—first brain-dump, then compress to half the words while preserving logic links. " +
      "Explicit signposting (“The risk is…”, “The trade-off is…”) buys clarity without sounding robotic.",
    low:
      "Clarity is in reasonable shape relative to this session's rubric. " +
      "Preserve concise framing while letting depth grow—don't let brevity become vague.",
  },
  consistency: {
    high:
      "Your per-question scores swung widely—interviewers read that as unstable preparation or uneven depth under pressure. " +
      "Stabilize with a repeatable outline you apply to every question (problem framing → core mechanism → trade-offs → validation), so weak prompts don't collapse structure. " +
      "Redo the lowest-scoring answers aloud until each lands within one band of your best answer.",
    medium:
      "There's noticeable variance between your strongest and weakest responses. " +
      "Audit time allocation: weaker answers often short-change trade-offs or edge cases. " +
      "Use the same checklist after each mock answer—did you name failure modes, metrics, and a falsifiable claim?",
    low:
      "Consistency looks relatively solid this round. " +
      "Keep calibration so future harder questions don't erode structure—maintain even pacing across the full loop.",
  },
  overall: {
    high:
      "Holistic signals suggest foundational gaps—either incomplete coverage of expected concepts or repeated misses on structure and substance together. " +
      "Treat the missing-concept tags below as a syllabus: rehearse each one with a crisp definition, when you'd use it, and one pitfall. " +
      "Pair that with timed mocks so pacing pressure doesn't erase fundamentals.",
    medium:
      "You're close enough that disciplined rehearsal—not brute cramming—should lift aggregates fastest. " +
      "Mine evaluator feedback for patterns rather than isolated mistakes; one systemic blind spot shows up as repeated ding themes.",
    low:
      "Overall trajectory here compares favourably with weaker axes—don't stagnate. " +
      "Use leftover polish cycles on sharper narratives around ownership stories or sharper differentiation versus naive alternatives.",
  },
};

export function getRubricDeepGuidance(key, priority) {
  const k = GUIDANCE[key] ? key : "overall";
  return GUIDANCE[k][priority] || GUIDANCE[k].medium;
}

function pstdev(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, x) => s + (x - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

export function computeSessionWeakAreas(items) {
  const rows = (items || []).filter((it) => it?.evaluation);
  if (!rows.length) return null;

  const evs = rows.map((r) => r.evaluation);
  const depths = evs.map((e) => e.depth_score);
  const clarities = evs.map((e) => e.clarity_score);
  const scores = evs.map((e) => e.score);

  const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const depthAvg = avg(depths);
  const clarityAvg = avg(clarities);
  const overallAvg = avg(scores);

  let consistencyAvg;
  if (scores.length >= 2) {
    consistencyAvg = Math.max(1, Math.min(10, 10 - pstdev(scores) * 2));
  } else {
    consistencyAvg = overallAvg;
  }

  const rubricSnapshot = {
    depth: Math.round(depthAvg * 100) / 100,
    clarity: Math.round(clarityAvg * 100) / 100,
    consistency: Math.round(consistencyAvg * 100) / 100,
    overall: Math.round(overallAvg * 100) / 100,
  };

  const FOCUS_THRESHOLD = 7;
  const HIGH_BELOW = 6;

  const dims = [
    ["depth", depthAvg],
    ["clarity", clarityAvg],
    ["consistency", consistencyAvg],
    ["overall", overallAvg],
  ];

  const below = dims.filter(([, v]) => v < FOCUS_THRESHOLD).sort((a, b) => a[1] - b[1]);
  const rest = dims.filter(([, v]) => v >= FOCUS_THRESHOLD).sort((a, b) => a[1] - b[1]);

  const orderedKeys = [];
  for (const [k] of [...below, ...rest]) {
    if (!orderedKeys.includes(k)) orderedKeys.push(k);
  }
  const pickKeys = orderedKeys.slice(0, 3);

  const counts = new Map();
  const display = new Map();
  for (const e of evs) {
    const mc = e.missing_concepts;
    if (!Array.isArray(mc)) continue;
    for (const raw of mc) {
      const c = String(raw).trim();
      if (!c) continue;
      const low = c.toLowerCase();
      counts.set(low, (counts.get(low) || 0) + 1);
      if (!display.has(low)) display.set(low, c);
    }
  }

  const topMissing = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([low]) => display.get(low));

  const focusAreas = pickKeys.map((key) => {
    const score = rubricSnapshot[key];
    const high = score < HIGH_BELOW;
    const medium = score < FOCUS_THRESHOLD && !high;
    const priority = high ? "high" : medium ? "medium" : "low";
    return {
      key,
      label: RUBRIC_LABELS[key],
      score,
      priority,
      priorityLabel: high ? PRIORITY_LABELS.high : null,
      mediumBadge: medium ? PRIORITY_LABELS.medium : null,
      lowBadge: priority === "low" ? PRIORITY_LABELS.low : null,
      guidance: getRubricDeepGuidance(key, priority),
    };
  });

  return {
    rubricSnapshot,
    focusAreas,
    topMissing,
    hasWeakBelowSeven: below.length > 0,
  };
}
