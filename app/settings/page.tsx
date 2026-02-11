"use client";

import { useEffect, useState, useCallback } from "react";
import { Nav } from "@/components/nav";
import { getAudienceAccent } from "@/lib/constants";
import { RefreshCw } from "lucide-react";

interface Audience {
  id: string;
  name: string;
  member_count: number;
}

interface TagData {
  id: number;
  name: string;
  member_count: number;
}

export default function SettingsPage() {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [tagsByAudience, setTagsByAudience] = useState<Record<string, TagData[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/audiences");
      if (!res.ok) throw new Error("Failed to fetch audiences");
      const data = await res.json();
      const auds: Audience[] = data.audiences || [];
      setAudiences(auds);
      setApiConnected(true);

      // Fetch tags for each audience
      const tagsMap: Record<string, TagData[]> = {};
      for (const aud of auds) {
        try {
          const tagRes = await fetch(`/api/tags?audienceId=${aud.id}`);
          if (tagRes.ok) {
            const tagData = await tagRes.json();
            tagsMap[aud.id] = tagData.tags || [];
          }
        } catch {
          // skip
        }
      }
      setTagsByAudience(tagsMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <>
      <Nav />
      <main className="pt-20 pb-12 px-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <button
            onClick={loadData}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Connection */}
        <section className="mb-10">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
            Connection
          </p>
          <div className="rounded-xl bg-card border border-border/30 p-4 flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                apiConnected === null
                  ? "bg-muted-foreground animate-pulse"
                  : apiConnected
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                    : "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.4)]"
              }`}
            />
            <div>
              <span className="text-sm font-medium">
                {apiConnected === null
                  ? "Checking..."
                  : apiConnected
                    ? "Mailchimp connected"
                    : "Disconnected"}
              </span>
              {apiConnected && (
                <span className="text-xs text-muted-foreground ml-2">
                  {audiences.length} audience{audiences.length !== 1 ? "s" : ""} found
                </span>
              )}
            </div>
          </div>
          {error && (
            <p className="text-xs text-destructive mt-2">{error}</p>
          )}
        </section>

        {/* Audiences */}
        <section className="mb-10">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
            Audiences
          </p>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border/30 divide-y divide-border/20 overflow-hidden">
              {audiences.map((aud) => {
                const tags = tagsByAudience[aud.id] || [];
                return (
                  <div key={aud.id} className="px-4 py-3 hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getAudienceAccent(aud.name) }}
                        />
                        <span className="text-sm font-medium">{aud.name}</span>
                      </div>
                      <span className="text-sm font-semibold tabular-nums">
                        {aud.member_count.toLocaleString()}
                      </span>
                    </div>
                    {tags.length > 0 && (
                      <div className="ml-5 mt-1.5 flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="text-[10px] text-muted-foreground bg-secondary/40 px-1.5 py-0.5 rounded"
                          >
                            {tag.name} ({tag.member_count})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
