"use client";

import { cn } from "@/lib/utils";
import { Users, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AssociationCardProps {
  id: string;
  tag: string;
  name: string;
  accent: string;
  memberCount?: number;
  lastSmsDate?: string | null;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: (id: string) => void;
  onSendSms?: (id: string) => void;
  compact?: boolean;
}

export function AssociationCard({
  id,
  tag,
  name,
  accent,
  memberCount,
  lastSmsDate,
  selected = false,
  selectable = false,
  onSelect,
  onSendSms,
  compact = false,
}: AssociationCardProps) {
  const handleClick = () => {
    if (selectable && onSelect) {
      onSelect(id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "relative rounded-xl border transition-all duration-200",
        selectable && "cursor-pointer",
        selected
          ? "border-2 shadow-lg"
          : "border-border hover:border-border/80",
        !selected && selectable && "hover:shadow-md",
        compact ? "p-4" : "p-5"
      )}
      style={{
        borderColor: selected ? accent : undefined,
        boxShadow: selected ? `0 0 20px ${accent}20` : undefined,
      }}
    >
      {/* Accent bar at top */}
      <div
        className="absolute top-0 left-4 right-4 h-0.5 rounded-b-full"
        style={{ backgroundColor: accent }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-md"
              style={{
                backgroundColor: `${accent}20`,
                color: accent,
              }}
            >
              {tag}
            </span>
            {selected && (
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: accent, color: "#0f1219" }}
              >
                ✓
              </div>
            )}
          </div>

          <h3
            className={cn(
              "font-semibold leading-tight",
              compact ? "text-sm" : "text-base"
            )}
          >
            {name}
          </h3>

          {!compact && (
            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {memberCount !== undefined ? memberCount.toLocaleString() : "—"}{" "}
                  members
                </span>
              </div>
              {lastSmsDate && (
                <div className="text-xs">
                  Last SMS: {new Date(lastSmsDate).toLocaleDateString()}
                </div>
              )}
            </div>
          )}

          {compact && memberCount !== undefined && (
            <p className="text-xs text-muted-foreground mt-1">
              {memberCount.toLocaleString()} members
            </p>
          )}
        </div>

        {onSendSms && !compact && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onSendSms(id);
            }}
            className="shrink-0"
            style={{ borderColor: `${accent}40`, color: accent }}
          >
            <Send className="w-3.5 h-3.5 mr-1" />
            Send SMS
          </Button>
        )}
      </div>
    </div>
  );
}
