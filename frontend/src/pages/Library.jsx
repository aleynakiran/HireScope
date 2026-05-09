const sampleSets = [
  {
    title: "Modern Frontend Architecture",
    level: "Advanced",
    role: "Frontend",
    summary: "React patterns, performance tuning, and scalable state management.",
    questions: 24,
  },
  {
    title: "Distributed Systems Foundations",
    level: "Mid-Level",
    role: "Backend",
    summary: "CAP theorem, consistency tradeoffs, and resilient service communication.",
    questions: 18,
  },
  {
    title: "Web Security Essentials",
    level: "Lead",
    role: "System Design",
    summary: "OAuth2, threat modeling, and practical hardening scenarios.",
    questions: 15,
  },
];

export default function Library() {
  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0 }}>Question Library</h2>
          <div className="muted">AI-curated interview sets by role and difficulty</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row">
          <span className="pill">All roles</span>
          <span className="pill">Frontend</span>
          <span className="pill">Backend</span>
          <span className="pill">System Design</span>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {sampleSets.map((set) => (
          <div key={set.title} className="card">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{set.title}</strong>
              <span className="pill">{set.level}</span>
            </div>
            <p className="muted" style={{ margin: "8px 0 10px" }}>
              {set.summary}
            </p>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="muted">
                {set.role} · {set.questions} questions
              </span>
              <button type="button" className="btn primary">
                View set
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
