import { MessageSquare, MessagesSquare, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsOverviewProps {
  conversations: number;
  messages: number;
  escalations: number;
  loading?: boolean;
}

export default function StatsOverview({ conversations, messages, escalations, loading }: StatsOverviewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    { label: "Conversations", value: conversations, icon: MessageSquare, color: "text-blue-600 bg-blue-50" },
    { label: "Messages", value: messages, icon: MessagesSquare, color: "text-emerald-600 bg-emerald-50" },
    { label: "Escalations", value: escalations, icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
