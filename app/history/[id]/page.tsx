"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Send, Users, CheckCircle2, XCircle, AlertTriangle, UserMinus } from "lucide-react";

interface CampaignDetail {
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
  tracking?: {
    delivered: number;
    bounced: number;
    failed: number;
    opted_out: number;
    delivery_rate: number;
  };
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl bg-card border border-border/30 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function DeliveryBar({ tracking, total }: { tracking: CampaignDetail["tracking"]; total: number }) {
  if (!tracking || total === 0) return null;

  const deliveredPct = (tracking.delivered / total) * 100;
  const bouncedPct = (tracking.bounced / total) * 100;
  const failedPct = (tracking.failed / total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Delivery breakdown</span>
        <span className="tabular-nums">{tracking.delivery_rate}% delivered</span>
      </div>
      <div className="h-2.5 bg-secondary rounded-full overflow-hidden flex">
        <div
          className="h-full bg-emerald-400 transition-all duration-500"
          style={{ width: `${deliveredPct}%` }}
        />
        <div
          className="h-full bg-amber-400 transition-all duration-500"
          style={{ width: `${bouncedPct}%` }}
        />
        <div
          className="h-full bg-destructive transition-all duration-500"
          style={{ width: `${failedPct}%` }}
        />
      </div>
      <div className="flex gap-4 text-[11px]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Delivered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Bounced
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-destructive" />
          Failed
        </span>
      </div>
    </div>
  );
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/sms/campaign?id=${params.id}`);
        if (!res.ok) throw new Error("Campaign not found");
        const data = await res.json();
        setCampaign(data.campaign);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    if (params.id) load();
  }, [params.id]);

  return (
    <>
      <Nav />
      <main className="pt-20 pb-12 px-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/history")}
            className="text-muted-foreground mb-4"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" />
            Back to History
          </Button>

          {loading ? (
            <div className="space-y-3">
              <div className="h-6 w-64 rounded-lg animate-shimmer" />
              <div className="h-4 w-40 rounded-lg animate-shimmer" />
            </div>
          ) : error ? (
            <div className="py-3 px-4 rounded-xl border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          ) : campaign ? (
            <div className="animate-slide-up">
              {/* Header */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h1 className="text-xl font-bold tracking-tight">
                    {campaign.settings.title || "Untitled Campaign"}
                  </h1>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        campaign.status === "sent" ? "bg-emerald-400" : "bg-amber-400"
                      }`} />
                      <span className="capitalize">{campaign.status}</span>
                    </span>
                    {campaign.send_time && (
                      <>
                        <span>&middot;</span>
                        <span>{new Date(campaign.send_time).toLocaleString()}</span>
                      </>
                    )}
                    {campaign.recipients.segment_text && (
                      <>
                        <span>&middot;</span>
                        <span>{campaign.recipients.segment_text}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <StatCard
                  label="Total Sent"
                  value={campaign.recipients.recipient_count}
                  icon={Send}
                  color="#C9A84C"
                  sub={`To ${campaign.recipients.segment_text || "all"}`}
                />
                <StatCard
                  label="Delivered"
                  value={campaign.tracking?.delivered ?? "—"}
                  icon={CheckCircle2}
                  color="#34d399"
                  sub={campaign.tracking ? `${campaign.tracking.delivery_rate}% rate` : undefined}
                />
                <StatCard
                  label="Bounced"
                  value={campaign.tracking?.bounced ?? "—"}
                  icon={AlertTriangle}
                  color="#fbbf24"
                  sub={campaign.tracking
                    ? `${((campaign.tracking.bounced / campaign.recipients.recipient_count) * 100).toFixed(1)}%`
                    : undefined
                  }
                />
                <StatCard
                  label="Failed"
                  value={campaign.tracking?.failed ?? "—"}
                  icon={XCircle}
                  color="#ef4444"
                  sub={campaign.tracking
                    ? `${((campaign.tracking.failed / campaign.recipients.recipient_count) * 100).toFixed(1)}%`
                    : undefined
                  }
                />
              </div>

              {/* Delivery Bar */}
              {campaign.tracking && (
                <div className="rounded-xl bg-card border border-border/30 p-5 mb-8">
                  <DeliveryBar
                    tracking={campaign.tracking}
                    total={campaign.recipients.recipient_count}
                  />
                </div>
              )}

              {/* Additional Details */}
              <div className="grid md:grid-cols-2 gap-3">
                <div className="rounded-xl bg-card border border-border/30 p-5 space-y-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Campaign Details
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Campaign ID</span>
                      <span className="font-mono text-xs">{campaign.id}</span>
                    </div>
                    <div className="h-px bg-border/20" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span>SMS</span>
                    </div>
                    <div className="h-px bg-border/20" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Audience</span>
                      <span>{campaign.recipients.segment_text || "All contacts"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-card border border-border/30 p-5 space-y-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    Engagement
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> Recipients
                      </span>
                      <span className="font-semibold tabular-nums">
                        {campaign.recipients.recipient_count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-px bg-border/20" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <UserMinus className="w-3.5 h-3.5" /> Opt-outs
                      </span>
                      <span className="tabular-nums">
                        {campaign.tracking?.opted_out ?? "—"}
                      </span>
                    </div>
                    <div className="h-px bg-border/20" />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery Rate</span>
                      <span className="font-semibold text-primary tabular-nums">
                        {campaign.tracking?.delivery_rate ?? "—"}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </>
  );
}
