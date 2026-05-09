import { useEffect, useState } from "react";
import { apiClient } from "../api/client";
import { computeSessionWeakAreas, RUBRIC_LABELS } from "../utils/sessionWeakAreas";

export default function SessionWeakAreasModal({ sessionId, open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open || !sessionId) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    setData(null);
    (async () => {
      try {
        const res = await apiClient.get(`/evaluations/${sessionId}`);
        if (cancelled) return;
        const computed = computeSessionWeakAreas(res.data.items);
        setData(computed);
      } catch {
        if (!cancelled) setError("Could not load evaluations for this session.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, sessionId]);

  if (!open) return null;

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="weak-areas-title">
      <button type="button" className="modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="modal-panel card focus-hub-card weak-areas-modal">
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h3 id="weak-areas-title" style={{ margin: 0, fontSize: "1.15rem" }}>
              Weak areas — session #{sessionId}
            </h3>
            <p className="muted weak-areas-lede" style={{ marginTop: 10 }}>
              This breakdown averages evaluator scores across every answered question in this interview only.
              Averages below <strong>7</strong> usually signal noticeable gaps for hiring loops; below{" "}
              <strong>6</strong> are urgent fixes before your next practice round.
              Use it alongside full results—especially feedback bullets—to prioritize deeper studying and mocks,
              not perfectionism on every keyword.
            </p>
          </div>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>

        {loading ? <p className="muted" style={{ marginTop: 16 }}>Analyzing this session…</p> : null}
        {error ? <p className="error-message" style={{ marginTop: 16 }}>{error}</p> : null}

        {!loading && !error && data === null ? (
          <p className="muted" style={{ marginTop: 16 }}>
            No evaluation data yet—submit answers first so the model can grade each response.
          </p>
        ) : null}

        {!loading && data?.rubricSnapshot ? (
          <>
            <p className="muted" style={{ marginTop: 18, fontSize: 13, marginBottom: 10 }}>
              <strong>Rubric snapshot.</strong> These axes mirror your Results radar logic averaged across all
              graded answers here—overall pulls together evaluator judgement while depth/clarity isolate habits you can rehearse.
            </p>
            <div className="session-rubric-mini-grid">
              {["depth", "clarity", "consistency", "overall"].map((key) => (
                <div key={key} className="session-rubric-mini-cell">
                  <span className="muted" style={{ fontSize: 11 }}>{RUBRIC_LABELS[key]}</span>
                  <strong style={{ fontSize: 18 }}>{data.rubricSnapshot[key].toFixed(1)}</strong>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {!loading && data?.topMissing?.length ? (
          <div style={{ marginTop: 18 }}>
            <strong style={{ fontSize: 13 }}>Missing concepts flagged by evaluators</strong>
            <p className="muted weak-areas-guidance-block">
              Tags aggregate recurring evaluator mentions—they reveal thematic gaps (fundamentals you skimmed,
              vocabulary interviewers expected, or blind spots across multiple prompts).
              Treat the heavier-hit themes first: rewrite one polished verbal explanation per concept, citing trade-offs,
              not textbook sentences alone.
            </p>
            <div className="focus-missing-tags">
              {data.topMissing.map((tag) => (
                <span key={tag} className="focus-missing-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {!loading && data?.focusAreas?.length ? (
          <div style={{ marginTop: 22 }}>
            <strong style={{ fontSize: 13 }}>
              Where to improve deepest — three priority axes for this interview
            </strong>
            <p className="muted weak-areas-guidance-block" style={{ marginTop: 8 }}>
              Listed weakest-first relative to your other axes here (anything below 7 is prioritized before strengths).
              Read guidance literally—each paragraph translates patterns graders reacted to into practice drills,
              not generic encouragement.
            </p>
            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 16 }}>
              {data.focusAreas.map((area) => (
                <div
                  key={area.key}
                  className={
                    "weak-area-deep-card focus-area-row " +
                    (area.priority === "high" ? "focus-area-row--warn" : "focus-area-row--growth")
                  }
                >
                  <div className="row" style={{ gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <span className="focus-area-pill">{area.label}</span>
                    <span style={{ fontWeight: 800, color: "var(--accent)" }}>
                      {area.score.toFixed(1)} / 10
                    </span>
                    {area.priorityLabel ? (
                      <span className="focus-priority-badge">{area.priorityLabel}</span>
                    ) : area.mediumBadge ? (
                      <span className="session-focus-soft">{area.mediumBadge}</span>
                    ) : area.lowBadge ? (
                      <span className="muted" style={{ fontSize: 12 }}>
                        {area.lowBadge}
                      </span>
                    ) : null}
                  </div>
                  <div className="weak-area-guidance">
                    <p>{area.guidance}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!loading && data && !data.hasWeakBelowSeven && data.focusAreas.length ? (
          <p className="muted weak-areas-footer-note">
            Every rubric dimension averaged above <strong>7</strong> in this session—nice calibration for one loop.
            The three sections above still highlight comparative deltas so you know where marginal reps yield compounding gains next mock.
          </p>
        ) : null}
      </div>
    </div>
  );
}
