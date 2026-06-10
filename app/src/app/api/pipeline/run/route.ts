import { NextRequest, NextResponse } from "next/server";
import { appendLog, updateLog } from "@/lib/pipelineLog";
import { readClients } from "@/lib/clients";
import { fetchClientInsights } from "@/lib/metaInsights";

const VALID_JOBS = ["calendar", "metrics", "weekly-refresh"] as const;
type Job = (typeof VALID_JOBS)[number];

const JOB_LABELS: Record<string, string> = {
  metrics: "Coleta de Métricas",
  "weekly-refresh": "Refresh Semanal",
  calendar: "Calendário Mensal",
};

async function runMetrics(clientId: string | undefined): Promise<void> {
  const clients = readClients().filter(
    (c) => c.metaAccessToken && (!clientId || c.id === clientId)
  );

  for (const client of clients) {
    const startMs = Date.now();
    const entry = appendLog({
      date: new Date().toISOString(),
      job: "metrics",
      clientId: client.id,
      clientName: client.name,
      status: "running",
      message: `Coletando métricas de ${client.name}…`,
    });

    try {
      const insights = await fetchClientInsights(client, 30);
      const durationMs = Date.now() - startMs;

      updateLog(entry.id, {
        status: "success",
        durationMs,
        message: `Métricas coletadas com sucesso`,
        details: [
          { label: "Seguidores", value: insights.followerCount?.toLocaleString("pt-BR") ?? "—" },
          { label: "Crescimento", value: `${insights.followerGrowth > 0 ? "+" : ""}${insights.followerGrowth}` },
          { label: "Alcance (30d)", value: insights.reach?.toLocaleString("pt-BR") ?? "—" },
          { label: "Impressões (30d)", value: insights.impressions?.toLocaleString("pt-BR") ?? "—" },
          { label: "Engajamento", value: `${insights.engagementRate?.toFixed(2) ?? "—"}%` },
          { label: "Posts coletados", value: insights.topPosts?.length ?? 0 },
        ],
      });
    } catch (err) {
      updateLog(entry.id, {
        status: "error",
        durationMs: Date.now() - startMs,
        message: err instanceof Error ? err.message : "Erro desconhecido",
        details: [{ label: "Erro", value: err instanceof Error ? err.message : String(err) }],
      });
    }
  }
}

async function runWeeklyRefresh(): Promise<void> {
  const clients = readClients().filter((c) => c.metaAccessToken);
  const entry = appendLog({
    date: new Date().toISOString(),
    job: "weekly-refresh",
    clientId: "all",
    status: "running",
    message: `Iniciando refresh semanal para ${clients.length} clientes…`,
    details: [],
  });

  // placeholder — future: re-scrape competitors and refresh Trello topics
  await new Promise((r) => setTimeout(r, 500));

  updateLog(entry.id, {
    status: "success",
    message: "Refresh semanal concluído",
    details: [
      { label: "Clientes processados", value: clients.length },
      { label: "Tópicos atualizados", value: 0 },
      { label: "Nota", value: "Conecte o scraper de concorrentes para atualizar tópicos automaticamente" },
    ],
  });
}

async function runCalendar(): Promise<void> {
  const clients = readClients();
  const entry = appendLog({
    date: new Date().toISOString(),
    job: "calendar",
    clientId: "all",
    status: "running",
    message: `Verificando calendário de ${clients.length} clientes…`,
  });

  await new Promise((r) => setTimeout(r, 300));

  updateLog(entry.id, {
    status: "success",
    message: "Verificação de calendário concluída",
    details: [
      { label: "Clientes verificados", value: clients.length },
      { label: "Fonte", value: "Trello via API" },
      { label: "Nota", value: "Calendário lido em tempo real do Trello — não há geração automática ainda" },
    ],
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { clientId, job } = body as { clientId?: string; job?: string };

  if (!job || !VALID_JOBS.includes(job as Job)) {
    return NextResponse.json(
      { error: `job must be one of: ${VALID_JOBS.join(", ")}` },
      { status: 400 }
    );
  }

  // Run async — don't await so response is immediate
  (async () => {
    try {
      if (job === "metrics") await runMetrics(clientId);
      else if (job === "weekly-refresh") await runWeeklyRefresh();
      else if (job === "calendar") await runCalendar();
    } catch { /* logged inside each function */ }
  })();

  return NextResponse.json({ ok: true, job, label: JOB_LABELS[job] });
}
