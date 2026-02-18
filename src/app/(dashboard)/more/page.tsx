import Link from "next/link";
import {
  Fish,
  BarChart3,
  Shield,
  Unlock,
  Droplets,
  Flag,
  Zap,
  Star,
  Settings,
  Gem,
} from "lucide-react";

const moreItems = [
  { href: "/kimchi", label: "김치프리미엄", icon: Flag },
  { href: "/listing", label: "상장 알림", icon: Zap },
  { href: "/whale", label: "고래 추적", icon: Fish },
  { href: "/signals", label: "시그널", icon: BarChart3 },
  { href: "/risk", label: "DeFi 리스크", icon: Shield },
  { href: "/unlocks", label: "토큰 언락", icon: Unlock },
  { href: "/liquidity", label: "유동성", icon: Droplets },
  { href: "/watchlist", label: "워치리스트", icon: Star },
  { href: "/settings", label: "설정", icon: Settings },
  { href: "/billing", label: "구독 관리", icon: Gem },
];

export default function MorePage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-[20px] font-semibold mb-4">더보기</h1>
      <div className="space-y-1">
        {moreItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 h-12 px-3 rounded-[8px] hover:bg-bg-secondary transition-colors"
          >
            <item.icon className="w-5 h-5 text-text-secondary" />
            <span className="text-[14px] text-text-primary">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
