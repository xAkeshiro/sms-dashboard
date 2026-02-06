"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

interface Campaign {
  id: string;
  status: string;
  send_time: string | null;
  settings: {
    subject_line: string;
    title: string;
  };
  recipients: {
    recipient_count: number;
    segment_text: string;
  };
}

interface CampaignHistoryTableProps {
  campaigns: Campaign[];
  loading?: boolean;
}

function getStatusColor(status: string) {
  switch (status) {
    case "sent":
      return "bg-green-500/10 text-green-400 border-green-500/20";
    case "sending":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "schedule":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "paused":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function CampaignHistoryTable({
  campaigns,
  loading,
}: CampaignHistoryTableProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 bg-secondary/30 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No campaigns yet</p>
        <p className="text-sm mt-1">
          Campaigns you send will appear here
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead className="text-right">Recipients</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((campaign) => (
          <TableRow key={campaign.id}>
            <TableCell className="font-mono text-xs whitespace-nowrap">
              {campaign.send_time
                ? new Date(campaign.send_time).toLocaleString()
                : "—"}
            </TableCell>
            <TableCell className="font-medium max-w-[200px] truncate">
              {campaign.settings.title || "Untitled"}
            </TableCell>
            <TableCell className="max-w-[300px] truncate text-muted-foreground">
              {campaign.settings.subject_line || "—"}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {campaign.recipients.recipient_count?.toLocaleString() || "—"}
            </TableCell>
            <TableCell>
              <Badge
                variant="outline"
                className={getStatusColor(campaign.status)}
              >
                {campaign.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
