"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CLIENT_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

type Metric = "followers" | "reach" | "impressions" | "engagement";

interface ClientMetrics {
  clientId: string;
  clientName: string;
  followers: number;
  reach: number;
  impressions: number;
  engagementRate: number;
}

interface InsightsChartProps {
  clients: ClientMetrics[];
  metric: Metric;
  period: "7d" | "30d" | "90d";
}

const METRIC_LABELS: Record<Metric, string> = {
  followers: "Seguidores",
  reach: "Alcance",
  impressions: "Impressões",
  engagement: "Engajamento (%)",
};

function getMetricValue(c: ClientMetrics, metric: Metric): number {
  switch (metric) {
    case "followers": return c.followers;
    case "reach": return c.reach;
    case "impressions": return c.impressions;
    case "engagement": return c.engagementRate;
  }
}

export function InsightsChart({ clients, metric, period }: InsightsChartProps) {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;

  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().slice(5, 10);
  });

  const chartData = dates.map((date, i) => {
    const row: Record<string, string | number> = { date };
    clients.forEach((c) => {
      const base = getMetricValue(c, metric);
      const growth = base * (i / days) * 0.05;
      row[c.clientName] = Math.round(base * (1 - 0.05) + growth);
    });
    return row;
  });

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <h3 className="text-sm font-semibold text-[#111] mb-4">{METRIC_LABELS[metric]}</h3>
      {clients.length === 0 ? (
        <p className="text-sm text-[#888] py-8 text-center">Selecione pelo menos um cliente.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#888" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#888" }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, border: "1px solid #e5e5e5", borderRadius: 8 }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {clients.map((c, i) => (
              <Line
                key={c.clientId}
                type="monotone"
                dataKey={c.clientName}
                stroke={CLIENT_COLORS[i % CLIENT_COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
