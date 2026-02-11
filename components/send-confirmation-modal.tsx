"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface SendConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  audiences: string[];
  includeTags: string[];
  excludeTags: string[];
  recipientCount: number | null;
  totalAudienceCount: number;
  message: string;
  sending: boolean;
}

export function SendConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  audiences,
  includeTags,
  excludeTags,
  recipientCount,
  totalAudienceCount,
  message,
  sending,
}: SendConfirmationModalProps) {
  const excluded =
    recipientCount !== null ? totalAudienceCount - recipientCount : null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Send</DialogTitle>
          <DialogDescription>
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-3 text-sm">
          <div className="rounded-xl bg-secondary/30 border border-border/20 p-4 space-y-2.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">To</span>
              <span className="font-medium">{audiences.join(", ")}</span>
            </div>

            {includeTags.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Only tags</span>
                <span className="text-emerald-400">
                  {includeTags.join(", ")}
                </span>
              </div>
            )}

            {excludeTags.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Excluding</span>
                <span className="text-muted-foreground">
                  {excludeTags.join(", ")}
                </span>
              </div>
            )}

            <div className="h-px bg-border/20" />

            <div className="flex justify-between">
              <span className="text-muted-foreground">Total in audience</span>
              <span className="tabular-nums text-muted-foreground">
                {totalAudienceCount.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sending to</span>
              <span className="font-bold tabular-nums text-primary">
                {recipientCount !== null ? recipientCount.toLocaleString() : "—"}
              </span>
            </div>
            {excluded != null && excluded > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Not receiving</span>
                <span className="tabular-nums text-muted-foreground">
                  {excluded.toLocaleString()}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl bg-card border border-border/30 p-4">
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={sending}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={sending} size="sm">
            {sending ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Send Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
