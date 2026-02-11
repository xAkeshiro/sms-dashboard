import { NextRequest, NextResponse } from "next/server";
import { fetchTagsForAudience } from "@/lib/mailchimp";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audienceId = searchParams.get("audienceId");

    if (!audienceId) {
      return NextResponse.json(
        { error: "audienceId query parameter is required" },
        { status: 400 }
      );
    }

    const tags = await fetchTagsForAudience(audienceId);
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags from Mailchimp" },
      { status: 500 }
    );
  }
}
