"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Waves,
  AlertTriangle,
  TrendingUp,
  Unlock,
  Droplets,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRules } from "@/hooks/use-rules";
import {
  Button,
  Input,
  Select,
  Toggle,
  ButtonGroup,
} from "@/components/ui";
import type { AlertType } from "@/types";

/* ── Type Cards ── */
const alertTypes: {
  type: AlertType;
  label: string;
  description: string;
  icon: typeof Waves;
  color: string;
  bgTint: string;
}[] = [
  {
    type: "whale",
    label: "Whale Movement",
    description: "Track large transactions and wallet movements",
    icon: Waves,
    color: "text-signal-info",
    bgTint: "bg-signal-info/10 border-signal-info/20",
  },
  {
    type: "risk",
    label: "Risk Alert",
    description: "Security exploits, rug pulls, and protocol risks",
    icon: AlertTriangle,
    color: "text-signal-danger",
    bgTint: "bg-signal-danger/10 border-signal-danger/20",
  },
  {
    type: "price_signal",
    label: "Price Signal",
    description: "Price breakouts, volatility spikes, and momentum shifts",
    icon: TrendingUp,
    color: "text-signal-success",
    bgTint: "bg-signal-success/10 border-signal-success/20",
  },
  {
    type: "token_unlock",
    label: "Token Unlock",
    description: "Upcoming vesting schedules and token release events",
    icon: Unlock,
    color: "text-signal-warning",
    bgTint: "bg-signal-warning/10 border-signal-warning/20",
  },
  {
    type: "liquidity",
    label: "Liquidity Change",
    description: "Pool additions, removals, and TVL shifts",
    icon: Droplets,
    color: "text-[#8B5CF6]",
    bgTint: "bg-[#8B5CF6]/10 border-[#8B5CF6]/20",
  },
];

const STEPS = ["Type", "Conditions", "Delivery"] as const;

export default function NewAlertRulePage() {
  const router = useRouter();
  const { createRule } = useRules();
  const [step, setStep] = useState(0);

  // Step 1: Type
  const [selectedType, setSelectedType] = useState<AlertType | null>(null);

  // Step 2: Conditions
  const [ruleName, setRuleName] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [direction, setDirection] = useState("both");
  const [cooldown, setCooldown] = useState("30");
  const [tokenFilter, setTokenFilter] = useState("");

  // Step 3: Delivery
  const [channels, setChannels] = useState<Record<string, boolean>>({
    push: true,
    telegram: false,
    discord: false,
    email: false,
    sms: false,
  });

  const canNext =
    step === 0
      ? selectedType !== null
      : step === 1
        ? ruleName.trim().length > 0
        : true;

  const handleCreate = () => {
    if (!selectedType || !ruleName.trim()) return;

    const conditions: Record<string, unknown> = {};
    if (minAmount) conditions.min_amount = Number(minAmount);
    if (direction !== "both") conditions.direction = direction;
    if (tokenFilter) conditions.token = tokenFilter;

    createRule.mutate(
      {
        name: ruleName,
        type: selectedType,
        conditions,
        delivery_channels: channels,
        cooldown_minutes: Number(cooldown),
      },
      {
        onSuccess: () => router.push("/alerts"),
      }
    );
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-6 max-w-3xl w-full mx-auto">
        {/* Progress Bar */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={cn(
                  "size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border transition-colors",
                  i < step
                    ? "bg-accent-primary text-bg-primary border-accent-primary"
                    : i === step
                      ? "border-accent-primary text-accent-primary bg-accent-primary/10"
                      : "border-border-default text-text-disabled bg-bg-secondary"
                )}
              >
                {i < step ? <Check className="size-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  i <= step ? "text-text-primary" : "text-text-disabled"
                )}
              >
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px",
                    i < step ? "bg-accent-primary" : "bg-border-default"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Type Selection */}
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-bold">Select Alert Type</h2>
            <p className="text-sm text-text-secondary">
              Choose the type of on-chain activity you want to monitor.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {alertTypes.map((at) => {
                const Icon = at.icon;
                const isSelected = selectedType === at.type;
                return (
                  <button
                    key={at.type}
                    type="button"
                    onClick={() => setSelectedType(at.type)}
                    className={cn(
                      "flex items-start gap-4 p-4 rounded-lg border transition-all text-left",
                      isSelected
                        ? "border-accent-primary bg-accent-primary/5"
                        : "border-border-default bg-bg-secondary hover:border-text-disabled"
                    )}
                  >
                    <div
                      className={cn(
                        "size-10 rounded-lg flex items-center justify-center shrink-0 border",
                        at.bgTint
                      )}
                    >
                      <Icon className={cn("size-5", at.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-text-primary">{at.label}</p>
                      <p className="text-xs text-text-secondary mt-1">{at.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Conditions */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-bold">Configure Conditions</h2>
            <p className="text-sm text-text-secondary">
              Define the conditions that will trigger this alert.
            </p>

            <div>
              <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                Rule Name *
              </label>
              <Input
                placeholder="e.g. Large BTC Whale Transfer"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                Token Filter
              </label>
              <Input
                placeholder="e.g. BTC, ETH (leave empty for all)"
                value={tokenFilter}
                onChange={(e) => setTokenFilter(e.target.value)}
              />
            </div>

            {(selectedType === "whale" || selectedType === "liquidity") && (
              <div>
                <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                  Minimum Amount (USD)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 100000"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
              </div>
            )}

            {selectedType === "whale" && (
              <div>
                <label className="text-xs text-text-secondary uppercase font-bold mb-2 block">
                  Direction
                </label>
                <ButtonGroup
                  options={[
                    { value: "both", label: "Both" },
                    { value: "inflow", label: "Inflow" },
                    { value: "outflow", label: "Outflow" },
                  ]}
                  value={direction}
                  onChange={setDirection}
                />
              </div>
            )}

            <div>
              <label className="text-xs text-text-secondary uppercase font-bold mb-1 block">
                Cooldown
              </label>
              <Select
                value={cooldown}
                onChange={(e) => setCooldown(e.target.value)}
              >
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="240">4 hours</option>
                <option value="1440">24 hours</option>
              </Select>
            </div>
          </div>
        )}

        {/* Step 3: Delivery */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h2 className="text-lg font-bold">Delivery Channels</h2>
            <p className="text-sm text-text-secondary">
              Choose how you want to receive this alert.
            </p>

            <div className="flex flex-col gap-3">
              {[
                { key: "push", label: "Push Notification", desc: "Browser & mobile push" },
                { key: "telegram", label: "Telegram", desc: "Via @blosafe_bot" },
                { key: "discord", label: "Discord", desc: "Via webhook" },
                { key: "email", label: "Email", desc: "To your registered email" },
                { key: "sms", label: "SMS", desc: "Whale plan only", locked: true },
              ].map((ch) => (
                <div
                  key={ch.key}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border",
                    ch.locked
                      ? "border-border-default/50 bg-bg-secondary/50 opacity-60"
                      : "border-border-default bg-bg-secondary"
                  )}
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{ch.label}</p>
                    <p className="text-xs text-text-secondary">{ch.desc}</p>
                  </div>
                  <Toggle
                    pressed={channels[ch.key] ?? false}
                    onPressedChange={(v) =>
                      !ch.locked &&
                      setChannels((prev) => ({ ...prev, [ch.key]: v }))
                    }
                    disabled={ch.locked}
                  />
                </div>
              ))}
            </div>

            {/* Preview */}
            {selectedType && (
              <div className="bg-bg-tertiary border border-border-default rounded-lg p-4">
                <p className="text-xs text-text-secondary uppercase font-bold mb-2">
                  Alert Preview
                </p>
                <p className="text-sm text-text-primary font-medium">
                  {ruleName || "Untitled Rule"}
                </p>
                <p className="text-xs text-text-secondary mt-1">
                  Type: {selectedType} | Cooldown: {cooldown}min |
                  Channels: {Object.entries(channels)
                    .filter(([, v]) => v)
                    .map(([k]) => k)
                    .join(", ") || "none"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-border-default">
          <Button
            variant="ghost"
            onClick={() => (step === 0 ? router.push("/alerts") : setStep(step - 1))}
          >
            <ArrowLeft className="size-4 mr-1" />
            {step === 0 ? "Cancel" : "Back"}
          </Button>

          {step < 2 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
              Next
              <ArrowRight className="size-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleCreate}
              disabled={createRule.isPending || !canNext}
            >
              {createRule.isPending ? (
                <Loader2 className="size-4 animate-spin mr-1" />
              ) : (
                <Check className="size-4 mr-1" />
              )}
              Create Alert Rule
            </Button>
          )}
        </div>

        {createRule.isError && (
          <p className="text-sm text-signal-danger text-center">
            {createRule.error.message}
          </p>
        )}
      </div>
    </div>
  );
}
