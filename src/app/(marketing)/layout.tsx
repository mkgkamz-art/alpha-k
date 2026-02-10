import Link from "next/link";
import Script from "next/script";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Lemon Squeezy overlay checkout script */}
      <Script
        src="https://app.lemonsqueezy.com/js/lemon.js"
        strategy="lazyOnload"
      />
      {/* TopNav */}
      <header className="sticky top-0 z-50 bg-bg-primary/80 backdrop-blur border-b border-border-default">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between h-14 px-4 md:px-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-text-primary">
            BLOSAFE
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
            <Link href="/" className="hover:text-text-primary transition-colors">
              Market
            </Link>
            <Link href="/alerts" className="hover:text-text-primary transition-colors">
              Alerts
            </Link>
            <Link
              href="/pricing"
              className="hover:text-text-primary transition-colors text-text-primary"
            >
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-sm bg-accent-primary text-bg-primary font-medium px-4 py-1.5 rounded-md hover:bg-[#D4A30A] transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border-default">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-sm font-bold text-text-primary mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li><Link href="/pricing" className="hover:text-text-primary transition-colors">Pricing</Link></li>
                <li><Link href="/alerts" className="hover:text-text-primary transition-colors">Alerts</Link></li>
                <li><Link href="/signals" className="hover:text-text-primary transition-colors">Signals</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary mb-3">Resources</h4>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li><span className="text-text-disabled">Docs (Coming Soon)</span></li>
                <li><span className="text-text-disabled">API Reference</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary mb-3">Company</h4>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li><span className="text-text-disabled">About</span></li>
                <li><span className="text-text-disabled">Contact</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li><span className="text-text-disabled">Privacy Policy</span></li>
                <li><span className="text-text-disabled">Terms of Service</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-border-default flex items-center justify-between">
            <p className="text-xs text-text-disabled">
              &copy; {new Date().getFullYear()} BLOSAFE. All rights reserved.
            </p>
            <p className="text-[10px] text-text-disabled">
              Not financial advice. Past performance ≠ future results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
