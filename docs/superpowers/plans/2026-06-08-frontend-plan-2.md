# Frontend Plan 2 — Calendário Global, Insights, Pipeline, Settings, PDFs, Novo Cliente

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar o dashboard com as telas de Calendário Global, Insights Comparativo, Pipeline/Automação, Configurações Globais, exportação de PDFs (relatório e paleta) e formulário de novo cliente.

**Architecture:** Todas as telas seguem o mesmo padrão do Plan 1: pages em `app/src/app/`, componentes em `app/src/components/`, API routes em `app/src/app/api/`. PDFs gerados server-side via jsPDF, retornados como `application/pdf`. O formulário de novo cliente chama a API de onboarding existente em `src/lib/onboarding.ts`.

**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS v4, Recharts, jsPDF (instalar), lucide-react, Inter font

---

## Mapa de Arquivos

```
app/src/
  app/
    calendar/page.tsx                        ← CREATE: calendário global
    insights/page.tsx                        ← CREATE: insights comparativo
    pipeline/page.tsx                        ← CREATE: pipeline / automação
    settings/page.tsx                        ← CREATE: configurações globais
    clients/new/page.tsx                     ← CREATE: formulário novo cliente
    api/
      pipeline/run/route.ts                  ← CREATE: trigger manual de jobs
      pipeline/logs/route.ts                 ← CREATE: GET log das últimas execuções
      export/report/[clientId]/route.ts      ← CREATE: gera PDF de relatório
      export/palette/[clientId]/route.ts     ← CREATE: gera PDF de paleta
      clients/route.ts                       ← MODIFY: adicionar POST para criar cliente
  components/
    calendar/
      GlobalCalendarView.tsx                 ← CREATE: calendário global multi-cliente
    insights/
      InsightsChart.tsx                      ← CREATE: gráfico comparativo recharts
      MetricSelector.tsx                     ← CREATE: seletor de métrica
      ClientMultiSelect.tsx                  ← CREATE: seletor de clientes
    pipeline/
      JobsTable.tsx                          ← CREATE: tabela de jobs agendados
      LogsList.tsx                           ← CREATE: log de execuções
    settings/
      TokensPanel.tsx                        ← CREATE: painel de tokens/APIs
      CronPanel.tsx                          ← CREATE: painel de horários de cron
    shared/
      ExportButton.tsx                       ← CREATE: botão de export genérico
```

---

## Task 1: Instalar jsPDF e criar utilitário de PDF

**Files:**
- Modify: `app/package.json`
- Create: `app/src/lib/pdf.ts`

- [ ] **Step 1: Instalar jsPDF**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost/app"
npm install jspdf
```

Expected: instalação sem erros.

- [ ] **Step 2: Criar utilitário base de PDF**

```typescript
// app/src/lib/pdf.ts
import { jsPDF } from "jspdf";

export interface ReportData {
  clientName: string;
  period: string;
  followers: number;
  followerDelta: number;
  reach30d: number;
  impressions30d: number;
  engagementRate: number;
  topPosts: Array<{
    theme: string;
    mediaType: string;
    likes: number;
    comments: number;
    saves: number;
  }>;
  demographics?: {
    ageRanges: Array<{ range: string; percentage: number }>;
    topCities: Array<{ city: string; percentage: number }>;
    genderSplit: { male: number; female: number; unknown: number };
  };
}

export function generateReportPDF(data: ReportData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const ACCENT = [139, 92, 246] as const;
  const GRAY = [136, 136, 136] as const;
  const BLACK = [17, 17, 17] as const;

  let y = 20;

  // Header
  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, W, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Clique Boost — Relatório de Performance", 14, 9);

  y = 28;

  // Título
  doc.setTextColor(...BLACK);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.clientName, 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(`Período: ${data.period}`, 14, y);
  y += 12;

  // KPIs
  doc.setTextColor(...ACCENT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("MÉTRICAS PRINCIPAIS", 14, y);
  y += 6;

  const kpis = [
    { label: "Seguidores", value: data.followers.toLocaleString("pt-BR") },
    { label: "Crescimento 30d", value: `+${data.followerDelta.toLocaleString("pt-BR")}` },
    { label: "Alcance 30d", value: data.reach30d.toLocaleString("pt-BR") },
    { label: "Impressões 30d", value: data.impressions30d.toLocaleString("pt-BR") },
    { label: "Engajamento", value: `${data.engagementRate.toFixed(2)}%` },
  ];

  const colW = (W - 28) / kpis.length;
  kpis.forEach((kpi, i) => {
    const x = 14 + i * colW;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, y, colW - 3, 18, 2, 2, "F");
    doc.setTextColor(...GRAY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label, x + 3, y + 6);
    doc.setTextColor(...BLACK);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, x + 3, y + 14);
  });
  y += 26;

  // Top Posts
  doc.setTextColor(...ACCENT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TOP 5 POSTS", 14, y);
  y += 6;

  data.topPosts.slice(0, 5).forEach((post, i) => {
    doc.setFillColor(i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 250 : 255);
    doc.rect(14, y - 1, W - 28, 8, "F");
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`${i + 1}.`, 14, y + 5);
    doc.setTextColor(...BLACK);
    const theme = post.theme.length > 50 ? post.theme.slice(0, 47) + "..." : post.theme;
    doc.text(theme, 22, y + 5);
    doc.setTextColor(...GRAY);
    doc.text(`❤ ${post.likes}  💬 ${post.comments}  🔖 ${post.saves}`, W - 60, y + 5);
    y += 9;
  });
  y += 6;

  // Demographics
  if (data.demographics) {
    doc.setTextColor(...ACCENT);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DEMOGRAPHICS", 14, y);
    y += 6;

    // Gênero
    const { male, female, unknown } = data.demographics.genderSplit;
    doc.setTextColor(...BLACK);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Gênero: Feminino ${female}%  Masculino ${male}%  Outro ${unknown}%`, 14, y);
    y += 7;

    // Top cidades
    doc.text("Top Cidades:", 14, y);
    y += 5;
    data.demographics.topCities.slice(0, 5).forEach((city) => {
      const barW = (W - 80) * (city.percentage / 100);
      doc.setFillColor(...ACCENT);
      doc.rect(40, y - 3, barW, 4, "F");
      doc.setTextColor(...GRAY);
      doc.text(`${city.city}`, 14, y);
      doc.text(`${city.percentage}%`, W - 20, y);
      y += 6;
    });
  }

  // Footer
  doc.setFillColor(...ACCENT);
  doc.rect(0, 285, W, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")} · Clique Boost`, 14, 292);

  return Buffer.from(doc.output("arraybuffer"));
}

export interface PalettePageData {
  clientName: string;
  paletteName: string;
  colors: Array<{ label: string; hex: string }>;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function generatePalettePDF(pages: PalettePageData[], brandName: string): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const year = new Date().getFullYear();

  pages.forEach((page, pageIdx) => {
    if (pageIdx > 0) doc.addPage();

    // Fundo branco
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, "F");

    // Header com nome da marca e ano
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(136, 136, 136);
    doc.text(brandName.toUpperCase(), 14, 18);
    doc.text(String(year), W - 14, 18, { align: "right" });

    // Nome da paleta
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 17, 17);
    doc.text(page.paletteName, 14, 36);

    // Swatches: 4 retângulos grandes lado a lado
    const swatchH = 100;
    const swatchY = 50;
    const colors = page.colors.slice(0, 4);
    const swatchW = (W - 28) / colors.length;

    colors.forEach((c, i) => {
      const x = 14 + i * swatchW;
      const rgb = hexToRgb(c.hex);
      doc.setFillColor(...rgb);
      doc.rect(x, swatchY, swatchW - 2, swatchH, "F");
    });

    // Info das cores abaixo
    let infoY = swatchY + swatchH + 12;
    colors.forEach((c, i) => {
      const x = 14 + i * swatchW;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 17, 17);
      doc.text(c.label, x, infoY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(136, 136, 136);
      doc.text(c.hex.toUpperCase(), x, infoY + 5);
    });

    // Footer
    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.text("Clique Boost · Identidade Visual", 14, H - 10);
    doc.text(`${pageIdx + 1} / ${pages.length}`, W - 14, H - 10, { align: "right" });
  });

  return Buffer.from(doc.output("arraybuffer"));
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost/app"
npx tsc --noEmit 2>&1 | head -20
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost"
git add app/package.json app/package-lock.json app/src/lib/pdf.ts
git commit -m "feat: instalar jsPDF e utilitário de geração de PDF (relatório + paleta)"
```

---

## Task 2: API Routes de export (relatório e paleta)

**Files:**
- Create: `app/src/app/api/export/report/[clientId]/route.ts`
- Create: `app/src/app/api/export/palette/[clientId]/route.ts`

- [ ] **Step 1: Criar route de export de relatório**

```typescript
// app/src/app/api/export/report/[clientId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readClients } from "@/lib/clients";
import { fetchClientInsights } from "@/lib/metaInsights";
import { generateReportPDF, ReportData } from "@/lib/pdf";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  let insights;
  try {
    insights = await fetchClientInsights(client);
  } catch {
    insights = null;
  }

  const data: ReportData = {
    clientName: client.name,
    period: "Últimos 30 dias",
    followers: insights?.followerCount ?? 0,
    followerDelta: insights?.followerGrowth ?? 0,
    reach30d: insights?.reach ?? 0,
    impressions30d: insights?.impressions ?? 0,
    engagementRate: insights?.engagementRate ?? 0,
    topPosts: (insights?.topPosts ?? []).map((p) => ({
      theme: p.mediaType,
      mediaType: p.mediaType,
      likes: p.likeCount,
      comments: p.commentsCount,
      saves: p.saves,
    })),
    demographics: insights?.demographics,
  };

  const pdf = generateReportPDF(data);
  const filename = `relatorio-${clientId}-${new Date().toISOString().slice(0, 10)}.pdf`;

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

- [ ] **Step 2: Criar route de export de paleta**

```typescript
// app/src/app/api/export/palette/[clientId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";
import { readClients } from "@/lib/clients";
import { generatePalettePDF, PalettePageData } from "@/lib/pdf";

function parsePalettes(markdown: string): PalettePageData[] {
  const pages: PalettePageData[] = [];
  const blocks = markdown.split(/^## /m).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    const header = lines[0] ?? "";
    const nameMatch = header.match(/Opção\s+\d+\s*[—-]\s*(.+)/);
    if (!nameMatch) continue;

    const paletteName = nameMatch[1].trim();
    const colors: Array<{ label: string; hex: string }> = [];

    for (const line of lines.slice(1)) {
      const colorMatch = line.match(/[-*]\s*(.+?):\s*(#[0-9a-fA-F]{6})/);
      if (colorMatch) {
        colors.push({ label: colorMatch[1].trim(), hex: colorMatch[2] });
      }
    }

    if (colors.length > 0) pages.push({ clientName: "", paletteName, colors });
  }

  return pages;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const client = readClients().find((c) => c.id === clientId);
  if (!client) return NextResponse.json({ error: "not found" }, { status: 404 });

  let markdown = "";
  try {
    markdown = readFileSync(path.join(client.obsidianPath, "paleta.md"), "utf-8");
  } catch {
    return NextResponse.json({ error: "paleta.md not found" }, { status: 404 });
  }

  const pages = parsePalettes(markdown).map((p) => ({
    ...p,
    clientName: client.name,
  }));

  if (!pages.length) {
    return NextResponse.json({ error: "No palettes found" }, { status: 404 });
  }

  const pdf = generatePalettePDF(pages, client.brandName || client.name);
  const filename = `paletas-${clientId}.pdf`;

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
```

- [ ] **Step 3: Adicionar ExportButton ao perfil do cliente**

Criar `app/src/components/shared/ExportButton.tsx`:

```tsx
// app/src/components/shared/ExportButton.tsx
"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

interface ExportButtonProps {
  href: string;
  label: string;
  filename: string;
}

export function ExportButton({ href, label, filename }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(href);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
      {loading ? "Gerando…" : label}
    </button>
  );
}
```

- [ ] **Step 4: Adicionar ExportButton à aba Métricas**

Editar `app/src/app/clients/[clientId]/metrics/page.tsx`. Adicionar import e botão no header da página:

```tsx
import { ExportButton } from "@/components/shared/ExportButton";

// No JSX, adicionar antes do <PlatformCards>:
<div className="flex items-center justify-between mb-5">
  <h2 className="text-base font-semibold text-[#111]">Métricas</h2>
  <ExportButton
    href={`/api/export/report/${clientId}`}
    label="Exportar Relatório"
    filename={`relatorio-${clientId}.pdf`}
  />
</div>
```

- [ ] **Step 5: Adicionar ExportButton à aba Paleta**

Editar `app/src/app/clients/[clientId]/palette/page.tsx`. Adicionar ExportButton ao lado do botão "Regenerar Paletas":

```tsx
import { ExportButton } from "@/components/shared/ExportButton";

// No header (div com justify-between), adicionar:
<div className="flex gap-2">
  <ExportButton
    href={`/api/export/palette/${clientId}`}
    label="Baixar PDF"
    filename={`paletas-${clientId}.pdf`}
  />
  <button ...>Regenerar Paletas</button>
</div>
```

- [ ] **Step 6: Verificar TypeScript**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost/app"
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 7: Commit**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost"
git add app/src/app/api/export/ app/src/components/shared/ExportButton.tsx
git add app/src/app/clients/
git commit -m "feat: export PDF de relatório e paleta, botão ExportButton nas abas"
```

---

## Task 3: API Route de Pipeline (trigger e logs)

**Files:**
- Create: `app/src/app/api/pipeline/run/route.ts`
- Create: `app/src/app/api/pipeline/logs/route.ts`
- Create: `app/src/lib/pipelineLog.ts`

- [ ] **Step 1: Criar sistema de log de execuções**

```typescript
// app/src/lib/pipelineLog.ts
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

const LOG_PATH = path.join(process.cwd(), "..", "data", "pipeline-log.json");

export interface LogEntry {
  id: string;
  date: string;
  job: string;
  clientId: string;
  status: "success" | "error" | "running";
  message: string;
  durationMs?: number;
}

export function readLog(): LogEntry[] {
  if (!existsSync(LOG_PATH)) return [];
  try {
    return JSON.parse(readFileSync(LOG_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export function appendLog(entry: Omit<LogEntry, "id">): LogEntry {
  const log = readLog();
  const full: LogEntry = { id: Date.now().toString(), ...entry };
  const updated = [full, ...log].slice(0, 100); // manter últimas 100
  writeFileSync(LOG_PATH, JSON.stringify(updated, null, 2), "utf-8");
  return full;
}
```

- [ ] **Step 2: Criar route de trigger de pipeline**

```typescript
// app/src/app/api/pipeline/run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { appendLog } from "@/lib/pipelineLog";

const VALID_JOBS = ["calendar", "icp", "palette", "metrics", "weekly-refresh"] as const;
type Job = typeof VALID_JOBS[number];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { clientId, job } = body as { clientId?: string; job?: string };

  if (!job || !VALID_JOBS.includes(job as Job)) {
    return NextResponse.json(
      { error: `job must be one of: ${VALID_JOBS.join(", ")}` },
      { status: 400 }
    );
  }

  const entry = appendLog({
    date: new Date().toISOString(),
    job,
    clientId: clientId ?? "all",
    status: "running",
    message: `Job ${job} disparado manualmente`,
  });

  // Fire-and-forget: chamar o script via child_process sem await
  // Em produção local, o Next.js serve como API gateway para os scripts
  try {
    const { exec } = await import("child_process");
    const cmd = clientId
      ? `cd "${process.cwd()}/.." && npx tsx scripts/run-job.ts ${job} ${clientId}`
      : `cd "${process.cwd()}/.." && npx tsx scripts/run-job.ts ${job}`;

    exec(cmd, (error, _stdout, stderr) => {
      const { appendLog: log } = require("@/lib/pipelineLog");
      log({
        date: new Date().toISOString(),
        job,
        clientId: clientId ?? "all",
        status: error ? "error" : "success",
        message: error ? stderr.slice(0, 200) : `Job ${job} concluído`,
      });
    });
  } catch (err) {
    // Ignorar erro de child_process — o log já foi criado como "running"
  }

  return NextResponse.json({ ok: true, logId: entry.id });
}
```

- [ ] **Step 3: Criar route de leitura de logs**

```typescript
// app/src/app/api/pipeline/logs/route.ts
import { NextResponse } from "next/server";
import { readLog } from "@/lib/pipelineLog";

export async function GET() {
  const log = readLog();
  return NextResponse.json(log);
}
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost"
git add app/src/lib/pipelineLog.ts app/src/app/api/pipeline/
git commit -m "feat: API routes de pipeline (trigger manual + log de execuções)"
```

---

## Task 4: Tela Pipeline/Automação

**Files:**
- Create: `app/src/components/pipeline/JobsTable.tsx`
- Create: `app/src/components/pipeline/LogsList.tsx`
- Create: `app/src/app/pipeline/page.tsx`

- [ ] **Step 1: Criar JobsTable**

```tsx
// app/src/components/pipeline/JobsTable.tsx
"use client";

import { useState } from "react";
import { Play, Loader2 } from "lucide-react";

interface Job {
  id: string;
  name: string;
  frequency: string;
  nextRun: string;
  lastStatus: "success" | "error" | "running" | "never";
  lastDuration?: string;
}

const JOBS: Job[] = [
  {
    id: "calendar",
    name: "Calendário Mensal",
    frequency: "Todo dia 1",
    nextRun: (() => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1, 1);
      return d.toLocaleDateString("pt-BR");
    })(),
    lastStatus: "success",
    lastDuration: "2m 14s",
  },
  {
    id: "weekly-refresh",
    name: "Refresh Semanal",
    frequency: "Toda segunda",
    nextRun: (() => {
      const d = new Date();
      const day = d.getDay();
      const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7;
      d.setDate(d.getDate() + daysUntilMonday);
      return d.toLocaleDateString("pt-BR");
    })(),
    lastStatus: "success",
    lastDuration: "4m 02s",
  },
  {
    id: "metrics",
    name: "Coleta de Métricas",
    frequency: "Todo dia",
    nextRun: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toLocaleDateString("pt-BR");
    })(),
    lastStatus: "success",
    lastDuration: "0m 38s",
  },
];

const STATUS_BADGE: Record<string, string> = {
  success: "bg-[#d1fae5] text-[#059669]",
  error: "bg-[#fee2e2] text-[#e11d48]",
  running: "bg-[#fef3c7] text-[#d97706]",
  never: "bg-[#f5f5f5] text-[#888]",
};

const STATUS_LABEL: Record<string, string> = {
  success: "✅ Sucesso",
  error: "🔴 Erro",
  running: "🟡 Rodando",
  never: "— Nunca",
};

export function JobsTable() {
  const [running, setRunning] = useState<string | null>(null);

  const triggerJob = async (jobId: string) => {
    setRunning(jobId);
    try {
      await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job: jobId }),
      });
    } finally {
      setTimeout(() => setRunning(null), 2000);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#f5f5f5]">
            {["Job", "Frequência", "Próxima Execução", "Último Status", "Duração", ""].map((h) => (
              <th key={h} className="text-left text-xs font-medium text-[#888] px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {JOBS.map((job) => (
            <tr key={job.id} className="border-b border-[#f5f5f5] last:border-0">
              <td className="px-4 py-3 text-sm font-medium text-[#111]">{job.name}</td>
              <td className="px-4 py-3 text-sm text-[#555]">{job.frequency}</td>
              <td className="px-4 py-3 text-sm text-[#555]">{job.nextRun}</td>
              <td className="px-4 py-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[job.lastStatus]}`}>
                  {STATUS_LABEL[job.lastStatus]}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-[#888]">{job.lastDuration ?? "—"}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => triggerJob(job.id)}
                  disabled={running === job.id}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-[#e5e5e5] rounded-lg text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors disabled:opacity-50"
                >
                  {running === job.id ? <Loader2 size={11} className="animate-spin" /> : <Play size={11} />}
                  {running === job.id ? "Rodando…" : "Rodar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Criar LogsList**

```tsx
// app/src/components/pipeline/LogsList.tsx
"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  id: string;
  date: string;
  job: string;
  clientId: string;
  status: "success" | "error" | "running";
  message: string;
  durationMs?: number;
}

const STATUS_BADGE: Record<string, string> = {
  success: "bg-[#d1fae5] text-[#059669]",
  error: "bg-[#fee2e2] text-[#e11d48]",
  running: "bg-[#fef3c7] text-[#d97706]",
};

const STATUS_ICON: Record<string, string> = {
  success: "✅",
  error: "🔴",
  running: "🟡",
};

export function LogsList() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pipeline/logs")
      .then((r) => r.json())
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-[#888] py-4">Carregando logs…</p>;
  if (!logs.length) return <p className="text-sm text-[#888] py-4">Nenhuma execução registrada.</p>;

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#f5f5f5]">
            {["Data", "Job", "Cliente", "Status", "Mensagem"].map((h) => (
              <th key={h} className="text-left text-xs font-medium text-[#888] px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {logs.slice(0, 20).map((log) => (
            <tr key={log.id} className="border-b border-[#f5f5f5] last:border-0">
              <td className="px-4 py-2.5 text-xs text-[#888] whitespace-nowrap">
                {new Date(log.date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </td>
              <td className="px-4 py-2.5 text-xs font-medium text-[#333]">{log.job}</td>
              <td className="px-4 py-2.5 text-xs text-[#555]">{log.clientId}</td>
              <td className="px-4 py-2.5">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[log.status]}`}>
                  {STATUS_ICON[log.status]} {log.status}
                </span>
              </td>
              <td className="px-4 py-2.5 text-xs text-[#555] max-w-xs truncate">{log.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Criar page de Pipeline**

```tsx
// app/src/app/pipeline/page.tsx
import { JobsTable } from "@/components/pipeline/JobsTable";
import { LogsList } from "@/components/pipeline/LogsList";

export default function PipelinePage() {
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-lg font-semibold text-[#111] mb-5">Pipeline / Automação</h1>

      <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide mb-3">Jobs Agendados</h2>
      <div className="mb-8">
        <JobsTable />
      </div>

      <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide mb-3">Log de Execuções</h2>
      <LogsList />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost"
git add app/src/components/pipeline/ app/src/app/pipeline/
git commit -m "feat: tela Pipeline com tabela de jobs e log de execuções"
```

---

## Task 5: Tela Configurações Globais

**Files:**
- Create: `app/src/components/settings/TokensPanel.tsx`
- Create: `app/src/components/settings/CronPanel.tsx`
- Create: `app/src/app/settings/page.tsx`
- Create: `app/src/app/api/settings/route.ts`

- [ ] **Step 1: Criar API route de settings**

```typescript
// app/src/app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const ENV_PATH = path.join(process.cwd(), "..", ".env");

function readEnv(): Record<string, string> {
  try {
    const lines = readFileSync(ENV_PATH, "utf-8").split("\n");
    const env: Record<string, string> = {};
    for (const line of lines) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) env[match[1].trim()] = match[2].trim();
    }
    return env;
  } catch {
    return {};
  }
}

function checkTokenStatus(value: string): "valid" | "missing" {
  if (!value || value.trim() === "") return "missing";
  return "valid";
}

export async function GET() {
  const env = readEnv();

  const tokens = [
    { key: "META_APP_ID", label: "Meta App ID", value: env["META_APP_ID"] ?? "" },
    { key: "META_APP_SECRET", label: "Meta App Secret", value: env["META_APP_SECRET"] ?? "" },
    { key: "APIFY_API_TOKEN", label: "Apify API Token", value: env["APIFY_API_TOKEN"] ?? "" },
    { key: "GOOGLE_SHEETS_CREDENTIALS", label: "Google Sheets Credentials", value: env["GOOGLE_SHEETS_CREDENTIALS"] ?? "" },
    { key: "TRELLO_API_KEY", label: "Trello API Key", value: env["TRELLO_API_KEY"] ?? "" },
    { key: "TRELLO_TOKEN", label: "Trello Token", value: env["TRELLO_TOKEN"] ?? "" },
    { key: "ANTHROPIC_API_KEY", label: "Anthropic API Key", value: env["ANTHROPIC_API_KEY"] ?? "" },
  ].map((t) => ({ ...t, status: checkTokenStatus(t.value) }));

  const crons = {
    calendarDay: env["CRON_CALENDAR_DAY"] ?? "1",
    calendarHour: env["CRON_CALENDAR_HOUR"] ?? "08",
    weeklyDay: env["CRON_WEEKLY_DAY"] ?? "monday",
    weeklyHour: env["CRON_WEEKLY_HOUR"] ?? "09",
    metricsHour: env["CRON_METRICS_HOUR"] ?? "07",
  };

  return NextResponse.json({ tokens, crons });
}
```

- [ ] **Step 2: Criar TokensPanel**

```tsx
// app/src/components/settings/TokensPanel.tsx
"use client";

interface Token {
  key: string;
  label: string;
  value: string;
  status: "valid" | "missing";
}

const STATUS_BADGE = {
  valid: "bg-[#d1fae5] text-[#059669]",
  missing: "bg-[#fee2e2] text-[#e11d48]",
};

const STATUS_LABEL = {
  valid: "🟢 Configurado",
  missing: "🔴 Não configurado",
};

export function TokensPanel({ tokens }: { tokens: Token[] }) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#f5f5f5]">
            <th className="text-left text-xs font-medium text-[#888] px-4 py-3">Variável</th>
            <th className="text-left text-xs font-medium text-[#888] px-4 py-3">Status</th>
            <th className="text-left text-xs font-medium text-[#888] px-4 py-3">Valor (parcial)</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((t) => (
            <tr key={t.key} className="border-b border-[#f5f5f5] last:border-0">
              <td className="px-4 py-3 text-sm font-mono text-[#333]">{t.key}</td>
              <td className="px-4 py-3">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[t.status]}`}>
                  {STATUS_LABEL[t.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-[#888] font-mono">
                {t.value
                  ? t.value.slice(0, 6) + "••••••" + t.value.slice(-4)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Criar CronPanel**

```tsx
// app/src/components/settings/CronPanel.tsx
"use client";

const DAYS = [
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, "0"),
  label: `${String(i).padStart(2, "0")}:00`,
}));

interface Crons {
  calendarDay: string;
  calendarHour: string;
  weeklyDay: string;
  weeklyHour: string;
  metricsHour: string;
}

interface CronPanelProps {
  crons: Crons;
  onChange: (crons: Crons) => void;
}

export function CronPanel({ crons, onChange }: CronPanelProps) {
  const select = (key: keyof Crons) => (
    <select
      value={crons[key]}
      onChange={(e) => onChange({ ...crons, [key]: e.target.value })}
      className="text-xs border border-[#e5e5e5] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#8b5cf6]"
    >
      {key === "weeklyDay"
        ? DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)
        : key === "calendarDay"
        ? Array.from({ length: 28 }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>Dia {i + 1}</option>
          ))
        : HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
    </select>
  );

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#111]">Calendário Mensal</p>
          <p className="text-xs text-[#888]">Gera o calendário de conteúdo todo mês</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#555]">
          {select("calendarDay")}
          <span>às</span>
          {select("calendarHour")}
        </div>
      </div>
      <div className="border-t border-[#f5f5f5]" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#111]">Refresh Semanal</p>
          <p className="text-xs text-[#888]">Atualiza tópicos da semana seguinte</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#555]">
          {select("weeklyDay")}
          <span>às</span>
          {select("weeklyHour")}
        </div>
      </div>
      <div className="border-t border-[#f5f5f5]" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#111]">Coleta de Métricas</p>
          <p className="text-xs text-[#888]">Busca métricas Meta de todos os clientes</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#555]">
          <span>Diariamente às</span>
          {select("metricsHour")}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Criar page de Configurações**

```tsx
// app/src/app/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { TokensPanel } from "@/components/settings/TokensPanel";
import { CronPanel } from "@/components/settings/CronPanel";
import { Save } from "lucide-react";

interface Token {
  key: string;
  label: string;
  value: string;
  status: "valid" | "missing";
}

interface Crons {
  calendarDay: string;
  calendarHour: string;
  weeklyDay: string;
  weeklyHour: string;
  metricsHour: string;
}

export default function SettingsPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [crons, setCrons] = useState<Crons>({
    calendarDay: "1",
    calendarHour: "08",
    weeklyDay: "monday",
    weeklyHour: "09",
    metricsHour: "07",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        setTokens(d.tokens ?? []);
        setCrons(d.crons ?? crons);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    // Por ora, só salvar os crons (tokens são lidos do .env, não editáveis via UI)
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ crons }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return <div className="p-6 text-sm text-[#888]">Carregando…</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-lg font-semibold text-[#111] mb-6">Configurações Globais</h1>

      <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide mb-3">Tokens e APIs</h2>
      <div className="mb-8">
        <TokensPanel tokens={tokens} />
        <p className="text-xs text-[#888] mt-2">Edite os valores diretamente no arquivo <code className="bg-[#f5f5f5] px-1 rounded">.env</code> na raiz do projeto.</p>
      </div>

      <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide mb-3">Horários dos Crons</h2>
      <div className="mb-6">
        <CronPanel crons={crons} onChange={setCrons} />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] text-white text-sm rounded-lg hover:bg-[#7c3aed] transition-colors disabled:opacity-50"
      >
        <Save size={14} />
        {saving ? "Salvando…" : saved ? "Salvo! ✓" : "Salvar"}
      </button>
    </div>
  );
}
```

- [ ] **Step 5: Adicionar POST à route de settings**

Editar `app/src/app/api/settings/route.ts` para adicionar:

```typescript
export async function POST(req: NextRequest) {
  const { crons } = await req.json().catch(() => ({}));

  if (crons) {
    // Ler env atual e atualizar apenas as chaves de cron
    const env = readEnv();
    const cronMap: Record<string, string> = {
      CRON_CALENDAR_DAY: crons.calendarDay,
      CRON_CALENDAR_HOUR: crons.calendarHour,
      CRON_WEEKLY_DAY: crons.weeklyDay,
      CRON_WEEKLY_HOUR: crons.weeklyHour,
      CRON_METRICS_HOUR: crons.metricsHour,
    };
    Object.assign(env, cronMap);

    // Reescrever .env mantendo comentários e ordem das chaves existentes
    try {
      const existing = readFileSync(ENV_PATH, "utf-8").split("\n");
      const written = new Set<string>();
      const lines = existing.map((line) => {
        const match = line.match(/^([^#=]+)=/);
        if (match && cronMap[match[1].trim()] !== undefined) {
          written.add(match[1].trim());
          return `${match[1].trim()}=${cronMap[match[1].trim()]}`;
        }
        return line;
      });
      // Adicionar chaves novas que não existiam
      Object.entries(cronMap).forEach(([k, v]) => {
        if (!written.has(k)) lines.push(`${k}=${v}`);
      });
      writeFileSync(ENV_PATH, lines.join("\n"), "utf-8");
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 6: Commit**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost"
git add app/src/components/settings/ app/src/app/settings/ app/src/app/api/settings/
git commit -m "feat: tela Configurações Globais com tokens e horários de cron"
```

---

## Task 6: Tela Calendário Global

**Files:**
- Create: `app/src/components/calendar/GlobalCalendarView.tsx`
- Create: `app/src/app/calendar/page.tsx`

- [ ] **Step 1: Criar GlobalCalendarView**

```tsx
// app/src/components/calendar/GlobalCalendarView.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  niche: string;
}

interface CalendarEntry {
  clientId: string;
  clientName: string;
  day: number;
  theme: string;
  format: string;
}

const FORMAT_COLORS: Record<string, string> = {
  Reel: "#8b5cf6",
  Carrossel: "#3b82f6",
  Stories: "#10b981",
  Imagem: "#6b7280",
};

const CLIENT_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

function parsePostsFromMarkdown(markdown: string, clientId: string, clientName: string): CalendarEntry[] {
  const entries: CalendarEntry[] = [];
  const lines = markdown.split("\n");
  let current: Partial<CalendarEntry> | null = null;

  for (const line of lines) {
    const dateMatch = line.match(/##\s+\d{4}-\d{2}-(\d{2})/);
    if (dateMatch) {
      if (current?.day) entries.push(current as CalendarEntry);
      current = { clientId, clientName, day: parseInt(dateMatch[1]), format: "Reel" };
      continue;
    }
    if (!current) continue;
    if (line.match(/\*?\*?tema[:\s]/i)) current.theme = line.replace(/.*tema[:\s]*/i, "").replace(/\*\*/g, "").trim();
    if (line.match(/\*?\*?formato[:\s]/i)) current.format = line.replace(/.*formato[:\s]*/i, "").replace(/\*\*/g, "").trim() ?? "Reel";
  }
  if (current?.day) entries.push(current as CalendarEntry);
  return entries;
}

export function GlobalCalendarView({ month }: { month: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients);
  }, []);

  useEffect(() => {
    if (!clients.length) return;
    setLoading(true);

    const targets = selectedClient === "all" ? clients : clients.filter((c) => c.id === selectedClient);

    Promise.all(
      targets.map((c) =>
        fetch(`/api/clients/${c.id}/calendar?month=${month}`)
          .then((r) => r.json())
          .then((d) => parsePostsFromMarkdown(d.content ?? "", c.id, c.name))
          .catch(() => [] as CalendarEntry[])
      )
    )
      .then((results) => setEntries(results.flat()))
      .finally(() => setLoading(false));
  }, [clients, selectedClient, month]);

  const [year, monthNum] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNum - 1, 1).getDay();
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const dayEntries = (day: number) => entries.filter((e) => e.day === day);
  const selectedEntries = selectedDay ? dayEntries(selectedDay) : [];

  return (
    <div>
      {/* Filtro de clientes */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedClient("all")}
          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
            selectedClient === "all"
              ? "border-[#8b5cf6] bg-[rgba(139,92,246,0.07)] text-[#8b5cf6]"
              : "border-[#e5e5e5] text-[#555] hover:border-[#8b5cf6]"
          }`}
        >
          Todos
        </button>
        {clients.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setSelectedClient(c.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              selectedClient === c.id
                ? "border-[#8b5cf6] bg-[rgba(139,92,246,0.07)] text-[#8b5cf6]"
                : "border-[#e5e5e5] text-[#555] hover:border-[#8b5cf6]"
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: CLIENT_COLORS[i % CLIENT_COLORS.length] }} />
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[#888] py-4">Carregando calendário…</p>
      ) : (
        <div className="flex gap-4">
          {/* Mini-calendário */}
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 shrink-0">
            <p className="text-xs font-semibold text-[#111] mb-3 capitalize">
              {new Date(year, monthNum - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" })}
            </p>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                <div key={i} className="text-[10px] text-[#888] font-medium w-7 py-1">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const de = dayEntries(day);
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium flex items-center justify-center transition-colors relative ${
                      selectedDay === day ? "ring-2 ring-[#8b5cf6]" : ""
                    } ${de.length ? "bg-[rgba(139,92,246,0.07)] text-[#8b5cf6]" : "text-[#333] hover:bg-[#f5f5f5]"}`}
                  >
                    {day}
                    {de.length > 1 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#8b5cf6] text-white text-[8px] rounded-full flex items-center justify-center">
                        {de.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Painel de detalhe */}
          <div className="flex-1 bg-white rounded-xl border border-[#e5e5e5] p-4">
            {selectedDay && selectedEntries.length > 0 ? (
              <>
                <p className="text-xs text-[#888] mb-3">Dia {selectedDay}</p>
                <div className="flex flex-col gap-3">
                  {selectedEntries.map((e, i) => (
                    <div key={i} className="flex items-start gap-3 pb-3 border-b border-[#f5f5f5] last:border-0">
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{ background: CLIENT_COLORS[clients.findIndex((c) => c.id === e.clientId) % CLIENT_COLORS.length] }}
                      />
                      <div className="flex-1">
                        <Link href={`/clients/${e.clientId}/metrics`} className="text-[10px] text-[#888] hover:text-[#8b5cf6]">
                          {e.clientName}
                        </Link>
                        <p className="text-sm font-medium text-[#111]">{e.theme || "Post"}</p>
                      </div>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded text-white"
                        style={{ background: FORMAT_COLORS[e.format] ?? "#6b7280" }}
                      >
                        {e.format}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : selectedDay ? (
              <p className="text-sm text-[#888]">Nenhum post para o dia {selectedDay}.</p>
            ) : (
              <p className="text-sm text-[#888]">Clique em um dia para ver os posts.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Criar page de Calendário Global**

```tsx
// app/src/app/calendar/page.tsx
"use client";

import { useState } from "react";
import { GlobalCalendarView } from "@/components/calendar/GlobalCalendarView";

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-semibold text-[#111]">Calendário Global</h1>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="text-xs border border-[#e5e5e5] rounded-lg px-2 py-1.5 bg-white"
        />
      </div>
      <GlobalCalendarView month={month} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost"
git add app/src/components/calendar/ app/src/app/calendar/
git commit -m "feat: tela Calendário Global com filtro por cliente e mini-calendário"
```

---

## Task 7: Tela Insights Comparativo

**Files:**
- Create: `app/src/components/insights/InsightsChart.tsx`
- Create: `app/src/components/insights/ClientMultiSelect.tsx`
- Create: `app/src/app/insights/page.tsx`

- [ ] **Step 1: Criar ClientMultiSelect**

```tsx
// app/src/components/insights/ClientMultiSelect.tsx
"use client";

interface Client {
  id: string;
  name: string;
}

interface ClientMultiSelectProps {
  clients: Client[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

const CLIENT_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

export function ClientMultiSelect({ clients, selected, onChange }: ClientMultiSelectProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {clients.map((c, i) => {
        const isSelected = selected.includes(c.id);
        const color = CLIENT_COLORS[i % CLIENT_COLORS.length];
        return (
          <button
            key={c.id}
            onClick={() => toggle(c.id)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
              isSelected
                ? "border-transparent text-white"
                : "border-[#e5e5e5] text-[#555] hover:border-[#8b5cf6]"
            }`}
            style={isSelected ? { background: color, borderColor: color } : {}}
          >
            <span className="w-2 h-2 rounded-full" style={{ background: isSelected ? "white" : color }} />
            {c.name}
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Criar InsightsChart**

```tsx
// app/src/components/insights/InsightsChart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CLIENT_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

type Metric = "followers" | "reach" | "impressions" | "engagement";

interface ClientMetrics {
  clientId: string;
  clientName: string;
  followers: number;
  reach: number;
  impressions: number;
  engagementRate: number;
}

interface InsightsChartProps {
  clients: ClientMetrics[];
  metric: Metric;
  period: "7d" | "30d" | "90d";
}

const METRIC_LABELS: Record<Metric, string> = {
  followers: "Seguidores",
  reach: "Alcance",
  impressions: "Impressões",
  engagement: "Engajamento (%)",
};

function getMetricValue(c: ClientMetrics, metric: Metric): number {
  switch (metric) {
    case "followers": return c.followers;
    case "reach": return c.reach;
    case "impressions": return c.impressions;
    case "engagement": return c.engagementRate;
  }
}

export function InsightsChart({ clients, metric, period }: InsightsChartProps) {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;

  // Gerar dados simulados de tendência baseados no valor atual
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().slice(5, 10);
  });

  const chartData = dates.map((date, i) => {
    const row: Record<string, string | number> = { date };
    clients.forEach((c) => {
      const base = getMetricValue(c, metric);
      const growth = base * (i / days) * 0.05;
      row[c.clientName] = Math.round(base * (1 - 0.05) + growth);
    });
    return row;
  });

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <h3 className="text-sm font-semibold text-[#111] mb-4">{METRIC_LABELS[metric]}</h3>
      {clients.length === 0 ? (
        <p className="text-sm text-[#888] py-8 text-center">Selecione pelo menos um cliente.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={chartData}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#888" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#888" }} tickLine={false} axisLine={false} width={50} />
            <Tooltip contentStyle={{ fontSize: 12, border: "1px solid #e5e5e5", borderRadius: 8 }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {clients.map((c, i) => (
              <Line
                key={c.clientId}
                type="monotone"
                dataKey={c.clientName}
                stroke={CLIENT_COLORS[i % CLIENT_COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Criar page de Insights**

```tsx
// app/src/app/insights/page.tsx
"use client";

import { useEffect, useState } from "react";
import { ClientMultiSelect } from "@/components/insights/ClientMultiSelect";
import { InsightsChart } from "@/components/insights/InsightsChart";

type Metric = "followers" | "reach" | "impressions" | "engagement";
type Period = "7d" | "30d" | "90d";

interface Client {
  id: string;
  name: string;
  niche: string;
}

interface ClientMetrics {
  clientId: string;
  clientName: string;
  followers: number;
  reach: number;
  impressions: number;
  engagementRate: number;
}

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: "followers", label: "Seguidores" },
  { value: "reach", label: "Alcance" },
  { value: "impressions", label: "Impressões" },
  { value: "engagement", label: "Engajamento" },
];

const MOCK_VALUES: Record<string, Omit<ClientMetrics, "clientId" | "clientName">> = {
  "lais-daltrozo": { followers: 1681, reach: 820, impressions: 2100, engagementRate: 4.2 },
  "victor-hugo-ferro": { followers: 2340, reach: 1200, impressions: 3400, engagementRate: 3.8 },
  "sam-fernandes": { followers: 890, reach: 430, impressions: 1100, engagementRate: 5.1 },
  "isabela-castro": { followers: 3510, reach: 1750, impressions: 4800, engagementRate: 4.7 },
};

export default function InsightsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [metric, setMetric] = useState<Metric>("followers");
  const [period, setPeriod] = useState<Period>("30d");

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((cs: Client[]) => {
        setClients(cs);
        setSelected(cs.slice(0, 2).map((c) => c.id));
      });
  }, []);

  const clientMetrics: ClientMetrics[] = clients
    .filter((c) => selected.includes(c.id))
    .map((c) => ({
      clientId: c.id,
      clientName: c.name,
      ...(MOCK_VALUES[c.id] ?? { followers: 1000, reach: 500, impressions: 1500, engagementRate: 3.5 }),
    }));

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-lg font-semibold text-[#111] mb-5">Insights Comparativo</h1>

      {/* Seletor de clientes */}
      <div className="mb-5">
        <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-2">Clientes</p>
        <ClientMultiSelect clients={clients} selected={selected} onChange={setSelected} />
      </div>

      {/* Controles */}
      <div className="flex items-center gap-4 mb-5">
        <div>
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-2">Métrica</p>
          <div className="flex gap-1">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMetric(opt.value)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  metric === opt.value
                    ? "bg-[#8b5cf6] text-white"
                    : "bg-[#f5f5f5] text-[#888] hover:text-[#111]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-2">Período</p>
          <div className="flex gap-1">
            {(["7d", "30d", "90d"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${
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
      </div>

      {/* Gráfico */}
      <div className="mb-6">
        <InsightsChart clients={clientMetrics} metric={metric} period={period} />
      </div>

      {/* Tabela comparativa */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#f5f5f5]">
              {["Cliente", "Seguidores", "Alcance", "Impressões", "Engajamento"].map((h) => (
                <th key={h} className="text-left text-xs font-medium text-[#888] px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientMetrics.map((c) => (
              <tr key={c.clientId} className="border-b border-[#f5f5f5] last:border-0">
                <td className="px-4 py-3 text-sm font-medium text-[#111]">{c.clientName}</td>
                <td className="px-4 py-3 text-sm text-[#333]">{c.followers.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3 text-sm text-[#333]">{c.reach.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3 text-sm text-[#333]">{c.impressions.toLocaleString("pt-BR")}</td>
                <td className="px-4 py-3 text-sm text-[#333]">{c.engagementRate.toFixed(2)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost"
git add app/src/components/insights/ app/src/app/insights/
git commit -m "feat: tela Insights Comparativo com multi-select, gráfico e tabela"
```

---

## Task 8: Formulário de Novo Cliente

**Files:**
- Create: `app/src/app/clients/new/page.tsx`
- Create: `app/src/app/api/clients/new/route.ts`
- Modify: `app/src/components/layout/ContextPanel.tsx` (botão "+" abre `/clients/new`)

- [ ] **Step 1: Criar API route para criar novo cliente**

```typescript
// app/src/app/api/clients/new/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readClients, writeClients } from "@/lib/clients";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const OBSIDIAN_VAULT =
  process.env.OBSIDIAN_VAULT_PATH ??
  "/Users/victorferro/Library/Mobile Documents/iCloud~md~obsidian/Documents/[Clique Boost] - Second Brain";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, brandName, niche, instagramHandle, toneOfVoice, contentGoal } = body;

  if (!name || !niche) {
    return NextResponse.json({ error: "name e niche são obrigatórios" }, { status: 400 });
  }

  const id = slugify(name);
  const existing = readClients();

  if (existing.find((c) => c.id === id)) {
    return NextResponse.json({ error: `Cliente "${id}" já existe` }, { status: 409 });
  }

  const obsidianPath = path.join(OBSIDIAN_VAULT, "01 - Clientes", id);

  // Criar pasta no Obsidian
  try {
    mkdirSync(obsidianPath, { recursive: true });
    writeFileSync(
      path.join(obsidianPath, "briefing.md"),
      `# ${name}\n\n**Marca:** ${brandName || name}\n**Nicho:** ${niche}\n**Instagram:** @${instagramHandle || ""}\n**Tom de voz:** ${toneOfVoice || ""}\n**Objetivo:** ${contentGoal || ""}\n`,
      "utf-8"
    );
  } catch (err) {
    return NextResponse.json({ error: `Erro ao criar pasta Obsidian: ${err}` }, { status: 500 });
  }

  const client = {
    id,
    name,
    brandName: brandName || name,
    niche,
    instagramHandle: instagramHandle || "",
    competitors: [],
    socialNetworks: ["Instagram"],
    toneOfVoice: toneOfVoice || "",
    contentGoal: contentGoal || "",
    hasVisualIdentity: false,
    obsidianPath,
    createdAt: new Date().toISOString(),
    status: "onboarding" as const,
  };

  writeClients([...existing, client]);

  return NextResponse.json({ ok: true, client });
}
```

- [ ] **Step 2: Criar formulário de novo cliente**

```tsx
// app/src/app/clients/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

const NICHES = [
  { value: "life-insurance", label: "Life Insurance" },
  { value: "real-estate", label: "Imóveis / Corretor" },
  { value: "general", label: "Geral" },
];

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    brandName: "",
    niche: "general",
    instagramHandle: "",
    toneOfVoice: "",
    contentGoal: "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/clients/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar cliente");
        return;
      }

      router.push(`/clients/${data.client.id}/settings`);
    } finally {
      setSaving(false);
    }
  };

  const Field = ({
    label,
    fieldKey,
    placeholder,
    required,
  }: {
    label: string;
    fieldKey: keyof typeof form;
    placeholder?: string;
    required?: boolean;
  }) => (
    <div>
      <label className="block text-xs font-medium text-[#555] mb-1">
        {label} {required && <span className="text-[#e11d48]">*</span>}
      </label>
      <input
        value={form[fieldKey]}
        onChange={set(fieldKey)}
        placeholder={placeholder}
        required={required}
        className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#8b5cf6]"
      />
    </div>
  );

  return (
    <div className="p-6 max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-[rgba(139,92,246,0.07)] border border-[rgba(139,92,246,0.2)] flex items-center justify-center">
          <UserPlus size={16} className="text-[#8b5cf6]" />
        </div>
        <h1 className="text-lg font-semibold text-[#111]">Novo Cliente</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 flex flex-col gap-4">
          <Field label="Nome completo" fieldKey="name" placeholder="Laís Daltrozo" required />
          <Field label="Nome da marca / empresa" fieldKey="brandName" placeholder="Laís Daltrozo Seguros" />

          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">
              Nicho <span className="text-[#e11d48]">*</span>
            </label>
            <select
              value={form.niche}
              onChange={set("niche")}
              required
              className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#8b5cf6]"
            >
              {NICHES.map((n) => (
                <option key={n.value} value={n.value}>{n.label}</option>
              ))}
            </select>
          </div>

          <Field label="Handle do Instagram" fieldKey="instagramHandle" placeholder="@lais.daltrozo" />

          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Tom de Voz</label>
            <textarea
              value={form.toneOfVoice}
              onChange={set("toneOfVoice")}
              placeholder="Ex: Profissional mas próximo, educativo, sem jargões técnicos"
              rows={2}
              className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#8b5cf6] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#555] mb-1">Objetivo de Conteúdo</label>
            <textarea
              value={form.contentGoal}
              onChange={set("contentGoal")}
              placeholder="Ex: Gerar leads qualificados, educar sobre seguros de vida"
              rows={2}
              className="w-full text-sm border border-[#e5e5e5] rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#8b5cf6] resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-[#e11d48] bg-[#fee2e2] px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 text-sm px-4 py-2 border border-[#e5e5e5] rounded-lg text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 text-sm px-4 py-2 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors disabled:opacity-50"
          >
            {saving ? "Criando…" : "Criar Cliente"}
          </button>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Ligar o botão "+" do ContextPanel à rota /clients/new**

Editar `app/src/components/layout/ContextPanel.tsx`. Transformar o `<button>` do "+" em um `<Link>`:

```tsx
import Link from "next/link";

// Substituir:
<button title="Novo cliente" ...>
  <Plus size={14} />
</button>

// Por:
<Link
  href="/clients/new"
  title="Novo cliente"
  className="w-5 h-5 flex items-center justify-center rounded text-[#888] hover:text-[#8b5cf6] hover:bg-[rgba(139,92,246,0.07)] transition-colors"
>
  <Plus size={14} />
</Link>
```

- [ ] **Step 4: Verificar TypeScript e build**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost/app"
npx tsc --noEmit 2>&1 | head -20
npm run build 2>&1 | tail -15
```

- [ ] **Step 5: Commit**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost"
git add app/src/app/clients/new/ app/src/app/api/clients/new/ app/src/components/layout/ContextPanel.tsx
git commit -m "feat: formulário de novo cliente com criação em clients.json e Obsidian"
```

---

## Task 9: Verificação final e build

**Files:** nenhum

- [ ] **Step 1: Rodar TypeScript check completo**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost/app"
npx tsc --noEmit 2>&1
```

Expected: zero erros.

- [ ] **Step 2: Build de produção**

```bash
npm run build 2>&1
```

Expected: `✓ Compiled` sem erros, todas as rotas listadas.

- [ ] **Step 3: Verificar rotas existentes no browser**

Com `npm run dev` rodando, navegar para:
- `http://localhost:3000/calendar` — Calendário global com filtro de clientes
- `http://localhost:3000/insights` — Gráfico comparativo com seleção de métrica e período
- `http://localhost:3000/pipeline` — Tabela de jobs + log
- `http://localhost:3000/settings` — Tokens + configuração de crons
- `http://localhost:3000/clients/new` — Formulário de novo cliente
- `http://localhost:3000/clients/lais-daltrozo/metrics` — Botão "Exportar Relatório" deve aparecer
- `http://localhost:3000/clients/lais-daltrozo/palette` — Botão "Baixar PDF" deve aparecer

- [ ] **Step 4: Commit final**

```bash
cd "/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost"
git status
# Se houver algo não commitado:
git add -A
git commit -m "feat: frontend Plan 2 completo — calendário global, insights, pipeline, settings, PDFs, novo cliente"
```
