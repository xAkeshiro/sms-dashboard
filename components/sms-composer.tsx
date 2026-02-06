"use client";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SMS_CHAR_LIMIT, MERGE_FIELDS } from "@/lib/constants";

interface SmsComposerProps {
  message: string;
  onMessageChange: (message: string) => void;
}

export function SmsComposer({ message, onMessageChange }: SmsComposerProps) {
  const charCount = message.length;
  const segmentCount = Math.ceil(charCount / SMS_CHAR_LIMIT) || 1;
  const charsInCurrentSegment = charCount % SMS_CHAR_LIMIT || (charCount > 0 ? SMS_CHAR_LIMIT : 0);

  function insertMergeField(field: string) {
    onMessageChange(message + field);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Message Body</label>
        <Textarea
          placeholder="Type your SMS message here..."
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={5}
          className="bg-secondary/30 resize-none text-base leading-relaxed"
        />
      </div>

      {/* Character counter */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground">
            {charCount} character{charCount !== 1 ? "s" : ""}
          </span>
          <Badge variant="outline" className="font-mono text-xs">
            {segmentCount} SMS segment{segmentCount !== 1 ? "s" : ""}
          </Badge>
        </div>
        <span className="text-muted-foreground text-xs">
          {SMS_CHAR_LIMIT - charsInCurrentSegment} chars remaining in segment
        </span>
      </div>

      {/* Progress bar for current segment */}
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-200"
          style={{
            width: `${(charsInCurrentSegment / SMS_CHAR_LIMIT) * 100}%`,
          }}
        />
      </div>

      {/* Merge fields */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-2 block">
          Insert Merge Field
        </label>
        <div className="flex flex-wrap gap-1.5">
          {MERGE_FIELDS.map((field) => (
            <Button
              key={field.value}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => insertMergeField(field.value)}
              className="text-xs h-7"
            >
              {field.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Message preview */}
      {message && (
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Preview
          </label>
          <div className="bg-secondary/50 rounded-xl p-4 border border-border">
            <div className="bg-primary/10 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
              <p className="text-sm whitespace-pre-wrap break-words">
                {message}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
