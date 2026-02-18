"use client";

import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  X,
  Zap,
  Crown,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS } from "@/lib/lemonsqueezy/plans";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem } from "@/components/ui/accordion";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@/components/ui/modal";
import { Toast } from "@/components/ui/toast";
import { useAuthStore } from "@/stores/auth-store";
import { useSubscription } from "@/hooks/use-subscription";
import { LoginPromptModal } from "@/components/login-prompt-modal";

type Interval = "monthly" | "yearly";

/* ── Comparison table data ── */
const COMPARISON_ROWS: {
  feature: string;
  free: string | boolean;
  pro: string | boolean;
  whale: string | boolean;
}[] = [
  { feature: "알림 규칙", free: "3개", pro: "무제한", whale: "무제한" },
  { feature: "알림 지연", free: "5분 지연", pro: "실시간", whale: "<10초" },
  { feature: "급등 레이더", free: "상위 5개", pro: "전체", whale: "전체" },
  { feature: "상장 알림", free: "30분 지연", pro: "즉시", whale: "즉시" },
  { feature: "시그널 타임프레임", free: false, pro: "1D", whale: "4H / 1D / 1W" },
  { feature: "고래 추적", free: "20건 + 5분 지연", pro: "전체 실시간", whale: "전체 실시간" },
  { feature: "워치리스트", free: "5코인", pro: "무제한", whale: "무제한" },
  { feature: "텔레그램 & 디스코드", free: false, pro: true, whale: true },
  { feature: "SMS & 전화 알림", free: false, pro: false, whale: true },
  { feature: "API 접근", free: false, pro: "1,000/일", whale: "무제한" },
  { feature: "커스텀 웹훅", free: false, pro: false, whale: true },
  { feature: "지원", free: "커뮤니티", pro: "24시간 우선", whale: "전담 매니저" },
];

/* ── FAQ items ── */
const FAQ_ITEMS = [
  {
    q: "언제든 플랜을 변경할 수 있나요?",
    a: "네. 업그레이드는 즉시 적용되며 차액만 결제됩니다. 다운그레이드는 현재 결제 기간 종료 후 적용됩니다. 위약금은 없습니다.",
  },
  {
    q: "어떤 결제 수단을 지원하나요?",
    a: "Visa, Mastercard, Amex 등 주요 신용/체크카드와 PayPal을 지원합니다. Lemon Squeezy를 통해 안전하게 처리됩니다.",
  },
  {
    q: "무료 체험이 있나요?",
    a: "Free 플랜은 기간 제한 없이 사용 가능합니다. Pro와 Whale 플랜은 7일 무료 체험이 포함되어 모든 기능을 먼저 평가할 수 있습니다.",
  },
  {
    q: "언제든 해지할 수 있나요?",
    a: "물론입니다. 약정이나 위약금이 없습니다. Billing 페이지에서 해지하면 현재 결제 기간 종료까지 모든 기능을 이용할 수 있습니다.",
  },
];

/* ── Feature lists ── */
const PRO_FEATURES = [
  "무제한 알림 규칙",
  "실시간 즉시 알림",
  "텔레그램 & 디스코드 연동",
  "상장 알림 즉시 확인",
  "급등 레이더 전체 보기",
  "1D 트레이딩 시그널",
  "API 1,000회/일",
];

const WHALE_FEATURES = [
  "Pro의 모든 기능 포함",
  "<10초 블록 지연 알림",
  "SMS & 전화 알림",
  "4H / 1D / 1W 시그널",
  "무제한 API 접근",
  "커스텀 웹훅",
  "전담 매니저",
];

/* ── Date formatter ── */
function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/* ══════════════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════════════ */

export default function BillingPage() {
  return (
    <Suspense>
      <BillingContent />
    </Suspense>
  );
}

function BillingContent() {
  const [interval, setInterval] = useState<Interval>("monthly");
  const [loginModal, setLoginModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [toast, setToast] = useState<{ variant: "success" | "error" | "warning" | "info"; message: string } | null>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const user = useAuthStore((s) => s.user);
  const tier = useAuthStore((s) => s.tier);
  const isPaid = tier === "pro" || tier === "whale";

  const { subscription, cancelSubscription, refetch } = useSubscription(!!user && isPaid);

  /* ── Dynamic page title ── */
  useEffect(() => {
    document.title = isPaid ? "구독 관리 — Alpha K" : "요금제 — Alpha K";
  }, [isPaid]);

  /* ── Checkout success detection ── */
  useEffect(() => {
    if (searchParams.get("success") !== "true") return;

    setToast({ variant: "success", message: "구독이 활성화되었습니다! 환영합니다." });

    // Remove ?success=true from URL
    router.replace("/billing", { scroll: false });

    // Poll for subscription update (webhook may take a moment)
    let attempts = 0;
    const maxAttempts = 5;
    const pollInterval = window.setInterval(() => {
      attempts++;
      refetch();
      if (attempts >= maxAttempts) clearInterval(pollInterval);
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [searchParams, router, refetch]);

  const proPlan = PLANS.find((p) => p.tier === "pro")!;
  const whalePlan = PLANS.find((p) => p.tier === "whale")!;

  const proPrice = interval === "monthly" ? proPlan.monthly.price : proPlan.yearly.price;
  const whalePrice = interval === "monthly" ? whalePlan.monthly.price : whalePlan.yearly.price;
  const period = interval === "monthly" ? "/월" : "/년";
  const formatKRW = (n: number) => n === 0 ? "무료" : `₩${n.toLocaleString("ko-KR")}`;

  const handleCheckout = useCallback(
    async (targetTier: "pro" | "whale") => {
      if (!user) {
        setLoginModal(true);
        return;
      }

      const plan = targetTier === "pro" ? proPlan : whalePlan;
      const variant = interval === "monthly" ? plan.monthly : plan.yearly;

      if (!variant.variantId) {
        setToast({ variant: "warning", message: "결제가 아직 설정되지 않았습니다. 나중에 다시 시도해주세요." });
        return;
      }

      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variantId: variant.variantId,
            email: user.email,
            userId: user.id,
          }),
        });

        if (!res.ok) throw new Error("Checkout failed");
        const { url } = (await res.json()) as { url: string };

        if (typeof window !== "undefined" && window.LemonSqueezy) {
          window.LemonSqueezy.Url.Open(url);
        } else {
          window.location.href = url;
        }
      } catch (err) {
        console.error("Checkout error:", err);
      }
    },
    [user, interval, proPlan, whalePlan, router]
  );

  const handleCancel = useCallback(async () => {
    try {
      await cancelSubscription.mutateAsync();
      setCancelModal(false);
      setToast({ variant: "info", message: "구독이 해지되었습니다. 결제 기간 종료까지 기능을 이용할 수 있습니다." });
    } catch (err) {
      console.error("Cancel error:", err);
      setToast({ variant: "error", message: "구독 해지에 실패했습니다. 다시 시도해주세요." });
    }
  }, [cancelSubscription]);

  const scrollToPricing = () => {
    pricingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getCtaState = (targetTier: "pro" | "whale") => {
    if (!user) return { label: "시작하기", disabled: false };
    if (tier === targetTier) return { label: "현재 플랜", disabled: true };
    if (tier === "whale" && targetTier === "pro") return { label: "현재: Whale", disabled: true };
    return { label: targetTier === "pro" ? "Pro 업그레이드" : "Whale 업그레이드", disabled: false };
  };

  const proCta = getCtaState("pro");
  const whaleCta = getCtaState("whale");

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 md:p-6 flex flex-col gap-10 max-w-[1100px] w-full mx-auto">

        {/* ══ Subscription Management Card ══ */}
        {user && isPaid && (
          <SubscriptionCard
            subscription={subscription}
            tier={tier!}
            onChangePlan={scrollToPricing}
            onManage={() => {
              if (subscription?.customerPortalUrl) {
                window.open(subscription.customerPortalUrl, "_blank");
              }
            }}
            onCancel={() => setCancelModal(true)}
          />
        )}

        {/* ── Header ── */}
        <div className="text-center pt-2 md:pt-6" ref={pricingRef}>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight">
            {isPaid ? "플랜 변경" : "요금제 선택"}
          </h1>
          <p className="mt-2 text-sm text-text-secondary max-w-md mx-auto">
            실시간 고래 알림, DeFi 모니터링, 트레이딩 시그널.
            언제든 업그레이드 가능합니다.
          </p>

          {/* Interval Toggle */}
          <div className="mt-6 inline-flex items-center gap-1 p-1 bg-bg-secondary rounded-lg border border-border-default">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                interval === "monthly"
                  ? "bg-bg-tertiary text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              월간
            </button>
            <button
              type="button"
              onClick={() => setInterval("yearly")}
              className={cn(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-colors",
                interval === "yearly"
                  ? "bg-bg-tertiary text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              연간
              <span className="ml-1.5 text-[10px] text-signal-success font-bold">
                20% 할인
              </span>
            </button>
          </div>
        </div>

        {/* ── Pricing Cards — 2 columns ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pro Card — amber/gold accent */}
          <div className="relative flex flex-col rounded-[12px] border border-border-default bg-bg-secondary p-8">
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-accent-primary" />
              <h3 className="text-[16px] font-semibold text-text-primary">PRO</h3>
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-[32px] font-bold font-num text-text-primary">
                {formatKRW(proPrice)}
              </span>
              <span className="text-[14px] text-text-secondary">{period}</span>
            </div>

            <p className="text-[13px] text-text-secondary mt-2">
              적극적인 트레이더를 위한 프로 도구.
            </p>

            <Button
              variant={proCta.disabled ? "outline" : "primary"}
              disabled={proCta.disabled}
              onClick={() => handleCheckout("pro")}
              className="w-full mt-6"
            >
              {proCta.label}
            </Button>

            <ul className="mt-6 space-y-3 flex-1" aria-label="Pro features">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 mt-0.5 text-accent-primary shrink-0" />
                  <span className="text-[13px] text-text-secondary">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Whale Card — cyan/teal accent */}
          <div className="relative flex flex-col rounded-[12px] border-2 border-accent-secondary bg-bg-secondary p-8">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-accent-secondary text-white text-[11px] font-bold uppercase px-3 py-1 rounded-full">
              추천
            </span>

            <div className="flex items-center gap-2">
              <Crown className="size-5 text-accent-secondary" />
              <h3 className="text-[16px] font-semibold text-text-primary">WHALE</h3>
            </div>

            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-[32px] font-bold font-num text-text-primary">
                {formatKRW(whalePrice)}
              </span>
              <span className="text-[14px] text-text-secondary">{period}</span>
            </div>

            <p className="text-[13px] text-text-secondary mt-2">
              대량 운용을 위한 기관급 속도와 기능.
            </p>

            <Button
              variant={whaleCta.disabled ? "outline" : "secondary"}
              disabled={whaleCta.disabled}
              onClick={() => handleCheckout("whale")}
              className="w-full mt-6"
            >
              {whaleCta.label}
            </Button>

            <ul className="mt-6 space-y-3 flex-1" aria-label="Whale features">
              {WHALE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 mt-0.5 text-accent-secondary shrink-0" />
                  <span className="text-[13px] text-text-secondary">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Comparison Table ── */}
        <div>
          <h2 className="text-lg font-bold text-text-primary text-center mb-6">
            플랜 비교
          </h2>
          <div className="bg-bg-secondary border border-border-default rounded-[12px] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="px-6 py-4 text-left text-text-secondary font-medium text-xs uppercase tracking-wider">
                      기능
                    </th>
                    <th className="px-6 py-4 text-center text-text-secondary font-medium text-xs uppercase tracking-wider">
                      Free
                    </th>
                    <th className="px-6 py-4 text-center font-medium text-xs uppercase tracking-wider text-accent-primary">
                      Pro
                    </th>
                    <th className="px-6 py-4 text-center font-medium text-xs uppercase tracking-wider text-accent-secondary">
                      Whale
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON_ROWS.map((row) => (
                    <tr
                      key={row.feature}
                      className="border-b border-border-default/50 last:border-0"
                    >
                      <td className="px-6 py-3.5 text-text-primary text-[13px]">
                        {row.feature}
                      </td>
                      <ComparisonCell value={row.free} />
                      <ComparisonCell value={row.pro} accent="amber" />
                      <ComparisonCell value={row.whale} accent="cyan" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="pb-8">
          <h2 className="text-lg font-bold text-text-primary text-center mb-6">
            자주 묻는 질문
          </h2>
          <div className="max-w-[700px] mx-auto">
            <Accordion>
              {FAQ_ITEMS.map((item) => (
                <AccordionItem key={item.q} title={item.q}>
                  {item.a}
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        open={loginModal}
        onClose={() => setLoginModal(false)}
        message="플랜을 구독하려면 로그인이 필요합니다"
      />

      {/* Cancel Confirmation Modal */}
      <CancelModal
        open={cancelModal}
        loading={cancelSubscription.isPending}
        onConfirm={handleCancel}
        onClose={() => setCancelModal(false)}
      />

      {/* Toast */}
      {toast && (
        <Toast
          variant={toast.variant}
          message={toast.message}
          visible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Subscription Management Card
   ══════════════════════════════════════════════════════════ */

function SubscriptionCard({
  subscription,
  tier,
  onChangePlan,
  onManage,
  onCancel,
}: {
  subscription: ReturnType<typeof useSubscription>["subscription"];
  tier: string;
  onChangePlan: () => void;
  onManage: () => void;
  onCancel: () => void;
}) {
  const isWhale = tier === "whale";
  const borderColor = isWhale ? "border-l-accent-secondary" : "border-l-accent-primary";
  const badgeBg = isWhale ? "bg-accent-secondary/15 text-accent-secondary" : "bg-accent-primary/15 text-accent-primary";

  const isCancelled = subscription?.cancelled;
  const statusLabel = isCancelled ? "해지 예정" : "활성";
  const statusColor = isCancelled ? "text-signal-warning" : "text-signal-success";

  const amount = subscription?.amount;
  const intervalLabel = subscription?.interval === "yearly" ? "/년" : "/월";

  return (
    <div
      className={cn(
        "bg-bg-secondary border border-border-default rounded-[12px] border-l-[3px] p-6",
        borderColor
      )}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        {/* Left: Plan info */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-text-primary">
              현재 플랜: {tier === "whale" ? "Whale" : "Pro"}
            </h2>
            <span className={cn("text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full", badgeBg)}>
              {tier.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">상태:</span>
              <span className={cn("font-medium", statusColor)}>
                {statusLabel}
              </span>
              {isCancelled && subscription?.endsAt && (
                <span className="text-text-disabled text-xs">
                  — {formatDate(subscription.endsAt)} 만료
                </span>
              )}
            </div>

            {subscription?.renewsAt && !isCancelled && (
              <div>
                <span className="text-text-secondary">다음 결제: </span>
                <span className="text-text-primary font-num">
                  {formatDate(subscription.renewsAt)}
                </span>
              </div>
            )}

            {amount != null && (
              <div>
                <span className="text-text-secondary">금액: </span>
                <span className="text-text-primary font-num font-medium">
                  ₩{typeof amount === "number" ? amount.toLocaleString("ko-KR") : amount}{intervalLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Button variant="outline" size="sm" onClick={onChangePlan}>
            플랜 변경
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onManage}
            disabled={!subscription?.customerPortalUrl}
          >
            구독 관리
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
          {!isCancelled && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="text-signal-danger hover:text-signal-danger hover:bg-signal-danger/10">
              구독 해지
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Cancel Confirmation Modal
   ══════════════════════════════════════════════════════════ */

function CancelModal({
  open,
  loading,
  onConfirm,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent>
        <ModalHeader>구독 해지</ModalHeader>
        <ModalBody>
          <div className="text-sm text-text-secondary space-y-4">
            <p>
              정말 구독을 해지하시겠습니까?
            </p>
            <p>
              현재 결제 기간 종료까지 모든 프리미엄 기능을 계속 이용할 수 있습니다.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="primary" size="sm" onClick={onClose} disabled={loading}>
            구독 유지
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onConfirm}
            disabled={loading}
            className="text-signal-danger border-signal-danger/40 hover:bg-signal-danger/10"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                해지 중...
              </>
            ) : (
              "구독 해지"
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════
   Comparison Cell Helper
   ══════════════════════════════════════════════════════════ */

function ComparisonCell({
  value,
  accent,
}: {
  value: string | boolean;
  accent?: "amber" | "cyan";
}) {
  if (typeof value === "boolean") {
    return (
      <td className="px-6 py-3.5 text-center">
        {value ? (
          <Check
            className={cn(
              "w-4 h-4 mx-auto",
              accent === "amber"
                ? "text-accent-primary"
                : accent === "cyan"
                  ? "text-accent-secondary"
                  : "text-signal-success"
            )}
          />
        ) : (
          <X className="w-4 h-4 mx-auto text-text-disabled" />
        )}
      </td>
    );
  }

  return (
    <td
      className={cn(
        "px-6 py-3.5 text-center text-[13px] font-num",
        accent === "amber"
          ? "text-accent-primary"
          : accent === "cyan"
            ? "text-accent-secondary"
            : "text-text-secondary"
      )}
    >
      {value}
    </td>
  );
}

/* ── Extend Window for Lemon Squeezy ── */
declare global {
  interface Window {
    LemonSqueezy?: {
      Url: {
        Open: (url: string) => void;
      };
    };
  }
}
