import mailchimp from "@mailchimp/mailchimp_marketing";

let initialized = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MailchimpClient = any;

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

export interface MailchimpCampaign {
  id: string;
  type: string;
  status: string;
  send_time: string | null;
  settings: {
    subject_line: string;
    title: string;
  };
  recipients: {
    list_id: string;
    segment_text: string;
    recipient_count: number;
  };
  content_type?: string;
}

// Tag cache to avoid repeated API calls
let tagCache: MailchimpTag[] | null = null;
let tagCacheTime = 0;
const TAG_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function fetchAllTags(): Promise<MailchimpTag[]> {
  const now = Date.now();
  if (tagCache && now - tagCacheTime < TAG_CACHE_TTL) {
    return tagCache;
  }

  const client = getClient();
  const audienceId = getAudienceId();

  // Use listSegments to get static segments (tags) with type=static and count up to 1000
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
  const client = getClient();
  const audienceId = getAudienceId();

  const conditions: Record<string, unknown>[] = [];

  // Include conditions - use "any" match if multiple associations
  for (const tagId of includeTags) {
    conditions.push({
      condition_type: "StaticSegment",
      field: "static_segment",
      op: "static_is",
      value: tagId,
    });
  }

  // Exclude conditions
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
  // Create a temporary segment to get the count
  const timestamp = Date.now();
  const segment = await createSegment(
    `_preview_${timestamp}`,
    includeTags,
    excludeTags
  );

  const count = segment.member_count;

  // Delete the preview segment
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
  segmentId: number,
  message: string,
  title: string
): Promise<{ campaignId: string; status: string }> {
  const client = getClient();
  const audienceId = getAudienceId();

  // Create campaign
  const campaign = (await client.campaigns.create({
    type: "plaintext",
    recipients: {
      list_id: audienceId,
      segment_opts: {
        saved_segment_id: segmentId,
      },
    },
    settings: {
      subject_line: title,
      title: title,
      from_name: "SMS Admin",
      reply_to: "noreply@example.com",
    },
  })) as { id: string };

  // Set campaign content
  await client.campaigns.setContent(campaign.id, {
    plain_text: message,
  });

  // Send campaign
  await client.campaigns.send(campaign.id);

  return { campaignId: campaign.id, status: "sent" };
}

export async function fetchCampaignHistory(
  count: number = 20
): Promise<MailchimpCampaign[]> {
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

export async function pingMailchimp(): Promise<boolean> {
  try {
    const client = getClient();
    await client.ping.get();
    return true;
  } catch {
    return false;
  }
}
