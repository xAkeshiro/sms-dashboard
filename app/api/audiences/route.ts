import { NextResponse } from "next/server";
import { fetchAudiences } from "@/lib/mailchimp";

export async function GET() {
  try {
    const audiences = await fetchAudiences();
    return NextResponse.json({ audiences });
  } catch (error) {
    console.error("Failed to fetch audiences:", error);
    return NextResponse.json(
      { error: "Failed to fetch audiences from Mailchimp" },
      { status: 500 }
    );
  }
}
