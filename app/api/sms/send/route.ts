import { NextRequest, NextResponse } from "next/server";
import { sendSmsCampaign } from "@/lib/mailchimp";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, title, audienceIds, includeTagNames, excludeTagNames } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (!audienceIds || !Array.isArray(audienceIds) || audienceIds.length === 0) {
      return NextResponse.json(
        { error: "At least one audience is required" },
        { status: 400 }
      );
    }

    const campaignTitle = title || `SMS Campaign - ${new Date().toISOString()}`;

    console.log(
      `[SMS SEND] Sending to ${audienceIds.length} audience(s) - Title: "${campaignTitle}", Message: "${message.substring(0, 50)}..."`
    );

    const result = await sendSmsCampaign(
      audienceIds,
      message,
      campaignTitle,
      includeTagNames || [],
      excludeTagNames || []
    );

    console.log(
      `[SMS SEND] Complete — Sent: ${result.sent}, Failed: ${result.failed}, Total: ${result.total}`
    );

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      recipientCount: result.total,
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
