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
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  label?: string;
  placeholder?: string;
}

export function TagSelector({
  tags,
  selectedIds,
  onSelectionChange,
  label = "Select tags",
  placeholder = "Search tags...",
}: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectedTags = tags.filter((t) => selectedIds.includes(t.id));

  function toggleTag(tagId: number) {
    if (selectedIds.includes(tagId)) {
      onSelectionChange(selectedIds.filter((id) => id !== tagId));
    } else {
      onSelectionChange([...selectedIds, tagId]);
    }
  }

  function removeTag(tagId: number) {
    onSelectionChange(selectedIds.filter((id) => id !== tagId));
  }

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
              className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-lg"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
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
            {selectedIds.length === 0
              ? "Select tags..."
              : `${selectedIds.length} selected`}
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
                  const isSelected = selectedIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-2 py-1 text-xs rounded transition-colors",
                        isSelected
                          ? "text-primary"
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
