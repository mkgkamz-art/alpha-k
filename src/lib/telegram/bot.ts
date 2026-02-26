/**
 * Telegram Bot — Command Handlers & Account Linking
 *
 * Reference: docs/NOTIFICATIONS.md
 *
 * Commands:
 *   /start [code]  — Link Telegram to BLOSAFE account
 *   /status        — Show subscription & alert status
 *   /mute [duration] — Mute notifications (1h|4h|24h)
 *   /unmute        — Resume notifications
 *   /watchlist     — Show watchlist tokens
 *   /help          — Show available commands
 *
 * Connection Flow (reversed — bot generates code):
 *   1. User sends /start to @blosafe_alert_bot
 *   2. Bot generates 6-digit code, stores in DB, sends to user
 *   3. User enters code in web Settings page
 *   4. Web calls /api/telegram/verify → validates code, saves chat_id
 *   5. Confirmation message sent to Telegram
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "./sender";

/* ── Types ── */

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: {
      id: number;
      is_bot: boolean;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: "private" | "group" | "supergroup" | "channel";
    };
    date: number;
    text?: string;
  };
}

interface LinkCode {
  userId: string;
  code: string;
  expiresAt: number;
}

/* ── Link Code Store (in-memory, backward compat) ── */

const LINK_CODE_TTL_MS = 5 * 60 * 1_000; // 5 minutes
const pendingCodes = new Map<string, LinkCode>();

/** Generate a 6-digit linking code for a user (old flow, backward compat) */
export function generateLinkCode(userId: string): string {
  for (const [code, entry] of pendingCodes) {
    if (entry.userId === userId) pendingCodes.delete(code);
  }

  const code = String(Math.floor(100_000 + Math.random() * 900_000));

  pendingCodes.set(code, {
    userId,
    code,
    expiresAt: Date.now() + LINK_CODE_TTL_MS,
  });

  return code;
}

/** Validate and consume an old-flow link code. Returns userId if valid. */
function consumeLinkCode(code: string): string | null {
  const entry = pendingCodes.get(code);
  if (!entry) return null;

  pendingCodes.delete(code);

  if (Date.now() > entry.expiresAt) return null;

  return entry.userId;
}

/* ── New Flow: Bot generates code → User enters in web ── */

/** Generate a 6-digit code for a Telegram chatId (DB-backed, serverless safe) */
export async function generateChatLinkCode(chatId: number): Promise<string> {
  const supabase = createAdminClient();

  // Remove existing codes for this chatId
  await supabase
    .from("telegram_verifications")
    .delete()
    .eq("chat_id", String(chatId));

  const code = String(Math.floor(100_000 + Math.random() * 900_000));
  const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS).toISOString();

  await supabase.from("telegram_verifications").insert({
    verification_code: code,
    chat_id: String(chatId),
    expires_at: expiresAt,
  });

  return code;
}

/** Verify a code entered in the web UI. Returns chatId string if valid, null otherwise. */
export async function verifyTelegramCode(code: string): Promise<string | null> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("telegram_verifications")
    .select("chat_id, expires_at")
    .eq("verification_code", code)
    .single();

  if (!data) return null;

  // Delete the code (single-use)
  await supabase.from("telegram_verifications").delete().eq("verification_code", code);

  // Check expiry
  if (new Date(data.expires_at) < new Date()) return null;

  return data.chat_id;
}

/** Periodic cleanup of expired codes (both in-memory and DB) */
export async function cleanupExpiredCodes(): Promise<void> {
  // In-memory cleanup (old flow)
  const now = Date.now();
  for (const [code, entry] of pendingCodes) {
    if (now > entry.expiresAt) pendingCodes.delete(code);
  }

  // DB cleanup (new flow)
  try {
    const supabase = createAdminClient();
    await supabase
      .from("telegram_verifications")
      .delete()
      .lt("expires_at", new Date().toISOString());
  } catch {
    // Non-critical cleanup
  }
}

/* ── MarkdownV2 Escape ── */

const SPECIAL = /([_*\[\]()~`>#+\-=|{}.!\\])/g;
function esc(text: string): string {
  return text.replace(SPECIAL, "\\$1");
}

/* ── Command Handlers ── */

/**
 * /start [code]
 * New flow (reversed):
 *   - No code → generate 6-digit code → send to user → user enters in web
 *   - With code → backward compat: validate old-flow code, link chat_id
 */
async function handleStart(
  chatId: number,
  args: string,
  firstName: string
): Promise<void> {
  const code = args.trim();

  // No code: NEW FLOW — generate code and send to user
  if (!code) {
    try {
      const linkCode = await generateChatLinkCode(chatId);
      await sendTelegramMessage(
        String(chatId),
        [
          `\u{1F44B} *Alpha K 텔레그램 연동*`,
          ``,
          `안녕하세요, ${esc(firstName)}\\!`,
          ``,
          `인증 코드: \`${linkCode}\``,
          ``,
          `웹사이트 *설정 \\> 알림 연동* 에서`,
          `위 코드를 입력하세요\\.`,
          ``,
          `코드는 5분 후 만료됩니다\\.`,
        ].join("\n")
      );
    } catch {
      await sendTelegramMessage(
        String(chatId),
        `\u274C 코드 생성에 실패했습니다\\. 다시 시도해주세요\\.`
      );
    }
    return;
  }

  // Validate code format (6 digits)
  if (!/^\d{6}$/.test(code)) {
    await sendTelegramMessage(
      String(chatId),
      `\u274C 잘못된 코드 형식입니다\\. 6자리 숫자를 입력하세요\\.`
    );
    return;
  }

  // Backward compat: old flow — validate code from web
  const userId = consumeLinkCode(code);
  if (!userId) {
    await sendTelegramMessage(
      String(chatId),
      `\u274C 코드가 만료되었거나 유효하지 않습니다\\.\n/start 를 다시 전송하여 새 코드를 받으세요\\.`
    );
    return;
  }

  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("users")
      .update({
        telegram_chat_id: String(chatId),
        telegram_username: null, // old flow doesn't have username context
        telegram_connected_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) throw error;

    await sendTelegramMessage(
      String(chatId),
      [
        `\u2705 *계정이 연결되었습니다\\!*`,
        ``,
        `${esc(firstName)}님, 텔레그램이 Alpha K에 연결되었습니다\\.`,
        `이제 실시간 알림을 받을 수 있습니다\\.`,
        ``,
        `\u{1F514} /status \\- 설정 확인`,
        `\u{1F515} /mute \\- 알림 일시정지`,
      ].join("\n")
    );
  } catch {
    await sendTelegramMessage(
      String(chatId),
      `\u274C 계정 연결에 실패했습니다\\. 다시 시도해주세요\\.`
    );
  }
}

/**
 * /status — Show subscription tier, active alert rules, delivery channels
 */
async function handleStatus(chatId: number): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Find user by telegram_chat_id
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id, display_name, subscription_tier, quiet_hours_start, quiet_hours_end, max_alerts_per_hour, timezone")
      .eq("telegram_chat_id", String(chatId))
      .single();

    if (userErr || !user) {
      await sendTelegramMessage(
        String(chatId),
        `\u26A0\uFE0F Account not linked\\. Use /start to connect your BLOSAFE account\\.`
      );
      return;
    }

    // Count active alert rules
    const { count: ruleCount } = await supabase
      .from("alert_rules")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_active", true);

    // Count unread alerts (last 24h)
    const dayAgo = new Date(Date.now() - 86_400_000).toISOString();
    const { count: alertCount } = await supabase
      .from("alert_events")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .gte("created_at", dayAgo);

    const tierEmoji: Record<string, string> = {
      free: "\u26AA",
      pro: "\u{1F535}",
      whale: "\u{1F40B}",
    };

    const tier = user.subscription_tier ?? "free";
    const name = user.display_name ?? "User";

    const quietHours =
      user.quiet_hours_start && user.quiet_hours_end
        ? `${esc(user.quiet_hours_start)} — ${esc(user.quiet_hours_end)} \\(${esc(user.timezone)}\\)`
        : "Off";

    await sendTelegramMessage(
      String(chatId),
      [
        `\u{1F4CA} *BLOSAFE Status*`,
        ``,
        `\u{1F464} ${esc(name)}`,
        `${tierEmoji[tier] ?? "\u26AA"} Plan: *${esc(tier.toUpperCase())}*`,
        `\u{1F514} Active Rules: *${ruleCount ?? 0}*`,
        `\u{1F4EC} Unread Alerts \\(24h\\): *${alertCount ?? 0}*`,
        `\u{1F551} Quiet Hours: ${quietHours}`,
        `\u26A1 Rate Limit: *${user.max_alerts_per_hour}/hr*`,
      ].join("\n")
    );
  } catch {
    await sendTelegramMessage(
      String(chatId),
      `\u274C Failed to fetch status\\. Please try again later\\.`
    );
  }
}

/**
 * /mute [1h|4h|24h] — Mute notifications for a duration
 * Stores quiet hours temporarily. Default: 1h.
 */
async function handleMute(chatId: number, args: string): Promise<void> {
  const durationArg = args.trim().toLowerCase() || "1h";
  const durationMap: Record<string, number> = {
    "1h": 1,
    "4h": 4,
    "24h": 24,
  };

  const hours = durationMap[durationArg];
  if (!hours) {
    await sendTelegramMessage(
      String(chatId),
      `\u274C Invalid duration\\. Use: /mute 1h, /mute 4h, or /mute 24h`
    );
    return;
  }

  try {
    const supabase = createAdminClient();

    const now = new Date();
    const end = new Date(now.getTime() + hours * 60 * 60 * 1_000);

    const formatHHMM = (d: Date) =>
      `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;

    const { error } = await supabase
      .from("users")
      .update({
        quiet_hours_start: formatHHMM(now),
        quiet_hours_end: formatHHMM(end),
      })
      .eq("telegram_chat_id", String(chatId));

    if (error) throw error;

    await sendTelegramMessage(
      String(chatId),
      `\u{1F515} *Notifications muted for ${esc(durationArg)}*\nUse /unmute to resume\\.`
    );
  } catch {
    await sendTelegramMessage(
      String(chatId),
      `\u274C Failed to mute\\. Please try again\\.`
    );
  }
}

/**
 * /unmute — Resume notifications (clear quiet hours)
 */
async function handleUnmute(chatId: number): Promise<void> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("users")
      .update({
        quiet_hours_start: null,
        quiet_hours_end: null,
      })
      .eq("telegram_chat_id", String(chatId));

    if (error) throw error;

    await sendTelegramMessage(
      String(chatId),
      `\u{1F514} *Notifications resumed\\!*\nYou'll receive alerts again\\.`
    );
  } catch {
    await sendTelegramMessage(
      String(chatId),
      `\u274C Failed to unmute\\. Please try again\\.`
    );
  }
}

/**
 * /watchlist — Show user's watchlist tokens
 */
async function handleWatchlist(chatId: number): Promise<void> {
  try {
    const supabase = createAdminClient();

    // Find user
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_chat_id", String(chatId))
      .single();

    if (!user) {
      await sendTelegramMessage(
        String(chatId),
        `\u26A0\uFE0F Account not linked\\. Use /start to connect\\.`
      );
      return;
    }

    const { data: items } = await supabase
      .from("watchlist_items")
      .select("token_symbol, token_name, chain, is_muted")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false })
      .limit(20);

    if (!items?.length) {
      await sendTelegramMessage(
        String(chatId),
        [
          `\u{1F4CB} *Your Watchlist*`,
          ``,
          `No tokens in your watchlist yet\\.`,
          `Add tokens from the BLOSAFE web app\\.`,
        ].join("\n")
      );
      return;
    }

    const lines = items.map((t, i) => {
      const muteIcon = t.is_muted ? "\u{1F515}" : "\u{1F514}";
      return `${i + 1}\\. ${muteIcon} *${esc(t.token_symbol)}* — ${esc(t.token_name)} \\(${esc(t.chain)}\\)`;
    });

    await sendTelegramMessage(
      String(chatId),
      [
        `\u{1F4CB} *Your Watchlist* \\(${items.length} tokens\\)`,
        ``,
        ...lines,
      ].join("\n")
    );
  } catch {
    await sendTelegramMessage(
      String(chatId),
      `\u274C Failed to fetch watchlist\\. Please try again\\.`
    );
  }
}

/**
 * /help — Show all available commands
 */
async function handleHelp(chatId: number): Promise<void> {
  await sendTelegramMessage(
    String(chatId),
    [
      `\u2753 *BLOSAFE Bot Commands*`,
      ``,
      `/start \\[code\\] — Link your BLOSAFE account`,
      `/status — View subscription \\& alert status`,
      `/mute \\[1h\\|4h\\|24h\\] — Pause notifications`,
      `/unmute — Resume notifications`,
      `/watchlist — View your watchlist`,
      `/help — Show this message`,
      ``,
      `\u{1F310} Web: [app\\.blosafe\\.io](https://app.blosafe.io)`,
    ].join("\n")
  );
}

/* ── Main Update Router ── */

/**
 * Process an incoming Telegram webhook update.
 * Parses the command and delegates to the appropriate handler.
 */
export async function handleTelegramUpdate(
  update: TelegramUpdate
): Promise<void> {
  const message = update.message;
  if (!message?.text || !message.chat) return;

  // Only handle private chats
  if (message.chat.type !== "private") return;

  const chatId = message.chat.id;
  const text = message.text.trim();
  const firstName = message.from?.first_name ?? "User";

  // Parse command: /command args
  const match = text.match(/^\/(\w+)(?:\s+(.*))?$/);
  if (!match) return; // Not a command

  const command = match[1].toLowerCase();
  const args = match[2] ?? "";

  switch (command) {
    case "start":
      await handleStart(chatId, args, firstName);
      break;
    case "status":
      await handleStatus(chatId);
      break;
    case "mute":
      await handleMute(chatId, args);
      break;
    case "unmute":
      await handleUnmute(chatId);
      break;
    case "watchlist":
      await handleWatchlist(chatId);
      break;
    case "help":
      await handleHelp(chatId);
      break;
    default:
      await sendTelegramMessage(
        String(chatId),
        `Unknown command\\. Type /help for available commands\\.`
      );
  }
}

/**
 * Verify Telegram webhook secret token.
 * Compare the X-Telegram-Bot-Api-Secret-Token header.
 */
export function verifyWebhookSecret(headerToken: string | null): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true; // No secret configured — skip check
  return headerToken === secret;
}
