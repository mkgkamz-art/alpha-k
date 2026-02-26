"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Settings,
  Bell,
  Send,
  Mail,
  Smartphone,
  Loader2,
  Save,
  CheckCircle,
  Key,
  Copy,
  RefreshCw,
  Trash2,
  ExternalLink,
  AlertTriangle,
  Infinity as InfinityIcon,
  Code,
  LinkIcon,
  Unlink,
  Zap,
  Lock,
  SettingsIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";
import { useApiKeys } from "@/hooks/use-api-keys";
import { useTelegramLink } from "@/hooks/use-telegram-link";
import { useNotificationPreferences } from "@/hooks/use-notification-preferences";
import { useAuthStore } from "@/stores/auth-store";
import {
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  Input,
  Toggle,
  Button,
} from "@/components/ui";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@/components/ui/modal";
import type {
  AlertType,
  SubscriptionTier,
  NotificationAlertType,
  NotificationFrequency,
} from "@/types";

/* ── Alert Notification Row Definitions ── */

interface AlertRowDef {
  type: NotificationAlertType;
  label: string;
  desc: string;
  emoji: string;
  minTier: SubscriptionTier;
  hasThreshold: boolean;
  thresholdLabel?: string;
  thresholdUnit?: string;
  thresholdMin?: number;
  thresholdMax?: number;
  thresholdStep?: number;
  thresholdDefault?: number;
  formatThreshold?: (v: number) => string;
}

const ALERT_ROWS: AlertRowDef[] = [
  {
    type: "listing",
    label: "신규 상장 알림",
    desc: "한국 거래소 신규 상장 코인 알림",
    emoji: "\uD83D\uDCCB",
    minTier: "free",
    hasThreshold: false,
  },
  {
    type: "surge",
    label: "급등 알림",
    desc: "가격이 급등할 때 알림",
    emoji: "\uD83D\uDE80",
    minTier: "free",
    hasThreshold: true,
    thresholdLabel: "급등 기준",
    thresholdUnit: "%",
    thresholdMin: 5,
    thresholdMax: 50,
    thresholdStep: 1,
    thresholdDefault: 10,
  },
  {
    type: "kimchi_premium",
    label: "김치프리미엄 이상치",
    desc: "김프가 비정상적일 때 알림",
    emoji: "\uD83C\uDDF0\uD83C\uDDF7",
    minTier: "pro",
    hasThreshold: true,
    thresholdLabel: "이상치 기준",
    thresholdUnit: "%",
    thresholdMin: 1,
    thresholdMax: 20,
    thresholdStep: 0.5,
    thresholdDefault: 5,
  },
  {
    type: "whale",
    label: "고래 거래 감지",
    desc: "대량 거래 발생 시 알림",
    emoji: "\uD83D\uDC0B",
    minTier: "pro",
    hasThreshold: true,
    thresholdLabel: "최소 거래 금액",
    thresholdUnit: "$",
    thresholdMin: 10_000,
    thresholdMax: 10_000_000,
    thresholdStep: 10_000,
    thresholdDefault: 100_000,
    formatThreshold: (v: number) =>
      v >= 1_000_000
        ? `$${(v / 1_000_000).toFixed(1)}M`
        : `$${(v / 1_000).toFixed(0)}K`,
  },
  {
    type: "defi_risk",
    label: "DeFi 리스크 알림",
    desc: "DeFi 프로토콜 이상 감지 시 알림",
    emoji: "\u26A0\uFE0F",
    minTier: "pro",
    hasThreshold: false,
  },
  {
    type: "trading_signal",
    label: "트레이딩 시그널",
    desc: "새로운 매매 시그널 발생 시 알림",
    emoji: "\uD83D\uDCCA",
    minTier: "pro",
    hasThreshold: false,
  },
  {
    type: "liquidity",
    label: "유동성 이상 감지",
    desc: "유동성 급변 시 알림",
    emoji: "\uD83D\uDCA7",
    minTier: "pro",
    hasThreshold: false,
  },
];

const FREQUENCY_OPTIONS = [
  { value: "instant", label: "즉시" },
  { value: "hourly", label: "1시간 요약" },
  { value: "daily", label: "1일 요약" },
];

const TIER_ORDER: Record<SubscriptionTier, number> = {
  free: 0,
  pro: 1,
  whale: 2,
};

/* ══════════════════════════════════════════════════════════
   Main Settings Page
   ══════════════════════════════════════════════════════════ */

export default function SettingsPage() {
  const { settings, isLoading, updateSettings } = useSettings();
  const user = useAuthStore((s) => s.user);

  // Local form state
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");
  const [maxAlerts, setMaxAlerts] = useState("25");
  const [saved, setSaved] = useState(false);

  // Sync from server
  useEffect(() => {
    if (!settings) return;
    setQuietHoursEnabled(!!settings.quiet_hours_start);
    setQuietStart(settings.quiet_hours_start ?? "22:00");
    setQuietEnd(settings.quiet_hours_end ?? "07:00");
    setMaxAlerts(String(settings.max_alerts_per_hour ?? 25));
  }, [settings]);

  const handleSave = () => {
    updateSettings.mutate(
      {
        quiet_hours_start: quietHoursEnabled ? quietStart : null,
        quiet_hours_end: quietHoursEnabled ? quietEnd : null,
        max_alerts_per_hour: Number(maxAlerts),
      },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-6 text-text-secondary animate-spin" />
      </div>
    );
  }

  const userTier = (settings?.subscription_tier ?? "free") as SubscriptionTier;
  const telegramConnected = !!settings?.telegram_chat_id;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-360 w-full mx-auto">
        <h1 className="text-xl font-bold">설정</h1>

        <Tabs defaultValue="notifications">
          <TabList>
            <TabTrigger value="profile">프로필</TabTrigger>
            <TabTrigger value="notifications">알림</TabTrigger>
            <TabTrigger value="integrations">알림 연동</TabTrigger>
            <TabTrigger value="api">API 연동</TabTrigger>
          </TabList>

          {/* ── Profile Tab ── */}
          <TabContent value="profile">
            <div className="max-w-lg flex flex-col gap-5">
              <div>
                <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                  Display Name
                </label>
                <Input
                  defaultValue={settings?.display_name ?? ""}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                  Email
                </label>
                <Input
                  value={settings?.email ?? ""}
                  disabled
                  className="opacity-60"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                  Timezone
                </label>
                <Input
                  defaultValue={settings?.timezone ?? "UTC"}
                  placeholder="e.g. Asia/Seoul"
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                  Subscription
                </label>
                <span className="text-sm font-bold text-accent-primary uppercase">
                  {settings?.subscription_tier ?? "free"} Plan
                </span>
              </div>
            </div>
          </TabContent>

          {/* ── Notifications Tab ── */}
          <TabContent value="notifications">
            <div className="grid grid-cols-12 gap-8">
              {/* Left: Global Preferences + Connected Channels */}
              <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                {/* Global Preferences */}
                <section className="bg-bg-secondary border border-border-default rounded-lg p-6">
                  <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
                    <Settings className="size-4 text-accent-primary" />
                    알림 설정
                  </h2>
                  <div className="flex flex-col gap-5">
                    {/* Quiet Hours */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">방해 금지</p>
                        <p className="text-xs text-text-secondary">
                          지정 시간 동안 모든 알림을 차단합니다.
                        </p>
                      </div>
                      <Toggle
                        pressed={quietHoursEnabled}
                        onPressedChange={setQuietHoursEnabled}
                      />
                    </div>
                    {quietHoursEnabled && (
                      <div className="flex items-center gap-4 pl-4 border-l-2 border-border-default ml-2">
                        <div className="flex-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">
                            시작
                          </label>
                          <Input
                            value={quietStart}
                            onChange={(e) => setQuietStart(e.target.value)}
                            placeholder="22:00"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">
                            종료
                          </label>
                          <Input
                            value={quietEnd}
                            onChange={(e) => setQuietEnd(e.target.value)}
                            placeholder="07:00"
                          />
                        </div>
                      </div>
                    )}
                    {/* Max Alerts */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">시간당 최대 알림</p>
                        <p className="text-xs text-text-secondary">
                          알림 피로도를 방지합니다.
                        </p>
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          value={maxAlerts}
                          onChange={(e) => setMaxAlerts(e.target.value)}
                          className="text-right"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Connected Channels */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ChannelCard
                    icon={<Send className="size-5" />}
                    name="Telegram"
                    detail={
                      settings?.telegram_chat_id
                        ? settings?.telegram_username
                          ? `@${settings.telegram_username}`
                          : `Chat: ${settings.telegram_chat_id}`
                        : undefined
                    }
                    connected={telegramConnected}
                    iconColor="text-[#0088cc]"
                    iconBg="bg-[#0088cc]/20"
                  />
                  <ChannelCard
                    icon={<Bell className="size-5" />}
                    name="Discord"
                    detail={
                      settings?.discord_webhook_url
                        ? "Webhook active"
                        : undefined
                    }
                    connected={!!settings?.discord_webhook_url}
                    iconColor="text-[#5865F2]"
                    iconBg="bg-[#5865F2]/20"
                  />
                  <ChannelCard
                    icon={<Mail className="size-5" />}
                    name="Email"
                    detail={settings?.email}
                    connected={!!settings?.email}
                    iconColor="text-accent-primary"
                    iconBg="bg-accent-primary/20"
                  />
                  <ChannelCard
                    icon={<Smartphone className="size-5" />}
                    name="SMS"
                    detail={settings?.phone_number || "Whale Plan Only"}
                    connected={!!settings?.phone_number}
                    iconColor="text-text-secondary"
                    iconBg="bg-text-secondary/20"
                    locked={settings?.subscription_tier !== "whale"}
                  />
                </div>

                {/* Save Bar */}
                <div className="flex items-center justify-between p-5 bg-bg-secondary border border-border-default rounded-lg">
                  <p className="text-xs text-text-secondary">
                    방해 금지 / 최대 알림 설정
                  </p>
                  <Button
                    onClick={handleSave}
                    disabled={updateSettings.isPending}
                  >
                    {updateSettings.isPending ? (
                      <Loader2 className="size-4 animate-spin mr-1" />
                    ) : saved ? (
                      <CheckCircle className="size-4 mr-1 text-signal-success" />
                    ) : (
                      <Save className="size-4 mr-1" />
                    )}
                    {saved ? "저장 완료" : "저장"}
                  </Button>
                </div>
              </div>

              {/* Right: Notification Alert Matrix (7x2) */}
              <div className="col-span-12 lg:col-span-7">
                <NotificationMatrix
                  userTier={userTier}
                  telegramConnected={telegramConnected}
                />
              </div>
            </div>
          </TabContent>

          {/* ── Integrations (알림 연동) Tab ── */}
          <TabContent value="integrations">
            <div className="max-w-2xl flex flex-col gap-8">
              <TelegramSection
                chatId={settings?.telegram_chat_id ?? null}
              />

              {/* Discord Section */}
              <section className="bg-bg-secondary border border-border-default rounded-lg p-6">
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <Bell className="size-4 text-[#5865F2]" />
                  Discord
                </h2>
                <div>
                  <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                    Webhook URL
                  </label>
                  <Input
                    defaultValue={settings?.discord_webhook_url ?? ""}
                    placeholder="https://discord.com/api/webhooks/..."
                  />
                  <p className="text-[10px] text-text-secondary mt-1">
                    Discord 채널 설정 &gt; 연동 &gt; 웹훅에서 URL을 복사하세요.
                  </p>
                </div>
              </section>

              {/* Phone Number Section */}
              <section className="bg-bg-secondary border border-border-default rounded-lg p-6">
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <Smartphone className="size-4 text-text-secondary" />
                  SMS / 전화 알림
                  {settings?.subscription_tier !== "whale" && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-bg-tertiary text-text-disabled font-bold uppercase">
                      Whale Only
                    </span>
                  )}
                </h2>
                <div>
                  <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                    전화번호
                  </label>
                  <Input
                    defaultValue={settings?.phone_number ?? ""}
                    placeholder="+821012345678"
                    disabled={settings?.subscription_tier !== "whale"}
                  />
                </div>
              </section>
            </div>
          </TabContent>

          {/* ── API 연동 Tab ── */}
          <TabContent value="api">
            <ApiTab enabled={!!user} />
          </TabContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Notification Alert Matrix (7×2)
   ══════════════════════════════════════════════════════════ */

function NotificationMatrix({
  userTier,
  telegramConnected,
}: {
  userTier: SubscriptionTier;
  telegramConnected: boolean;
}) {
  const { preferences, updatePreference } = useNotificationPreferences();
  const [openSettings, setOpenSettings] = useState<NotificationAlertType | null>(
    null,
  );

  const handleToggle = (
    type: NotificationAlertType,
    channel: "telegram" | "in_app",
    value: boolean,
  ) => {
    updatePreference.mutate({
      alertType: type,
      updates: { [channel]: value },
    });
  };

  const handleThreshold = (type: NotificationAlertType, value: number) => {
    updatePreference.mutate({
      alertType: type,
      updates: { threshold: value },
    });
  };

  const handleFrequency = (
    type: NotificationAlertType,
    value: NotificationFrequency,
  ) => {
    updatePreference.mutate({
      alertType: type,
      updates: { frequency: value },
    });
  };

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
      <div className="p-5 border-b border-border-default">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Bell className="size-4 text-accent-primary" />
          알림 항목별 설정
        </h2>
        <p className="text-xs text-text-secondary mt-1">
          토글 변경 시 자동 저장됩니다.
        </p>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[1fr_80px_80px_48px] gap-2 px-5 py-3 border-b border-border-default bg-bg-primary/30">
        <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider">
          알림 유형
        </span>
        <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider text-center">
          텔레그램
        </span>
        <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider text-center">
          앱 내
        </span>
        <span className="text-[10px] uppercase font-bold text-text-secondary tracking-wider text-center">
          설정
        </span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border-default/50">
        {ALERT_ROWS.map((row) => {
          const pref = preferences[row.type];
          const locked =
            TIER_ORDER[userTier] < TIER_ORDER[row.minTier];
          const tgDisabled = !telegramConnected || locked;

          return (
            <div
              key={row.type}
              className={cn(
                "grid grid-cols-[1fr_80px_80px_48px] gap-2 px-5 py-4 items-center",
                locked && "opacity-60",
              )}
            >
              {/* Label */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base shrink-0">{row.emoji}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{row.label}</p>
                    {locked && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-text-disabled font-bold shrink-0">
                        <Lock className="size-3" />
                        Pro+
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-secondary truncate">
                    {row.desc}
                  </p>
                </div>
              </div>

              {/* Telegram Toggle */}
              <div className="flex justify-center" title={tgDisabled && !locked ? "텔레그램을 먼저 연결하세요" : undefined}>
                <Toggle
                  pressed={!tgDisabled && pref.telegram}
                  onPressedChange={(v) => handleToggle(row.type, "telegram", v)}
                  disabled={tgDisabled}
                  aria-label={`${row.label} 텔레그램`}
                />
              </div>

              {/* In-App Toggle */}
              <div className="flex justify-center">
                <Toggle
                  pressed={!locked && pref.in_app}
                  onPressedChange={(v) => handleToggle(row.type, "in_app", v)}
                  disabled={locked}
                  aria-label={`${row.label} 앱 내 알림`}
                />
              </div>

              {/* Settings Gear */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() =>
                    setOpenSettings(
                      openSettings === row.type ? null : row.type,
                    )
                  }
                  disabled={locked}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    locked
                      ? "text-text-disabled cursor-not-allowed"
                      : openSettings === row.type
                        ? "text-accent-primary bg-accent-primary/10"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary",
                  )}
                  aria-label={`${row.label} 설정`}
                >
                  <SettingsIcon className="size-4" />
                </button>
              </div>

              {/* Inline Settings Panel */}
              {openSettings === row.type && !locked && (
                <div className="col-span-full bg-bg-primary/50 border border-border-default rounded-lg p-4 mt-1">
                  <AlertSettingsPanel
                    row={row}
                    threshold={pref.threshold}
                    frequency={pref.frequency}
                    onThresholdChange={(v) => handleThreshold(row.type, v)}
                    onFrequencyChange={(v) => handleFrequency(row.type, v)}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Alert Settings Panel (inline dropdown)
   ══════════════════════════════════════════════════════════ */

function AlertSettingsPanel({
  row,
  threshold,
  frequency,
  onThresholdChange,
  onFrequencyChange,
}: {
  row: AlertRowDef;
  threshold?: number;
  frequency: NotificationFrequency;
  onThresholdChange: (v: number) => void;
  onFrequencyChange: (v: NotificationFrequency) => void;
}) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [localThreshold, setLocalThreshold] = useState(
    threshold ?? row.thresholdDefault ?? 0,
  );

  useEffect(() => {
    setLocalThreshold(threshold ?? row.thresholdDefault ?? 0);
  }, [threshold, row.thresholdDefault]);

  const handleSliderChange = (v: number) => {
    setLocalThreshold(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onThresholdChange(v), 300);
  };

  const formatValue = row.formatThreshold
    ? row.formatThreshold(localThreshold)
    : `${localThreshold}${row.thresholdUnit ?? ""}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Threshold Slider */}
      {row.hasThreshold && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-text-secondary font-medium">
              {row.thresholdLabel}
            </label>
            <span className="text-xs font-num text-accent-primary font-medium">
              {formatValue}
            </span>
          </div>
          <input
            type="range"
            min={row.thresholdMin}
            max={row.thresholdMax}
            step={row.thresholdStep}
            value={localThreshold}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full h-1.5 bg-bg-tertiary rounded-full appearance-none cursor-pointer accent-accent-primary"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-text-disabled font-num">
              {row.formatThreshold
                ? row.formatThreshold(row.thresholdMin ?? 0)
                : `${row.thresholdMin}${row.thresholdUnit}`}
            </span>
            <span className="text-[10px] text-text-disabled font-num">
              {row.formatThreshold
                ? row.formatThreshold(row.thresholdMax ?? 0)
                : `${row.thresholdMax}${row.thresholdUnit}`}
            </span>
          </div>
        </div>
      )}

      {/* Frequency Selector */}
      <div>
        <label className="text-xs text-text-secondary font-medium mb-2 block">
          알림 빈도
        </label>
        <ButtonGroup
          size="sm"
          options={FREQUENCY_OPTIONS}
          value={frequency}
          onChange={(v) => onFrequencyChange(v as NotificationFrequency)}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Telegram Connection Section (reversed flow)
   ══════════════════════════════════════════════════════════ */

function TelegramSection({ chatId }: { chatId: string | null }) {
  const { verifyCode, disconnect, sendTest } = useTelegramLink();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [testSent, setTestSent] = useState(false);

  const handleTest = async () => {
    await sendTest.mutateAsync();
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleDisconnect = async () => {
    await disconnect.mutateAsync();
    setShowDisconnectModal(false);
  };

  const connected = !!chatId;

  return (
    <>
      <section className="bg-bg-secondary border border-border-default rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Send className="size-4 text-[#0088cc]" />
            Telegram
          </h2>
          <span
            className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
              connected
                ? "bg-signal-success/10 text-signal-success"
                : "bg-text-secondary/10 text-text-secondary",
            )}
          >
            {connected ? "연결됨" : "미연결"}
          </span>
        </div>

        {connected ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-sm">
              <LinkIcon className="size-4 text-text-secondary" />
              <span className="text-text-secondary">Chat ID:</span>
              <span className="font-num text-text-primary">{chatId}</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={sendTest.isPending}
              >
                {sendTest.isPending ? (
                  <Loader2 className="size-3.5 animate-spin mr-1" />
                ) : testSent ? (
                  <CheckCircle className="size-3.5 mr-1 text-signal-success" />
                ) : (
                  <Zap className="size-3.5 mr-1" />
                )}
                {testSent ? "전송 완료" : "테스트 메시지 보내기"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDisconnectModal(true)}
                disabled={disconnect.isPending}
                className="text-signal-danger hover:text-signal-danger hover:bg-signal-danger/10"
              >
                <Unlink className="size-3.5 mr-1" />
                연결 해제
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm text-text-secondary mb-3">
              텔레그램을 연결하면 실시간 알림을 받을 수 있습니다.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConnectModal(true)}
            >
              <Send className="size-3.5 mr-1" />
              텔레그램 연결하기
            </Button>
          </div>
        )}
      </section>

      {/* Connect Modal */}
      <TelegramConnectModal
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        verifyCode={verifyCode}
      />

      {/* Disconnect Confirm Modal */}
      <Modal
        open={showDisconnectModal}
        onClose={() => setShowDisconnectModal(false)}
      >
        <ModalContent>
          <ModalHeader>텔레그램 연결 해제</ModalHeader>
          <ModalBody>
            <p className="text-sm text-text-secondary">
              연결을 해제하면 모든 텔레그램 알림이 비활성화됩니다.
              계속하시겠습니까?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDisconnectModal(false)}
            >
              취소
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDisconnect}
              disabled={disconnect.isPending}
            >
              {disconnect.isPending && (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              )}
              연결 해제
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   Telegram Connect Modal (3-step wizard + OTP input)
   ══════════════════════════════════════════════════════════ */

function TelegramConnectModal({
  open,
  onClose,
  verifyCode,
}: {
  open: boolean;
  onClose: () => void;
  verifyCode: ReturnType<typeof useTelegramLink>["verifyCode"];
}) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setDigits(["", "", "", "", "", ""]);
      setError(null);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);
    setError(null);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (value && index === 5) {
      const code = newDigits.join("");
      if (code.length === 6) {
        handleVerify(code);
      }
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    setError(null);

    if (pasted.length === 6) {
      handleVerify(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    try {
      await verifyCode.mutateAsync(code);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "인증에 실패했습니다. 다시 시도하세요.",
      );
      setDigits(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  };

  const code = digits.join("");
  const canSubmit = code.length === 6;

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center gap-2">
            <Send className="size-4 text-[#0088cc]" />
            텔레그램 연동
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-5">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center size-6 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold shrink-0">
                1
              </span>
              <div>
                <p className="text-sm text-text-primary">
                  텔레그램에서{" "}
                  <a
                    href="https://t.me/blosafe_alert_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0088cc] font-medium hover:underline"
                  >
                    @blosafe_alert_bot
                  </a>
                  을 검색하세요
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center size-6 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold shrink-0">
                2
              </span>
              <div>
                <p className="text-sm text-text-primary">
                  채팅창에서{" "}
                  <code className="px-1.5 py-0.5 rounded bg-bg-tertiary text-accent-primary text-xs font-num">
                    /start
                  </code>
                  {" "}를 전송하세요
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center size-6 rounded-full bg-accent-primary/10 text-accent-primary text-xs font-bold shrink-0">
                3
              </span>
              <div className="flex-1">
                <p className="text-sm text-text-primary mb-3">
                  봇이 전달한 6자리 인증 코드를 입력하세요
                </p>

                {/* OTP Input */}
                <div
                  className="flex items-center gap-2 justify-center"
                  onPaste={handlePaste}
                >
                  {digits.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputRefs.current[i] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(i, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(i, e)}
                      className={cn(
                        "w-10 h-12 text-center text-lg font-num font-bold rounded-lg border transition-colors",
                        "bg-bg-primary text-text-primary",
                        "focus:outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary",
                        error
                          ? "border-signal-danger"
                          : "border-border-default",
                      )}
                      aria-label={`코드 ${i + 1}번째 자리`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-xs text-signal-danger text-center mt-2">
                    {error}
                  </p>
                )}
              </div>
            </div>

            <p className="text-[10px] text-text-disabled text-center">
              코드를 받지 못하셨나요?{" "}
              <code className="text-text-secondary">/start</code>를 다시
              전송해보세요.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            취소
          </Button>
          <Button
            size="sm"
            onClick={() => handleVerify(code)}
            disabled={!canSubmit || verifyCode.isPending}
          >
            {verifyCode.isPending ? (
              <Loader2 className="size-3.5 animate-spin mr-1" />
            ) : (
              <CheckCircle className="size-3.5 mr-1" />
            )}
            인증하기
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   API Tab (unchanged from previous implementation)
   ══════════════════════════════════════════════════════════ */

function ApiTab({ enabled }: { enabled: boolean }) {
  const { data, createKey, deleteKey } = useApiKeys(enabled);
  const [secretModal, setSecretModal] = useState<{
    apiKey: string;
    apiSecret: string;
  } | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    "regenerate" | "delete" | null
  >(null);
  const [copied, setCopied] = useState<string | null>(null);

  const apiKey = data?.apiKey ?? null;
  const usage = data?.usage ?? { today: 0, limit: null, tier: "free" };

  const handleCreate = async () => {
    try {
      const result = await createKey.mutateAsync();
      setSecretModal({ apiKey: result.apiKey, apiSecret: result.apiSecret });
    } catch {
      // error handled
    }
  };

  const handleRegenerate = async () => {
    setConfirmAction(null);
    await handleCreate();
  };

  const handleDelete = async () => {
    if (!apiKey) return;
    setConfirmAction(null);
    try {
      await deleteKey.mutateAsync(apiKey.id);
    } catch {
      // error handled
    }
  };

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }, []);

  return (
    <div className="max-w-2xl flex flex-col gap-8">
      {/* Section 1: API Key Management */}
      <section className="bg-bg-secondary border border-border-default rounded-lg p-6">
        <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
          <Key className="size-4 text-accent-primary" />
          API 키 관리
        </h2>

        {apiKey ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-bg-primary/50 border border-border-default rounded-lg px-4 py-3">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-num text-text-primary">
                    {apiKey.maskedKey}
                  </code>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-signal-success/10 text-signal-success uppercase">
                    Active
                  </span>
                </div>
                <p className="text-[10px] text-text-disabled mt-1">
                  발급일:{" "}
                  {new Date(apiKey.createdAt).toLocaleDateString("ko-KR")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(apiKey.maskedKey, "key")}
              >
                {copied === "key" ? (
                  <CheckCircle className="size-3.5 mr-1 text-signal-success" />
                ) : (
                  <Copy className="size-3.5 mr-1" />
                )}
                복사
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmAction("regenerate")}
              >
                <RefreshCw className="size-3.5 mr-1" />
                재발급
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmAction("delete")}
                className="text-signal-danger hover:text-signal-danger hover:bg-signal-danger/10"
              >
                <Trash2 className="size-3.5 mr-1" />
                삭제
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="size-12 rounded-lg bg-bg-tertiary flex items-center justify-center">
              <Key className="size-6 text-text-disabled" />
            </div>
            <p className="text-sm text-text-secondary">API 키가 없습니다.</p>
            <Button onClick={handleCreate} disabled={createKey.isPending}>
              {createKey.isPending ? (
                <Loader2 className="size-4 animate-spin mr-1" />
              ) : (
                <Key className="size-4 mr-1" />
              )}
              API 키 발급
            </Button>
          </div>
        )}
      </section>

      {/* Section 2: API Usage */}
      <section className="bg-bg-secondary border border-border-default rounded-lg p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Zap className="size-4 text-accent-secondary" />
          API 사용량
        </h2>

        {usage.limit === null ? (
          <div className="flex items-center gap-2 text-sm">
            <InfinityIcon className="size-4 text-accent-secondary" />
            <span className="text-text-primary font-medium">무제한</span>
            <span className="text-text-secondary ml-2">
              오늘 {usage.today}회 사용
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">
                오늘 사용량:{" "}
                <span className="text-text-primary font-num font-medium">
                  {usage.today} / {usage.limit}
                </span>
                <span className="text-text-disabled ml-1">
                  (
                  {usage.limit > 0
                    ? Math.round((usage.today / usage.limit) * 100)
                    : 0}
                  %)
                </span>
              </span>
              <span className="text-xs text-text-disabled">
                {usage.limit - usage.today}회 남음
              </span>
            </div>
            <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  usage.today / (usage.limit || 1) >= 0.9
                    ? "bg-signal-danger"
                    : usage.today / (usage.limit || 1) >= 0.7
                      ? "bg-signal-warning"
                      : "bg-accent-primary",
                )}
                style={{
                  width: `${Math.min(100, (usage.today / (usage.limit || 1)) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[10px] text-text-disabled">
              매일 00:00 KST 초기화
            </p>
          </div>
        )}
      </section>

      {/* Section 3: API Usage Example */}
      <section className="bg-bg-secondary border border-border-default rounded-lg p-6">
        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Code className="size-4 text-text-secondary" />
          API 사용 예시
        </h2>
        <div className="relative bg-bg-primary rounded-lg p-4 overflow-x-auto">
          <pre className="text-xs font-num text-text-secondary leading-relaxed">
            <code>{`curl -H "X-API-Key: YOUR_API_KEY" \\
     -H "X-API-Secret: YOUR_API_SECRET" \\
     https://alphak.io/api/v1/alerts`}</code>
          </pre>
          <button
            type="button"
            onClick={() =>
              copyToClipboard(
                `curl -H "X-API-Key: YOUR_API_KEY" -H "X-API-Secret: YOUR_API_SECRET" https://alphak.io/api/v1/alerts`,
                "snippet",
              )
            }
            className="absolute top-2 right-2 p-1.5 rounded bg-bg-tertiary hover:bg-bg-tertiary/80 transition-colors"
            aria-label="코드 복사"
          >
            {copied === "snippet" ? (
              <CheckCircle className="size-3.5 text-signal-success" />
            ) : (
              <Copy className="size-3.5 text-text-disabled" />
            )}
          </button>
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" disabled>
            <ExternalLink className="size-3.5 mr-1" />
            API 문서 보기
          </Button>
          <span className="text-[10px] text-text-disabled ml-2">
            Coming Soon
          </span>
        </div>
      </section>

      {/* Secret Modal */}
      <Modal open={!!secretModal} onClose={() => setSecretModal(null)}>
        <ModalContent>
          <ModalHeader>API 키 발급 완료</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-signal-warning/10 border border-signal-warning/20">
                <AlertTriangle className="size-4 text-signal-warning shrink-0 mt-0.5" />
                <p className="text-xs text-signal-warning">
                  API Secret은 이 화면에서만 확인 가능합니다. 반드시 안전한 곳에
                  저장하세요.
                </p>
              </div>

              <div>
                <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">
                  API Key
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-num bg-bg-primary border border-border-default rounded px-3 py-2 text-text-primary break-all">
                    {secretModal?.apiKey}
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      secretModal &&
                      copyToClipboard(secretModal.apiKey, "modal-key")
                    }
                    className="p-2 rounded bg-bg-tertiary hover:bg-bg-tertiary/80"
                  >
                    {copied === "modal-key" ? (
                      <CheckCircle className="size-3.5 text-signal-success" />
                    ) : (
                      <Copy className="size-3.5 text-text-secondary" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">
                  API Secret
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-num bg-bg-primary border border-border-default rounded px-3 py-2 text-text-primary break-all">
                    {secretModal?.apiSecret}
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      secretModal &&
                      copyToClipboard(secretModal.apiSecret, "modal-secret")
                    }
                    className="p-2 rounded bg-bg-tertiary hover:bg-bg-tertiary/80"
                  >
                    {copied === "modal-secret" ? (
                      <CheckCircle className="size-3.5 text-signal-success" />
                    ) : (
                      <Copy className="size-3.5 text-text-secondary" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button onClick={() => setSecretModal(null)}>확인</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirm Modal */}
      <Modal open={!!confirmAction} onClose={() => setConfirmAction(null)}>
        <ModalContent>
          <ModalHeader>
            {confirmAction === "regenerate" ? "API 키 재발급" : "API 키 삭제"}
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-text-secondary">
              {confirmAction === "regenerate"
                ? "기존 API 키가 즉시 무효화됩니다. 진행하시겠습니까?"
                : "API 키를 삭제하면 모든 API 접근이 차단됩니다."}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmAction(null)}
            >
              취소
            </Button>
            <Button
              variant={confirmAction === "delete" ? "danger" : "primary"}
              size="sm"
              onClick={
                confirmAction === "regenerate" ? handleRegenerate : handleDelete
              }
              disabled={createKey.isPending || deleteKey.isPending}
            >
              {(createKey.isPending || deleteKey.isPending) && (
                <Loader2 className="size-3.5 animate-spin mr-1" />
              )}
              {confirmAction === "regenerate" ? "재발급" : "삭제"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Channel Card
   ══════════════════════════════════════════════════════════ */

function ChannelCard({
  icon,
  name,
  detail,
  connected,
  iconColor,
  iconBg,
  locked,
}: {
  icon: React.ReactNode;
  name: string;
  detail?: string | null;
  connected: boolean;
  iconColor: string;
  iconBg: string;
  locked?: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-bg-secondary border rounded-lg p-4",
        locked
          ? "border-dashed border-border-default opacity-70"
          : "border-border-default",
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div
          className={cn(
            "size-9 rounded-lg flex items-center justify-center",
            iconBg,
            iconColor,
          )}
        >
          {icon}
        </div>
        <span
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
            connected
              ? "bg-signal-success/10 text-signal-success"
              : "bg-text-secondary/10 text-text-secondary",
          )}
        >
          {connected ? "Connected" : "Inactive"}
        </span>
      </div>
      <h3 className="text-sm font-semibold mb-0.5">{name}</h3>
      <p className="text-xs text-text-secondary font-num truncate">
        {detail ?? "Not configured"}
      </p>
    </div>
  );
}
