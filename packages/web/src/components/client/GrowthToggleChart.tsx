"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface GrowthPoint {
  date: string;
  followers: number;
}

interface GrowthToggleChartProps {
  data: GrowthPoint[];
}

export function GrowthToggleChart({ data }: GrowthToggleChartProps) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-5">
      <h3 className="text-sm font-semibold text-[#111] mb-4">
        Crescimento de Seguidores
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#888" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#888" }}
            tickLine={false}
            axisLine={false}
            width={45}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              fontSize: 12,
              border: "1px solid #e5e5e5",
              borderRadius: 8,
            }}
            formatter={(v) => [(v as number).toLocaleString("pt-BR"), "Seguidores"]}
          />
          <Line
            type="monotone"
            dataKey="followers"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#8b5cf6" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
