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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Send } from "lucide-react";

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
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-primary" />
            Confirm SMS Send
          </DialogTitle>
          <DialogDescription>
            Please review the details below before sending. This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Sending To
            </p>
            <div className="flex flex-wrap gap-1.5">
              {associations.map((a) => (
                <Badge key={a} variant="secondary">
                  {a}
                </Badge>
              ))}
            </div>
          </div>

          {exclusions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
                Excluding
              </p>
              <div className="flex flex-wrap gap-1.5">
                {exclusions.map((e) => (
                  <Badge key={e} variant="outline">
                    {e}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Estimated Recipients
            </p>
            <p className="text-xl font-bold">
              {recipientCount !== null ? recipientCount.toLocaleString() : "—"}
            </p>
          </div>

          <Separator />

          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Message Preview
            </p>
            <div className="bg-secondary/50 rounded-lg p-3 border border-border">
              <p className="text-sm whitespace-pre-wrap break-words">
                {message}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={sending}>
            {sending ? (
              "Sending..."
            ) : (
              <>
                <Send className="w-4 h-4 mr-1" />
                Send SMS Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
