import mailchimp from "@mailchimp/mailchimp_marketing";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const mailchimpTransactional = require("@mailchimp/mailchimp_transactional");
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

function isSmsConfigured(): boolean {
  return !!(
    process.env.MAILCHIMP_TRANSACTIONAL_KEY && process.env.SMS_FROM_NUMBER
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getTransactionalClient(): any {
  return mailchimpTransactional(process.env.MAILCHIMP_TRANSACTIONAL_KEY);
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

// ─── Fetch Audience Members with Phone Numbers ──────────────

interface AudienceMember {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
}

async function fetchAudienceMembers(
  audienceId: string,
  includeTagNames: string[],
  excludeTagNames: string[]
): Promise<AudienceMember[]> {
  const client = getClient();
  const members: AudienceMember[] = [];

  // Build segment conditions for tag filtering
  let segmentId: number | null = null;
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
      const seg = (await client.lists.createSegment(audienceId, {
        name: `_sms_send_${Date.now()}`,
        options: {
          match: includeTagNames.length > 1 ? "any" : "all",
          conditions,
        },
      })) as MailchimpSegment;
      segmentId = seg.id;
    }
  }

  // Paginate through all members
  let offset = 0;
  const batchSize = 500;

  while (true) {
    let response;
    if (segmentId) {
      response = (await client.lists.getSegmentMembersList(
        audienceId,
        segmentId.toString(),
        { count: batchSize, offset, fields: "members.email_address,members.merge_fields,members.status" }
      )) as { members: Array<{ email_address: string; merge_fields: Record<string, string>; status: string }> };
    } else {
      response = (await client.lists.getListMembersInfo(audienceId, {
        count: batchSize,
        offset,
        status: "subscribed",
        fields: "members.email_address,members.merge_fields,members.status",
      })) as { members: Array<{ email_address: string; merge_fields: Record<string, string>; status: string }> };
    }

    if (!response.members || response.members.length === 0) break;

    for (const m of response.members) {
      if (m.status !== "subscribed") continue;
      const phone = m.merge_fields?.PHONE || m.merge_fields?.SMS || m.merge_fields?.MMERGE4 || "";
      if (phone) {
        members.push({
          email: m.email_address,
          phone: normalizePhone(phone),
          firstName: m.merge_fields?.FNAME || "",
          lastName: m.merge_fields?.LNAME || "",
        });
      }
    }

    if (response.members.length < batchSize) break;
    offset += batchSize;
  }

  // Clean up temp segment
  if (segmentId) {
    try {
      await client.lists.deleteSegment(audienceId, segmentId.toString());
    } catch {
      console.warn("Failed to delete send segment:", segmentId);
    }
  }

  return members;
}

/** Normalize phone to E.164 format */
function normalizePhone(phone: string): string {
  // Strip everything except digits and leading +
  const digits = phone.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return `+1${digits}`; // US numbers
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

// ─── Send SMS via Transactional API ─────────────────────────

export async function sendSmsCampaign(
  audienceIds: string[],
  message: string,
  title: string,
  includeTagNames: string[],
  excludeTagNames: string[]
): Promise<{ sent: number; failed: number; total: number }> {
  if (!isConfigured()) {
    const result = sendMockCampaign(audienceIds, message, title, includeTagNames, excludeTagNames);
    return { sent: result.recipientCount, failed: 0, total: result.recipientCount };
  }

  if (!isSmsConfigured()) {
    throw new Error(
      "SMS not configured. Set MAILCHIMP_TRANSACTIONAL_KEY and SMS_FROM_NUMBER environment variables."
    );
  }

  const transactional = getTransactionalClient();
  const fromNumber = process.env.SMS_FROM_NUMBER!;

  // Collect all phone numbers from selected audiences
  const allMembers: AudienceMember[] = [];
  for (const audienceId of audienceIds) {
    const members = await fetchAudienceMembers(audienceId, includeTagNames, excludeTagNames);
    allMembers.push(...members);
  }

  // Deduplicate by phone number
  const seen = new Set<string>();
  const uniqueMembers = allMembers.filter((m) => {
    if (seen.has(m.phone)) return false;
    seen.add(m.phone);
    return true;
  });

  console.log(
    `[SMS SEND] Sending "${title}" to ${uniqueMembers.length} phone numbers from ${fromNumber}`
  );

  let sent = 0;
  let failed = 0;

  // Send SMS to each recipient
  for (const member of uniqueMembers) {
    // Replace merge fields in message
    let personalizedMessage = message
      .replace(/\*\|FNAME\|\*/g, member.firstName)
      .replace(/\*\|LNAME\|\*/g, member.lastName)
      .replace(/\*\|EMAIL\|\*/g, member.email)
      .replace(/\*\|PHONE\|\*/g, member.phone);

    try {
      await transactional.messages.sendSms({
        message: {
          to: member.phone,
          from: fromNumber,
          text: personalizedMessage,
          consent: "recurring",
        },
      });
      sent++;
    } catch (err: unknown) {
      failed++;
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[SMS SEND] Failed to send to ${member.phone}: ${errMsg}`);
    }
  }

  console.log(
    `[SMS SEND] Complete — Sent: ${sent}, Failed: ${failed}, Total: ${uniqueMembers.length}`
  );

  return { sent, failed, total: uniqueMembers.length };
}

// ─── Campaign History ───────────────────────────────────────

export type { MailchimpCampaign };

export async function fetchCampaignHistory(
  count: number = 20
): Promise<MailchimpCampaign[]> {
  if (!isConfigured()) {
    return getMockCampaignHistory().slice(0, count) as MailchimpCampaign[];
  }

  // For now, return mock history since Transactional SMS doesn't have
  // a campaign history like the Marketing API does.
  // Real SMS tracking would come from Transactional API message search.
  return getMockCampaignHistory().slice(0, count) as MailchimpCampaign[];
}

export async function fetchCampaignById(
  id: string
): Promise<MailchimpCampaign | null> {
  if (!isConfigured()) {
    const mock = getMockCampaignById(id);
    return mock ? (mock as MailchimpCampaign) : null;
  }

  const mock = getMockCampaignById(id);
  return mock ? (mock as MailchimpCampaign) : null;
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
