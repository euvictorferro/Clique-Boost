"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
const DATA = [
  { month: "Jan", revenue: 3200 },
  { month: "Fev", revenue: 3200 },
  { month: "Mar", revenue: 4000 },
  { month: "Abr", revenue: 4800 },
  { month: "Mai", revenue: 5600 },
  { month: "Jun", revenue: 6400 },
];

const CURRENT = MONTHS[new Date().getMonth()] ?? "Jun";

function fmt(v: number) {
  return `R$ ${v.toLocaleString("pt-BR")}`;
}

export function RevenueChart() {
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#111]">Faturamento Mensal</h3>
        <span className="text-xs text-[#888]">2026</span>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={DATA} barSize={32} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "#888" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#aaa" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            formatter={(v: unknown) => [fmt(Number(v)), "Faturamento"] as [string, string]}
            contentStyle={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
            {DATA.map((entry) => (
              <Cell
                key={entry.month}
                fill={entry.month === CURRENT ? "#8b5cf6" : "#ede9fe"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
