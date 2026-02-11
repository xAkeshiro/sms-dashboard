import type { MailchimpAudience } from "./types";

// ─── Mock Audiences ─────────────────────────────────────────
export const MOCK_AUDIENCES: MailchimpAudience[] = [
  { id: "aud_glta", name: "GLTA", member_count: 1247 },
  { id: "aud_sustainable", name: "Sustainable Travel", member_count: 892 },
  { id: "aud_fla", name: "FLA", member_count: 634 },
  { id: "aud_gcla", name: "GCLA", member_count: 518 },
];

// ─── Mock Tags (per audience) ───────────────────────────────
export interface MockTag {
  id: number;
  name: string;
  member_count: number;
}

const TAG_TEMPLATES: { name: string; ratio: number }[] = [
  { name: "VIP Members", ratio: 0.25 },
  { name: "New Members 2025", ratio: 0.15 },
  { name: "Event Attendees", ratio: 0.35 },
  { name: "Fleet Owners", ratio: 0.22 },
  { name: "Annual Gala 2025", ratio: 0.12 },
];

// Cache generated tags so they stay consistent within a session
const tagCacheMap = new Map<string, MockTag[]>();

function buildTagsForAudience(audienceId: string): MockTag[] {
  const audience = MOCK_AUDIENCES.find((a) => a.id === audienceId);
  if (!audience) return [];
  const audIdx = MOCK_AUDIENCES.indexOf(audience);
  return TAG_TEMPLATES.map((tmpl, i) => ({
    id: 2000 + audIdx * 100 + i,
    name: tmpl.name,
    member_count: Math.floor(audience.member_count * tmpl.ratio),
  }));
}

export function getMockTagsForAudience(audienceId: string): MockTag[] {
  if (!tagCacheMap.has(audienceId)) {
    tagCacheMap.set(audienceId, buildTagsForAudience(audienceId));
  }
  return tagCacheMap.get(audienceId)!;
}

export function getMockAudiences(): MailchimpAudience[] {
  return MOCK_AUDIENCES;
}

// ─── Mock Campaigns ─────────────────────────────────────────
export interface MockCampaign {
  id: string;
  status: string;
  send_time: string | null;
  settings: {
    subject_line: string;
    title: string;
  };
  recipients: {
    list_id?: string;
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
    recipients: { list_id: "aud_glta", recipient_count: 1247, segment_text: "GLTA" },
    tracking: { delivered: 1218, bounced: 22, failed: 7, opted_out: 3, delivery_rate: 97.7 },
  },
  {
    id: "camp_002",
    status: "sent",
    send_time: new Date(now - DAY * 3).toISOString(),
    settings: {
      subject_line: "SMS to Sustainable Travel, GLTA",
      title: "Industry Update - Q4 Report",
    },
    recipients: { recipient_count: 2139, segment_text: "Sustainable Travel, GLTA" },
    tracking: { delivered: 2098, bounced: 31, failed: 10, opted_out: 5, delivery_rate: 98.1 },
  },
  {
    id: "camp_003",
    status: "sent",
    send_time: new Date(now - DAY * 5).toISOString(),
    settings: {
      subject_line: "SMS to FLA",
      title: "FLA Membership Renewal Notice",
    },
    recipients: { list_id: "aud_fla", recipient_count: 634, segment_text: "FLA" },
    tracking: { delivered: 621, bounced: 9, failed: 4, opted_out: 1, delivery_rate: 97.9 },
  },
  {
    id: "camp_004",
    status: "sent",
    send_time: new Date(now - DAY * 7).toISOString(),
    settings: {
      subject_line: "SMS to GCLA",
      title: "GCLA Board Meeting - Location Update",
    },
    recipients: { list_id: "aud_gcla", recipient_count: 518, segment_text: "GCLA" },
    tracking: { delivered: 507, bounced: 8, failed: 3, opted_out: 0, delivery_rate: 97.9 },
  },
  {
    id: "camp_005",
    status: "sent",
    send_time: new Date(now - DAY * 10).toISOString(),
    settings: {
      subject_line: "SMS to All Audiences",
      title: "RAS International - Holiday Greetings",
    },
    recipients: { recipient_count: 3291, segment_text: "All Audiences" },
    tracking: { delivered: 3224, bounced: 48, failed: 19, opted_out: 8, delivery_rate: 97.9 },
  },
  {
    id: "camp_006",
    status: "sent",
    send_time: new Date(now - DAY * 14).toISOString(),
    settings: {
      subject_line: "SMS to Sustainable Travel",
      title: "Sustainable Travel Conference Early Bird",
    },
    recipients: { list_id: "aud_sustainable", recipient_count: 892, segment_text: "Sustainable Travel" },
    tracking: { delivered: 874, bounced: 14, failed: 4, opted_out: 2, delivery_rate: 97.9 },
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
    tracking: { delivered: 1128, bounced: 18, failed: 6, opted_out: 3, delivery_rate: 97.9 },
  },
  {
    id: "camp_008",
    status: "sent",
    send_time: new Date(now - DAY * 28).toISOString(),
    settings: {
      subject_line: "SMS to GLTA",
      title: "GLTA November Mixer RSVP",
    },
    recipients: { list_id: "aud_glta", recipient_count: 1247, segment_text: "GLTA" },
    tracking: { delivered: 1219, bounced: 21, failed: 7, opted_out: 4, delivery_rate: 97.8 },
  },
];

// Mutable array to store campaigns sent during this session
const sessionCampaigns: MockCampaign[] = [];

// ─── Mock API Functions ─────────────────────────────────────

export function getMockSegmentCount(
  audienceId: string,
  includeTagNames: string[],
  excludeTagNames: string[]
): number {
  const audience = MOCK_AUDIENCES.find((a) => a.id === audienceId);
  if (!audience) return 0;
  const tags = getMockTagsForAudience(audienceId);

  let total: number;
  if (includeTagNames.length > 0) {
    // When include tags specified, total = sum of those tags (simulates union)
    total = 0;
    for (const name of includeTagNames) {
      const tag = tags.find(
        (t) => t.name.toLowerCase() === name.toLowerCase()
      );
      if (tag) total += tag.member_count;
    }
  } else {
    total = audience.member_count;
  }

  if (excludeTagNames.length > 0) {
    for (const name of excludeTagNames) {
      const tag = tags.find(
        (t) => t.name.toLowerCase() === name.toLowerCase()
      );
      if (tag) total = Math.max(0, total - Math.floor(tag.member_count * 0.15));
    }
  }
  return total;
}

export function sendMockCampaign(
  audienceIds: string[],
  message: string,
  title: string,
  includeTagNames: string[],
  excludeTagNames: string[]
): { campaignId: string; recipientCount: number } {
  let totalRecipients = 0;
  const audienceNames: string[] = [];

  for (const audienceId of audienceIds) {
    const count = getMockSegmentCount(audienceId, includeTagNames, excludeTagNames);
    totalRecipients += count;
    const audience = MOCK_AUDIENCES.find((a) => a.id === audienceId);
    if (audience) audienceNames.push(audience.name);
  }

  const campaignId = `camp_${Date.now()}`;
  const segmentText = audienceNames.join(", ");

  const delivered = Math.floor(totalRecipients * 0.978);
  const bounced = Math.floor(totalRecipients * 0.015);
  const failed = totalRecipients - delivered - bounced;

  const campaign: MockCampaign = {
    id: campaignId,
    status: "sent",
    send_time: new Date().toISOString(),
    settings: {
      subject_line: `SMS to ${segmentText}`,
      title,
    },
    recipients: { recipient_count: totalRecipients, segment_text: segmentText },
    tracking: {
      delivered,
      bounced,
      failed: Math.max(0, failed),
      opted_out: Math.floor(Math.random() * 3),
      delivery_rate:
        totalRecipients > 0
          ? parseFloat(((delivered / totalRecipients) * 100).toFixed(1))
          : 0,
    },
  };

  sessionCampaigns.unshift(campaign);
  return { campaignId, recipientCount: totalRecipients };
}

export function getMockCampaignHistory(): MockCampaign[] {
  return [...sessionCampaigns, ...MOCK_CAMPAIGNS];
}

export function getMockCampaignById(id: string): MockCampaign | undefined {
  return [...sessionCampaigns, ...MOCK_CAMPAIGNS].find((c) => c.id === id);
}
