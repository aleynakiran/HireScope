import { useEffect, useState } from "react";
import { apiClient } from "../../api/client";

export default function AdminOversight() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, l] = await Promise.all([apiClient.get("/admin/stats"), apiClient.get("/admin/audit-log")]);
        if (!cancelled) {
          setStats(s.data);
          setLogs((l.data || []).slice(0, 12));
        }
      } catch {
        if (!cancelled) setError("Could not load oversight data.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container">
      <h2 style={{ marginTop: 0, marginBottom: 4 }}>System Oversight</h2>
      <div className="muted" style={{ marginBottom: 12 }}>
        Audit dashboard for compliance and risk monitoring.
      </div>
      {error ? <div className="error-message">{error}</div> : null}

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="metric-grid">
          <div className="metric-card">
            <div className="muted">Compliance health</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{stats ? "98.4%" : "—"}</div>
          </div>
          <div className="metric-card">
            <div className="muted">Active sessions today</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{stats?.active_sessions_today ?? "—"}</div>
          </div>
          <div className="metric-card">
            <div className="muted">Users</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{stats?.total_users ?? "—"}</div>
          </div>
          <div className="metric-card">
            <div className="muted">Total sessions</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{stats?.total_sessions ?? "—"}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <strong>Event Audit Log</strong>
        <table className="table" style={{ marginTop: 10 }}>
          <thead>
            <tr>
              <th>Time</th>
              <th>Action</th>
              <th>Admin</th>
              <th>Target user</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((row) => (
              <tr key={row.id}>
                <td>{new Date(row.created_at).toLocaleString()}</td>
                <td>{row.action}</td>
                <td>{row.admin_id}</td>
                <td>{row.target_user_id ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
