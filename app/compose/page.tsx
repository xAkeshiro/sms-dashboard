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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  const [selectedAssociations, setSelectedAssociations] = useState<string[]>(
    []
  );
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

  // Pre-select association from URL params
  useEffect(() => {
    const assoc = searchParams.get("association");
    if (assoc && ASSOCIATIONS.some((a) => a.id === assoc)) {
      setSelectedAssociations([assoc]);
    }
  }, [searchParams]);

  // Fetch all tags
  useEffect(() => {
    async function loadTags() {
      try {
        const res = await fetch("/api/tags");
        if (!res.ok) throw new Error("Failed to fetch tags");
        const data = await res.json();
        setAllTags(data.tags || []);
      } catch {
        // Tags will be empty, handled in UI
      } finally {
        setTagsLoading(false);
      }
    }
    loadTags();
  }, []);

  // Get tag IDs for selected associations
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

  // Exclusion tags: all tags except association tags
  const exclusionTags = allTags.filter(
    (t) =>
      !ASSOCIATIONS.some(
        (a) => a.tag.toUpperCase() === t.name.toUpperCase()
      )
  );

  // Fetch recipient count when selections change
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
      if (excludedTagIds.length > 0) {
        params.set("exclude", excludedTagIds.join(","));
      }

      const res = await fetch(`/api/segments/preview?${params}`);
      if (!res.ok) throw new Error("Failed to preview count");
      const data = await res.json();
      setRecipientCount(data.count);
    } catch {
      setCountError("Unable to fetch recipient count");
    } finally {
      setCountLoading(false);
    }
  }, [getSelectedTagIds, excludedTagIds]);

  useEffect(() => {
    if (step >= 2) {
      fetchCount();
    }
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
      if (res.ok) {
        setSendResult({
          success: true,
          message: `SMS campaign sent successfully to ${data.recipientCount} recipients.`,
        });
        setShowConfirm(false);
      } else {
        setSendResult({
          success: false,
          message: data.error || "Failed to send SMS campaign",
        });
        setShowConfirm(false);
      }
    } catch {
      setSendResult({
        success: false,
        message: "Network error. Please try again.",
      });
      setShowConfirm(false);
    } finally {
      setSending(false);
    }
  }

  const canProceedStep1 = selectedAssociations.length > 0;
  const canProceedStep3 = message.trim().length > 0;

  const steps = [
    { number: 1, label: "Select Association(s)" },
    { number: 2, label: "Exclusions" },
    { number: 3, label: "Compose Message" },
    { number: 4, label: "Review & Send" },
  ];

  // Show success/error result
  if (sendResult) {
    return (
      <>
        <Nav />
        <main className="pt-20 pb-12 px-4 sm:px-6 max-w-3xl mx-auto">
          <Card className="mt-8">
            <CardContent className="p-8 text-center">
              {sendResult.success ? (
                <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto mb-4" />
              ) : (
                <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              )}
              <h2 className="text-xl font-bold mb-2">
                {sendResult.success ? "SMS Sent!" : "Send Failed"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {sendResult.message}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push("/history")}
                >
                  View History
                </Button>
                <Button
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
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="pt-20 pb-12 px-4 sm:px-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Compose SMS</h1>
          <p className="text-muted-foreground mt-1">
            Send SMS messages to association members
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {steps.map((s, i) => (
            <div key={s.number} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  if (s.number <= step) setStep(s.number);
                }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  step === s.number
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : step > s.number
                      ? "bg-green-500/10 text-green-400"
                      : "text-muted-foreground"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === s.number
                      ? "bg-primary text-primary-foreground"
                      : step > s.number
                        ? "bg-green-500 text-white"
                        : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step > s.number ? "✓" : s.number}
                </span>
                <span className="hidden sm:block">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground mx-1 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Select Associations */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Select Association(s)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Choose one or more associations to target with your SMS message.
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
                      allTags.find(
                        (t) =>
                          t.name.toUpperCase() === assoc.tag.toUpperCase()
                      )?.member_count
                    }
                    selected={selectedAssociations.includes(assoc.id)}
                    selectable
                    onSelect={toggleAssociation}
                    compact
                  />
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                >
                  Next: Exclusions
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Exclusions */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>Exclusions (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Optionally exclude contacts that have specific tags. This helps
                you avoid sending to inactive members, VIPs, or other groups.
              </p>

              <RecipientCounter
                count={recipientCount}
                loading={countLoading}
                error={countError}
              />

              <div className="mt-4">
                {tagsLoading ? (
                  <div className="h-20 bg-secondary/30 rounded-lg animate-pulse" />
                ) : (
                  <TagSelector
                    tags={exclusionTags}
                    selectedIds={excludedTagIds}
                    onSelectionChange={setExcludedTagIds}
                    label="Exclude contacts with these tags"
                    placeholder="Search exclusion tags..."
                  />
                )}
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Next: Compose
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Compose */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <RecipientCounter
                  count={recipientCount}
                  loading={countLoading}
                  error={countError}
                />
              </div>

              <SmsComposer message={message} onMessageChange={setMessage} />

              <Separator className="my-6" />

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={!canProceedStep3}
                >
                  Next: Review
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Send */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle>Review & Send</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Summary */}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Sending To
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {getSelectedNames().map((name) => (
                        <Badge key={name} variant="secondary">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      Excluding
                    </p>
                    {getExcludedNames().length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {getExcludedNames().map((name) => (
                          <Badge key={name} variant="outline">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">None</p>
                    )}
                  </div>
                </div>

                <RecipientCounter
                  count={recipientCount}
                  loading={countLoading}
                  error={countError}
                />

                <Separator />

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Message
                  </p>
                  <div className="bg-secondary/50 rounded-xl p-4 border border-border">
                    <div className="bg-primary/10 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {message.length} characters,{" "}
                    {Math.ceil(message.length / 160) || 1} SMS segment(s)
                  </p>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Edit Message
                  </Button>
                  <Button onClick={() => setShowConfirm(true)}>
                    <Send className="w-4 h-4 mr-1" />
                    Send SMS
                  </Button>
                </div>
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
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}

export default function ComposePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <ComposeContent />
    </Suspense>
  );
}
