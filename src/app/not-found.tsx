import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6 bg-bg-primary text-text-primary">
      <span className="text-6xl font-bold text-text-disabled font-mono">
        404
      </span>
      <h1 className="text-lg font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-text-secondary">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        href="/dashboard"
        className="mt-2 inline-flex items-center px-4 py-2 rounded-lg bg-accent-primary text-bg-primary text-sm font-semibold hover:bg-accent-primary/90 transition-colors"
      >
        대시보드로 이동
      </Link>
    </div>
  );
}
