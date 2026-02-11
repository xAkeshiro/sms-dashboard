"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { AssociationCard } from "@/components/association-card";
import { getAudienceAccent } from "@/lib/constants";

interface Audience {
  id: string;
  name: string;
  member_count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAudiences() {
      try {
        const res = await fetch("/api/audiences");
        if (!res.ok) throw new Error("Failed to fetch audiences");
        const data = await res.json();
        setAudiences(data.audiences || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadAudiences();
  }, []);

  const totalContacts = audiences.reduce(
    (sum, a) => sum + a.member_count,
    0
  );

  function handleSendSms(id: string) {
    router.push(`/compose?audience=${id}`);
  }

  return (
    <>
      <Nav />
      <main className="pt-20 pb-12 px-6 max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage association communications
            </p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-card border border-border/30 px-5 py-3 text-right">
              <p className="text-2xl font-bold tabular-nums leading-none">
                {loading ? "..." : totalContacts.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                Total contacts
              </p>
            </div>
            <div className="rounded-xl bg-card border border-border/30 px-5 py-3 text-right">
              <p className="text-2xl font-bold tabular-nums leading-none">
                {loading ? "..." : audiences.length}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                Audiences
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 py-3 px-4 rounded-lg border border-destructive/20 text-destructive text-xs">
            {error} — Check Mailchimp API credentials.
          </div>
        )}

        <div className="mb-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Audiences
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-[80px] rounded-xl animate-shimmer"
              />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {audiences.map((audience) => (
              <AssociationCard
                key={audience.id}
                id={audience.id}
                name={audience.name}
                accent={getAudienceAccent(audience.name)}
                memberCount={audience.member_count}
                onSendSms={handleSendSms}
              />
            ))}
          </div>
        )}
      </main>
    </>
  );
}
