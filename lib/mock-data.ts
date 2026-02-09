import { ASSOCIATIONS } from "./constants";

// ─── Mock Tags ───────────────────────────────────────────────
export interface MockTag {
  id: number;
  name: string;
  member_count: number;
}

export const MOCK_TAGS: MockTag[] = [
  { id: 1001, name: "GLTA", member_count: 1247 },
  { id: 1002, name: "NLTA", member_count: 892 },
  { id: 1003, name: "FLA", member_count: 634 },
  { id: 1004, name: "GCLA", member_count: 518 },
  { id: 2001, name: "VIP Members", member_count: 312 },
  { id: 2002, name: "New Members 2025", member_count: 189 },
  { id: 2003, name: "Event Attendees", member_count: 445 },
  { id: 2004, name: "Fleet Owners", member_count: 276 },
  { id: 2005, name: "Annual Gala 2025", member_count: 158 },
];

// ─── Mock Campaigns ──────────────────────────────────────────
export interface MockCampaign {
  id: string;
  status: string;
  send_time: string | null;
  settings: {
    subject_line: string;
    title: string;
  };
  recipients: {
    recipient_count: number;
    segment_text: string;
  };
  tracking: {
    delivered: number;
    bounced: number;
    failed: number;
    opted_out: number;
    delivery_rate: number;
  };
}

const now = Date.now();
const DAY = 86400000;

export const MOCK_CAMPAIGNS: MockCampaign[] = [
  {
    id: "camp_001",
    status: "sent",
    send_time: new Date(now - DAY * 1).toISOString(),
    settings: {
      subject_line: "SMS to GLTA",
      title: "GLTA Annual Gala Reminder",
    },
    recipients: { recipient_count: 1247, segment_text: "GLTA" },
    tracking: {
      delivered: 1218,
      bounced: 22,
      failed: 7,
      opted_out: 3,
      delivery_rate: 97.7,
    },
  },
  {
    id: "camp_002",
    status: "sent",
    send_time: new Date(now - DAY * 3).toISOString(),
    settings: {
      subject_line: "SMS to NLTA, GLTA",
      title: "Industry Update - Q4 Report",
    },
    recipients: { recipient_count: 2139, segment_text: "NLTA, GLTA" },
    tracking: {
      delivered: 2098,
      bounced: 31,
      failed: 10,
      opted_out: 5,
      delivery_rate: 98.1,
    },
  },
  {
    id: "camp_003",
    status: "sent",
    send_time: new Date(now - DAY * 5).toISOString(),
    settings: {
      subject_line: "SMS to FLA",
      title: "FLA Membership Renewal Notice",
    },
    recipients: { recipient_count: 634, segment_text: "FLA" },
    tracking: {
      delivered: 621,
      bounced: 9,
      failed: 4,
      opted_out: 1,
      delivery_rate: 97.9,
    },
  },
  {
    id: "camp_004",
    status: "sent",
    send_time: new Date(now - DAY * 7).toISOString(),
    settings: {
      subject_line: "SMS to GCLA",
      title: "GCLA Board Meeting - Location Update",
    },
    recipients: { recipient_count: 518, segment_text: "GCLA" },
    tracking: {
      delivered: 507,
      bounced: 8,
      failed: 3,
      opted_out: 0,
      delivery_rate: 97.9,
    },
  },
  {
    id: "camp_005",
    status: "sent",
    send_time: new Date(now - DAY * 10).toISOString(),
    settings: {
      subject_line: "SMS to GLTA, NLTA, FLA, GCLA",
      title: "RAS International - Holiday Greetings",
    },
    recipients: { recipient_count: 3291, segment_text: "All Associations" },
    tracking: {
      delivered: 3224,
      bounced: 48,
      failed: 19,
      opted_out: 8,
      delivery_rate: 97.9,
    },
  },
  {
    id: "camp_006",
    status: "sent",
    send_time: new Date(now - DAY * 14).toISOString(),
    settings: {
      subject_line: "SMS to NLTA",
      title: "NLTA Conference Early Bird Registration",
    },
    recipients: { recipient_count: 892, segment_text: "NLTA" },
    tracking: {
      delivered: 874,
      bounced: 14,
      failed: 4,
      opted_out: 2,
      delivery_rate: 97.9,
    },
  },
  {
    id: "camp_007",
    status: "sent",
    send_time: new Date(now - DAY * 21).toISOString(),
    settings: {
      subject_line: "SMS to FLA, GCLA",
      title: "Safety Compliance Update - New Regulations",
    },
    recipients: { recipient_count: 1152, segment_text: "FLA, GCLA" },
    tracking: {
      delivered: 1128,
      bounced: 18,
      failed: 6,
      opted_out: 3,
      delivery_rate: 97.9,
    },
  },
  {
    id: "camp_008",
    status: "sent",
    send_time: new Date(now - DAY * 28).toISOString(),
    settings: {
      subject_line: "SMS to GLTA",
      title: "GLTA November Mixer RSVP",
    },
    recipients: { recipient_count: 1247, segment_text: "GLTA" },
    tracking: {
      delivered: 1219,
      bounced: 21,
      failed: 7,
      opted_out: 4,
      delivery_rate: 97.8,
    },
  },
];

// Mutable array to store campaigns sent during this session
const sessionCampaigns: MockCampaign[] = [];

// ─── Mock API Functions ──────────────────────────────────────

export function getMockTags(): MockTag[] {
  return MOCK_TAGS;
}

export function getMockSegmentCount(
  includeTags: number[],
  excludeTags: number[]
): number {
  let total = 0;
  for (const tagId of includeTags) {
    const tag = MOCK_TAGS.find((t) => t.id === tagId);
    if (tag) total += tag.member_count;
  }
  // Subtract ~15% for each exclusion tag (simulate overlap)
  for (const tagId of excludeTags) {
    const tag = MOCK_TAGS.find((t) => t.id === tagId);
    if (tag) total = Math.max(0, total - Math.floor(tag.member_count * 0.15));
  }
  return total;
}

export function sendMockCampaign(
  message: string,
  title: string,
  includeTags: number[],
  excludeTags: number[]
): { campaignId: string; recipientCount: number } {
  const recipientCount = getMockSegmentCount(includeTags, excludeTags);
  const campaignId = `camp_${Date.now()}`;

  const tagNames = includeTags
    .map((id) => MOCK_TAGS.find((t) => t.id === id)?.name || `Tag ${id}`)
    .join(", ");

  const delivered = Math.floor(recipientCount * 0.978);
  const bounced = Math.floor(recipientCount * 0.015);
  const failed = recipientCount - delivered - bounced;

  const campaign: MockCampaign = {
    id: campaignId,
    status: "sent",
    send_time: new Date().toISOString(),
    settings: {
      subject_line: `SMS to ${tagNames}`,
      title,
    },
    recipients: { recipient_count: recipientCount, segment_text: tagNames },
    tracking: {
      delivered,
      bounced,
      failed: Math.max(0, failed),
      opted_out: Math.floor(Math.random() * 3),
      delivery_rate: parseFloat(((delivered / recipientCount) * 100).toFixed(1)),
    },
  };

  sessionCampaigns.unshift(campaign);
  return { campaignId, recipientCount };
}

export function getMockCampaignHistory(): MockCampaign[] {
  return [...sessionCampaigns, ...MOCK_CAMPAIGNS];
}

export function getMockCampaignById(id: string): MockCampaign | undefined {
  return [...sessionCampaigns, ...MOCK_CAMPAIGNS].find((c) => c.id === id);
}

// ─── Helper: resolve association tag IDs from ASSOCIATIONS ───
export function getAssociationTagId(assocTag: string): number | undefined {
  const mockTag = MOCK_TAGS.find(
    (t) => t.name.toUpperCase() === assocTag.toUpperCase()
  );
  return mockTag?.id;
}
