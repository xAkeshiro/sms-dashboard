"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { AssociationCard } from "@/components/association-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ASSOCIATIONS } from "@/lib/constants";
import { Users, Send, MessageSquare, Activity } from "lucide-react";

interface TagData {
  id: number;
  name: string;
  member_count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTags() {
      try {
        const res = await fetch("/api/tags");
        if (!res.ok) throw new Error("Failed to fetch tags");
        const data = await res.json();
        setTags(data.tags || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadTags();
  }, []);

  function getTagCount(tagName: string): number | undefined {
    const tag = tags.find(
      (t) => t.name.toUpperCase() === tagName.toUpperCase()
    );
    return tag?.member_count;
  }

  const totalContacts = ASSOCIATIONS.reduce(
    (sum, a) => sum + (getTagCount(a.tag) || 0),
    0
  );

  function handleSendSms(id: string) {
    router.push(`/compose?association=${id}`);
  }

  return (
    <>
      <Nav />
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Welcome header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back. Manage your association SMS communications.
          </p>
        </div>

        {/* Error state */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm">
            {error} — Make sure your Mailchimp API credentials are configured.
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Total Contacts
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {loading ? "..." : totalContacts.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Associations
                </p>
                <p className="text-xl font-bold">{ASSOCIATIONS.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Send className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Available Tags
                </p>
                <p className="text-xl font-bold tabular-nums">
                  {loading ? "..." : tags.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">
                  Status
                </p>
                <p className="text-xl font-bold">
                  {loading ? "..." : error ? "Error" : "Connected"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Association cards */}
        <div className="mb-6">
          <CardHeader className="px-0">
            <CardTitle>Associations</CardTitle>
          </CardHeader>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-32 bg-secondary/30 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {ASSOCIATIONS.map((association) => (
              <AssociationCard
                key={association.id}
                id={association.id}
                tag={association.tag}
                name={association.name}
                accent={association.accent}
                memberCount={getTagCount(association.tag)}
                onSendSms={handleSendSms}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
