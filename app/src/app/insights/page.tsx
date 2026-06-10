"use client";

import { useEffect, useState } from "react";
import { ClientMultiSelect } from "@/components/insights/ClientMultiSelect";
import { InsightsChart } from "@/components/insights/InsightsChart";

type Metric = "followers" | "reach" | "impressions" | "engagement";
type Period = "7d" | "30d" | "90d";

interface Client {
  id: string;
  name: string;
  niche: string;
}

interface ClientMetrics {
  clientId: string;
  clientName: string;
  followers: number;
  reach: number;
  impressions: number;
  engagementRate: number;
}

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: "followers", label: "Seguidores" },
  { value: "reach", label: "Alcance" },
  { value: "impressions", label: "Impressões" },
  { value: "engagement", label: "Engajamento" },
];

const MOCK_VALUES: Record<string, Omit<ClientMetrics, "clientId" | "clientName">> = {
  "lais-daltrozo": { followers: 1681, reach: 820, impressions: 2100, engagementRate: 4.2 },
  "victor-hugo-ferro": { followers: 2340, reach: 1200, impressions: 3400, engagementRate: 3.8 },
  "sam-fernandes": { followers: 890, reach: 430, impressions: 1100, engagementRate: 5.1 },
  "isabela-castro": { followers: 3510, reach: 1750, impressions: 4800, engagementRate: 4.7 },
};

const DEFAULT_METRICS = { followers: 1000, reach: 500, impressions: 1500, engagementRate: 3.5 };

export default function InsightsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [metric, setMetric] = useState<Metric>("followers");
  const [period, setPeriod] = useState<Period>("30d");

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((cs: Client[]) => {
        setClients(cs);
        setSelected(cs.slice(0, 2).map((c) => c.id));
      });
  }, []);

  const clientMetrics: ClientMetrics[] = clients
    .filter((c) => selected.includes(c.id))
    .map((c) => ({
      clientId: c.id,
      clientName: c.name,
      ...(MOCK_VALUES[c.id] ?? DEFAULT_METRICS),
    }));

  return (
    <div className="p-6 ">
      <h1 className="text-lg font-semibold text-[#111] mb-5">Insights Comparativo</h1>

      <div className="mb-5">
        <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-2">Clientes</p>
        <ClientMultiSelect clients={clients} selected={selected} onChange={setSelected} />
      </div>

      <div className="flex items-start gap-4 mb-5">
        <div>
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-2">Métrica</p>
          <div className="flex gap-1">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMetric(opt.value)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  metric === opt.value
                    ? "bg-[#8b5cf6] text-white"
                    : "bg-[#f5f5f5] text-[#888] hover:text-[#111]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-2">Período</p>
          <div className="flex gap-1">
            {(["7d", "30d", "90d"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  period === p
                    ? "bg-[#8b5cf6] text-white"
                    : "bg-[#f5f5f5] text-[#888] hover:text-[#111]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <InsightsChart clients={clientMetrics} metric={metric} period={period} />
      </div>

      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f5f5f5]">
              {["Cliente", "Seguidores", "Alcance", "Impressões", "Engajamento"].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-[#888] px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientMetrics.map((c) => (
              <tr key={c.clientId} className="border-b border-[#f5f5f5] last:border-0">
                <td className="px-4 py-3 text-sm font-medium text-[#111]">{c.clientName}</td>
                <td className="px-4 py-3 text-sm text-[#333]">{c.followers.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3 text-sm text-[#333]">{c.reach.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3 text-sm text-[#333]">{c.impressions.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3 text-sm text-[#333]">{c.engagementRate.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
