"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart2,
  Workflow,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/clients", icon: Users, label: "Clientes" },
  { href: "/calendar", icon: Calendar, label: "Calendário" },
  { href: "/insights", icon: BarChart2, label: "Insights" },
  { href: "/pipeline", icon: Workflow, label: "Pipeline" },
  { href: "/settings", icon: Settings, label: "Configurações" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[52px] h-screen flex flex-col items-center bg-white border-r border-[#e5e5e5] pt-3 gap-1 shrink-0">
      {/* Logo */}
      <div className="w-8 h-8 rounded-lg bg-[#8b5cf6] flex items-center justify-center mb-3">
        <span className="text-white text-xs font-bold">CB</span>
      </div>

      {NAV.map(({ href, icon: Icon, label }) => {
        const active =
          href === "/"
            ? pathname === "/"
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={`relative group w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              active
                ? "bg-[rgba(139,92,246,0.07)] border border-[rgba(139,92,246,0.2)]"
                : "hover:bg-[#f5f5f5]"
            }`}
          >
            <Icon
              size={18}
              className={active ? "text-[#8b5cf6]" : "text-[#888]"}
            />
            {/* Tooltip */}
            <span className="absolute left-full ml-2 px-2 py-1 text-xs bg-[#111] text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
              {label}
            </span>
          </Link>
        );
      })}
    </aside>
  );
}
