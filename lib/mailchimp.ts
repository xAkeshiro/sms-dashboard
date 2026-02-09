import mailchimp from "@mailchimp/mailchimp_marketing";
import {
  getMockTags,
  getMockSegmentCount,
  sendMockCampaign,
  getMockCampaignHistory,
  getMockCampaignById,
} from "./mock-data";
import type { MailchimpCampaign } from "./types";

let initialized = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MailchimpClient = any;

function isConfigured(): boolean {
  return !!(
    process.env.MAILCHIMP_API_KEY &&
    process.env.MAILCHIMP_SERVER_PREFIX &&
    process.env.MAILCHIMP_AUDIENCE_ID
  );
}

function getClient(): MailchimpClient {
  if (!initialized) {
    mailchimp.setConfig({
      apiKey: process.env.MAILCHIMP_API_KEY,
      server: process.env.MAILCHIMP_SERVER_PREFIX,
    });
    initialized = true;
  }
  return mailchimp;
}

function getAudienceId(): string {
  const id = process.env.MAILCHIMP_AUDIENCE_ID;
  if (!id) throw new Error("MAILCHIMP_AUDIENCE_ID is not set");
  return id;
}

export interface MailchimpTag {
  id: number;
  name: string;
  member_count: number;
}

export interface MailchimpSegment {
  id: number;
  name: string;
  member_count: number;
}

export type { MailchimpCampaign };

// Tag cache
let tagCache: MailchimpTag[] | null = null;
let tagCacheTime = 0;
const TAG_CACHE_TTL = 5 * 60 * 1000;

export async function fetchAllTags(): Promise<MailchimpTag[]> {
  if (!isConfigured()) {
    return getMockTags();
  }

  const now = Date.now();
  if (tagCache && now - tagCacheTime < TAG_CACHE_TTL) {
    return tagCache;
  }

  const client = getClient();
  const audienceId = getAudienceId();

  const response = (await client.lists.listSegments(audienceId, {
    type: "static",
    count: 1000,
  })) as { segments: Array<{ id: number; name: string; member_count: number }> };

  const tags: MailchimpTag[] = response.segments.map((s) => ({
    id: s.id,
    name: s.name,
    member_count: s.member_count,
  }));

  tagCache = tags;
  tagCacheTime = now;
  return tags;
}

export function clearTagCache(): void {
  tagCache = null;
  tagCacheTime = 0;
}

export async function createSegment(
  name: string,
  includeTags: number[],
  excludeTags: number[]
): Promise<MailchimpSegment> {
  if (!isConfigured()) {
    const count = getMockSegmentCount(includeTags, excludeTags);
    return { id: Date.now(), name, member_count: count };
  }

  const client = getClient();
  const audienceId = getAudienceId();

  const conditions: Record<string, unknown>[] = [];

  for (const tagId of includeTags) {
    conditions.push({
      condition_type: "StaticSegment",
      field: "static_segment",
      op: "static_is",
      value: tagId,
    });
  }

  for (const tagId of excludeTags) {
    conditions.push({
      condition_type: "StaticSegment",
      field: "static_segment",
      op: "static_not",
      value: tagId,
    });
  }

  const response = (await client.lists.createSegment(audienceId, {
    name,
    options: {
      match: includeTags.length > 1 ? "any" : "all",
      conditions,
    },
  })) as MailchimpSegment;

  return {
    id: response.id,
    name: response.name,
    member_count: response.member_count,
  };
}

export async function previewSegmentCount(
  includeTags: number[],
  excludeTags: number[]
): Promise<number> {
  if (!isConfigured()) {
    return getMockSegmentCount(includeTags, excludeTags);
  }

  const timestamp = Date.now();
  const segment = await createSegment(
    `_preview_${timestamp}`,
    includeTags,
    excludeTags
  );

  const count = segment.member_count;

  try {
    const client = getClient();
    const audienceId = getAudienceId();
    await client.lists.deleteSegment(audienceId, segment.id.toString());
  } catch {
    console.warn("Failed to delete preview segment:", segment.id);
  }

  return count;
}

export async function createAndSendSmsCampaign(
  _segmentId: number,
  message: string,
  title: string,
  includeTags?: number[],
  excludeTags?: number[]
): Promise<{ campaignId: string; status: string; recipientCount?: number }> {
  if (!isConfigured()) {
    const result = sendMockCampaign(
      message,
      title,
      includeTags || [],
      excludeTags || []
    );
    return {
      campaignId: result.campaignId,
      status: "sent",
      recipientCount: result.recipientCount,
    };
  }

  const client = getClient();
  const audienceId = getAudienceId();

  const campaign = (await client.campaigns.create({
    type: "plaintext",
    recipients: {
      list_id: audienceId,
      segment_opts: {
        saved_segment_id: _segmentId,
      },
    },
    settings: {
      subject_line: title,
      title: title,
      from_name: "SMS Admin",
      reply_to: "noreply@example.com",
    },
  })) as { id: string };

  await client.campaigns.setContent(campaign.id, {
    plain_text: message,
  });

  await client.campaigns.send(campaign.id);

  return { campaignId: campaign.id, status: "sent" };
}

export async function fetchCampaignHistory(
  count: number = 20
): Promise<MailchimpCampaign[]> {
  if (!isConfigured()) {
    return getMockCampaignHistory().slice(0, count) as MailchimpCampaign[];
  }

  const client = getClient();
  const audienceId = getAudienceId();

  const response = (await client.campaigns.list({
    list_id: audienceId,
    count,
    sort_field: "send_time",
    sort_dir: "DESC",
  })) as { campaigns: MailchimpCampaign[] };

  return response.campaigns || [];
}

export async function fetchCampaignById(
  id: string
): Promise<MailchimpCampaign | null> {
  if (!isConfigured()) {
    const mock = getMockCampaignById(id);
    return mock ? (mock as MailchimpCampaign) : null;
  }

  try {
    const client = getClient();
    const campaign = (await client.campaigns.get(id)) as MailchimpCampaign;
    return campaign;
  } catch {
    return null;
  }
}

export async function pingMailchimp(): Promise<boolean> {
  if (!isConfigured()) {
    return true;
  }

  try {
    const client = getClient();
    await client.ping.get();
    return true;
  } catch {
    return false;
  }
}
