import { NextRequest, NextResponse } from "next/server";
import { fetchCampaignHistory } from "@/lib/mailchimp";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const count = parseInt(searchParams.get("count") || "20", 10);

    const campaigns = await fetchCampaignHistory(count);
    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error("Failed to fetch campaign history:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign history" },
      { status: 500 }
    );
  }
}
