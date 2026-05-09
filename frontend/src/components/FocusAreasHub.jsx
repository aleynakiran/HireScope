const TARGET = 10;

function ScoreRing({ value, emphasized }) {
  const r = 20;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, Number(value) / TARGET));
  const dash = c * pct;
  const stroke = emphasized ? "#ff9f43" : "#5aa7ff";
  const glow = emphasized ? "rgba(255, 159, 67, 0.35)" : "rgba(90, 167, 255, 0.35)";
  return (
    <svg width={52} height={52} viewBox="0 0 52 52" aria-hidden>
      <circle cx="26" cy="26" r={r} fill="none" stroke="rgba(232,238,247,0.08)" strokeWidth="5" />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c}`}
        transform="rotate(-90 26 26)"
        style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
      />
      <text
        x="26"
        y="29"
        textAnchor="middle"
        fill="#e8eef7"
        fontSize="11"
        fontWeight="700"
      >
        {typeof value === "number" ? value.toFixed(1) : "—"}
      </text>
    </svg>
  );
}

export default function FocusAreasHub({ data, loading, error }) {
  const empty = !loading && data && data.sessions_analyzed === 0;

  return (
    <div className="card focus-hub-card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <strong>Personalized Improvement Hub</strong>
          <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
            Focus areas from your last {data?.sessions_analyzed ?? "—"} graded{" "}
            {data?.sessions_analyzed === 1 ? "session" : "sessions"} · rubric vs target {TARGET.toFixed(1)}
          </div>
        </div>
      </div>

      {error ? <p className="error-message" style={{ marginTop: 12 }}>{error}</p> : null}

      {loading ? (
        <p className="muted" style={{ marginTop: 16 }}>
          Analyzing rubric trends…
        </p>
      ) : null}

      {empty ? (
        <p className="muted" style={{ marginTop: 16 }}>
          Complete at least one graded interview to unlock focus areas, coaching tips, and missing-concept
          tracking.
        </p>
      ) : null}

      {!loading && !empty && data?.top_missing_concepts?.length ? (
        <div style={{ marginTop: 14 }}>
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>
            Recent feedback — missing concepts
          </div>
          <div className="focus-missing-tags">
            {data.top_missing_concepts.slice(0, 8).map((tag) => (
              <span key={tag} className="focus-missing-tag">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {!loading && !empty && data?.focus_areas?.length ? (
        <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
          {data.focus_areas.map((area) => {
            const high = area.priority === "high";
            const rowClass =
              "focus-area-row" + (high ? " focus-area-row--warn" : " focus-area-row--growth");
            const frac = Math.min(1, Math.max(0, area.score / TARGET));
            return (
              <div key={area.key} className={rowClass}>
                <div className="row" style={{ alignItems: "flex-start", gap: 14 }}>
                  <ScoreRing value={area.score} emphasized={high} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                      <span className="focus-area-pill">{area.label}</span>
                      {area.priority_label ? (
                        <span className="focus-priority-badge">{area.priority_label}</span>
                      ) : null}
                    </div>
                    <div className="focus-mini-track" aria-hidden>
                      <div
                        className="focus-mini-fill"
                        style={{
                          width: `${frac * 100}%`,
                          background: high
                            ? "linear-gradient(90deg, #ff9f43, #ff6b7d)"
                            : "linear-gradient(90deg, #5aa7ff, #68e4b1)",
                        }}
                      />
                    </div>
                    <p style={{ margin: "10px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.55 }}>
                      {area.tip}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
