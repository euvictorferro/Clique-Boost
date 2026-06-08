# Frontend Plan 1 — Shell + Dashboard + Perfil do Cliente

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o shell de layout 3 colunas, o dashboard geral e o perfil completo do cliente (todas as abas: Métricas, Calendário, ICP, Paleta, Configurações).

**Architecture:** Next.js 16 App Router com layout global em `app/layout.tsx` contendo as 3 colunas fixas. Dados de clientes e métricas servidos via API routes (`/api/clients`, `/api/metrics/[clientId]`). Componentes de UI com shadcn/ui + Tailwind CSS v4.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, shadcn/ui, Recharts, lucide-react, Inter (Google Fonts)

---

## Mapa de Arquivos

```
app/src/
  app/
    layout.tsx                          ← MODIFY: layout global 3 colunas
    page.tsx                            ← CREATE: dashboard geral
    globals.css                         ← MODIFY: tokens CSS
    clients/[clientId]/
      layout.tsx                        ← CREATE: layout do perfil (mini-sidebar)
      page.tsx                          ← CREATE: redirect para /metrics
      metrics/page.tsx                  ← CREATE: aba métricas
      calendar/page.tsx                 ← CREATE: aba calendário
      icp/page.tsx                      ← CREATE: aba ICP
      palette/page.tsx                  ← CREATE: aba paleta
      settings/page.tsx                 ← CREATE: aba config do cliente
    api/
      clients/route.ts                  ← CREATE: GET clients.json
      metrics/[clientId]/route.ts       ← CREATE: GET metaInsights
      clients/[clientId]/icp/route.ts   ← CREATE: GET/POST ICP.md
      clients/[clientId]/palette/route.ts ← CREATE: GET/POST paleta
      clients/[clientId]/calendar/route.ts ← CREATE: GET calendário
  components/
    layout/
      Sidebar.tsx                       ← CREATE: coluna 1 (ícones)
      ContextPanel.tsx                  ← CREATE: coluna 2 (contexto)
    dashboard/
      KpiCard.tsx                       ← CREATE: card de métrica
      GrowthChart.tsx                   ← CREATE: gráfico de linhas Recharts
      ClientRanking.tsx                 ← CREATE: tabela ranking
    client/
      PlatformCards.tsx                 ← CREATE: cards de plataforma
      MetricsKpis.tsx                   ← CREATE: KPIs do cliente
      TopPostsList.tsx                  ← CREATE: top 5 posts ranqueados
      Demographics.tsx                  ← CREATE: pizza + barras demográficas
      GrowthToggleChart.tsx             ← CREATE: gráfico com toggle 7d/30d/90d
      CalendarView.tsx                  ← CREATE: mini-calendário + painel
      IcpEditor.tsx                     ← CREATE: markdown viewer + editor
      PaletteGrid.tsx                   ← CREATE: grade 5×2 de paletas
    shared/
      Toast.tsx                         ← CREATE: sistema de notificações
      TokenBadge.tsx                    ← CREATE: badge de validade de token
```

---

## Task 1: Instalar dependências e configurar design tokens

**Files:**
- Modify: `app/package.json`
- Modify: `app/src/app/globals.css`

- [ ] **Step 1: Instalar shadcn/ui, Recharts e react-markdown**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost/app"
npm install recharts react-markdown
npm install @radix-ui/react-tooltip @radix-ui/react-dialog @radix-ui/react-tabs
```

Expected: instalação concluída sem erros.

- [ ] **Step 2: Adicionar tokens CSS ao globals.css**

Substituir o conteúdo de `app/src/app/globals.css` por:

```css
@import "tailwindcss";

@theme {
  --color-accent: #8b5cf6;
  --color-accent-light: rgba(139, 92, 246, 0.07);
  --color-accent-border: rgba(139, 92, 246, 0.2);
  --color-bg: #f5f5f5;
  --color-surface: #ffffff;
  --color-border: #e5e5e5;
  --color-text-primary: #111111;
  --color-text-secondary: #888888;
  --color-success: #059669;
  --color-warning: #d97706;
  --color-danger: #e11d48;
  --font-sans: "Inter", sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  background: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-sans);
  margin: 0;
}
```

- [ ] **Step 3: Verificar que o projeto builda sem erro**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost/app"
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled` sem erros TypeScript.

- [ ] **Step 4: Commit**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost/app"
git add package.json package-lock.json src/app/globals.css
git commit -m "feat: instalar recharts, radix-ui e configurar design tokens CSS"
```

---

## Task 2: API Route — GET /api/clients

**Files:**
- Create: `app/src/app/api/clients/route.ts`

- [ ] **Step 1: Criar a API route**

```typescript
// app/src/app/api/clients/route.ts
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

const CLIENTS_PATH = path.join(process.cwd(), "..", "data", "clients.json");

export async function GET() {
  try {
    const raw = readFileSync(CLIENTS_PATH, "utf-8");
    const clients = JSON.parse(raw);
    return NextResponse.json(clients);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
```

- [ ] **Step 2: Testar no terminal**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost/app"
npm run dev &
sleep 3
curl http://localhost:3000/api/clients | head -c 200
kill %1
```

Expected: JSON com array de clientes, incluindo lais-daltrozo, victor-hugo-ferro, sam-fernandes, isabela-castro.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/clients/route.ts
git commit -m "feat: API route GET /api/clients"
```

---

## Task 3: API Route — GET /api/metrics/[clientId]

**Files:**
- Create: `app/src/app/api/metrics/[clientId]/route.ts`

- [ ] **Step 1: Criar a route com cache de 1 hora**

```typescript
// app/src/app/api/metrics/[clientId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { fetchClientInsights } from "@/lib/metaInsights";
import { readClients } from "@/lib/clients";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const clients = readClients();
  const client = clients.find((c) => c.id === clientId);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  if (!client.metaAccessToken) {
    return NextResponse.json(
      { error: "No Meta access token" },
      { status: 400 }
    );
  }

  try {
    const insights = await fetchClientInsights(client);
    return NextResponse.json(insights, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Adicionar `readClients` ao lib/clients.ts**

Abrir `app/src/lib/clients.ts` e garantir que a função existe:

```typescript
import { readFileSync } from "fs";
import path from "path";
import { Client } from "./types";

const CLIENTS_PATH = path.join(process.cwd(), "..", "data", "clients.json");

export function readClients(): Client[] {
  try {
    return JSON.parse(readFileSync(CLIENTS_PATH, "utf-8"));
  } catch {
    return [];
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/metrics/ src/lib/clients.ts
git commit -m "feat: API route GET /api/metrics/[clientId]"
```

---

## Task 4: API Routes — ICP, Paleta, Calendário

**Files:**
- Create: `app/src/app/api/clients/[clientId]/icp/route.ts`
- Create: `app/src/app/api/clients/[clientId]/palette/route.ts`
- Create: `app/src/app/api/clients/[clientId]/calendar/route.ts`

- [ ] **Step 1: Criar route de ICP (GET lê, POST regenera)**

```typescript
// app/src/app/api/clients/[clientId]/icp/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { readClients } from "@/lib/clients";

function icpPath(obsidianPath: string) {
  return path.join(obsidianPath, "ICP.md");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const content = readFileSync(icpPath(client.obsidianPath), "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ content: "" });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  const { content } = await req.json();
  writeFileSync(icpPath(client.obsidianPath), content, "utf-8");
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Criar route de paleta**

```typescript
// app/src/app/api/clients/[clientId]/palette/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { readClients } from "@/lib/clients";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const raw = readFileSync(
      path.join(client.obsidianPath, "paleta.md"),
      "utf-8"
    );
    return NextResponse.json({ content: raw });
  } catch {
    return NextResponse.json({ content: "" });
  }
}
```

- [ ] **Step 3: Criar route de calendário**

```typescript
// app/src/app/api/clients/[clientId]/calendar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFileSync, readdirSync } from "fs";
import path from "path";
import { readClients } from "@/lib/clients";

const CALENDARS_PATH =
  "/Users/victorferro/Library/Mobile Documents/iCloud~md~obsidian/Documents/[Clique Boost] - Second Brain/03 - Calendários";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    const filename = `${clientId}-${month}.md`;
    const content = readFileSync(path.join(CALENDARS_PATH, filename), "utf-8");
    return NextResponse.json({ content, month });
  } catch {
    return NextResponse.json({ content: "", month });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/clients/
git commit -m "feat: API routes para ICP, paleta e calendário por cliente"
```

---

## Task 5: Componente Sidebar (coluna 1 — ícones)

**Files:**
- Create: `app/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Criar Sidebar com ícones de navegação**

```tsx
// app/src/components/layout/Sidebar.tsx
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: componente Sidebar com navegação por ícones"
```

---

## Task 6: Componente ContextPanel (coluna 2)

**Files:**
- Create: `app/src/components/layout/ContextPanel.tsx`

- [ ] **Step 1: Criar ContextPanel que lista clientes**

```tsx
// app/src/components/layout/ContextPanel.tsx
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
    if (isClientsSection) return null; // lista de clientes
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/ContextPanel.tsx
git commit -m "feat: componente ContextPanel com lista de clientes por nicho"
```

---

## Task 7: Layout global (3 colunas)

**Files:**
- Modify: `app/src/app/layout.tsx`

- [ ] **Step 1: Reescrever layout.tsx com 3 colunas**

```tsx
// app/src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { ContextPanel } from "@/components/layout/ContextPanel";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clique Boost — Social Media",
  description: "Dashboard de gestão de social media",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <ContextPanel />
          <main className="flex-1 overflow-y-auto bg-[#f5f5f5]">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Iniciar o dev server e verificar visualmente**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost/app"
npm run dev
```

Abrir `http://localhost:3000` no browser. Verificar:
- Sidebar de 52px com ícones à esquerda
- Painel de contexto de 200px ao centro
- Área de conteúdo à direita

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: layout global 3 colunas (sidebar + context panel + content)"
```

---

## Task 8: Componentes shared — KpiCard e Toast

**Files:**
- Create: `app/src/components/shared/Toast.tsx`
- Create: `app/src/components/dashboard/KpiCard.tsx`

- [ ] **Step 1: Criar KpiCard**

```tsx
// app/src/components/dashboard/KpiCard.tsx
import { TrendingUp, TrendingDown } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  delta?: number; // positivo = verde, negativo = vermelho
  deltaLabel?: string;
}

export function KpiCard({ label, value, delta, deltaLabel }: KpiCardProps) {
  const isPositive = delta !== undefined && delta >= 0;

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-4">
      <p className="text-xs text-[#888] mb-1">{label}</p>
      <p className="text-2xl font-bold text-[#111]">{value}</p>
      {delta !== undefined && (
        <div
          className={`flex items-center gap-1 mt-1 text-xs font-medium ${
            isPositive ? "text-[#059669]" : "text-[#e11d48]"
          }`}
        >
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>
            {isPositive ? "+" : ""}
            {delta.toLocaleString("pt-BR")} {deltaLabel ?? ""}
          </span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Criar sistema de Toast**

```tsx
// app/src/components/shared/Toast.tsx
"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X } from "lucide-react";

interface ToastItem {
  id: string;
  message: string;
  type: "success" | "warning" | "error";
}

interface ToastContextValue {
  show: (message: string, type?: ToastItem["type"]) => void;
}

const ToastContext = createContext<ToastContextValue>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: ToastItem["type"] = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const COLORS = {
    success: "border-[#059669] bg-white",
    warning: "border-[#d97706] bg-white",
    error: "border-[#e11d48] bg-white",
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-start gap-2 px-4 py-3 rounded-xl border shadow-lg text-sm text-[#111] max-w-xs ${COLORS[t.type]}`}
          >
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-[#888] hover:text-[#111]">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
```

- [ ] **Step 3: Adicionar ToastProvider ao layout.tsx**

Editar `app/src/app/layout.tsx` para envolver `children` com `ToastProvider`:

```tsx
import { ToastProvider } from "@/components/shared/Toast";

// Dentro do <main>:
<main className="flex-1 overflow-y-auto bg-[#f5f5f5]">
  <ToastProvider>
    {children}
  </ToastProvider>
</main>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/dashboard/KpiCard.tsx src/components/shared/Toast.tsx src/app/layout.tsx
git commit -m "feat: KpiCard, sistema de Toast e ToastProvider no layout"
```

---

## Task 9: Dashboard Geral (page.tsx raiz)

**Files:**
- Create: `app/src/app/page.tsx`
- Create: `app/src/components/dashboard/GrowthChart.tsx`
- Create: `app/src/components/dashboard/ClientRanking.tsx`

- [ ] **Step 1: Criar GrowthChart com Recharts**

```tsx
// app/src/components/dashboard/GrowthChart.tsx
"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

interface Series {
  name: string;
  data: Array<{ date: string; value: number }>;
}

interface GrowthChartProps {
  series: Series[];
}

export function GrowthChart({ series }: GrowthChartProps) {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  // Combinar todas as datas únicas
  const allDates = Array.from(
    new Set(series.flatMap((s) => s.data.map((d) => d.date)))
  ).sort();

  const chartData = allDates.map((date) => {
    const row: Record<string, string | number> = { date };
    series.forEach((s) => {
      const point = s.data.find((d) => d.date === date);
      row[s.name] = point?.value ?? 0;
    });
    return row;
  });

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
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
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData}>
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
            contentStyle={{
              fontSize: 12,
              border: "1px solid #e5e5e5",
              borderRadius: 8,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {series.map((s, i) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Criar ClientRanking**

```tsx
// app/src/components/dashboard/ClientRanking.tsx
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
```

- [ ] **Step 3: Criar page.tsx do dashboard**

```tsx
// app/src/app/page.tsx
import { KpiCard } from "@/components/dashboard/KpiCard";
import { GrowthChart } from "@/components/dashboard/GrowthChart";
import { ClientRanking } from "@/components/dashboard/ClientRanking";
import { readClients } from "@/lib/clients";

export const revalidate = 3600;

export default async function DashboardPage() {
  const clients = readClients().filter((c) => c.status === "active");

  // Dados mockados até os tokens Meta estarem válidos
  const totalFollowers = 8_420;
  const avgReach = 3_200;
  const avgEngagement = 4.3;

  const rankingRows = clients.map((c, i) => ({
    id: c.id,
    name: c.name,
    followers: [1681, 2340, 890, 3510][i] ?? 1000,
    growth30d: [42, 120, -10, 88][i] ?? 0,
    engagementRate: [4.2, 3.8, 5.1, 4.7][i] ?? 3.5,
    reach30d: [820, 1200, 430, 1750][i] ?? 500,
  }));

  const growthSeries = clients.map((c, i) => ({
    name: c.name,
    data: Array.from({ length: 30 }, (_, d) => ({
      date: new Date(Date.now() - (29 - d) * 86400000)
        .toISOString()
        .slice(5, 10),
      value: ([1600, 2200, 870, 3400][i] ?? 900) + d * ([1.4, 4, 0.7, 3][i] ?? 1),
    })),
  }));

  return (
    <div className="p-6 max-w-6xl">
      <h1 className="text-lg font-semibold text-[#111] mb-5">Dashboard</h1>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <KpiCard
          label="Total de Seguidores"
          value={totalFollowers.toLocaleString("pt-BR")}
          delta={250}
          deltaLabel="30d"
        />
        <KpiCard
          label="Alcance Médio 30d"
          value={avgReach.toLocaleString("pt-BR")}
        />
        <KpiCard
          label="Engajamento Médio"
          value={`${avgEngagement.toFixed(1)}%`}
        />
      </div>

      {/* Gráfico comparativo */}
      <div className="mb-5">
        <GrowthChart series={growthSeries} />
      </div>

      {/* Ranking */}
      <ClientRanking rows={rankingRows} />
    </div>
  );
}
```

- [ ] **Step 4: Abrir browser e verificar dashboard**

Navegar para `http://localhost:3000`. Verificar KPIs, gráfico e tabela ranking.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx src/components/dashboard/
git commit -m "feat: dashboard geral com KPIs, gráfico de crescimento e ranking"
```

---

## Task 10: Layout do perfil do cliente

**Files:**
- Create: `app/src/app/clients/[clientId]/layout.tsx`
- Create: `app/src/app/clients/[clientId]/page.tsx`

- [ ] **Step 1: Criar layout com mini-sidebar**

```tsx
// app/src/app/clients/[clientId]/layout.tsx
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
          <p className="text-sm font-semibold text-[#111] leading-tight">{clientId.replace(/-/g, " ")}</p>
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
```

- [ ] **Step 2: Criar page.tsx de redirect**

```tsx
// app/src/app/clients/[clientId]/page.tsx
import { redirect } from "next/navigation";

export default function ClientPage({ params }: { params: { clientId: string } }) {
  redirect(`/clients/${params.clientId}/metrics`);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/clients/
git commit -m "feat: layout do perfil do cliente com mini-sidebar de abas"
```

---

## Task 11: Aba Métricas — componentes de apoio

**Files:**
- Create: `app/src/components/client/PlatformCards.tsx`
- Create: `app/src/components/client/MetricsKpis.tsx`
- Create: `app/src/components/client/GrowthToggleChart.tsx`
- Create: `app/src/components/client/TopPostsList.tsx`
- Create: `app/src/components/client/Demographics.tsx`

- [ ] **Step 1: Criar PlatformCards**

```tsx
// app/src/components/client/PlatformCards.tsx
const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📸", active: true },
  { id: "tiktok", label: "TikTok", icon: "🎵", active: false },
  { id: "linkedin", label: "LinkedIn", icon: "💼", active: false },
  { id: "meta-ads", label: "Meta Ads", icon: "📢", active: false },
];

export function PlatformCards({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-3 mb-5">
      {PLATFORMS.map((p) => (
        <div
          key={p.id}
          onClick={() => p.active && onSelect(p.id)}
          title={p.active ? p.label : "Em desenvolvimento"}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all select-none ${
            p.active
              ? selected === p.id
                ? "border-[#8b5cf6] bg-[rgba(139,92,246,0.07)] text-[#8b5cf6] cursor-pointer"
                : "border-[#e5e5e5] bg-white text-[#333] cursor-pointer hover:border-[#8b5cf6]"
              : "border-[#e5e5e5] bg-white text-[#333] opacity-40 cursor-not-allowed"
          }`}
        >
          <span>{p.icon}</span>
          {p.label}
          {!p.active && (
            <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-[#888] text-white px-1 rounded-full">
              em breve
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Criar MetricsKpis**

```tsx
// app/src/components/client/MetricsKpis.tsx
import { KpiCard } from "@/components/dashboard/KpiCard";

interface MetricsKpisProps {
  followers: number;
  followerDelta: number;
  reach30d: number;
  impressions30d: number;
  engagementRate: number;
}

export function MetricsKpis({
  followers,
  followerDelta,
  reach30d,
  impressions30d,
  engagementRate,
}: MetricsKpisProps) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-5">
      <KpiCard
        label="Seguidores"
        value={followers.toLocaleString("pt-BR")}
        delta={followerDelta}
        deltaLabel="30d"
      />
      <KpiCard label="Alcance 30d" value={reach30d.toLocaleString("pt-BR")} />
      <KpiCard label="Impressões 30d" value={impressions30d.toLocaleString("pt-BR")} />
      <KpiCard label="Engajamento" value={`${engagementRate.toFixed(2)}%`} />
    </div>
  );
}
```

- [ ] **Step 3: Criar GrowthToggleChart**

```tsx
// app/src/components/client/GrowthToggleChart.tsx
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
      ? data30d
      : data30d; // 90d usa os mesmos dados por enquanto

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
```

- [ ] **Step 4: Criar TopPostsList**

```tsx
// app/src/components/client/TopPostsList.tsx
import { Heart, MessageCircle, Bookmark, ExternalLink } from "lucide-react";

const FORMAT_COLORS: Record<string, string> = {
  Reel: "#8b5cf6",
  Carrossel: "#3b82f6",
  Imagem: "#6b7280",
  Stories: "#10b981",
};

interface Post {
  id: string;
  theme: string;
  mediaType: string;
  likes: number;
  comments: number;
  saves: number;
  permalink?: string;
}

export function TopPostsList({ posts }: { posts: Post[] }) {
  if (!posts.length) {
    return <p className="text-sm text-[#888] py-4">Nenhum post disponível.</p>;
  }

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-5">
      <h3 className="text-sm font-semibold text-[#111] mb-4">Top 5 Posts</h3>
      <div className="flex flex-col gap-3">
        {posts.slice(0, 5).map((post, i) => {
          const color = FORMAT_COLORS[post.mediaType] ?? "#6b7280";
          return (
            <div key={post.id} className="flex items-center gap-3">
              {/* Posição */}
              <span className="text-xs font-bold text-[#888] w-4 shrink-0">{i + 1}</span>
              {/* Thumbnail colorido */}
              <div
                className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
                style={{ background: color }}
              >
                {post.mediaType.charAt(0)}
              </div>
              {/* Tema */}
              <p className="flex-1 text-sm text-[#333] truncate">{post.theme || "Post"}</p>
              {/* Métricas */}
              <div className="flex items-center gap-3 text-xs text-[#888] shrink-0">
                <span className="flex items-center gap-1">
                  <Heart size={11} /> {post.likes.toLocaleString("pt-BR")}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle size={11} /> {post.comments.toLocaleString("pt-BR")}
                </span>
                <span className="flex items-center gap-1">
                  <Bookmark size={11} /> {post.saves.toLocaleString("pt-BR")}
                </span>
              </div>
              {/* Badge tipo */}
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded text-white shrink-0"
                style={{ background: color }}
              >
                {post.mediaType}
              </span>
              {/* Link */}
              {post.permalink && (
                <a
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#888] hover:text-[#8b5cf6] shrink-0"
                >
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Criar Demographics**

```tsx
// app/src/components/client/Demographics.tsx
"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from "recharts";

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
```

- [ ] **Step 6: Commit**

```bash
git add src/components/client/
git commit -m "feat: componentes de métricas do cliente (plataformas, KPIs, gráfico, top posts, demographics)"
```

---

## Task 12: Aba Métricas — page completa

**Files:**
- Create: `app/src/app/clients/[clientId]/metrics/page.tsx`

- [ ] **Step 1: Criar página de métricas**

```tsx
// app/src/app/clients/[clientId]/metrics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { PlatformCards } from "@/components/client/PlatformCards";
import { MetricsKpis } from "@/components/client/MetricsKpis";
import { GrowthToggleChart } from "@/components/client/GrowthToggleChart";
import { TopPostsList } from "@/components/client/TopPostsList";
import { Demographics } from "@/components/client/Demographics";

const MOCK_DEMOGRAPHICS = {
  ageRanges: [
    { range: "18-24", percentage: 22 },
    { range: "25-34", percentage: 38 },
    { range: "35-44", percentage: 24 },
    { range: "45-54", percentage: 11 },
    { range: "55+", percentage: 5 },
  ],
  topCities: [
    { city: "São Paulo", percentage: 34 },
    { city: "Rio de Janeiro", percentage: 18 },
    { city: "Curitiba", percentage: 12 },
    { city: "Belo Horizonte", percentage: 9 },
    { city: "Florianópolis", percentage: 7 },
  ],
  genderSplit: { female: 62, male: 35, unknown: 3 },
};

const MOCK_GROWTH = Array.from({ length: 30 }, (_, d) => ({
  date: new Date(Date.now() - (29 - d) * 86400000).toISOString().slice(5, 10),
  followers: 1600 + Math.round(d * 2.7),
}));

export default function MetricsPage({
  params,
}: {
  params: { clientId: string };
}) {
  const [platform, setPlatform] = useState("instagram");
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/metrics/${params.clientId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setInsights(data);
      })
      .finally(() => setLoading(false));
  }, [params.clientId]);

  const followers = insights?.followers ?? 1681;
  const followerDelta = insights?.followerGrowth ?? 42;
  const reach30d = insights?.reach ?? 3200;
  const impressions30d = insights?.impressions ?? 8400;
  const engagementRate = insights?.engagementRate ?? 4.2;
  const topPosts = insights?.topPosts ?? [];
  const demographics = insights?.demographics ?? MOCK_DEMOGRAPHICS;
  const growthData = MOCK_GROWTH;

  return (
    <div className="p-6">
      <PlatformCards selected={platform} onSelect={setPlatform} />

      {loading ? (
        <div className="text-sm text-[#888] py-4">Carregando métricas…</div>
      ) : (
        <>
          <MetricsKpis
            followers={followers}
            followerDelta={followerDelta}
            reach30d={reach30d}
            impressions30d={impressions30d}
            engagementRate={engagementRate}
          />
          <GrowthToggleChart data30d={growthData} />
          <TopPostsList posts={topPosts} />
          <Demographics demographics={demographics} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verificar no browser**

Navegar para `http://localhost:3000/clients/lais-daltrozo/metrics`. Verificar KPIs, gráfico, top posts e demographics.

- [ ] **Step 3: Commit**

```bash
git add src/app/clients/
git commit -m "feat: aba Métricas completa com dados reais ou mock"
```

---

## Task 13: Aba Calendário

**Files:**
- Create: `app/src/components/client/CalendarView.tsx`
- Create: `app/src/app/clients/[clientId]/calendar/page.tsx`

- [ ] **Step 1: Criar CalendarView com mini-calendário e painel de detalhe**

```tsx
// app/src/components/client/CalendarView.tsx
"use client";

import { useState } from "react";

const FORMAT_COLORS: Record<string, string> = {
  Reel: "#8b5cf6",
  Carrossel: "#3b82f6",
  Stories: "#10b981",
  Imagem: "#6b7280",
};

interface Post {
  day: number;
  theme: string;
  format: string;
  hook?: string;
  objective?: string;
  notes?: string;
}

function parsePosts(markdown: string, year: number, month: number): Post[] {
  const posts: Post[] = [];
  const lines = markdown.split("\n");
  let current: Partial<Post> | null = null;

  for (const line of lines) {
    const dateMatch = line.match(/##\s+\d{4}-(\d{2})-(\d{2})/);
    if (dateMatch) {
      if (current?.day) posts.push(current as Post);
      current = { day: parseInt(dateMatch[2]), format: "Reel" };
      continue;
    }
    if (!current) continue;
    if (line.match(/tema[:\s]/i)) current.theme = line.split(/[:\s]/)[1]?.trim();
    if (line.match(/formato[:\s]/i)) current.format = line.split(/[:\s]/)[1]?.trim() ?? "Reel";
    if (line.match(/gancho[:\s]/i)) current.hook = line.replace(/gancho[:\s]*/i, "").trim();
    if (line.match(/objetivo[:\s]/i)) current.objective = line.replace(/objetivo[:\s]*/i, "").trim();
    if (line.match(/notas[:\s]/i)) current.notes = line.replace(/notas[:\s]*/i, "").trim();
  }
  if (current?.day) posts.push(current as Post);
  return posts;
}

export function CalendarView({
  markdown,
  month,
}: {
  markdown: string;
  month: string;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [year, monthNum] = month.split("-").map(Number);
  const posts = parsePosts(markdown, year, monthNum);
  const firstDay = new Date(year, monthNum - 1, 1).getDay();
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const selectedPost = posts.find((p) => p.day === selectedDay);

  return (
    <div>
      {/* Header toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#111]">
          {new Date(year, monthNum - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" })}
        </h3>
        <div className="flex gap-1">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                view === v ? "bg-[#8b5cf6] text-white" : "bg-[#f5f5f5] text-[#888]"
              }`}
            >
              {v === "grid" ? "Grade" : "Lista"}
            </button>
          ))}
        </div>
      </div>

      {view === "grid" ? (
        <div className="flex gap-4">
          {/* Mini-calendário */}
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 shrink-0">
            <div className="grid grid-cols-7 gap-1 text-center">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                <div key={i} className="text-[10px] text-[#888] font-medium w-7 py-1">
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const post = posts.find((p) => p.day === day);
                const color = post ? FORMAT_COLORS[post.format] ?? "#6b7280" : null;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium flex items-center justify-center transition-colors ${
                      selectedDay === day
                        ? "ring-2 ring-[#8b5cf6]"
                        : ""
                    } ${color ? "text-white" : "text-[#333] hover:bg-[#f5f5f5]"}`}
                    style={color ? { background: color } : {}}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Painel de detalhe */}
          <div className="flex-1 bg-white rounded-xl border border-[#e5e5e5] p-4">
            {selectedPost ? (
              <>
                <p className="text-xs text-[#888] mb-1">Dia {selectedDay}</p>
                <h4 className="text-sm font-semibold text-[#111] mb-3">{selectedPost.theme ?? "Post"}</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <div>
                    <span className="text-[#888] mr-2">Formato:</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded text-white"
                      style={{ background: FORMAT_COLORS[selectedPost.format] ?? "#6b7280" }}
                    >
                      {selectedPost.format}
                    </span>
                  </div>
                  {selectedPost.hook && (
                    <div>
                      <span className="text-[#888]">Gancho: </span>
                      <span className="text-[#333]">{selectedPost.hook}</span>
                    </div>
                  )}
                  {selectedPost.objective && (
                    <div>
                      <span className="text-[#888]">Objetivo: </span>
                      <span className="text-[#333]">{selectedPost.objective}</span>
                    </div>
                  )}
                  {selectedPost.notes && (
                    <div>
                      <span className="text-[#888]">Notas: </span>
                      <span className="text-[#333]">{selectedPost.notes}</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-[#888]">Selecione um dia com post no calendário.</p>
            )}
          </div>
        </div>
      ) : (
        /* Visão lista */
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <div key={post.day} className="bg-white rounded-xl border border-[#e5e5e5] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs text-[#888] mb-0.5">Dia {post.day}</p>
                  <h4 className="text-sm font-semibold text-[#111]">{post.theme ?? "Post"}</h4>
                  {post.hook && <p className="text-xs text-[#555] mt-1">{post.hook}</p>}
                </div>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded text-white shrink-0"
                  style={{ background: FORMAT_COLORS[post.format] ?? "#6b7280" }}
                >
                  {post.format}
                </span>
              </div>
            </div>
          ))}
          {posts.length === 0 && (
            <p className="text-sm text-[#888]">Nenhum post no calendário deste mês.</p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Criar page de calendário**

```tsx
// app/src/app/clients/[clientId]/calendar/page.tsx
"use client";

import { useEffect, useState } from "react";
import { CalendarView } from "@/components/client/CalendarView";
import { RefreshCw } from "lucide-react";

export default function CalendarPage({ params }: { params: { clientId: string } }) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<{ content: string; month: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/clients/${params.clientId}/calendar?month=${month}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [params.clientId, month]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-[#111]">Calendário de Conteúdo</h2>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="text-xs border border-[#e5e5e5] rounded-lg px-2 py-1.5 bg-white"
          />
          <button
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors"
            onClick={() => {
              fetch(`/api/pipeline/run`, { method: "POST", body: JSON.stringify({ clientId: params.clientId, job: "calendar" }) });
            }}
          >
            <RefreshCw size={12} />
            Regenerar Calendário
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#888]">Carregando calendário…</p>
      ) : data ? (
        <CalendarView markdown={data.content} month={month} />
      ) : null}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/client/CalendarView.tsx src/app/clients/
git commit -m "feat: aba Calendário com visão grade/lista e painel de detalhe"
```

---

## Task 14: Aba ICP

**Files:**
- Create: `app/src/components/client/IcpEditor.tsx`
- Create: `app/src/app/clients/[clientId]/icp/page.tsx`

- [ ] **Step 1: Criar IcpEditor**

```tsx
// app/src/components/client/IcpEditor.tsx
"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Edit2, Check, RefreshCw } from "lucide-react";

interface IcpEditorProps {
  initial: string;
  onSave: (content: string) => Promise<void>;
  onRegenerate: () => Promise<void>;
}

export function IcpEditor({ initial, onSave, onRegenerate }: IcpEditorProps) {
  const [content, setContent] = useState(initial);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(content);
    setSaving(false);
    setEditing(false);
  };

  const handleRegenerate = async () => {
    if (!confirm("Isso vai sobrescrever o ICP atual. Continuar?")) return;
    setRegenerating(true);
    await onRegenerate();
    setRegenerating(false);
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold text-[#111] flex-1">ICP — Perfil do Cliente Ideal</h2>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={regenerating ? "animate-spin" : ""} />
          {regenerating ? "Gerando…" : "Regenerar"}
        </button>
        {editing ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#8b5cf6] text-white rounded-lg disabled:opacity-50"
          >
            <Check size={12} />
            {saving ? "Salvando…" : "Salvar"}
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
          >
            <Edit2 size={12} />
            Editar
          </button>
        )}
      </div>

      {editing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-[calc(100vh-200px)] font-mono text-sm border border-[#e5e5e5] rounded-xl p-4 resize-none focus:outline-none focus:border-[#8b5cf6]"
        />
      ) : (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-6 prose prose-sm max-w-none">
          {content ? (
            <ReactMarkdown>{content}</ReactMarkdown>
          ) : (
            <p className="text-[#888]">ICP não gerado ainda.</p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Criar page de ICP**

```tsx
// app/src/app/clients/[clientId]/icp/page.tsx
"use client";

import { useEffect, useState } from "react";
import { IcpEditor } from "@/components/client/IcpEditor";

export default function IcpPage({ params }: { params: { clientId: string } }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${params.clientId}/icp`)
      .then((r) => r.json())
      .then((d) => setContent(d.content ?? ""))
      .finally(() => setLoading(false));
  }, [params.clientId]);

  const handleSave = async (newContent: string) => {
    await fetch(`/api/clients/${params.clientId}/icp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newContent }),
    });
    setContent(newContent);
  };

  const handleRegenerate = async () => {
    await fetch(`/api/pipeline/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: params.clientId, job: "icp" }),
    });
    // Recarregar após 3s
    setTimeout(() => {
      fetch(`/api/clients/${params.clientId}/icp`)
        .then((r) => r.json())
        .then((d) => setContent(d.content ?? ""));
    }, 3000);
  };

  if (loading) return <div className="p-6 text-sm text-[#888]">Carregando ICP…</div>;

  return (
    <div className="p-6">
      <IcpEditor initial={content} onSave={handleSave} onRegenerate={handleRegenerate} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/client/IcpEditor.tsx src/app/clients/
git commit -m "feat: aba ICP com visualização markdown, edição e regeneração"
```

---

## Task 15: Aba Paleta

**Files:**
- Create: `app/src/components/client/PaletteGrid.tsx`
- Create: `app/src/app/clients/[clientId]/palette/page.tsx`

- [ ] **Step 1: Parser de paletas do markdown**

O `paleta.md` do Obsidian tem formato:
```markdown
## Opção 1 — Nome da Paleta
- Primária: #XXXXXX
- Secundária: #XXXXXX
- Acento: #XXXXXX
- Neutro: #XXXXXX
```

- [ ] **Step 2: Criar PaletteGrid**

```tsx
// app/src/components/client/PaletteGrid.tsx
"use client";

import { useState } from "react";
import { Check } from "lucide-react";

interface Palette {
  index: number;
  name: string;
  colors: Array<{ label: string; hex: string }>;
}

function parsePalettes(markdown: string): Palette[] {
  const palettes: Palette[] = [];
  const blocks = markdown.split(/^## /m).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const header = lines[0] ?? "";
    const nameMatch = header.match(/Opção\s+(\d+)\s*[—-]\s*(.+)/);
    if (!nameMatch) continue;

    const index = parseInt(nameMatch[1]);
    const name = nameMatch[2].trim();
    const colors: Array<{ label: string; hex: string }> = [];

    for (const line of lines.slice(1)) {
      const colorMatch = line.match(/[-*]\s*(.+?):\s*(#[0-9a-fA-F]{6})/);
      if (colorMatch) {
        colors.push({ label: colorMatch[1].trim(), hex: colorMatch[2] });
      }
    }

    if (colors.length > 0) palettes.push({ index, name, colors });
  }

  return palettes;
}

interface PaletteGridProps {
  markdown: string;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

export function PaletteGrid({ markdown, selectedIndex, onSelect }: PaletteGridProps) {
  const palettes = parsePalettes(markdown);

  if (!palettes.length) {
    return <p className="text-sm text-[#888]">Paletas não geradas ainda.</p>;
  }

  return (
    <div className="grid grid-cols-5 gap-4">
      {palettes.map((palette) => {
        const selected = selectedIndex === palette.index;
        return (
          <div
            key={palette.index}
            className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${
              selected
                ? "border-[#8b5cf6] shadow-md"
                : "border-[#e5e5e5] hover:border-[#c4b5fd]"
            }`}
          >
            {/* Faixa de cores */}
            <div className="flex h-16">
              {palette.colors.slice(0, 4).map((c) => (
                <div key={c.hex} className="flex-1" style={{ background: c.hex }} />
              ))}
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="text-xs font-semibold text-[#111] mb-1 truncate">{palette.name}</p>
              <div className="flex flex-col gap-0.5 mb-3">
                {palette.colors.slice(0, 2).map((c) => (
                  <div key={c.hex} className="flex items-center gap-1.5">
                    <div
                      className="w-3 h-3 rounded-sm shrink-0"
                      style={{ background: c.hex }}
                    />
                    <span className="text-[10px] text-[#888] truncate">{c.label}</span>
                    <span className="text-[10px] font-mono text-[#555] ml-auto">{c.hex}</span>
                  </div>
                ))}
              </div>

              {selected ? (
                <div className="flex items-center gap-1 text-[10px] font-medium text-[#8b5cf6]">
                  <Check size={11} />
                  Selecionada
                </div>
              ) : (
                <button
                  onClick={() => onSelect(palette.index)}
                  className="text-[10px] font-medium text-[#888] hover:text-[#8b5cf6] transition-colors"
                >
                  Selecionar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: Criar page de paleta**

```tsx
// app/src/app/clients/[clientId]/palette/page.tsx
"use client";

import { useEffect, useState } from "react";
import { PaletteGrid } from "@/components/client/PaletteGrid";
import { RefreshCw } from "lucide-react";

export default function PalettePage({ params }: { params: { clientId: string } }) {
  const [markdown, setMarkdown] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/clients/${params.clientId}/palette`)
      .then((r) => r.json())
      .then((d) => setMarkdown(d.content ?? ""))
      .finally(() => setLoading(false));
  }, [params.clientId]);

  const handleSelect = (index: number) => {
    setSelected(index);
    // Salvar no clients.json via API (futuro)
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-[#111]">Paletas de Cores</h2>
        <button
          onClick={() => {
            fetch(`/api/pipeline/run`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ clientId: params.clientId, job: "palette" }),
            });
          }}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
        >
          <RefreshCw size={12} />
          Regenerar Paletas
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#888]">Carregando paletas…</p>
      ) : (
        <PaletteGrid markdown={markdown} selectedIndex={selected} onSelect={handleSelect} />
      )}
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/client/PaletteGrid.tsx src/app/clients/
git commit -m "feat: aba Paleta com grade 5×2, seleção e parser de markdown"
```

---

## Task 16: Aba Configurações do Cliente

**Files:**
- Create: `app/src/app/clients/[clientId]/settings/page.tsx`
- Create: `app/src/components/shared/TokenBadge.tsx`

- [ ] **Step 1: Criar TokenBadge**

```tsx
// app/src/components/shared/TokenBadge.tsx
function daysDiff(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / 86400000);
}

interface TokenBadgeProps {
  expiresAt?: string;
}

export function TokenBadge({ expiresAt }: TokenBadgeProps) {
  if (!expiresAt) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#e11d48] font-medium">
        🔴 Não configurado
      </span>
    );
  }

  const days = daysDiff(expiresAt);

  if (days <= 0) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#e11d48] font-medium">
        🔴 Expirado
      </span>
    );
  }

  if (days <= 14) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#d97706] font-medium">
        🟡 Expira em {days}d
      </span>
    );
  }

  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d1fae5] text-[#059669] font-medium">
      🟢 Válido
    </span>
  );
}
```

- [ ] **Step 2: Criar página de configurações do cliente**

```tsx
// app/src/app/clients/[clientId]/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { TokenBadge } from "@/components/shared/TokenBadge";
import { Save } from "lucide-react";

interface ClientData {
  id: string;
  name: string;
  brandName?: string;
  niche: string;
  instagramHandle?: string;
  status: string;
  toneOfVoice?: string;
  contentGoal?: string;
  metaAccessToken?: string;
  metaTokenExpiresAt?: string;
}

export default function ClientSettingsPage({ params }: { params: { clientId: string } }) {
  const [client, setClient] = useState<ClientData | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/clients`)
      .then((r) => r.json())
      .then((clients: ClientData[]) => {
        const found = clients.find((c) => c.id === params.clientId);
        if (found) setClient(found);
      });
  }, [params.clientId]);

  if (!client) return <div className="p-6 text-sm text-[#888]">Carregando…</div>;

  const Field = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div>
      <label className="block text-xs font-medium text-[#555] mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#8b5cf6]"
      />
    </div>
  );

  return (
    <div className="p-6 max-w-xl">
      <h2 className="text-base font-semibold text-[#111] mb-5">Configurações do Cliente</h2>

      <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 flex flex-col gap-4 mb-4">
        <Field
          label="Nome"
          value={client.name}
          onChange={(v) => setClient({ ...client, name: v })}
        />
        <Field
          label="Marca"
          value={client.brandName ?? ""}
          onChange={(v) => setClient({ ...client, brandName: v })}
        />
        <div>
          <label className="block text-xs font-medium text-[#555] mb-1">Nicho</label>
          <select
            value={client.niche}
            onChange={(e) => setClient({ ...client, niche: e.target.value })}
            className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#8b5cf6]"
          >
            <option value="life-insurance">Life Insurance</option>
            <option value="real-estate">Imóveis</option>
            <option value="general">Geral</option>
          </select>
        </div>
        <Field
          label="Instagram Handle"
          value={client.instagramHandle ?? ""}
          onChange={(v) => setClient({ ...client, instagramHandle: v })}
        />
        <Field
          label="Tom de Voz"
          value={client.toneOfVoice ?? ""}
          onChange={(v) => setClient({ ...client, toneOfVoice: v })}
        />
        <Field
          label="Objetivo de Conteúdo"
          value={client.contentGoal ?? ""}
          onChange={(v) => setClient({ ...client, contentGoal: v })}
        />
      </div>

      {/* Meta Token */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#111]">Meta Access Token</h3>
          <TokenBadge expiresAt={client.metaTokenExpiresAt} />
        </div>
        <input
          type="password"
          value={client.metaAccessToken ?? ""}
          onChange={(e) => setClient({ ...client, metaAccessToken: e.target.value })}
          placeholder="EAAxxxxxxxxx…"
          className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#8b5cf6] font-mono"
        />
      </div>

      <button
        onClick={async () => {
          setSaving(true);
          await fetch(`/api/clients`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(client),
          });
          setSaving(false);
        }}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] text-white text-sm rounded-lg hover:bg-[#7c3aed] transition-colors disabled:opacity-50"
      >
        <Save size={14} />
        {saving ? "Salvando…" : "Salvar"}
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Adicionar método PATCH à API de clients**

Editar `app/src/app/api/clients/route.ts` para adicionar:

```typescript
import { writeFileSync } from "fs";
import type { Client } from "@/lib/types";

export async function PATCH(req: Request) {
  try {
    const updated: Client = await req.json();
    const raw = readFileSync(CLIENTS_PATH, "utf-8");
    const clients: Client[] = JSON.parse(raw);
    const idx = clients.findIndex((c) => c.id === updated.id);
    if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
    clients[idx] = { ...clients[idx], ...updated };
    writeFileSync(CLIENTS_PATH, JSON.stringify(clients, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/clients/ src/components/shared/TokenBadge.tsx src/app/api/clients/route.ts
git commit -m "feat: aba Configurações do cliente com TokenBadge e PATCH API"
```

---

## Task 17: Página de Clientes (lista)

**Files:**
- Create: `app/src/app/clients/page.tsx`

- [ ] **Step 1: Criar lista de todos os clientes**

```tsx
// app/src/app/clients/page.tsx
import Link from "next/link";
import { readClients } from "@/lib/clients";

export default function ClientsPage() {
  const clients = readClients();

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-[#111] mb-5">Clientes</h1>
      <div className="grid grid-cols-2 gap-4">
        {clients.map((c) => (
          <Link
            key={c.id}
            href={`/clients/${c.id}/metrics`}
            className="bg-white rounded-xl border border-[#e5e5e5] p-4 hover:border-[#8b5cf6] transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-full bg-[#8b5cf6] flex items-center justify-center text-white font-bold text-sm">
                {c.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#111]">{c.name}</p>
                <p className="text-xs text-[#888]">{c.niche}</p>
              </div>
            </div>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                c.status === "active"
                  ? "bg-[#d1fae5] text-[#059669]"
                  : "bg-[#f5f5f5] text-[#888]"
              }`}
            >
              {c.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar no browser**

Navegar para `http://localhost:3000/clients`. Verificar que aparece a lista de clientes.

- [ ] **Step 3: Commit**

```bash
git add src/app/clients/page.tsx
git commit -m "feat: página de listagem de clientes"
```

---

## Task 18: Verificação final e ajustes

- [ ] **Step 1: Checar todas as rotas no browser**

Com `npm run dev` rodando:
- `http://localhost:3000` — dashboard com KPIs, gráfico e ranking
- `http://localhost:3000/clients` — lista de clientes
- `http://localhost:3000/clients/lais-daltrozo/metrics` — métricas (KPIs, gráfico, top posts, demographics)
- `http://localhost:3000/clients/lais-daltrozo/calendar` — calendário grade e lista
- `http://localhost:3000/clients/lais-daltrozo/icp` — ICP renderizado em markdown
- `http://localhost:3000/clients/lais-daltrozo/palette` — paletas 5×2
- `http://localhost:3000/clients/lais-daltrozo/settings` — configurações e token badge

- [ ] **Step 2: Checar erros de TypeScript**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost/app"
npx tsc --noEmit 2>&1 | head -40
```

Expected: zero erros.

- [ ] **Step 3: Build de produção**

```bash
npm run build 2>&1 | tail -20
```

Expected: `✓ Compiled` sem erros.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "feat: frontend Plan 1 completo — shell, dashboard, perfil do cliente"
```
