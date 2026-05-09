import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiClient } from "../api/client";
import EvaluationCard from "../components/EvaluationCard";
import SkillRadarChart from "../components/SkillRadarChart";

export default function Results() {
  const { sessionId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(`/evaluations/${sessionId}`);
        if (!cancelled) setData(res.data);
      } catch {
        if (!cancelled) setError("Could not load results.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!data) {
    return (
      <div className="container">
        <p className="muted">{error || "Loading results…"}</p>
      </div>
    );
  }

  const avg = data.average_score;
  const avgClass =
    typeof avg !== "number" ? "" : avg >= 8 ? "score-high" : avg >= 5 ? "score-mid" : "score-low";

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0 }}>Results</h2>
          <div className="muted">Session #{sessionId}</div>
        </div>
        <div className="row">
          <Link className="btn" to="/sessions/new">
            Try again
          </Link>
          <Link className="btn primary" to="/dashboard">
            Dashboard
          </Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="muted">Overall average score</div>
          <div
            className={`overall-score ${avgClass}`.trim()}
            style={{ fontSize: 56, fontWeight: 800, marginTop: 6 }}
          >
            {avg == null ? "—" : avg.toFixed(1)}
          </div>
        </div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="muted">Verdict</div>
          <div
            className={avg == null ? "" : avg >= 8 ? "score-high" : avg >= 5 ? "score-mid" : "score-low"}
            style={{ fontSize: 28, fontWeight: 800, marginTop: 10 }}
          >
            {avg == null ? "Pending" : avg >= 8 ? "Strong" : avg >= 5 ? "Good" : "Needs work"}
          </div>
          <p className="muted" style={{ marginTop: 8 }}>
            Based on technical depth, clarity and consistency across answers.
          </p>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <SkillRadarChart averageScore={avg} samples={data.items || []} />
      </div>

      <h3>Per question</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {(data.items || []).map((item) => (
          <EvaluationCard key={item.answer_id} sessionId={sessionId} item={item} />
        ))}
      </div>
    </div>
  );
}
