export const ASSOCIATIONS = [
  {
    id: "glta",
    tag: "GLTA",
    name: "Greater Limousine & Transportation Association",
    accent: "#C9A84C",
  },
  {
    id: "nlta",
    tag: "NLTA",
    name: "National Limousine & Transportation Association",
    accent: "#4C8BC9",
  },
  {
    id: "fla",
    tag: "FLA",
    name: "Florida Limousine Association",
    accent: "#4CC9A8",
  },
  {
    id: "gcla",
    tag: "GCLA",
    name: "Greater California Livery Association",
    accent: "#C94C6E",
  },
] as const;

export type AssociationId = (typeof ASSOCIATIONS)[number]["id"];
export type AssociationTag = (typeof ASSOCIATIONS)[number]["tag"];

export const SMS_CHAR_LIMIT = 160;

export const MERGE_FIELDS = [
  { label: "First Name", value: "*|FNAME|*" },
  { label: "Last Name", value: "*|LNAME|*" },
  { label: "Email", value: "*|EMAIL|*" },
  { label: "Phone", value: "*|PHONE|*" },
] as const;
