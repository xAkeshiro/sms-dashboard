import { NextRequest, NextResponse } from "next/server";
import { previewSegmentCount } from "@/lib/mailchimp";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeParam = searchParams.get("include");
    const excludeParam = searchParams.get("exclude");

    if (!includeParam) {
      return NextResponse.json(
        { error: "At least one include tag ID is required" },
        { status: 400 }
      );
    }

    const includeTags = includeParam.split(",").map(Number).filter(Boolean);
    const excludeTags = excludeParam
      ? excludeParam.split(",").map(Number).filter(Boolean)
      : [];

    if (includeTags.length === 0) {
      return NextResponse.json(
        { error: "Invalid include tag IDs" },
        { status: 400 }
      );
    }

    const count = await previewSegmentCount(includeTags, excludeTags);
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to preview segment:", error);
    return NextResponse.json(
      { error: "Failed to preview segment count" },
      { status: 500 }
    );
  }
}
