/**
 * Liquidity monitoring via DeFi Llama free APIs.
 *
 * - DEX volumes: https://api.llama.fi/overview/dexs
 * - Yield pools: https://yields.llama.fi/pools
 */

const DEX_API = "https://api.llama.fi/overview/dexs";
const POOLS_API = "https://yields.llama.fi/pools";

/* ── Types ── */

export interface DexVolumeData {
  protocol_name: string;
  daily_volume: number;
  volume_change_24h: number;
  total_tvl: number;
  chains: string[];
  last_updated: string;
}

export interface PoolData {
  pool_name: string;
  protocol: string;
  chain: string;
  tvl: number;
  apy: number;
  apy_base: number;
  apy_reward: number;
  tvl_change_24h: number;
  is_stablecoin: boolean;
  risk_level: string;
  last_updated: string;
}

export interface LiquidityAlert {
  type: "tvl_drop" | "apy_spike" | "volume_surge";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}

/* ── DEX Volume Fetcher ── */

export async function fetchDexVolumes(): Promise<DexVolumeData[]> {
  try {
    const res = await fetch(DEX_API, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`DeFi Llama DEX API: ${res.status}`);
    const json = await res.json();

    const protocols = json.protocols ?? [];
    const now = new Date().toISOString();

    // Top 20 DEXes by 24h volume
    return protocols
      .filter(
        (p: Record<string, unknown>) =>
          p.name && typeof p.total24h === "number" && p.total24h > 0
      )
      .sort(
        (a: Record<string, unknown>, b: Record<string, unknown>) =>
          (b.total24h as number) - (a.total24h as number)
      )
      .slice(0, 20)
      .map(
        (p: Record<string, unknown>): DexVolumeData => ({
          protocol_name: p.name as string,
          daily_volume: (p.total24h as number) ?? 0,
          volume_change_24h: (p.change_1d as number) ?? 0,
          total_tvl: (p.totalAllTime as number) ?? 0,
          chains: Array.isArray(p.chains)
            ? (p.chains as string[])
            : [],
          last_updated: now,
        })
      );
  } catch (err) {
    console.error("[liquidity-monitor] fetchDexVolumes error:", err);
    return [];
  }
}

/* ── Pool Fetcher ── */

export async function fetchTopPools(): Promise<PoolData[]> {
  try {
    const res = await fetch(POOLS_API, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`DeFi Llama Pools API: ${res.status}`);
    const json = await res.json();

    const pools = json.data ?? [];
    const now = new Date().toISOString();

    // Top 50 pools by TVL, filter for meaningful pools
    return pools
      .filter(
        (p: Record<string, unknown>) =>
          p.symbol &&
          typeof p.tvlUsd === "number" &&
          p.tvlUsd > 1_000_000
      )
      .sort(
        (a: Record<string, unknown>, b: Record<string, unknown>) =>
          (b.tvlUsd as number) - (a.tvlUsd as number)
      )
      .slice(0, 50)
      .map((p: Record<string, unknown>): PoolData => {
        const tvlChange = (p.il7d as number) ?? 0; // Use available change metric
        const apy = (p.apy as number) ?? 0;
        const apyBase = (p.apyBase as number) ?? 0;
        const apyReward = (p.apyReward as number) ?? 0;
        const stablecoin = (p.stablecoin as boolean) ?? false;

        // Risk assessment
        let riskLevel = "low";
        if (tvlChange <= -20 || apy > 100) riskLevel = "high";
        else if (Math.abs(tvlChange) > 10 || apy > 50) riskLevel = "medium";

        return {
          pool_name: (p.symbol as string) ?? "Unknown",
          protocol: (p.project as string) ?? "Unknown",
          chain: (p.chain as string) ?? "Ethereum",
          tvl: (p.tvlUsd as number) ?? 0,
          apy,
          apy_base: apyBase,
          apy_reward: apyReward,
          tvl_change_24h: tvlChange,
          is_stablecoin: stablecoin,
          risk_level: riskLevel,
          last_updated: now,
        };
      });
  } catch (err) {
    console.error("[liquidity-monitor] fetchTopPools error:", err);
    return [];
  }
}

/* ── Alert Detection ── */

export function detectLiquidityAlerts(
  pools: PoolData[],
  dexVolumes: DexVolumeData[]
): LiquidityAlert[] {
  const alerts: LiquidityAlert[] = [];

  // Pool TVL drops > 20%
  for (const pool of pools) {
    if (pool.tvl_change_24h <= -20) {
      alerts.push({
        type: "tvl_drop",
        severity: pool.tvl_change_24h <= -40 ? "critical" : "high",
        title: `${pool.pool_name} TVL dropped ${Math.abs(pool.tvl_change_24h).toFixed(1)}%`,
        description: `${pool.pool_name} on ${pool.protocol} (${pool.chain}) lost significant liquidity. Current TVL: $${Math.round(pool.tvl).toLocaleString()}`,
        metadata: {
          pool: pool.pool_name,
          protocol: pool.protocol,
          chain: pool.chain,
          tvl: pool.tvl,
          change: pool.tvl_change_24h,
        },
      });
    }

    // Stablecoin pool abnormal APY (>50%)
    if (pool.is_stablecoin && pool.apy > 50) {
      alerts.push({
        type: "apy_spike",
        severity: "medium",
        title: `Stable pool ${pool.pool_name} APY spike: ${pool.apy.toFixed(1)}%`,
        description: `Abnormally high APY on stablecoin pool ${pool.pool_name} (${pool.protocol}). This could indicate exploit risk.`,
        metadata: {
          pool: pool.pool_name,
          protocol: pool.protocol,
          apy: pool.apy,
          is_stablecoin: true,
        },
      });
    }
  }

  // DEX volume surges > 200%
  for (const dex of dexVolumes) {
    if (dex.volume_change_24h >= 200) {
      alerts.push({
        type: "volume_surge",
        severity: "medium",
        title: `${dex.protocol_name} volume surged ${dex.volume_change_24h.toFixed(0)}%`,
        description: `${dex.protocol_name} 24h volume: $${Math.round(dex.daily_volume).toLocaleString()} (+${dex.volume_change_24h.toFixed(1)}%)`,
        metadata: {
          protocol: dex.protocol_name,
          volume: dex.daily_volume,
          change: dex.volume_change_24h,
        },
      });
    }
  }

  return alerts;
}
