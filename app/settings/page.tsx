"use client";

import { useEffect, useState, useCallback } from "react";
import { Nav } from "@/components/nav";
import { ASSOCIATIONS } from "@/lib/constants";
import { RefreshCw } from "lucide-react";

interface TagData {
  id: number;
  name: string;
  member_count: number;
}

export default function SettingsPage() {
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);

  const loadTags = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error("Failed to fetch tags");
      const data = await res.json();
      setTags(data.tags || []);
      setApiConnected(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tags");
      setApiConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const otherTags = tags.filter(
    (t) => !ASSOCIATIONS.some((a) => a.tag.toUpperCase() === t.name.toUpperCase())
  );

  return (
    <>
      <Nav />
      <main className="pt-20 pb-12 px-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-xl font-bold tracking-tight">Settings</h1>
          <button
            onClick={loadTags}
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
                  {tags.length} tags synced
                </span>
              )}
            </div>
          </div>
          {error && (
            <p className="text-xs text-destructive mt-2">{error}</p>
          )}
        </section>

        {/* Association Tags */}
        <section className="mb-10">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
            Association Tags
          </p>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-12 rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border/30 divide-y divide-border/20 overflow-hidden">
              {ASSOCIATIONS.map((assoc) => {
                const tag = tags.find(
                  (t) => t.name.toUpperCase() === assoc.tag.toUpperCase()
                );
                return (
                  <div
                    key={assoc.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: assoc.accent }}
                      />
                      <span className="text-sm font-medium">{assoc.tag}</span>
                      <span className="text-xs text-muted-foreground">
                        {assoc.name}
                      </span>
                    </div>
                    <span className="text-sm font-semibold tabular-nums">
                      {tag ? tag.member_count.toLocaleString() : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Other Tags */}
        <section>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-3">
            Other Tags ({otherTags.length})
          </p>
          {loading ? (
            <div className="h-12 rounded-xl animate-shimmer" />
          ) : otherTags.length === 0 ? (
            <p className="text-xs text-muted-foreground">None</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {otherTags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs text-muted-foreground bg-card border border-border/30 px-2.5 py-1 rounded-lg"
                >
                  {tag.name} ({tag.member_count})
                </span>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
