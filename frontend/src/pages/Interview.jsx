import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../api/client";
import { formatApiError } from "../utils/formatApiError";
import QuestionCard from "../components/QuestionCard";

export default function Interview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(`/sessions/${sessionId}`);
        if (!cancelled) setDetail(res.data);
      } catch {
        if (!cancelled) setError("Session not found.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const sortedQuestions = useMemo(() => {
    const qs = detail?.questions || [];
    return [...qs].sort((a, b) => a.order_index - b.order_index);
  }, [detail]);

  const [answeredIds, setAnsweredIds] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get(`/answers/${sessionId}`);
        if (!cancelled) {
          setAnsweredIds(new Set(res.data.map((a) => a.question_id)));
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, busy]);

  const nextQuestion = useMemo(() => {
    return sortedQuestions.find((q) => !answeredIds.has(q.id)) || null;
  }, [sortedQuestions, answeredIds]);

  const progress = useMemo(() => {
    const total = sortedQuestions.length || 1;
    const done = sortedQuestions.filter((q) => answeredIds.has(q.id)).length;
    return Math.round((done / total) * 100);
  }, [sortedQuestions, answeredIds]);

  async function submitCurrent(isLast) {
    setError("");
    if (!nextQuestion) return;
    if (answer.trim().length < 10) {
      setError("Please write at least 10 characters.");
      return;
    }
    setBusy(true);
    try {
      await apiClient.post("/answers", {
        session_id: Number(sessionId),
        question_id: nextQuestion.id,
        content: answer,
      });
      setAnswer("");
      if (isLast) {
        await apiClient.put(`/sessions/${sessionId}/complete`);
        navigate(`/results/${sessionId}`);
      }
    } catch (err) {
      setError(formatApiError(err, "Submit failed"));
    } finally {
      setBusy(false);
    }
  }

  if (!detail) {
    return (
      <div className="container">
        <p className="muted">{error || "Loading session…"}</p>
      </div>
    );
  }

  const doneCount = sortedQuestions.filter((q) => answeredIds.has(q.id)).length;
  const total = sortedQuestions.length;
  const isLast = doneCount === total - 1 && nextQuestion;

  return (
    <div className="container">
      <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <div className="muted">
            {detail.position_title} · {detail.level}
          </div>
          <h2 style={{ margin: "6px 0 0" }}>Interview</h2>
        </div>
        <Link className="btn" to="/dashboard">
          Dashboard
        </Link>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>Progress</strong>
          <span className="muted">
            {doneCount}/{total}
          </span>
        </div>
        <div
          style={{
            marginTop: 10,
            height: 10,
            borderRadius: 999,
            border: "1px solid var(--border)",
            overflow: "hidden",
            background: "rgba(0,0,0,0.25)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress}%`,
              background: "linear-gradient(90deg, var(--accent), var(--accent-2))",
            }}
          />
        </div>
      </div>

      {!nextQuestion ? (
        <div className="card">
          <strong>All questions answered</strong>
          <div style={{ marginTop: 12 }} className="row">
            <button className="btn primary" type="button" onClick={() => navigate(`/results/${sessionId}`)}>
              View results
            </button>
            <button
              className="btn"
              type="button"
              onClick={async () => {
                await apiClient.put(`/sessions/${sessionId}/complete`);
                navigate(`/results/${sessionId}`);
              }}
            >
              Complete session
            </button>
          </div>
        </div>
      ) : (
        <>
          <QuestionCard question={nextQuestion} />

          <div className="card" style={{ marginTop: 12 }}>
            <label className="label" htmlFor="answer">
              Your answer
            </label>
            <textarea
              id="answer"
              name="answer"
              className="textarea"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />

            {error ? <div className="error-message">{error}</div> : null}

            <div style={{ marginTop: 12 }} className="row">
              <button
                type="button"
                className="btn primary"
                disabled={busy}
                onClick={() => submitCurrent(Boolean(isLast))}
              >
                {isLast ? "Complete interview" : "Submit & continue"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
