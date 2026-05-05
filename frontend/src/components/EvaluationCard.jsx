export default function EvaluationCard({ item }) {
  const ev = item.evaluation;
  if (!ev) return null;

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>Score: {ev.score}</strong>
        <span className="muted">
          depth {ev.depth_score} · clarity {ev.clarity_score}
        </span>
      </div>
      <p className="muted" style={{ marginTop: 10 }}>
        {item.question_content}
      </p>
      <div style={{ marginTop: 10 }}>
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
