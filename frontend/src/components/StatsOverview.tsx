interface StatsOverviewProps {
  conversations: number;
  messages: number;
  escalations: number;
}

export default function StatsOverview({ conversations, messages, escalations }: StatsOverviewProps) {
  return (
    <div className="stats-row">
      <div className="stat-item">
        <span className="stat-number">{conversations}</span>
        <span className="stat-label">Conversations</span>
      </div>
      <div className="stat-item">
        <span className="stat-number">{messages}</span>
        <span className="stat-label">Messages</span>
      </div>
      <div className="stat-item">
        <span className="stat-number">{escalations}</span>
        <span className="stat-label">Escalations</span>
      </div>
    </div>
  );
}
