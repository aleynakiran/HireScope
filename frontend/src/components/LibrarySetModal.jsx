import { useEffect, useMemo } from "react";
import { expandLibraryQuestions } from "../utils/libraryQuestions";

export default function LibrarySetModal({ librarySet, onClose }) {
  useEffect(() => {
    if (!librarySet) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [librarySet, onClose]);

  const questionLines = useMemo(
    () => (librarySet ? expandLibraryQuestions(librarySet) : []),
    [librarySet]
  );

  if (!librarySet) return null;

  const titleId = "library-set-modal-title";

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button type="button" className="modal-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="modal-panel card"
        style={{ maxWidth: 560 }}
      >
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <h3 id={titleId} style={{ margin: 0, fontSize: "1.15rem" }}>
              {librarySet.title}
            </h3>
            <p className="muted" style={{ margin: "8px 0 0", fontSize: 13 }}>
              {librarySet.role} · {librarySet.level} · {librarySet.questions} questions in full set
            </p>
          </div>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="muted" style={{ margin: "14px 0 12px", fontSize: 13, lineHeight: 1.6 }}>
          {librarySet.summary}
        </p>

        <strong style={{ fontSize: 13 }}>Questions ({questionLines.length})</strong>
        <ol style={{ margin: "10px 0 0", paddingLeft: 20 }}>
          {questionLines.map((q, idx) => (
            <li key={idx} style={{ marginBottom: 10, lineHeight: 1.55 }}>
              {q}
            </li>
          ))}
        </ol>

        <p className="muted" style={{ margin: "16px 0 0", fontSize: 12, lineHeight: 1.55 }}>
          Library preview — use <strong>New interview</strong> for AI-generated questions matched to your role and tech
          stack.
        </p>
      </div>
    </div>
  );
}
