import { KpiCard } from "@/components/dashboard/KpiCard";

interface MetricsKpisProps {
  followers: number;
  followerDelta: number;
  reach30d: number;
  impressions30d: number;
  engagementRate: number;
  periodLabel?: string;
}

export function MetricsKpis({
  followers,
  followerDelta,
  reach30d,
  impressions30d,
  engagementRate,
  periodLabel = "30 dias",
}: MetricsKpisProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-5">
      <KpiCard
        label="Seguidores"
        value={followers.toLocaleString("pt-BR")}
        delta={followerDelta}
        deltaLabel={periodLabel}
      />
      <KpiCard label={`Alcance (${periodLabel})`} value={reach30d.toLocaleString("pt-BR")} />
      <KpiCard label={`Impressões (${periodLabel})`} value={impressions30d.toLocaleString("pt-BR")} />
      <KpiCard label="Engajamento" value={`${engagementRate.toFixed(2)}%`} />
    </div>
  );
}
