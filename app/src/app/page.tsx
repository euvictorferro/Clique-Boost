import { KpiCard } from "@/components/dashboard/KpiCard";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { ClientRanking } from "@/components/dashboard/ClientRanking";
import { readClients } from "@/lib/clients";

export const revalidate = 3600;

export default async function DashboardPage() {
  const clients = readClients().filter((c) => c.status === "active");

  const totalFollowers = 8_420;
  const avgReach = 3_200;
  const avgEngagement = 4.3;

  const rankingRows = clients.map((c, i) => ({
    id: c.id,
    name: c.name,
    followers: [1681, 2340, 890, 3510][i] ?? 1000,
    growth30d: [42, 120, -10, 88][i] ?? 0,
    engagementRate: [4.2, 3.8, 5.1, 4.7][i] ?? 3.5,
    reach30d: [820, 1200, 430, 1750][i] ?? 500,
  }));

  const growthSeries = clients.map((c, i) => ({
    name: c.name,
    data: Array.from({ length: 30 }, (_, d) => ({
      date: new Date(Date.now() - (29 - d) * 86400000)
        .toISOString()
        .slice(5, 10),
      value: ([1600, 2200, 870, 3400][i] ?? 900) + d * ([1.4, 4, 0.7, 3][i] ?? 1),
    })),
  }));

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-lg font-semibold text-[#111] mb-5">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <KpiCard
          label="Total de Seguidores"
          value={totalFollowers.toLocaleString("pt-BR")}
          delta={250}
          deltaLabel="30d"
        />
        <KpiCard
          label="Alcance Médio 30d"
          value={avgReach.toLocaleString("pt-BR")}
        />
        <KpiCard
          label="Engajamento Médio"
          value={`${avgEngagement.toFixed(1)}%`}
        />
      </div>

      <div className="mb-5">
        <GrowthChart series={growthSeries} />
      </div>

      <ClientRanking rows={rankingRows} />
    </div>
  );
}
