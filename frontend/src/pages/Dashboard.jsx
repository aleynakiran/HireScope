import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { apiClient } from "../api/client";
import FocusAreasHub from "../components/FocusAreasHub";

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");
  const [hub, setHub] = useState(null);
  const [hubLoading, setHubLoading] = useState(true);
  const [hubError, setHubError] = useState("");

  const refreshDashboard = useCallback(async () => {
    setHubLoading(true);
    setHubError("");
    setError("");
    try {
      const [sessionsRes, hubRes] = await Promise.all([
        apiClient.get("/sessions"),
        apiClient.get("/insights/improvement-hub"),
      ]);
      setSessions(sessionsRes.data);
      setHub(hubRes.data);
    } catch {
      setError("Could not load sessions.");
      setHubError("Could not load improvement hub.");
      setSessions([]);
      setHub(null);
    } finally {
      setHubLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        refreshDashboard();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refreshDashboard]);

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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div className="card">
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

        <FocusAreasHub data={hub} loading={hubLoading} error={hubError} />

        <div className="card">
          <div className="muted">Total sessions</div>
          <div style={{ fontSize: 34, fontWeight: 800, marginTop: 8 }}>{sessions.length}</div>
          <div className="muted" style={{ marginTop: 14 }}>
            Completed
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
            {sessions.filter((s) => s.status === "completed").length}
          </div>
          <div className="muted" style={{ marginTop: 14 }}>
            Active
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
            {sessions.filter((s) => s.status === "active").length}
          </div>
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
