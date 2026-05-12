import { useMemo, useState } from "react";
import LibrarySetModal from "../components/LibrarySetModal";
import { LIBRARY_ROLE_FILTERS, sampleSets } from "../data/librarySets";

export default function Library() {
  const [activeSet, setActiveSet] = useState(null);
  const [roleFilter, setRoleFilter] = useState("all");

  const visibleSets = useMemo(
    () =>
      roleFilter === "all" ? sampleSets : sampleSets.filter((s) => s.role === roleFilter),
    [roleFilter]
  );

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <h2 style={{ margin: 0 }}>Question Library</h2>
          <div className="muted">AI-curated interview sets by role and difficulty</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row" role="group" aria-label="Filter by role">
          {LIBRARY_ROLE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`pill library-filter-btn${roleFilter === f.id ? " is-active" : ""}`}
              aria-pressed={roleFilter === f.id}
              onClick={() => setRoleFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {visibleSets.length === 0 ? (
          <div className="card muted">No sets match this filter.</div>
        ) : (
          visibleSets.map((set) => (
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
          ))
        )}
      </div>

      <LibrarySetModal librarySet={activeSet} onClose={() => setActiveSet(null)} />
    </div>
  );
}
