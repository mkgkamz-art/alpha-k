/**
 * GET /api/cron/promo-reminder
 *
 * Daily cron (UTC 00:00 = KST 09:00).
 * Sends trial-ending reminder emails at D-7, D-3, D-1.
 * Targets users with subscription_status='trialing' whose trial ends soon.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCronSecret, cronUnauthorized } from "@/lib/cron-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/notifications/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://alpha-k.vercel.app";

const MESSAGES: Record<number, { subject: string; headline: string; body: string }> = {
  7: {
    subject: "Alpha K 무료 체험 종료까지 7일 남았습니다",
    headline: "무료 체험 종료까지 7일 남았습니다",
    body: "현재 이용 중인 무료 체험이 7일 후 종료됩니다. 체험 종료 후 자동으로 결제가 시작됩니다. 계속 이용하지 않으시면 Billing 페이지에서 해지해주세요.",
  },
  3: {
    subject: "Alpha K 무료 체험 3일 후 종료 — 자동 결제 예정",
    headline: "3일 후 자동 결제가 시작됩니다",
    body: "무료 체험이 3일 후 종료되며, 등록하신 결제 수단으로 자동 결제됩니다. 해지를 원하시면 Billing 페이지에서 취소해주세요.",
  },
  1: {
    subject: "Alpha K 무료 체험 내일 종료",
    headline: "내일 무료 체험이 종료됩니다",
    body: "내일부터 유료 구독이 시작됩니다. 해지를 원하시면 오늘 안에 Billing 페이지에서 취소해주세요. 해지하면 Free 플랜으로 전환됩니다.",
  },
};

function buildReminderHtml(daysLeft: number): string {
  const msg = MESSAGES[daysLeft]!;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0B0E11;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#1E2329;border:1px solid #2B3139;border-left:4px solid #F0B90B;border-radius:8px;padding:24px;">
      <div style="font-size:12px;color:#F0B90B;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">
        D-${daysLeft} 무료 체험 종료 예고
      </div>
      <h1 style="color:#EAECEF;font-size:18px;font-weight:600;margin:0 0 12px;">${msg.headline}</h1>
      <p style="color:#848E9C;font-size:14px;line-height:1.6;margin:0 0 20px;">${msg.body}</p>
      <a href="${APP_URL}/billing" style="display:inline-block;background:#F0B90B;color:#0B0E11;font-weight:600;font-size:14px;padding:10px 24px;border-radius:6px;text-decoration:none;">
        구독 관리
      </a>
    </div>
    <div style="text-align:center;padding:24px 0 0;color:#474D57;font-size:11px;">
      <p>Alpha K &mdash; Smart Crypto Alert Platform</p>
      <a href="${APP_URL}/settings" style="color:#848E9C;">알림 설정 관리</a>
    </div>
  </div>
</body>
</html>`.trim();
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) return cronUnauthorized();

  const supabase = createAdminClient();

  // Get trialing users with trial_ends_at set
  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, trial_ends_at")
    .eq("subscription_status", "trialing")
    .not("trial_ends_at", "is", null)
    .not("email", "is", null);

  if (error) {
    console.error("[trial-reminder] DB error:", error);
    return NextResponse.json({ error: "DB query failed" }, { status: 500 });
  }

  if (!users || users.length === 0) {
    return NextResponse.json({ sent: 0, reason: "no trialing users" });
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.email || !user.trial_ends_at) continue;

    const daysLeft = Math.max(
      0,
      Math.ceil(
        (new Date(user.trial_ends_at).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    const msg = MESSAGES[daysLeft];
    if (!msg) {
      skipped++;
      continue;
    }

    const html = buildReminderHtml(daysLeft);
    const result = await sendEmail({
      to: user.email,
      subject: msg.subject,
      html,
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      console.warn(`[trial-reminder] Failed for ${user.id}: ${result.error}`);
    }
  }

  console.log(`[trial-reminder] sent=${sent} failed=${failed} skipped=${skipped} total=${users.length}`);

  return NextResponse.json({ sent, failed, skipped, total: users.length });
}
