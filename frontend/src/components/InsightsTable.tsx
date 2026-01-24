import type { QuestionInsight } from "../api";

interface InsightsTableProps {
  title: string;
  items: QuestionInsight[];
}

export default function InsightsTable({ title, items }: InsightsTableProps) {
  if (items.length === 0) return null;

  return (
    <div className="admin-card">
      <h2>{title}</h2>
      <table className="insights-table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Count</th>
            <th>Avg Confidence</th>
            <th>Escalations</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td>{item.question_pattern}</td>
              <td>{item.count}</td>
              <td>{Math.round(item.avg_confidence * 100)}%</td>
              <td>{item.escalation_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
