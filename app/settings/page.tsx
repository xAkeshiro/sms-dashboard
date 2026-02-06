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
          <h1 className="text-lg font-semibold">Settings</h1>
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
          <div className="flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                apiConnected === null
                  ? "bg-muted-foreground animate-pulse"
                  : apiConnected
                    ? "bg-emerald-400"
                    : "bg-destructive"
              }`}
            />
            <span className="text-sm">
              {apiConnected === null
                ? "Checking..."
                : apiConnected
                  ? "Mailchimp connected"
                  : "Disconnected"}
            </span>
            {apiConnected && (
              <span className="text-xs text-muted-foreground ml-1">
                &middot; {tags.length} tags
              </span>
            )}
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
                <div key={i} className="h-10 bg-secondary/20 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {ASSOCIATIONS.map((assoc) => {
                const tag = tags.find(
                  (t) => t.name.toUpperCase() === assoc.tag.toUpperCase()
                );
                return (
                  <div
                    key={assoc.id}
                    className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: assoc.accent }}
                      />
                      <span className="text-sm">{assoc.tag}</span>
                      <span className="text-xs text-muted-foreground">
                        {assoc.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
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
            <div className="h-12 bg-secondary/20 rounded animate-pulse" />
          ) : otherTags.length === 0 ? (
            <p className="text-xs text-muted-foreground">None</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {otherTags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs text-muted-foreground bg-secondary/50 px-2 py-0.5 rounded"
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
