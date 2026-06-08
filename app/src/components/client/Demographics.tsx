"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface MetaDemographics {
  ageRanges: Array<{ range: string; percentage: number }>;
  topCities: Array<{ city: string; percentage: number }>;
  genderSplit: { male: number; female: number; unknown: number };
}

export function Demographics({ demographics }: { demographics: MetaDemographics }) {
  const genderData = [
    { name: "Feminino", value: demographics.genderSplit.female, color: "#8b5cf6" },
    { name: "Masculino", value: demographics.genderSplit.male, color: "#3b82f6" },
    { name: "Outro", value: demographics.genderSplit.unknown, color: "#e5e5e5" },
  ].filter((d) => d.value > 0);

  const maxAge = Math.max(...demographics.ageRanges.map((a) => a.percentage));

  return (
    <div className="grid grid-cols-3 gap-4 mb-5">
      {/* Pizza de gênero */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-4">
        <h4 className="text-xs font-semibold text-[#888] mb-3">Gênero</h4>
        <ResponsiveContainer width="100%" height={120}>
          <PieChart>
            <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50}>
              {genderData.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `${v}%`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-1 mt-2">
          {genderData.map((d) => (
            <div key={d.name} className="flex items-center gap-1.5 text-xs text-[#555]">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
              {d.name}: {d.value}%
            </div>
          ))}
        </div>
      </div>

      {/* Barras de faixa etária */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-4">
        <h4 className="text-xs font-semibold text-[#888] mb-3">Faixa Etária</h4>
        <div className="flex flex-col gap-1.5">
          {demographics.ageRanges.map((a) => (
            <div key={a.range} className="flex items-center gap-2 text-xs">
              <span className="w-10 text-[#888] shrink-0">{a.range}</span>
              <div className="flex-1 bg-[#f5f5f5] rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(a.percentage / maxAge) * 100}%`,
                    background: a.percentage === maxAge ? "#8b5cf6" : "#c4b5fd",
                  }}
                />
              </div>
              <span className="w-8 text-right text-[#555]">{a.percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top cidades */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-4">
        <h4 className="text-xs font-semibold text-[#888] mb-3">Top Cidades</h4>
        <div className="flex flex-col gap-1.5">
          {demographics.topCities.slice(0, 5).map((city, i) => (
            <div key={city.city} className="flex items-center gap-2 text-xs">
              <span className="w-4 text-[#888] font-medium">{i + 1}</span>
              <span className="flex-1 text-[#333] truncate">{city.city}</span>
              <div className="w-16 bg-[#f5f5f5] rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-[#8b5cf6]"
                  style={{ width: `${city.percentage}%` }}
                />
              </div>
              <span className="w-8 text-right text-[#555]">{city.percentage}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
