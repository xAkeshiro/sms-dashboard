import { NextRequest, NextResponse } from "next/server";
import { createSegment, createAndSendSmsCampaign } from "@/lib/mailchimp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, title, includeTags, excludeTags } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!includeTags || !Array.isArray(includeTags) || includeTags.length === 0) {
      return NextResponse.json(
        { error: "At least one association tag is required" },
        { status: 400 }
      );
    }

    const campaignTitle = title || `SMS Campaign - ${new Date().toISOString()}`;

    // Create a segment for targeting
    const timestamp = Date.now();
    const segment = await createSegment(
      `sms_segment_${timestamp}`,
      includeTags,
      excludeTags || []
    );

    console.log(
      `[SMS SEND] Creating campaign - Title: "${campaignTitle}", Segment: ${segment.id}, Recipients: ${segment.member_count}, Message: "${message.substring(0, 50)}..."`
    );

    // Create and send the campaign
    const result = await createAndSendSmsCampaign(
      segment.id,
      message,
      campaignTitle
    );

    console.log(
      `[SMS SEND] Campaign sent - ID: ${result.campaignId}, Status: ${result.status}`
    );

    return NextResponse.json({
      success: true,
      campaignId: result.campaignId,
      status: result.status,
      recipientCount: segment.member_count,
    });
  } catch (error) {
    console.error("[SMS SEND] Failed:", error);
    return NextResponse.json(
      {
        error: "Failed to send SMS campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
