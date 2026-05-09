import { useState } from "react";
import { apiClient } from "../api/client";
import { formatApiError } from "../utils/formatApiError";

export default function EvaluationCard({ sessionId, item }) {
  const ev = item.evaluation;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modelAnswer, setModelAnswer] = useState("");
  const [keyPoints, setKeyPoints] = useState([]);

  if (!ev) return null;
  const score = Number(ev.score);
  const scoreClass =
    score >= 8 ? "score-high" : score >= 5 ? "score-mid" : "score-low";

  async function loadModelAnswer() {
    setError("");
    if (modelAnswer && open) {
      setOpen(false);
      return;
    }
    if (modelAnswer && !open) {
      setOpen(true);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post(`/evaluations/${sessionId}/model-answer`, {
        answer_id: item.answer_id,
      });
      setModelAnswer(res.data.model_answer || "");
      setKeyPoints(Array.isArray(res.data.key_points) ? res.data.key_points : []);
      setOpen(true);
    } catch (err) {
      setError(formatApiError(err, "Could not load model answer"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong className={scoreClass}>Score: {ev.score}</strong>
        <div className="row" style={{ gap: 8 }}>
          <span className="pill">depth {ev.depth_score}</span>
          <span className="pill">clarity {ev.clarity_score}</span>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 10 }}>
        {item.question_content}
      </p>
      {item.answer_content ? (
        <div style={{ marginTop: 10 }}>
          <div className="label">Your answer</div>
          <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
            {item.answer_content}
          </p>
        </div>
      ) : null}
      <div className="model-answer-cta-wrap">
        <div className="model-answer-cta-hint">Compare with reference</div>
        <button
          type="button"
          className="btn primary model-answer-cta"
          data-testid="model-answer-btn"
          disabled={loading}
          onClick={loadModelAnswer}
        >
          {loading
            ? "Loading…"
            : modelAnswer && open
              ? "Hide model answer"
              : modelAnswer
                ? "Show model answer"
                : "How would AI answer this?"}
        </button>
      </div>
      {error ? <div className="error-message" style={{ marginTop: 10 }}>{error}</div> : null}
      {open && modelAnswer ? (
        <div
          className="model-answer-panel"
          style={{
            marginTop: 14,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid color-mix(in srgb, var(--accent) 35%, var(--border))",
            background: "color-mix(in srgb, var(--accent) 8%, var(--bg-accent))",
          }}
        >
          <div className="label" style={{ marginTop: 0 }}>
            Model answer (high depth)
          </div>
          <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
            {modelAnswer}
          </p>
          {keyPoints.length ? (
            <div style={{ marginTop: 12 }}>
              <div className="label">Key technical points</div>
              <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                {keyPoints.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
      <div style={{ marginTop: 14 }}>
        <div className="label">Feedback</div>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {(ev.feedback || []).map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      </div>
      {(ev.missing_concepts || []).length ? (
        <div style={{ marginTop: 10 }}>
          <div className="label">Missing concepts</div>
          <div className="muted">{(ev.missing_concepts || []).join(", ")}</div>
        </div>
      ) : null}
    </div>
  );
}
