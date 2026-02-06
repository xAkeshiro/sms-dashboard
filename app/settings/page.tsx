"use client";

import { useEffect, useState, useCallback } from "react";
import { Nav } from "@/components/nav";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ASSOCIATIONS } from "@/lib/constants";
import {
  RefreshCw,
  CheckCircle2,
  XCircle,
  Tag,
  Server,
} from "lucide-react";

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

  const associationTags = tags.filter((t) =>
    ASSOCIATIONS.some((a) => a.tag.toUpperCase() === t.name.toUpperCase())
  );

  const otherTags = tags.filter(
    (t) =>
      !ASSOCIATIONS.some((a) => a.tag.toUpperCase() === t.name.toUpperCase())
  );

  return (
    <>
      <Nav />
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Mailchimp connection and view tag configuration
          </p>
        </div>

        {/* API Connection Status */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="w-4 h-4" />
              Mailchimp Connection
            </CardTitle>
            <CardDescription>
              Status of your Mailchimp API connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {apiConnected === null ? (
                  <div className="w-8 h-8 bg-secondary rounded-full animate-pulse" />
                ) : apiConnected ? (
                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-destructive" />
                  </div>
                )}
                <div>
                  <p className="font-medium">
                    {apiConnected === null
                      ? "Checking..."
                      : apiConnected
                        ? "Connected"
                        : "Disconnected"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {apiConnected
                      ? `${tags.length} tags loaded from audience`
                      : "Check your API credentials"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadTags}
                disabled={loading}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Association Tags */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tag className="w-4 h-4" />
              Association Tags
            </CardTitle>
            <CardDescription>
              Tags mapped to your associations for SMS targeting
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-secondary/30 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {ASSOCIATIONS.map((assoc) => {
                  const tag = associationTags.find(
                    (t) =>
                      t.name.toUpperCase() === assoc.tag.toUpperCase()
                  );
                  return (
                    <div
                      key={assoc.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="w-2 h-8 rounded-full"
                          style={{ backgroundColor: assoc.accent }}
                        />
                        <div>
                          <p className="font-medium text-sm">{assoc.tag}</p>
                          <p className="text-xs text-muted-foreground">
                            {assoc.name}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {tag ? (
                          <>
                            <p className="text-sm font-bold tabular-nums">
                              {tag.member_count.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              members
                            </p>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-yellow-400">
                            Not found
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Other Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Other Tags ({otherTags.length})
            </CardTitle>
            <CardDescription>
              Additional tags available for exclusion filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-20 bg-secondary/30 rounded-lg animate-pulse" />
            ) : otherTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No additional tags found
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {otherTags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="text-xs">
                    {tag.name}
                    <Separator
                      orientation="vertical"
                      className="mx-1.5 h-3"
                    />
                    <span className="text-muted-foreground tabular-nums">
                      {tag.member_count}
                    </span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
