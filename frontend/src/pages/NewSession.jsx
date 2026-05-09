import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api/client";
import { formatApiError } from "../utils/formatApiError";

const LEVELS = [
  { id: "junior", label: "Junior" },
  { id: "mid", label: "Mid" },
  { id: "senior", label: "Senior" },
];

const STACK_OPTIONS = ["Python", "FastAPI", "React", "PostgreSQL", "Docker", "AWS", "Go", "Kubernetes"];

export default function NewSession() {
  const navigate = useNavigate();
  const [positions, setPositions] = useState([]);
  const [positionId, setPositionId] = useState("");
  const [level, setLevel] = useState("junior");
  const [selectedStacks, setSelectedStacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get("/positions");
        if (!cancelled) {
          setPositions(res.data);
          if (res.data?.[0]?.id) setPositionId(String(res.data[0].id));
        }
      } catch {
        if (!cancelled) setError("Could not load positions.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(() => Boolean(positionId) && selectedStacks.length > 0 && !loading, [
    positionId,
    selectedStacks.length,
    loading,
  ]);

  function toggleStack(stack) {
    setSelectedStacks((prev) =>
      prev.includes(stack) ? prev.filter((s) => s !== stack) : [...prev, stack]
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await apiClient.post("/sessions", {
        position_id: Number(positionId),
        level,
        tech_stack: selectedStacks,
      });
      navigate(`/interview/${res.data.id}`);
    } catch (err) {
      setError(formatApiError(err, "Could not create session"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>New interview session</h2>

          <form onSubmit={onSubmit}>
            <label className="label" htmlFor="position">
              Position
            </label>
            <select
              id="position"
              className="select"
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              required
            >
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            <div className="label">Seniority</div>
            <div className="row">
              {LEVELS.map((l) => (
                <label key={l.id} className="pill">
                  <input
                    type="radio"
                    name="level"
                    value={l.id}
                    checked={level === l.id}
                    onChange={() => setLevel(l.id)}
                  />{" "}
                  {l.label}
                </label>
              ))}
            </div>

            <div className="label">Tech stack</div>
            <div className="row">
              {STACK_OPTIONS.map((s) => (
                <label key={s} className="pill">
                  <input
                    type="checkbox"
                    checked={selectedStacks.includes(s)}
                    onChange={() => toggleStack(s)}
                  />{" "}
                  {s}
                </label>
              ))}
            </div>

            <div style={{ marginTop: 14 }}>
              <button data-testid="start-session-btn" className="btn primary" type="submit" disabled={!canSubmit}>
                {loading ? "Starting…" : "Generate questions"}
              </button>
            </div>
          </form>

          {error ? <div className="error-message">{error}</div> : null}
        </div>

        <div className="card">
          <strong>Smart assessment</strong>
          <p className="muted" style={{ marginTop: 10 }}>
            The AI will generate 5 questions in progression: 1 warm-up, 2 core, and 2 deep-dive.
          </p>
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            <div className="pill">Role-aware prompts</div>
            <div className="pill">Rubric-based evaluation</div>
            <div className="pill">Prompt-injection safeguards</div>
          </div>
          <div style={{ marginTop: 16 }}>
            <div className="label" style={{ marginTop: 0 }}>
              Selected stack
            </div>
            <div className="muted">{selectedStacks.length ? selectedStacks.join(", ") : "No stack selected yet."}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
