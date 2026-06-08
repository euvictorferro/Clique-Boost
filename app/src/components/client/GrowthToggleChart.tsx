"use client";

import { useState } from "react";
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
  data30d: GrowthPoint[];
}

export function GrowthToggleChart({ data30d }: GrowthToggleChartProps) {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const sliced =
    period === "7d"
      ? data30d.slice(-7)
      : period === "30d"
      ? data30d.slice(-30)
      : data30d;

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#111]">Crescimento de Seguidores</h3>
        <div className="flex gap-1">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
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
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={sliced}>
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
            width={45}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, border: "1px solid #e5e5e5", borderRadius: 8 }}
          />
          <Line
            type="monotone"
            dataKey="followers"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
