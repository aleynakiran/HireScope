import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiClient } from "../api/client";

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get("/sessions");
        if (!cancelled) setSessions(res.data);
      } catch (e) {
        if (!cancelled) setError("Could not load sessions.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const chartData = useMemo(() => {
    const lastFive = sessions.slice(0, 5).reverse();
    return lastFive.map((s, idx) => ({
      label: `#${s.id}`,
      score: typeof s.average_score === "number" ? s.average_score : null,
      idx,
    }));
  }, [sessions]);

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <div className="muted">Your interview sessions and score trend</div>
        </div>
        <Link className="btn primary" to="/sessions/new">
          Start new interview
        </Link>
      </div>

      {error ? <div className="error-message">{error}</div> : null}

      <div className="card" style={{ marginBottom: 14 }}>
        <strong>Last 5 sessions (average score)</strong>
        <div style={{ width: "100%", height: 260, marginTop: 12 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <XAxis dataKey="label" stroke="#9fb0c5" />
              <YAxis stroke="#9fb0c5" domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#5aa7ff" strokeWidth={3} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <strong>Sessions</strong>
        <table className="table" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Position</th>
              <th>Level</th>
              <th>Status</th>
              <th>Avg score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.id}</td>
                <td>{s.position_title}</td>
                <td>{s.level}</td>
                <td>{s.status}</td>
                <td>{s.average_score == null ? "—" : s.average_score.toFixed(1)}</td>
                <td>
                  <Link className="btn" to={`/interview/${s.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
