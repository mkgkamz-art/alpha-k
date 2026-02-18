import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendDigestEmail } from "@/lib/notifications/email";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import type { AlertType, Severity } from "@/types";

/**
 * Cron: Daily email digest (daily at 08:00 UTC)
 *
 * Sends a summary of yesterday's alerts to each user who has email enabled.
 * Only Pro and Whale tier users receive digest emails.
 */

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const started = Date.now();

  try {
    const supabase = createAdminClient();

    // Get users with paid tiers (pro/whale) who have emails
    const { data: users } = await supabase
      .from("users")
      .select("id, email, display_name, subscription_tier")
      .in("subscription_tier", ["pro", "whale"])
      .not("email", "is", null);

    if (!users?.length) {
      return NextResponse.json({
        success: true,
        message: "No eligible users",
        duration: Date.now() - started,
      });
    }

    // Yesterday's time range (UTC)
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const dateLabel = yesterday.toISOString().slice(0, 10);
    let sentCount = 0;

    for (const user of users) {
      // Fetch user's alerts from yesterday
      const { data: alerts } = await supabase
        .from("alert_events")
        .select("type, severity, title, created_at")
        .eq("user_id", user.id)
        .gte("created_at", yesterday.toISOString())
        .lt("created_at", todayStart.toISOString())
        .order("created_at", { ascending: false })
        .limit(50);

      if (!alerts?.length) continue;

      const result = await sendDigestEmail(user.email, {
        recipientName: user.display_name ?? user.email.split("@")[0],
        date: dateLabel,
        alerts: alerts.map((a) => ({
          type: a.type as AlertType,
          severity: a.severity as Severity,
          title: a.title,
          time: new Date(a.created_at).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        })),
      });

      if (result.success) sentCount++;
    }

    console.log(
      `[cron/email-digest] Sent ${sentCount}/${users.length} digests for ${dateLabel} in ${Date.now() - started}ms`
    );

    return NextResponse.json({
      success: true,
      eligibleUsers: users.length,
      sent: sentCount,
      date: dateLabel,
      duration: Date.now() - started,
    });
  } catch (err) {
    console.error("[cron/email-digest] Error:", err);
    return NextResponse.json(
      { error: "Failed to send email digests" },
      { status: 500 }
    );
  }
}
