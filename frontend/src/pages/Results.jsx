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

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="muted">Overall average score</div>
        <div style={{ fontSize: 56, fontWeight: 800, color: "var(--accent-2)", marginTop: 6 }}>
          {avg == null ? "—" : avg.toFixed(1)}
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <SkillRadarChart averageScore={avg} samples={data.items || []} />
      </div>

      <h3>Per question</h3>
      <div style={{ display: "grid", gap: 12 }}>
        {(data.items || []).map((item) => (
          <EvaluationCard key={item.answer_id} item={item} />
        ))}
      </div>
    </div>
  );
}
