/**
 * Whale trade/hot-coin → Telegram notification dispatcher.
 *
 * 1. dispatchWhaleTradeNotifications
 *    - 새 거래 감지 → 팔로워 중 Pro/Whale + telegram + alert_telegram=true 유저에게 발송
 *    - 같은 고래의 최근 3일간 같은 코인 추가 매수/매도 횟수도 포함
 *
 * 2. dispatchWhaleHotCoinDigest
 *    - 1일 1회 (오전 9시) → notification_settings whale+telegram_enabled 유저에게 TOP3 발송
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { sendTelegramMessage } from "./sender";

/* ── Types ── */

type WhaleRow = Database["public"]["Tables"]["whales"]["Row"];
type TradeRow = Database["public"]["Tables"]["whale_trades"]["Row"];
type HotCoinRow = Database["public"]["Tables"]["whale_hot_coins"]["Row"];

interface FollowerUser {
  user_id: string;
  telegram_chat_id: string;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  timezone: string;
}

/* ── Constants ── */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://alphak.io";
const BATCH_SIZE = 10;

const SPECIAL_CHARS = /([_*\[\]()~`>#+\-=|{}.!\\])/g;
function escMd(text: string): string {
  return text.replace(SPECIAL_CHARS, "\\$1");
}

const TIER_LABEL: Record<string, string> = {
  s: "S",
  a: "A",
  b: "B",
  c: "C",
};

/* ── Quiet Hours Check ── */

function isInQuietHours(
  start: string | null,
  end: string | null,
  timezone: string,
): boolean {
  if (!start || !end) return false;

  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return false;

  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  let nowMin: number;
  try {
    const now = new Date();
    const formatted = now.toLocaleString("en-US", {
      timeZone: timezone,
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });
    const [h, m] = formatted.split(":").map(Number);
    nowMin = h * 60 + m;
  } catch {
    return false;
  }

  if (startMin > endMin) {
    return nowMin >= startMin || nowMin < endMin;
  }
  return nowMin >= startMin && nowMin < endMin;
}

/* ── Format: Dollar abbreviation ── */

function fmtUsd(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

/* ═══════════════════════════════════════════════
   1. Whale Trade Alert
   ═══════════════════════════════════════════════ */

function formatWhaleTradeMessage(
  whale: WhaleRow,
  trade: TradeRow,
  recentSameCount: number,
): string {
  const isBuy = trade.trade_type === "buy";
  const tierLabel = TIER_LABEL[whale.tier] ?? whale.tier.toUpperCase();
  const returnPct = whale.return_30d_pct >= 0
    ? `\\+${whale.return_30d_pct.toFixed(0)}%`
    : `${whale.return_30d_pct.toFixed(0)}%`;

  const header = isBuy
    ? `🐋 *고래 매수 감지*`
    : `🐋 *고래 매도 감지*`;

  const actionEmoji = isBuy ? "🟢 매수" : "🔴 매도";
  const actionLine = `${actionEmoji} $${escMd(trade.coin_symbol)}  ${escMd(fmtUsd(trade.value_usd))}  @$${escMd(trade.price.toFixed(2))}`;

  const lines: string[] = [
    header,
    `${escMd(whale.label)} \\[${escMd(tierLabel)}티어 · 수익률 ${returnPct}\\]`,
    actionLine,
  ];

  // PnL for sells
  if (!isBuy && trade.realized_pnl_pct != null && trade.realized_pnl_pct !== 0) {
    const pnlSign = trade.realized_pnl_pct > 0 ? "+" : "";
    lines.push(`${pnlSign}${trade.realized_pnl_pct.toFixed(0)}% 수익 실현`);
  }

  // Recent same-coin accumulation
  if (recentSameCount > 1) {
    const verb = isBuy ? "추가 매수" : "추가 매도";
    lines.push(`최근 3일간 ${recentSameCount}회 ${verb}`);
  }

  lines.push(
    ``,
    `[상세 보기](${escMd(`${APP_URL}/whale/${whale.id}`)})`,
  );

  return lines.join("\n");
}

/**
 * Send trade alert to all followers of a whale who have telegram enabled.
 * Called from the whale-notify cron after detecting new trades.
 */
export async function dispatchWhaleTradeNotifications(
  admin: SupabaseClient<Database>,
  trade: TradeRow,
  whale: WhaleRow,
): Promise<{ sent: number; skipped: number }> {
  let sent = 0;
  let skipped = 0;

  // 1. Get followers with alert_telegram = true
  const { data: follows } = await admin
    .from("whale_follows")
    .select("user_id")
    .eq("whale_id", whale.id)
    .eq("alert_telegram", true);

  if (!follows || follows.length === 0) return { sent: 0, skipped: 0 };

  const followerIds = follows.map((f) => f.user_id);

  // 2. Get user info (Pro/Whale only + telegram linked)
  const { data: users } = await admin
    .from("users")
    .select("id, telegram_chat_id, subscription_tier, quiet_hours_start, quiet_hours_end, timezone")
    .in("id", followerIds)
    .not("telegram_chat_id", "is", null)
    .in("subscription_tier", ["pro", "whale"]);

  if (!users || users.length === 0) return { sent: 0, skipped: 0 };

  // 3. Also check notification_settings: whale + telegram_enabled
  const userIds = users.map((u) => u.id);
  const { data: notifSettings } = await admin
    .from("notification_settings")
    .select("user_id, telegram_enabled")
    .in("user_id", userIds)
    .eq("alert_type", "whale");

  const notifMap = new Map(
    (notifSettings ?? []).map((s) => [s.user_id, s.telegram_enabled]),
  );

  // 4. Count recent same-coin trades (last 3 days) for context
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60_000).toISOString();
  const { count: recentSameCount } = await admin
    .from("whale_trades")
    .select("id", { count: "exact", head: true })
    .eq("whale_id", whale.id)
    .eq("coin_symbol", trade.coin_symbol)
    .eq("trade_type", trade.trade_type)
    .gte("created_at", threeDaysAgo);

  // 5. Build eligible list
  const eligible: FollowerUser[] = [];

  for (const user of users) {
    if (!user.telegram_chat_id) continue;

    // notification_settings check — if row exists and telegram_enabled=false, skip
    const telegramEnabled = notifMap.get(user.id);
    if (telegramEnabled === false) {
      skipped++;
      continue;
    }

    // Quiet hours
    if (isInQuietHours(user.quiet_hours_start, user.quiet_hours_end, user.timezone)) {
      skipped++;
      continue;
    }

    eligible.push({
      user_id: user.id,
      telegram_chat_id: user.telegram_chat_id,
      quiet_hours_start: user.quiet_hours_start,
      quiet_hours_end: user.quiet_hours_end,
      timezone: user.timezone,
    });
  }

  if (eligible.length === 0) return { sent, skipped };

  // 6. Format message
  const message = formatWhaleTradeMessage(whale, trade, recentSameCount ?? 1);

  // 7. Send in batches
  for (let i = 0; i < eligible.length; i += BATCH_SIZE) {
    const batch = eligible.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((u) => sendTelegramMessage(u.telegram_chat_id, message, "MarkdownV2")),
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success) {
        sent++;
      } else {
        skipped++;
      }
    }
  }

  console.log(
    `[whale-notifier] trade=${trade.id} whale=${whale.label} coin=${trade.coin_symbol} sent=${sent} skipped=${skipped}`,
  );

  return { sent, skipped };
}

/* ═══════════════════════════════════════════════
   2. Hot Coin Daily Digest
   ═══════════════════════════════════════════════ */

function formatHotCoinDigestMessage(
  coins: HotCoinRow[],
): string {
  const lines: string[] = [
    `🔥 *고래 핫 코인 TOP 3* \\(24h\\)`,
  ];

  coins.slice(0, 3).forEach((coin, i) => {
    const netStr = fmtUsd(coin.net_buy_volume_usd_24h);
    const action = coin.buy_whale_count_24h >= coin.sell_whale_count_24h ? "매수" : "매도";
    const count = Math.max(coin.buy_whale_count_24h, coin.sell_whale_count_24h);
    lines.push(
      `${i + 1}\\. $${escMd(coin.coin_symbol)} — 고래 ${count}명 ${escMd(action)} \\(순매수 ${escMd(netStr)}\\)`,
    );
  });

  lines.push(
    ``,
    `[전체 보기](${escMd(`${APP_URL}/whale`)})`,
  );

  return lines.join("\n");
}

/**
 * Send daily hot coin digest to all Pro/Whale users with whale telegram notifications enabled.
 * Called from the whale-hot-digest cron (daily 9 AM KST).
 */
export async function dispatchWhaleHotCoinDigest(
  admin: SupabaseClient<Database>,
): Promise<{ sent: number; skipped: number }> {
  let sent = 0;
  let skipped = 0;

  // 1. Get top 3 hot coins by net_buy_volume_usd_24h
  const { data: hotCoins } = await admin
    .from("whale_hot_coins")
    .select("*")
    .order("net_buy_volume_usd_24h", { ascending: false })
    .limit(3);

  if (!hotCoins || hotCoins.length === 0) {
    console.log("[whale-notifier] No hot coins to digest");
    return { sent: 0, skipped: 0 };
  }

  // 2. Get Pro/Whale users with telegram + whale notification enabled
  const { data: settings } = await admin
    .from("notification_settings")
    .select("user_id")
    .eq("alert_type", "whale")
    .eq("telegram_enabled", true);

  if (!settings || settings.length === 0) return { sent: 0, skipped: 0 };

  const eligibleUserIds = settings.map((s) => s.user_id);

  const { data: users } = await admin
    .from("users")
    .select("id, telegram_chat_id, subscription_tier, quiet_hours_start, quiet_hours_end, timezone")
    .in("id", eligibleUserIds)
    .not("telegram_chat_id", "is", null)
    .in("subscription_tier", ["pro", "whale"]);

  if (!users || users.length === 0) return { sent: 0, skipped: 0 };

  // 3. Format message
  const message = formatHotCoinDigestMessage(hotCoins);

  // 4. Send in batches (no quiet hours check for digest — it's a scheduled summary)
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((u) =>
        sendTelegramMessage(u.telegram_chat_id!, message, "MarkdownV2"),
      ),
    );

    for (const result of results) {
      if (result.status === "fulfilled" && result.value.success) {
        sent++;
      } else {
        skipped++;
      }
    }
  }

  console.log(
    `[whale-notifier] hot-coin-digest coins=${hotCoins.length} sent=${sent} skipped=${skipped}`,
  );

  return { sent, skipped };
}
