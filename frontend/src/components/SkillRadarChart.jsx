import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function SkillRadarChart({ averageScore, samples }) {
  const depthAvg =
    samples.length === 0
      ? 0
      : samples.reduce((acc, s) => acc + (s.evaluation?.depth_score || 0), 0) / samples.length;
  const clarityAvg =
    samples.length === 0
      ? 0
      : samples.reduce((acc, s) => acc + (s.evaluation?.clarity_score || 0), 0) / samples.length;
  const overall = typeof averageScore === "number" ? averageScore : 0;

  const data = [
    { skill: "Overall", value: overall },
    { skill: "Depth", value: depthAvg },
    { skill: "Clarity", value: clarityAvg },
    { skill: "Consistency", value: samples.length ? overall : 0 },
  ];

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>Rubric snapshot</strong>
        <span className="muted">Based on your latest session</span>
      </div>
      <div style={{ width: "100%", height: 320, marginTop: 12 }}>
        <ResponsiveContainer>
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="80%">
            <PolarGrid stroke="rgba(232,238,247,0.12)" />
            <PolarAngleAxis dataKey="skill" tick={{ fill: "#9fb0c5", fontSize: 12 }} />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#5aa7ff"
              fill="#5aa7ff"
              fillOpacity={0.35}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
