import { NextResponse } from "next/server";
import { fetchAllTags } from "@/lib/mailchimp";

export async function GET() {
  try {
    const tags = await fetchAllTags();
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags from Mailchimp" },
      { status: 500 }
    );
  }
}
