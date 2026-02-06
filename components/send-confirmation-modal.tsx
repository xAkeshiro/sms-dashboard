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
  associations: string[];
  exclusions: string[];
  recipientCount: number | null;
  message: string;
  sending: boolean;
}

export function SendConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  associations,
  exclusions,
  recipientCount,
  message,
  sending,
}: SendConfirmationModalProps) {
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
              <span className="font-medium">{associations.join(", ")}</span>
            </div>

            {exclusions.length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Excluding</span>
                <span className="text-muted-foreground">
                  {exclusions.join(", ")}
                </span>
              </div>
            )}

            <div className="h-px bg-border/20" />

            <div className="flex justify-between">
              <span className="text-muted-foreground">Recipients</span>
              <span className="font-bold tabular-nums text-primary">
                {recipientCount !== null ? recipientCount.toLocaleString() : "—"}
              </span>
            </div>
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
