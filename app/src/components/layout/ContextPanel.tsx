"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

interface Client {
  id: string;
  name: string;
  niche: string;
}

const NICHE_LABELS: Record<string, string> = {
  "life-insurance": "Life Insurance",
  "real-estate": "Imóveis",
  general: "Geral",
};

const AVATAR_COLORS = [
  "#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e",
];

function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

export function ContextPanel() {
  const pathname = usePathname();
  const [clients, setClients] = useState<Client[]>([]);
  const isClientsSection = pathname === "/clients" || pathname.startsWith("/clients/");

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients)
      .catch(() => {});
  }, []);

  const byNiche = clients.reduce<Record<string, Client[]>>((acc, c) => {
    const key = c.niche ?? "general";
    acc[key] = [...(acc[key] ?? []), c];
    return acc;
  }, {});

  const sectionTitle = () => {
    if (pathname === "/") return "Dashboard";
    if (isClientsSection) return null;
    if (pathname.startsWith("/calendar")) return "Calendário";
    if (pathname.startsWith("/insights")) return "Insights";
    if (pathname.startsWith("/pipeline")) return "Pipeline";
    if (pathname.startsWith("/settings")) return "Configurações";
    return "";
  };

  const title = sectionTitle();

  return (
    <div className="w-[200px] h-screen border-r border-[#e5e5e5] bg-white flex flex-col shrink-0">
      <div className="flex items-center justify-between px-3 pt-4 pb-2">
        <span className="text-xs font-semibold text-[#888] uppercase tracking-wide">
          {isClientsSection ? "Clientes" : title}
        </span>
        {isClientsSection && (
          <button
            title="Novo cliente"
            className="w-5 h-5 flex items-center justify-center rounded text-[#888] hover:text-[#8b5cf6] hover:bg-[rgba(139,92,246,0.07)] transition-colors"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {isClientsSection && (
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {Object.entries(byNiche).map(([niche, list]) => (
            <div key={niche} className="mb-3">
              <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide px-1 mb-1">
                {NICHE_LABELS[niche] ?? niche}
              </p>
              {list.map((c) => {
                const active = pathname.startsWith(`/clients/${c.id}`);
                const initial = c.name.charAt(0).toUpperCase();
                const bg = avatarColor(c.name);
                return (
                  <Link
                    key={c.id}
                    href={`/clients/${c.id}/metrics`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg mb-0.5 transition-colors ${
                      active
                        ? "bg-[rgba(139,92,246,0.07)] border border-[rgba(139,92,246,0.2)]"
                        : "hover:bg-[#f5f5f5]"
                    }`}
                  >
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: bg }}
                    >
                      {initial}
                    </span>
                    <span
                      className={`text-xs truncate ${
                        active ? "text-[#8b5cf6] font-medium" : "text-[#333]"
                      }`}
                    >
                      {c.name}
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
