import Link from "next/link";
import {
  Unlock,
  ShieldAlert,
  Settings,
  CreditCard,
  Key,
  HelpCircle,
} from "lucide-react";

const moreItems = [
  { href: "/unlocks", label: "Token Unlocks", icon: Unlock },
  { href: "/defi-risk", label: "DeFi Risk", icon: ShieldAlert },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/settings", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "API Keys", icon: Key },
  { href: "/settings", label: "Help", icon: HelpCircle },
];

export default function MorePage() {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-[20px] font-semibold mb-4">More</h1>
      <div className="space-y-1">
        {moreItems.map((item) => (
          <Link
            key={item.label}
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
