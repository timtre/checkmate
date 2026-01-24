import { BarChart3 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { QuestionInsight } from "../api";

interface InsightsTableProps {
  title: string;
  items: QuestionInsight[];
}

function getConfidenceBadge(confidence: number) {
  const pct = Math.round(confidence * 100);
  if (confidence >= 0.7) return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200" variant="outline">{pct}%</Badge>;
  if (confidence >= 0.4) return <Badge className="bg-amber-100 text-amber-800 border-amber-200" variant="outline">{pct}%</Badge>;
  return <Badge className="bg-red-100 text-red-800 border-red-200" variant="outline">{pct}%</Badge>;
}

export default function InsightsTable({ title, items }: InsightsTableProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No data yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead className="w-[70px]">Count</TableHead>
              <TableHead className="w-[100px]">Confidence</TableHead>
              <TableHead className="w-[90px]">Escalations</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{item.question_pattern}</TableCell>
                <TableCell>{item.count}</TableCell>
                <TableCell>{getConfidenceBadge(item.avg_confidence)}</TableCell>
                <TableCell>{item.escalation_count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
