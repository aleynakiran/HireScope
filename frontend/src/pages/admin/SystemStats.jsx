export default function SystemStats({ stats }) {
  if (!stats) return null;
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="row" style={{ gap: 18 }}>
        <div>
          <div className="muted">Users</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.total_users}</div>
        </div>
        <div>
          <div className="muted">Sessions</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.total_sessions}</div>
        </div>
        <div>
          <div className="muted">Active sessions today</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>{stats.active_sessions_today ?? "—"}</div>
        </div>
        <div>
          <div className="muted">Avg evaluation score</div>
          <div style={{ fontSize: 28, fontWeight: 800 }}>
            {stats.average_score == null ? "—" : stats.average_score.toFixed(2)}
          </div>
        </div>
      </div>
      {(stats.top_positions || []).length ? (
        <div style={{ marginTop: 10 }} className="muted">
          Top positions: {stats.top_positions.join(", ")}
        </div>
      ) : null}
    </div>
  );
}
