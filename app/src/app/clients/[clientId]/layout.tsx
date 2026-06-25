"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { BarChart2, Calendar, FileText, Film, Palette, Settings, TrendingUp, Users, NotebookPen } from "lucide-react";
import { useEffect, useState } from "react";

const TABS = [
  { slug: "metrics",     icon: BarChart2,  label: "Métricas" },
  { slug: "strategy",    icon: TrendingUp, label: "Estratégia" },
  { slug: "calendar",    icon: Calendar,   label: "Calendário" },
  { slug: "competitors", icon: Users,      label: "Concorrentes" },
  { slug: "meetings",    icon: NotebookPen, label: "Reuniões" },
  { slug: "video",       icon: Film,       label: "Vídeo" },
  { slug: "icp",         icon: FileText,   label: "ICP" },
  { slug: "palette",     icon: Palette,    label: "Paleta" },
  { slug: "settings",    icon: Settings,   label: "Config." },
];

const AVATAR_COLORS = ["#8b5cf6","#06b6d4","#f59e0b","#10b981","#f43f5e"];
function avatarColor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}

function ClientAvatar({ clientId }: { clientId: string }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    // Lê foto diretamente do endpoint de clientes — sem chamar a Meta API
    fetch("/api/clients")
      .then((r) => r.json())
      .then((clients: any[]) => {
        const client = clients.find((c) => c.id === clientId);
        if (client?.profilePictureUrl) setPhotoUrl(client.profilePictureUrl);
      })
      .catch(() => {});
  }, [clientId]);

  const initials = clientId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase())
    .slice(0, 2)
    .join("");

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={clientId}
        className="w-10 h-10 rounded-full object-cover border border-[#e5e5e5]"
      />
    );
  }

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
      style={{ background: avatarColor(clientId) }}
    >
      {initials}
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;

  const displayName = clientId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <div className="flex h-full">
      <aside className="w-44 shrink-0 border-r border-[#e5e5e5] bg-white pt-4 flex flex-col">
        <div className="px-3 mb-4">
          <ClientAvatar clientId={clientId} />
          <p className="text-sm font-semibold text-[#111] leading-tight mt-2">{displayName}</p>
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

      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
