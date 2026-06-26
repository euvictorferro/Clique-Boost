"use client";

import Link from "next/link";

interface Client {
  id: string;
  name: string;
  niche: string;
  status: string;
}

const NICHE_LABELS: Record<string, string> = {
  "life-insurance": "Life Insurance",
  "real-estate": "Imóveis",
  general: "Geral",
};

const AVATAR_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export function ClientsPanel({ clients }: { clients: Client[] }) {
  const active = clients.filter((c) => c.status === "active");

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#111]">Clientes Ativos</h3>
        <span className="text-xs font-semibold text-[#8b5cf6]">{active.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {active.map((c) => (
          <Link
            key={c.id}
            href={`/clients/${c.id}/metrics`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#f5f5f5] transition-colors group"
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
              style={{ background: avatarColor(c.name) }}
            >
              {c.name.charAt(0).toUpperCase()}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#111] truncate group-hover:text-[#8b5cf6] transition-colors">
                {c.name}
              </p>
              <p className="text-xs text-[#888]">{NICHE_LABELS[c.niche] ?? c.niche}</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-[#10b981] shrink-0" title="Ativo" />
          </Link>
        ))}
      </div>
    </div>
  );
}
