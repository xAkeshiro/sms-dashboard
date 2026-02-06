"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}

      {/* Selected tags display */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => removeTag(tag.id)}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Dropdown trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full flex items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors hover:bg-secondary/50",
            isOpen && "ring-1 ring-ring"
          )}
        >
          <span className="text-muted-foreground">
            {selectedIds.length === 0
              ? "Click to select tags..."
              : `${selectedIds.length} tag${selectedIds.length > 1 ? "s" : ""} selected`}
          </span>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Dropdown panel */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
            <div className="p-2 border-b border-border">
              <input
                type="text"
                placeholder={placeholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm px-2 py-1 outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
            <div className="max-h-48 overflow-y-auto p-1">
              {filteredTags.length === 0 ? (
                <p className="text-sm text-muted-foreground p-2 text-center">
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
                        "w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-md transition-colors",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-secondary"
                      )}
                    >
                      <span>{tag.name}</span>
                      <span className="text-xs text-muted-foreground">
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

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
