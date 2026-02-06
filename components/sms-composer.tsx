"use client";

import { Textarea } from "@/components/ui/textarea";
import { SMS_CHAR_LIMIT, MERGE_FIELDS } from "@/lib/constants";

interface SmsComposerProps {
  message: string;
  onMessageChange: (message: string) => void;
}

export function SmsComposer({ message, onMessageChange }: SmsComposerProps) {
  const charCount = message.length;
  const segmentCount = Math.ceil(charCount / SMS_CHAR_LIMIT) || 1;
  const charsInCurrentSegment =
    charCount % SMS_CHAR_LIMIT || (charCount > 0 ? SMS_CHAR_LIMIT : 0);

  function insertMergeField(field: string) {
    onMessageChange(message + field);
  }

  return (
    <div className="space-y-3">
      <Textarea
        placeholder="Type your SMS message..."
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        rows={5}
        className="resize-none text-sm leading-relaxed bg-secondary/30 border-border/50 focus:border-primary/30"
      />

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          {charCount}/{SMS_CHAR_LIMIT * segmentCount} &middot; {segmentCount}{" "}
          segment{segmentCount !== 1 ? "s" : ""}
        </span>
        <span>{SMS_CHAR_LIMIT - charsInCurrentSegment} remaining</span>
      </div>

      <div className="h-px bg-border/50 relative">
        <div
          className="h-px bg-primary transition-all duration-200 absolute inset-y-0 left-0"
          style={{
            width: `${(charsInCurrentSegment / SMS_CHAR_LIMIT) * 100}%`,
          }}
        />
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">
          Insert:
        </span>
        {MERGE_FIELDS.map((field) => (
          <button
            key={field.value}
            type="button"
            onClick={() => insertMergeField(field.value)}
            className="text-[11px] text-muted-foreground hover:text-primary px-1.5 py-0.5 rounded border border-border/50 hover:border-primary/30 transition-colors"
          >
            {field.label}
          </button>
        ))}
      </div>

      {message && (
        <div className="pt-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Preview
          </p>
          <div className="rounded-lg bg-secondary/30 p-4">
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
              {message}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
