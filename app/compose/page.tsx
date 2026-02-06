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
import { ASSOCIATIONS } from "@/lib/constants";
import {
  ChevronRight,
  ChevronLeft,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface TagData {
  id: number;
  name: string;
  member_count: number;
}

function ComposeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [selectedAssociations, setSelectedAssociations] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<TagData[]>([]);
  const [excludedTagIds, setExcludedTagIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [countError, setCountError] = useState<string | null>(null);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const assoc = searchParams.get("association");
    if (assoc && ASSOCIATIONS.some((a) => a.id === assoc)) {
      setSelectedAssociations([assoc]);
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadTags() {
      try {
        const res = await fetch("/api/tags");
        if (!res.ok) throw new Error("Failed to fetch tags");
        const data = await res.json();
        setAllTags(data.tags || []);
      } catch {
        // handled in UI
      } finally {
        setTagsLoading(false);
      }
    }
    loadTags();
  }, []);

  const getSelectedTagIds = useCallback((): number[] => {
    return selectedAssociations
      .map((id) => {
        const assoc = ASSOCIATIONS.find((a) => a.id === id);
        if (!assoc) return null;
        const tag = allTags.find(
          (t) => t.name.toUpperCase() === assoc.tag.toUpperCase()
        );
        return tag?.id ?? null;
      })
      .filter((id): id is number => id !== null);
  }, [selectedAssociations, allTags]);

  const exclusionTags = allTags.filter(
    (t) => !ASSOCIATIONS.some((a) => a.tag.toUpperCase() === t.name.toUpperCase())
  );

  const fetchCount = useCallback(async () => {
    const includeIds = getSelectedTagIds();
    if (includeIds.length === 0) {
      setRecipientCount(null);
      return;
    }
    setCountLoading(true);
    setCountError(null);
    try {
      const params = new URLSearchParams();
      params.set("include", includeIds.join(","));
      if (excludedTagIds.length > 0) params.set("exclude", excludedTagIds.join(","));
      const res = await fetch(`/api/segments/preview?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setRecipientCount(data.count);
    } catch {
      setCountError("Unable to fetch count");
    } finally {
      setCountLoading(false);
    }
  }, [getSelectedTagIds, excludedTagIds]);

  useEffect(() => {
    if (step >= 2) fetchCount();
  }, [step, fetchCount]);

  function toggleAssociation(id: string) {
    setSelectedAssociations((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }

  function getSelectedNames(): string[] {
    return selectedAssociations
      .map((id) => ASSOCIATIONS.find((a) => a.id === id)?.tag || id)
      .sort();
  }

  function getExcludedNames(): string[] {
    return excludedTagIds
      .map((id) => allTags.find((t) => t.id === id)?.name || String(id))
      .sort();
  }

  async function handleSend() {
    setSending(true);
    try {
      const includeIds = getSelectedTagIds();
      const res = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          title: `SMS to ${getSelectedNames().join(", ")}`,
          includeTags: includeIds,
          excludeTags: excludedTagIds,
        }),
      });
      const data = await res.json();
      setSendResult({
        success: res.ok,
        message: res.ok
          ? `Sent to ${data.recipientCount} recipients.`
          : data.error || "Failed to send",
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
    { n: 1, label: "Recipients" },
    { n: 2, label: "Exclusions" },
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
                  setSelectedAssociations([]);
                  setExcludedTagIds([]);
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
                  {step > s.n ? "✓" : s.n}
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

        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Select one or more associations.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {ASSOCIATIONS.map((assoc) => (
                <AssociationCard
                  key={assoc.id}
                  id={assoc.id}
                  tag={assoc.tag}
                  name={assoc.name}
                  accent={assoc.accent}
                  memberCount={
                    allTags.find((t) => t.name.toUpperCase() === assoc.tag.toUpperCase())
                      ?.member_count
                  }
                  selected={selectedAssociations.includes(assoc.id)}
                  selectable
                  onSelect={toggleAssociation}
                  compact
                />
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <Button
                size="sm"
                onClick={() => setStep(2)}
                disabled={selectedAssociations.length === 0}
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Optionally exclude contacts by tag.
              </p>
              <RecipientCounter count={recipientCount} loading={countLoading} error={countError} />
            </div>

            {tagsLoading ? (
              <div className="h-16 bg-secondary/20 rounded-lg animate-pulse" />
            ) : (
              <TagSelector
                tags={exclusionTags}
                selectedIds={excludedTagIds}
                onSelectionChange={setExcludedTagIds}
                label="Exclude by tag"
              />
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

        {/* Step 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <RecipientCounter count={recipientCount} loading={countLoading} error={countError} />
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

        {/* Step 4 */}
        {step === 4 && (
          <div className="space-y-6 animate-slide-up">
            <div className="rounded-xl bg-card border border-border/30 p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">{getSelectedNames().join(", ")}</span>
              </div>
              {getExcludedNames().length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Excluding</span>
                  <span className="text-muted-foreground">{getExcludedNames().join(", ")}</span>
                </div>
              )}
              <div className="h-px bg-border/20" />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Recipients</span>
                <span className="font-semibold tabular-nums text-primary">
                  {recipientCount !== null ? recipientCount.toLocaleString() : "—"}
                </span>
              </div>
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
              associations={getSelectedNames()}
              exclusions={getExcludedNames()}
              recipientCount={recipientCount}
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
