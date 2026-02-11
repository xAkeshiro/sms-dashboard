import mailchimp from "@mailchimp/mailchimp_marketing";
import {
  getMockAudiences,
  getMockTagsForAudience,
  getMockSegmentCount,
  sendMockCampaign,
  getMockCampaignHistory,
  getMockCampaignById,
} from "./mock-data";
import type { MailchimpAudience, MailchimpCampaign } from "./types";

let initialized = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MailchimpClient = any;

function isConfigured(): boolean {
  return !!(
    process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_SERVER_PREFIX
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

// ─── Audiences ──────────────────────────────────────────────

export async function fetchAudiences(): Promise<MailchimpAudience[]> {
  if (!isConfigured()) {
    return getMockAudiences();
  }

  const client = getClient();
  const response = (await client.lists.getAllLists({
    count: 100,
    fields: [
      "lists.id",
      "lists.name",
      "lists.stats.member_count",
    ],
  })) as {
    lists: Array<{
      id: string;
      name: string;
      stats: { member_count: number };
    }>;
  };

  return response.lists.map((l) => ({
    id: l.id,
    name: l.name,
    member_count: l.stats.member_count,
  }));
}

// ─── Tags (per audience) ────────────────────────────────────

export interface MailchimpTag {
  id: number;
  name: string;
  member_count: number;
}

// Per-audience tag cache
const tagCache = new Map<string, { tags: MailchimpTag[]; time: number }>();
const TAG_CACHE_TTL = 5 * 60 * 1000;

export async function fetchTagsForAudience(
  audienceId: string
): Promise<MailchimpTag[]> {
  if (!isConfigured()) {
    return getMockTagsForAudience(audienceId);
  }

  const now = Date.now();
  const cached = tagCache.get(audienceId);
  if (cached && now - cached.time < TAG_CACHE_TTL) {
    return cached.tags;
  }

  const client = getClient();
  const response = (await client.lists.listSegments(audienceId, {
    type: "static",
    count: 1000,
  })) as {
    segments: Array<{ id: number; name: string; member_count: number }>;
  };

  const tags: MailchimpTag[] = response.segments.map((s) => ({
    id: s.id,
    name: s.name,
    member_count: s.member_count,
  }));

  tagCache.set(audienceId, { tags, time: now });
  return tags;
}

export function clearTagCache(): void {
  tagCache.clear();
}

// ─── Segments & Preview ─────────────────────────────────────

export interface MailchimpSegment {
  id: number;
  name: string;
  member_count: number;
}

export async function previewSegmentCount(
  audienceId: string,
  includeTagNames: string[],
  excludeTagNames: string[]
): Promise<number> {
  if (!isConfigured()) {
    return getMockSegmentCount(audienceId, includeTagNames, excludeTagNames);
  }

  if (includeTagNames.length === 0 && excludeTagNames.length === 0) {
    const audiences = await fetchAudiences();
    const aud = audiences.find((a) => a.id === audienceId);
    return aud?.member_count ?? 0;
  }

  // Resolve tag names to IDs for this audience
  const tags = await fetchTagsForAudience(audienceId);

  const conditions: Record<string, unknown>[] = [];

  for (const name of includeTagNames) {
    const tag = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (tag) {
      conditions.push({
        condition_type: "StaticSegment",
        field: "static_segment",
        op: "static_is",
        value: tag.id,
      });
    }
  }

  for (const name of excludeTagNames) {
    const tag = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (tag) {
      conditions.push({
        condition_type: "StaticSegment",
        field: "static_segment",
        op: "static_not",
        value: tag.id,
      });
    }
  }

  if (conditions.length === 0) {
    const audiences = await fetchAudiences();
    const aud = audiences.find((a) => a.id === audienceId);
    return aud?.member_count ?? 0;
  }

  // Create a temporary segment
  const client = getClient();
  const timestamp = Date.now();
  const response = (await client.lists.createSegment(audienceId, {
    name: `_preview_${timestamp}`,
    options: {
      match: includeTagNames.length > 1 ? "any" : "all",
      conditions,
    },
  })) as MailchimpSegment;

  const count = response.member_count;

  try {
    await client.lists.deleteSegment(audienceId, response.id.toString());
  } catch {
    console.warn("Failed to delete preview segment:", response.id);
  }

  return count;
}

// ─── Send Campaign ──────────────────────────────────────────

export async function createAndSendCampaign(
  audienceId: string,
  message: string,
  title: string,
  includeTagNames: string[],
  excludeTagNames: string[]
): Promise<{ campaignId: string; status: string; recipientCount: number }> {
  if (!isConfigured()) {
    const result = sendMockCampaign([audienceId], message, title, includeTagNames, excludeTagNames);
    return { campaignId: result.campaignId, status: "sent", recipientCount: result.recipientCount };
  }

  const client = getClient();

  // Build segment options for inclusions and exclusions
  let segmentOpts: Record<string, unknown> | undefined;
  if (includeTagNames.length > 0 || excludeTagNames.length > 0) {
    const tags = await fetchTagsForAudience(audienceId);
    const conditions: Record<string, unknown>[] = [];

    for (const name of includeTagNames) {
      const tag = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
      if (tag) {
        conditions.push({
          condition_type: "StaticSegment",
          field: "static_segment",
          op: "static_is",
          value: tag.id,
        });
      }
    }

    for (const name of excludeTagNames) {
      const tag = tags.find((t) => t.name.toLowerCase() === name.toLowerCase());
      if (tag) {
        conditions.push({
          condition_type: "StaticSegment",
          field: "static_segment",
          op: "static_not",
          value: tag.id,
        });
      }
    }

    if (conditions.length > 0) {
      segmentOpts = {
        match: includeTagNames.length > 1 ? "any" : "all",
        conditions,
      };
    }
  }

  const recipients: Record<string, unknown> = { list_id: audienceId };
  if (segmentOpts) {
    recipients.segment_opts = segmentOpts;
  }

  const campaign = (await client.campaigns.create({
    type: "plaintext",
    recipients,
    settings: {
      subject_line: title,
      title,
      from_name: "RAS International",
      reply_to: "noreply@example.com",
    },
  })) as { id: string };

  await client.campaigns.setContent(campaign.id, { plain_text: message });
  await client.campaigns.send(campaign.id);

  // Get recipient count from campaign info
  const info = (await client.campaigns.get(campaign.id)) as {
    recipients: { recipient_count: number };
  };

  return {
    campaignId: campaign.id,
    status: "sent",
    recipientCount: info.recipients.recipient_count,
  };
}

/** Send to multiple audiences with the same message. Returns combined results. */
export async function sendToMultipleAudiences(
  audienceIds: string[],
  message: string,
  title: string,
  includeTagNames: string[],
  excludeTagNames: string[]
): Promise<{ campaignIds: string[]; totalRecipients: number }> {
  if (!isConfigured()) {
    const result = sendMockCampaign(audienceIds, message, title, includeTagNames, excludeTagNames);
    return { campaignIds: [result.campaignId], totalRecipients: result.recipientCount };
  }

  const results = await Promise.all(
    audienceIds.map((id) =>
      createAndSendCampaign(id, message, title, includeTagNames, excludeTagNames)
    )
  );

  return {
    campaignIds: results.map((r) => r.campaignId),
    totalRecipients: results.reduce((sum, r) => sum + r.recipientCount, 0),
  };
}

// ─── Campaign History ───────────────────────────────────────

export type { MailchimpCampaign };

export async function fetchCampaignHistory(
  count: number = 20
): Promise<MailchimpCampaign[]> {
  if (!isConfigured()) {
    return getMockCampaignHistory().slice(0, count) as MailchimpCampaign[];
  }

  const client = getClient();
  const response = (await client.campaigns.list({
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
