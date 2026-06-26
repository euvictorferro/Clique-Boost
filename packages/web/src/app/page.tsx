import { KpiCard } from "@/components/dashboard/KpiCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ClientsPanel } from "@/components/dashboard/ClientsPanel";
import { WeekAgenda } from "@/components/dashboard/WeekAgenda";
import { readClients } from "@/lib/clients";

export const revalidate = 3600;

export default async function DashboardPage() {
  const clients = await readClients();
  const activeClients = clients.filter((c) => c.status === "active");

  // Valores manuais — atualizar conforme faturamento real
  const mrr = 6_400;
  const mrrPrev = 5_600;
  const mrrDelta = mrr - mrrPrev;

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#111]">Dashboard</h1>
        <p className="text-xs text-[#888] mt-0.5">Visão geral da Clique Boost</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="MRR"
          value={`R$ ${mrr.toLocaleString("pt-BR")}`}
          delta={mrrDelta}
          deltaLabel="vs mês anterior"
        />
        <KpiCard
          label="Clientes Ativos"
          value={String(activeClients.length)}
        />
        <KpiCard
          label="Churn"
          value="0"
          delta={0}
          deltaLabel="últimos 30d"
        />
        <KpiCard
          label="Jobs Esta Semana"
          value="5"
        />
      </div>

      {/* Layout 2 colunas */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 flex flex-col gap-5">
          <RevenueChart />
          <WeekAgenda />
        </div>
        <div>
          <ClientsPanel clients={clients} />
        </div>
      </div>
    </div>
  );
}
