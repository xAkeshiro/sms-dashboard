"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";
import { CampaignHistoryTable } from "@/components/campaign-history-table";
import { RefreshCw } from "lucide-react";

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

export default function HistoryPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadHistory() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sms/history");
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <>
      <Nav />
      <main className="pt-20 pb-12 px-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-lg font-semibold">History</h1>
          <button
            onClick={loadHistory}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {error && (
          <div className="mb-6 py-3 px-4 rounded-lg border border-destructive/20 text-destructive text-xs">
            {error}
          </div>
        )}

        <CampaignHistoryTable campaigns={campaigns} loading={loading} />
      </main>
    </>
  );
}
