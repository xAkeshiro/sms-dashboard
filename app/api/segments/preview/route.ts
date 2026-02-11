import { NextRequest, NextResponse } from "next/server";
import { previewSegmentCount } from "@/lib/mailchimp";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audienceIds = searchParams.get("audienceIds");
    const includeTagNames = searchParams.get("includeTagNames");
    const excludeTagNames = searchParams.get("excludeTagNames");

    if (!audienceIds) {
      return NextResponse.json(
        { error: "audienceIds query parameter is required" },
        { status: 400 }
      );
    }

    const ids = audienceIds.split(",").filter(Boolean);
    const includeNames = includeTagNames
      ? includeTagNames.split(",").filter(Boolean)
      : [];
    const excludeNames = excludeTagNames
      ? excludeTagNames.split(",").filter(Boolean)
      : [];

    // Sum preview counts across all selected audiences
    const counts = await Promise.all(
      ids.map((id) => previewSegmentCount(id, includeNames, excludeNames))
    );
    const total = counts.reduce((sum, c) => sum + c, 0);

    return NextResponse.json({ count: total });
  } catch (error) {
    console.error("Failed to preview segment:", error);
    return NextResponse.json(
      { error: "Failed to preview segment count" },
      { status: 500 }
    );
  }
}
