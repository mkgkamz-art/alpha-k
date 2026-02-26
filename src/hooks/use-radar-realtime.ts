"use client";

/**
 * Supabase Realtime을 통한 실시간 레이더 시그널 수신 훅.
 *
 * Vercel 서버리스에서 WebSocket 서버 운영 불가 → Supabase Realtime postgres_changes 사용.
 *
 * 티어별 동작:
 * - Free:  score >= 80 시그널만 수신, 5분 지연 배달 (setTimeout)
 * - Pro:   전체 시그널 즉시 수신
 * - Whale: 전체 시그널 즉시 수신
 *
 * Prerequisite: Supabase Dashboard에서 radar_signals 테이블 Realtime 활성화 필요
 *   ALTER PUBLICATION supabase_realtime ADD TABLE radar_signals;
 */

import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/auth-store";
import type { RadarSignal } from "@/types";

interface UseRadarRealtimeOptions {
  /** Free 사용자 최소 score 필터 (기본: 80) */
  minScore?: number;
  /** 새 시그널 수신 콜백 */
  onSignal?: (signal: RadarSignal) => void;
}

const FREE_MIN_SCORE = 80;
const FREE_DELAY_MS = 5 * 60 * 1000; // 5분

export function useRadarRealtime(options: UseRadarRealtimeOptions = {}) {
  const queryClient = useQueryClient();
  const isPro = useAuthStore((s) => s.isPro);
  const delayTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const handleNewSignal = useCallback(
    (signal: RadarSignal) => {
      // Free: score >= 80만 수신
      if (!isPro && signal.score < (options.minScore ?? FREE_MIN_SCORE)) {
        return;
      }

      const deliver = () => {
        // TanStack Query 캐시에 prepend
        queryClient.setQueriesData<{
          pages: { signals: RadarSignal[] }[];
          pageParams: (string | null)[];
        }>({ queryKey: ["radar"] }, (old) => {
          if (!old) return old;
          const pages = [...old.pages];
          if (pages.length > 0) {
            pages[0] = {
              ...pages[0],
              signals: [signal, ...pages[0].signals],
            };
          }
          return { ...old, pages };
        });
        options.onSignal?.(signal);
      };

      if (isPro) {
        // 즉시 배달
        deliver();
      } else {
        // Free: 5분 지연
        const timer = setTimeout(deliver, FREE_DELAY_MS);
        delayTimers.current.push(timer);
      }
    },
    [isPro, queryClient, options],
  );

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("radar-signals-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "radar_signals",
        },
        (payload) => {
          const newSignal = payload.new as RadarSignal;
          handleNewSignal(newSignal);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      delayTimers.current.forEach(clearTimeout);
      delayTimers.current = [];
    };
  }, [handleNewSignal]);
}
