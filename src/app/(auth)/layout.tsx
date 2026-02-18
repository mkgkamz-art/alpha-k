import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: middleware already redirects authenticated users from /login → /dashboard.
  // This layout only renders for unauthenticated users.
  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      {/* Minimal header */}
      <header className="flex items-center h-14 px-6 border-b border-border-default shrink-0">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-accent-primary flex items-center justify-center">
            <span className="text-bg-primary font-bold text-[14px]">B</span>
          </div>
          <span className="text-[16px] font-bold text-text-primary">
            BLOSAFE
          </span>
        </Link>
      </header>

      {/* Centered content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-text-disabled">
        &copy; {new Date().getFullYear()} BLOSAFE. All rights reserved.
      </footer>
    </div>
  );
}
