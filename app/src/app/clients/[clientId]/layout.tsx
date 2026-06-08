"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { BarChart2, Calendar, FileText, Palette, Settings } from "lucide-react";

const TABS = [
  { slug: "metrics", icon: BarChart2, label: "Métricas" },
  { slug: "calendar", icon: Calendar, label: "Calendário" },
  { slug: "icp", icon: FileText, label: "ICP" },
  { slug: "palette", icon: Palette, label: "Paleta" },
  { slug: "settings", icon: Settings, label: "Config." },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;

  return (
    <div className="flex h-full">
      {/* Mini-sidebar do cliente */}
      <aside className="w-44 shrink-0 border-r border-[#e5e5e5] bg-white pt-4 flex flex-col">
        <div className="px-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white font-bold text-sm mb-2">
            {clientId.charAt(0).toUpperCase()}
          </div>
          <p className="text-sm font-semibold text-[#111] leading-tight capitalize">{clientId.replace(/-/g, " ")}</p>
        </div>
        <nav className="flex flex-col gap-0.5 px-2">
          {TABS.map(({ slug, icon: Icon, label }) => {
            const href = `/clients/${clientId}/${slug}`;
            const active = pathname.startsWith(href);
            return (
              <Link
                key={slug}
                href={href}
                className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs transition-colors ${
                  active
                    ? "bg-[rgba(139,92,246,0.07)] text-[#8b5cf6] font-medium border border-[rgba(139,92,246,0.2)]"
                    : "text-[#555] hover:bg-[#f5f5f5]"
                }`}
              >
                <Icon size={14} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Conteúdo da aba */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
