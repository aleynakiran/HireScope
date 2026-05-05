export default function QuestionCard({ question }) {
  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="pill">Difficulty: {question.difficulty}</div>
        <div className="muted">#{question.order_index + 1}</div>
      </div>
      <h3 style={{ marginTop: 12, marginBottom: 8 }}>{question.content}</h3>
      <div className="muted" style={{ fontSize: 13 }}>
        Expected concepts (hints):{" "}
        {(question.expected_keywords || []).slice(0, 8).join(", ")}
      </div>
    </div>
  );
}
