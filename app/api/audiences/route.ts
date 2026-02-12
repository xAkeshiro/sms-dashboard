import { NextResponse } from "next/server";
import { fetchAudiences } from "@/lib/mailchimp";
import { SMS_ENABLED_AUDIENCES } from "@/lib/constants";

export async function GET() {
  try {
    let audiences = await fetchAudiences();

    // Filter to SMS-enabled audiences only
    if (SMS_ENABLED_AUDIENCES) {
      const allowed = SMS_ENABLED_AUDIENCES.map((n) => n.toLowerCase());
      audiences = audiences.filter((a) =>
        allowed.some((name) => a.name.toLowerCase().includes(name))
      );
    }

    return NextResponse.json({ audiences });
  } catch (error) {
    console.error("Failed to fetch audiences:", error);
    return NextResponse.json(
      { error: "Failed to fetch audiences from Mailchimp" },
      { status: 500 }
    );
  }
}
