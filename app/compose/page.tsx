"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Nav } from "@/components/nav";
import { AssociationCard } from "@/components/association-card";
import { TagSelector } from "@/components/tag-selector";
import { SmsComposer } from "@/components/sms-composer";
import { RecipientCounter } from "@/components/recipient-counter";
import { SendConfirmationModal } from "@/components/send-confirmation-modal";
import { Button } from "@/components/ui/button";
import { getAudienceAccent } from "@/lib/constants";
import {
  ChevronRight,
  ChevronLeft,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

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

function ComposeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [audiencesLoading, setAudiencesLoading] = useState(true);
  const [selectedAudienceIds, setSelectedAudienceIds] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<TagData[]>([]);
  const [includedTagNames, setIncludedTagNames] = useState<string[]>([]);
  const [excludedTagNames, setExcludedTagNames] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [countError, setCountError] = useState<string | null>(null);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Load audiences
  useEffect(() => {
    async function loadAudiences() {
      try {
        const res = await fetch("/api/audiences");
        if (!res.ok) throw new Error("Failed to fetch audiences");
        const data = await res.json();
        setAudiences(data.audiences || []);
      } catch {
        // handled in UI
      } finally {
        setAudiencesLoading(false);
      }
    }
    loadAudiences();
  }, []);

  // Pre-select audience from URL param, or auto-select if only one audience
  useEffect(() => {
    if (audiences.length === 0) return;
    const audId = searchParams.get("audience");
    if (audId && audiences.some((a) => a.id === audId)) {
      setSelectedAudienceIds([audId]);
    } else if (audiences.length === 1) {
      setSelectedAudienceIds([audiences[0].id]);
    }
  }, [searchParams, audiences]);

  // Load tags when selected audiences change and we move to step 2
  const loadTagsForSelectedAudiences = useCallback(async () => {
    if (selectedAudienceIds.length === 0) {
      setAvailableTags([]);
      return;
    }
    setTagsLoading(true);
    try {
      const allTags: TagData[] = [];
      const seenNames = new Set<string>();

      for (const audienceId of selectedAudienceIds) {
        const res = await fetch(`/api/tags?audienceId=${audienceId}`);
        if (!res.ok) continue;
        const data = await res.json();
        for (const tag of data.tags || []) {
          const key = tag.name.toLowerCase();
          if (!seenNames.has(key)) {
            seenNames.add(key);
            allTags.push(tag);
          }
        }
      }
      setAvailableTags(allTags);
    } catch {
      // handled
    } finally {
      setTagsLoading(false);
    }
  }, [selectedAudienceIds]);

  useEffect(() => {
    if (step === 2) loadTagsForSelectedAudiences();
  }, [step, loadTagsForSelectedAudiences]);

  // Fetch recipient preview count
  const fetchCount = useCallback(async () => {
    if (selectedAudienceIds.length === 0) {
      setRecipientCount(null);
      return;
    }
    setCountLoading(true);
    setCountError(null);
    try {
      const params = new URLSearchParams();
      params.set("audienceIds", selectedAudienceIds.join(","));
      if (includedTagNames.length > 0) {
        params.set("includeTagNames", includedTagNames.join(","));
      }
      if (excludedTagNames.length > 0) {
        params.set("excludeTagNames", excludedTagNames.join(","));
      }
      const res = await fetch(`/api/segments/preview?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRecipientCount(data.count);
    } catch {
      setCountError("Unable to fetch count");
    } finally {
      setCountLoading(false);
    }
  }, [selectedAudienceIds, includedTagNames, excludedTagNames]);

  useEffect(() => {
    if (step >= 2) fetchCount();
  }, [step, fetchCount]);

  // Total audience size (before any tag filtering)
  const totalAudienceCount = selectedAudienceIds.reduce((sum, id) => {
    const aud = audiences.find((a) => a.id === id);
    return sum + (aud?.member_count ?? 0);
  }, 0);

  function toggleAudience(id: string) {
    setSelectedAudienceIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  function getSelectedAudienceNames(): string[] {
    return selectedAudienceIds
      .map((id) => audiences.find((a) => a.id === id)?.name || id)
      .sort();
  }

  // Toggle tag names for include/exclude (by name, not ID)
  function toggleIncludeTag(tagName: string) {
    setIncludedTagNames((prev) =>
      prev.includes(tagName) ? prev.filter((n) => n !== tagName) : [...prev, tagName]
    );
  }

  function toggleExcludeTag(tagName: string) {
    setExcludedTagNames((prev) =>
      prev.includes(tagName) ? prev.filter((n) => n !== tagName) : [...prev, tagName]
    );
  }

  async function handleSend() {
    setSending(true);
    try {
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          title: `SMS to ${getSelectedAudienceNames().join(", ")}`,
          audienceIds: selectedAudienceIds,
          includeTagNames: includedTagNames,
          excludeTagNames: excludedTagNames,
        }),
      });
      const data = await res.json();
      setSendResult({
        success: res.ok,
        message: res.ok
          ? `Sent ${data.sent} of ${data.recipientCount} SMS messages.${data.failed > 0 ? ` ${data.failed} failed.` : ""}`
          : data.details || data.error || "Failed to send",
      });
      setShowConfirm(false);
    } catch {
      setSendResult({ success: false, message: "Network error." });
      setShowConfirm(false);
    } finally {
      setSending(false);
    }
  }

  const steps = [
    { n: 1, label: "Audiences" },
    { n: 2, label: "Filter" },
    { n: 3, label: "Compose" },
    { n: 4, label: "Review" },
  ];

  if (sendResult) {
    return (
      <>
        <Nav />
        <main className="pt-20 pb-12 px-6 max-w-2xl mx-auto">
          <div className="mt-16 text-center animate-slide-up">
            <div className={`w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center ${
              sendResult.success ? "bg-emerald-400/10" : "bg-destructive/10"
            }`}>
              {sendResult.success ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              ) : (
                <AlertCircle className="w-7 h-7 text-destructive" />
              )}
            </div>
            <h2 className="text-base font-semibold mb-1">
              {sendResult.success ? "Message Sent" : "Send Failed"}
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              {sendResult.message}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="ghost" size="sm" onClick={() => router.push("/history")}>
                History
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSendResult(null);
                  setStep(1);
                  setSelectedAudienceIds([]);
                  setIncludedTagNames([]);
                  setExcludedTagNames([]);
                  setMessage("");
                  setRecipientCount(null);
                }}
              >
                Send Another
              </Button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="pt-20 pb-12 px-6 max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight">Compose</h1>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-px mb-8">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center">
              <button
                type="button"
                onClick={() => s.n <= step && setStep(s.n)}
                className={`flex items-center gap-2 text-xs font-medium transition-all duration-200 ${
                  step === s.n
                    ? "text-primary"
                    : step > s.n
                      ? "text-foreground"
                      : "text-muted-foreground/40"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all duration-200 ${
                    step === s.n
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : step > s.n
                        ? "bg-secondary text-foreground border border-border/50"
                        : "border border-border/30 text-muted-foreground/40"
                  }`}
                >
                  {step > s.n ? "\u2713" : s.n}
                </span>
                <span className="hidden sm:block">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-8 h-px mx-2 transition-colors ${
                  step > s.n ? "bg-border" : "bg-border/30"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 — Select Audiences */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Select one or more audiences to send to.
            </p>
            {audiencesLoading ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-[72px] rounded-xl animate-shimmer" />
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {audiences.map((audience) => (
                  <AssociationCard
                    key={audience.id}
                    id={audience.id}
                    name={audience.name}
                    accent={getAudienceAccent(audience.name)}
                    memberCount={audience.member_count}
                    selected={selectedAudienceIds.includes(audience.id)}
                    selectable
                    onSelect={toggleAudience}
                    compact
                  />
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                onClick={() => setStep(2)}
                disabled={selectedAudienceIds.length === 0}
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Filter by Tags */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Optionally filter recipients by tags within selected audiences.
              </p>
              <RecipientCounter count={recipientCount} totalAudienceCount={totalAudienceCount || null} loading={countLoading} error={countError} />
            </div>

            {tagsLoading ? (
              <div className="h-16 bg-secondary/20 rounded-lg animate-pulse" />
            ) : availableTags.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4">
                No tags found in selected audiences.
              </p>
            ) : (
              <>
                <TagSelector
                  tags={availableTags}
                  selectedNames={includedTagNames}
                  onToggle={toggleIncludeTag}
                  label="Only send to contacts with these tags"
                  placeholder="Search tags to include..."
                  mode="include"
                />

                <div className="h-px bg-border/20" />

                <TagSelector
                  tags={availableTags}
                  selectedNames={excludedTagNames}
                  onToggle={toggleExcludeTag}
                  label="Exclude contacts with these tags"
                  placeholder="Search tags to exclude..."
                  mode="exclude"
                />
              </>
            )}

            <div className="h-px bg-border/30" />
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>
              <Button size="sm" onClick={() => setStep(3)}>
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Compose */}
        {step === 3 && (
          <div className="space-y-4">
            <RecipientCounter count={recipientCount} totalAudienceCount={totalAudienceCount || null} loading={countLoading} error={countError} />
            <SmsComposer message={message} onMessageChange={setMessage} />
            <div className="h-px bg-border/30" />
            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Back
              </Button>
              <Button size="sm" onClick={() => setStep(4)} disabled={!message.trim()}>
                Review
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 4 && (
          <div className="space-y-6 animate-slide-up">
            <div className="rounded-xl bg-card border border-border/30 p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">{getSelectedAudienceNames().join(", ")}</span>
              </div>
              {includedTagNames.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Only tags</span>
                  <span className="text-emerald-400">{includedTagNames.join(", ")}</span>
                </div>
              )}
              {excludedTagNames.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Excluding</span>
                  <span className="text-muted-foreground">{excludedTagNames.join(", ")}</span>
                </div>
              )}
              <div className="h-px bg-border/20" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total in audience</span>
                <span className="tabular-nums text-muted-foreground">
                  {totalAudienceCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sending to</span>
                <span className="font-semibold tabular-nums text-primary">
                  {recipientCount !== null ? recipientCount.toLocaleString() : "—"}
                </span>
              </div>
              {recipientCount !== null && totalAudienceCount - recipientCount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Not receiving</span>
                  <span className="tabular-nums text-muted-foreground">
                    {(totalAudienceCount - recipientCount).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Message
              </p>
              <div className="rounded-xl bg-card border border-border/30 p-5">
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                  {message}
                </p>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                {message.length} chars &middot; {Math.ceil(message.length / 160) || 1} segment(s)
              </p>
            </div>

            <div className="h-px bg-border/30" />

            <div className="flex justify-between">
              <Button variant="ghost" size="sm" onClick={() => setStep(3)}>
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>
              <Button size="sm" onClick={() => setShowConfirm(true)}>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send
              </Button>
            </div>

            <SendConfirmationModal
              open={showConfirm}
              onOpenChange={setShowConfirm}
              onConfirm={handleSend}
              audiences={getSelectedAudienceNames()}
              includeTags={includedTagNames}
              excludeTags={excludedTagNames}
              recipientCount={recipientCount}
              totalAudienceCount={totalAudienceCount}
              message={message}
              sending={sending}
            />
          </div>
        )}
      </main>
    </>
  );
}

export default function ComposePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Loading...</span>
        </div>
      }
    >
      <ComposeContent />
    </Suspense>
  );
}
