"use client";

import { useRouter } from "next/navigation";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ChevronRight } from "lucide-react";

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

function StatusDot({ status }: { status: string }) {
  const color =
    status === "sent"
      ? "bg-emerald-400"
      : status === "sending"
        ? "bg-blue-400"
        : status === "schedule"
          ? "bg-amber-400"
          : "bg-muted-foreground";

  return (
    <span className="inline-flex items-center gap-2 text-xs capitalize">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      {status}
    </span>
  );
}

export function CampaignHistoryTable({
  campaigns,
  loading,
}: CampaignHistoryTableProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 rounded-lg animate-shimmer"
          />
        ))}
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="text-sm">No campaigns yet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="border-border/50 hover:bg-transparent">
          <TableHead className="text-[11px] uppercase tracking-wider font-medium">
            Date
          </TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider font-medium">
            Title
          </TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider font-medium text-right">
            Recipients
          </TableHead>
          <TableHead className="text-[11px] uppercase tracking-wider font-medium">
            Status
          </TableHead>
          <TableHead className="w-8" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {campaigns.map((campaign) => (
          <TableRow
            key={campaign.id}
            className="border-border/30 cursor-pointer hover:bg-secondary/40"
            onClick={() => router.push(`/history/${campaign.id}`)}
          >
            <TableCell className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
              {campaign.send_time
                ? new Date(campaign.send_time).toLocaleDateString()
                : "—"}
            </TableCell>
            <TableCell className="text-sm max-w-[300px] truncate">
              {campaign.settings.title || "Untitled"}
            </TableCell>
            <TableCell className="text-right text-sm tabular-nums">
              {campaign.recipients.recipient_count?.toLocaleString() || "—"}
            </TableCell>
            <TableCell>
              <StatusDot status={campaign.status} />
            </TableCell>
            <TableCell>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
