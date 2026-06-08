"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ClientRow {
  id: string;
  name: string;
  followers: number;
  growth30d: number;
  engagementRate: number;
  reach30d: number;
}

type SortKey = keyof ClientRow;

interface ClientRankingProps {
  rows: ClientRow[];
}

export function ClientRanking({ rows }: ClientRankingProps) {
  const [sortKey, setSortKey] = useState<SortKey>("followers");
  const [asc, setAsc] = useState(false);

  const sorted = [...rows].sort((a, b) => {
    const va = a[sortKey] as number;
    const vb = b[sortKey] as number;
    return asc ? va - vb : vb - va;
  });

  const toggle = (key: SortKey) => {
    if (key === sortKey) setAsc(!asc);
    else { setSortKey(key); setAsc(false); }
  };

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <th
      className="text-left text-xs font-medium text-[#888] pb-2 pr-4 cursor-pointer select-none whitespace-nowrap"
      onClick={() => toggle(k)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === k ? (
          asc ? <ChevronUp size={10} /> : <ChevronDown size={10} />
        ) : null}
      </span>
    </th>
  );

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <h3 className="text-sm font-semibold text-[#111] mb-4">Ranking de Clientes</h3>
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left text-xs font-medium text-[#888] pb-2 pr-4 w-6">#</th>
            <Th label="Cliente" k="name" />
            <Th label="Seguidores" k="followers" />
            <Th label="Crescimento 30d" k="growth30d" />
            <Th label="Engajamento" k="engagementRate" />
            <Th label="Alcance 30d" k="reach30d" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.id} className="border-t border-[#f5f5f5]">
              <td className="py-2.5 pr-4 text-xs text-[#888]">{i + 1}</td>
              <td className="py-2.5 pr-4 text-sm font-medium text-[#111]">{row.name}</td>
              <td className="py-2.5 pr-4 text-sm text-[#333]">{row.followers.toLocaleString("pt-BR")}</td>
              <td className={`py-2.5 pr-4 text-sm font-medium ${row.growth30d >= 0 ? "text-[#059669]" : "text-[#e11d48]"}`}>
                {row.growth30d >= 0 ? "+" : ""}{row.growth30d.toLocaleString("pt-BR")}
              </td>
              <td className="py-2.5 pr-4 text-sm text-[#333]">{row.engagementRate.toFixed(2)}%</td>
              <td className="py-2.5 text-sm text-[#333]">{row.reach30d.toLocaleString("pt-BR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
