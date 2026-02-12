// Color mapping for known audience names (matched case-insensitively)
export const AUDIENCE_COLORS: Record<string, string> = {
  GLTA: "#C9A84C",
  "Sustainable Travel": "#4C8BC9",
  FLA: "#4CC9A8",
  GCLA: "#C94C6E",
};

export const DEFAULT_ACCENT = "#71717a";

// SMS-enabled audiences (filter to only these). Set to null to show all.
export const SMS_ENABLED_AUDIENCES: string[] | null = ["GCLA"];

export function getAudienceAccent(name: string): string {
  const key = Object.keys(AUDIENCE_COLORS).find(
    (k) => k.toLowerCase() === name.toLowerCase()
  );
  return key ? AUDIENCE_COLORS[key] : DEFAULT_ACCENT;
}

export const SMS_CHAR_LIMIT = 160;

export const MERGE_FIELDS = [
  { label: "First Name", value: "*|FNAME|*" },
  { label: "Last Name", value: "*|LNAME|*" },
  { label: "Email", value: "*|EMAIL|*" },
  { label: "Phone", value: "*|PHONE|*" },
] as const;
