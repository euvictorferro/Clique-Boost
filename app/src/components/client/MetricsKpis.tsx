import { KpiCard } from "@/components/dashboard/KpiCard";

interface MetricsKpisProps {
  followers: number;
  followerDelta: number;
  reach30d: number;
  impressions30d: number;
  engagementRate: number;
}

export function MetricsKpis({
  followers,
  followerDelta,
  reach30d,
  impressions30d,
  engagementRate,
}: MetricsKpisProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-5">
      <KpiCard
        label="Seguidores"
        value={followers.toLocaleString("pt-BR")}
        delta={followerDelta}
        deltaLabel="30d"
      />
      <KpiCard label="Alcance 30d" value={reach30d.toLocaleString("pt-BR")} />
      <KpiCard label="Impressões 30d" value={impressions30d.toLocaleString("pt-BR")} />
      <KpiCard label="Engajamento" value={`${engagementRate.toFixed(2)}%`} />
    </div>
  );
}
