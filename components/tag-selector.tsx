"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";

interface Tag {
  id: number;
  name: string;
  member_count: number;
}

interface TagSelectorProps {
  tags: Tag[];
  selectedNames: string[];
  onToggle: (tagName: string) => void;
  label?: string;
  placeholder?: string;
  mode?: "include" | "exclude";
}

export function TagSelector({
  tags,
  selectedNames,
  onToggle,
  label = "Select tags",
  placeholder = "Search tags...",
  mode = "include",
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedTags = tags.filter((t) => selectedNames.includes(t.name));

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-xs text-muted-foreground">{label}</label>
      )}

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedTags.map((tag) => (
            <span
              key={tag.id}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs border px-2.5 py-1 rounded-lg",
                mode === "include"
                  ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                  : "bg-primary/10 text-primary border-primary/20"
              )}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => onToggle(tag.name)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between rounded-lg border border-border/40 bg-card px-3 py-2.5 text-xs transition-all duration-200 hover:border-border/60",
            isOpen && "border-primary/30 shadow-sm"
          )}
        >
          <span className="text-muted-foreground">
            {selectedNames.length === 0
              ? "Select tags..."
              : `${selectedNames.length} selected`}
          </span>
          <ChevronDown
            className={cn(
              "w-3.5 h-3.5 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1.5 w-full rounded-xl border border-border/40 bg-popover shadow-xl shadow-black/20 overflow-hidden">
            <div className="p-2.5 border-b border-border/30">
              <input
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-xs px-1 py-0.5 outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            <div className="max-h-40 overflow-y-auto p-1">
              {filteredTags.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2 text-center">
                  No tags found
                </p>
              ) : (
                filteredTags.map((tag) => {
                  const isSelected = selectedNames.includes(tag.name);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => onToggle(tag.name)}
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-1 text-xs rounded transition-colors",
                        isSelected
                          ? mode === "include"
                            ? "text-emerald-400"
                            : "text-primary"
                          : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <span>{tag.name}</span>
                      <span className="text-muted-foreground tabular-nums">
                        {tag.member_count}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
