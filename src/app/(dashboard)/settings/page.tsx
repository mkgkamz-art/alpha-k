"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  Send,
  Mail,
  Smartphone,
  Loader2,
  Save,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";
import {
  Tabs,
  TabList,
  TabTrigger,
  TabContent,
  Input,
  Toggle,
  Button,
} from "@/components/ui";
import type { AlertType } from "@/types";

/* ── Notification Channel Types ── */
const channels = ["push", "telegram", "discord", "email", "sms"] as const;
type Channel = (typeof channels)[number];

const alertTypeRows: { type: AlertType; label: string; desc: string }[] = [
  { type: "whale", label: "Whale Movement", desc: "Transactions > $100k" },
  { type: "risk", label: "Risk Alert", desc: "Security & exploits" },
  { type: "price_signal", label: "Price Signal", desc: "Volatility & breakout" },
  { type: "token_unlock", label: "Token Unlock", desc: "Vesting schedule events" },
  { type: "liquidity", label: "Liquidity", desc: "Pool adds & removals" },
];

export default function SettingsPage() {
  const { settings, isLoading, updateSettings } = useSettings();

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
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-6 text-text-secondary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-[1440px] w-full mx-auto">
        <h1 className="text-xl font-bold">Account Settings</h1>

        <Tabs defaultValue="notifications">
          <TabList>
            <TabTrigger value="profile">Profile</TabTrigger>
            <TabTrigger value="notifications">Notifications</TabTrigger>
            <TabTrigger value="integrations">Integrations</TabTrigger>
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
                    Global Preferences
                  </h2>
                  <div className="flex flex-col gap-5">
                    {/* Quiet Hours */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Quiet Hours</p>
                        <p className="text-xs text-text-secondary">
                          Mute all notifications during specific times.
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
                            Start
                          </label>
                          <Input
                            value={quietStart}
                            onChange={(e) => setQuietStart(e.target.value)}
                            placeholder="22:00"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[10px] text-text-secondary uppercase font-bold mb-1 block">
                            End
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
                        <p className="text-sm font-medium">Max Alerts Per Hour</p>
                        <p className="text-xs text-text-secondary">
                          Prevent notification fatigue.
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
                    detail={settings?.telegram_chat_id ? `Chat: ${settings.telegram_chat_id}` : undefined}
                    connected={!!settings?.telegram_chat_id}
                    iconColor="text-[#0088cc]"
                    iconBg="bg-[#0088cc]/20"
                  />
                  <ChannelCard
                    icon={<Bell className="size-5" />}
                    name="Discord"
                    detail={settings?.discord_webhook_url ? "Webhook active" : undefined}
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
              </div>

              {/* Right: Notification Matrix */}
              <div className="col-span-12 lg:col-span-7">
                <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
                  <div className="p-5 border-b border-border-default flex items-center justify-between">
                    <h2 className="text-base font-semibold flex items-center gap-2">
                      <Bell className="size-4 text-accent-primary" />
                      Notification Preferences
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-bg-primary/30">
                          <th className="p-4 text-[10px] uppercase font-bold text-text-secondary tracking-wider border-b border-border-default">
                            Event Type
                          </th>
                          {channels.map((ch) => (
                            <th
                              key={ch}
                              className="p-4 text-[10px] uppercase font-bold text-text-secondary tracking-wider border-b border-border-default text-center"
                            >
                              {ch}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default/50">
                        {alertTypeRows.map((row) => (
                          <tr
                            key={row.type}
                            className="hover:bg-bg-tertiary/20 transition-colors"
                          >
                            <td className="p-4">
                              <p className="text-sm font-medium">{row.label}</p>
                              <p className="text-[10px] text-text-secondary">
                                {row.desc}
                              </p>
                            </td>
                            {channels.map((ch) => {
                              const isSms = ch === "sms";
                              const locked =
                                isSms &&
                                settings?.subscription_tier !== "whale";
                              return (
                                <td key={ch} className="p-4 text-center">
                                  <input
                                    type="checkbox"
                                    disabled={locked}
                                    defaultChecked={
                                      !locked && (ch === "push" || ch === "telegram")
                                    }
                                    className={cn(
                                      "rounded-sm h-4 w-4",
                                      locked
                                        ? "bg-bg-tertiary/50 border-none cursor-not-allowed opacity-30"
                                        : "bg-bg-tertiary border-none text-accent-primary focus:ring-accent-primary cursor-pointer"
                                    )}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Save Bar */}
                <div className="mt-6 flex items-center justify-between p-5 bg-bg-secondary border border-border-default rounded-lg">
                  <p className="text-xs text-text-secondary">
                    Changes are applied immediately to all active webhooks.
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
                    {saved ? "Saved" : "Save Changes"}
                  </Button>
                </div>
              </div>
            </div>
          </TabContent>

          {/* ── Integrations Tab ── */}
          <TabContent value="integrations">
            <div className="max-w-lg flex flex-col gap-5">
              <div>
                <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                  Discord Webhook URL
                </label>
                <Input
                  defaultValue={settings?.discord_webhook_url ?? ""}
                  placeholder="https://discord.com/api/webhooks/..."
                />
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                  Telegram
                </label>
                <p className="text-sm text-text-secondary">
                  {settings?.telegram_chat_id
                    ? `Connected (Chat ID: ${settings.telegram_chat_id})`
                    : "Not connected. Use /start in @blosafe_bot to link your account."}
                </p>
              </div>
              <div>
                <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                  Phone Number (SMS — Whale only)
                </label>
                <Input
                  defaultValue={settings?.phone_number ?? ""}
                  placeholder="+1234567890"
                  disabled={settings?.subscription_tier !== "whale"}
                />
              </div>
            </div>
          </TabContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ── Channel Card ── */
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
        locked ? "border-dashed border-border-default opacity-70" : "border-border-default"
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div
          className={cn("size-9 rounded-lg flex items-center justify-center", iconBg, iconColor)}
        >
          {icon}
        </div>
        <span
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
            connected
              ? "bg-signal-success/10 text-signal-success"
              : "bg-text-secondary/10 text-text-secondary"
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
