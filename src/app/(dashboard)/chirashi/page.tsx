"use client";

import { MessageCircle } from "lucide-react";

export default function ChirashiPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 mb-4">
        <MessageCircle className="w-8 h-8 text-purple-400" />
      </div>
      <h2 className="text-xl font-bold text-text-primary mb-2">찌라시</h2>
      <p className="text-sm text-text-secondary max-w-xs">
        커뮤니티 인텔리전스가 곧 시작됩니다.
        <br />
        트레이더들의 실시간 루머와 정보를 한곳에서.
      </p>
      <span className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-medium">
        Coming Soon
      </span>
    </div>
  );
}
