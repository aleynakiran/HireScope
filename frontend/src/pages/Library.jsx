import { useState } from "react";
import LibrarySetModal from "../components/LibrarySetModal";

const sampleSets = [
  {
    title: "Modern Frontend Architecture",
    level: "Advanced",
    role: "Frontend",
    summary: "React patterns, performance tuning, and scalable state management.",
    questions: 24,
    items: [
      "How do you decide between client state, server cache, and URL state for a complex dashboard?",
      "Walk through how you would cut Largest Contentful Paint on a React SPA without sacrificing DX.",
      "Compare render props, HOCs, hooks, and composition — when does each become a footgun?",
      "How do you structure a design system so teams ship consistently without blocking velocity?",
      "Describe a production incident caused by stale closure or missed dependency arrays — how did you fix it?",
      "What trade-offs do you weigh when choosing between Redux, Zustand, and React context at scale?",
    ],
  },
  {
    title: "Distributed Systems Foundations",
    level: "Mid-Level",
    role: "Backend",
    summary: "CAP theorem, consistency tradeoffs, and resilient service communication.",
    questions: 18,
    items: [
      "Explain CAP in your own words — where do real systems usually compromise?",
      "How would you choose between strong and eventual consistency for an inventory service?",
      "Compare synchronous REST, async messaging, and event streaming for cross-service workflows.",
      "What is the outbox pattern and when is it worth the operational cost?",
      "How do you handle idempotency for retries in payment or booking flows?",
      "Describe how you would add observability so you can trace a request across five services.",
    ],
  },
  {
    title: "Web Security Essentials",
    level: "Lead",
    role: "System Design",
    summary: "OAuth2, threat modeling, and practical hardening scenarios.",
    questions: 15,
    items: [
      "Compare OAuth2 authorization code flow with implicit flow — why is implicit discouraged?",
      "How would you threat-model a public API that exposes user-generated webhooks?",
      "What headers and cookie flags would you require for a session-based admin app?",
      "Walk through mitigations for CSRF, XSS, and clickjacking in a modern SPA + API setup.",
      "How do you safely store and rotate third-party API tokens your backend proxies?",
      "When would you choose mutual TLS versus JWT between internal services?",
    ],
  },
];

export default function Library() {
  const [activeSet, setActiveSet] = useState(null);

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
              <button
                type="button"
                className="btn primary"
                onClick={() => setActiveSet(set)}
              >
                View set
              </button>
            </div>
          </div>
        ))}
      </div>

      <LibrarySetModal librarySet={activeSet} onClose={() => setActiveSet(null)} />
    </div>
  );
}
