import { NextRequest, NextResponse } from "next/server";
import { appendLog, updateLog } from "@/lib/pipelineLog";
import { readClients } from "@/lib/clients";
import { fetchClientInsights } from "@/lib/metaInsights";
import { generateMonthlyCalendar } from "@/lib/contentCalendar";
import { syncCalendarToTrello } from "@/lib/trello";
import { runWeeklyAnalysis } from "@/lib/weeklyAnalysis";
import { runWeeklyRefresh } from "@/lib/weeklyRefresh";

const VALID_JOBS = [
  "metrics",
  "calendar",
  "weekly-analysis",
  "weekly-refresh",
  "weekly-full",   // analysis + refresh em sequência
] as const;
type Job = (typeof VALID_JOBS)[number];

const JOB_LABELS: Record<string, string> = {
  metrics: "Coleta de Métricas",
  calendar: "Geração de Calendário Mensal",
  "weekly-analysis": "Análise Semanal",
  "weekly-refresh": "Refresh Semanal de Conteúdo",
  "weekly-full": "Ciclo Semanal Completo (Análise + Refresh)",
};

// ─── Métricas ────────────────────────────────────────────────────────────────
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
      updateLog(entry.id, {
        status: "success",
        durationMs: Date.now() - startMs,
        message: "Métricas coletadas com sucesso",
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
      });
    }
  }
}

// ─── Calendário mensal (todos os clientes) ───────────────────────────────────
async function runCalendar(clientId: string | undefined): Promise<void> {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const clients = readClients().filter((c) => !clientId || c.id === clientId);

  for (const client of clients) {
    const startMs = Date.now();
    const entry = appendLog({
      date: new Date().toISOString(),
      job: "calendar",
      clientId: client.id,
      clientName: client.name,
      status: "running",
      message: `Gerando calendário ${month} para ${client.name}…`,
    });
    try {
      const calendar = await generateMonthlyCalendar(client, month);

      // Sincroniza com Trello se o cliente tiver board
      let trelloCount = 0;
      if (client.trelloBoardId) {
        await syncCalendarToTrello(client.trelloBoardId, calendar);
        trelloCount = calendar.posts.length;
      }

      updateLog(entry.id, {
        status: "success",
        durationMs: Date.now() - startMs,
        message: `Calendário gerado: ${calendar.posts.length} posts`,
        details: [
          { label: "Posts gerados", value: calendar.posts.length },
          { label: "Mês", value: month },
          { label: "Trello", value: trelloCount > 0 ? `${trelloCount} cards criados` : "Board não configurado" },
          { label: "Obsidian", value: "Salvo em 03 - Calendários/" },
        ],
      });
    } catch (err) {
      updateLog(entry.id, {
        status: "error",
        durationMs: Date.now() - startMs,
        message: err instanceof Error ? err.message : "Erro ao gerar calendário",
      });
    }
  }
}

// ─── Análise semanal ─────────────────────────────────────────────────────────
async function runAnalysis(clientId: string | undefined): Promise<void> {
  const clients = readClients().filter(
    (c) => c.metaAccessToken && (!clientId || c.id === clientId)
  );

  for (const client of clients) {
    const startMs = Date.now();
    const entry = appendLog({
      date: new Date().toISOString(),
      job: "weekly-analysis",
      clientId: client.id,
      clientName: client.name,
      status: "running",
      message: `Analisando semana de ${client.name}…`,
    });
    try {
      const result = await runWeeklyAnalysis(client);
      updateLog(entry.id, {
        status: "success",
        durationMs: Date.now() - startMs,
        message: `Análise concluída: ${result.postsAnalyzed} posts analisados`,
        details: [
          { label: "Semana", value: result.weekLabel },
          { label: "Posts analisados", value: result.postsAnalyzed },
          { label: "Eng. médio", value: result.avgEngagement.toLocaleString("pt-BR") },
          { label: "Top performer", value: result.topPerformers[0]?.mediaType ?? "—" },
          { label: "Recomendações", value: result.recommendations.length },
          { label: "Obsidian", value: `analises/${result.weekLabel}.md` },
        ],
      });
    } catch (err) {
      updateLog(entry.id, {
        status: "error",
        durationMs: Date.now() - startMs,
        message: err instanceof Error ? err.message : "Erro na análise",
      });
    }
  }
}

// ─── Refresh semanal ─────────────────────────────────────────────────────────
async function runRefresh(clientId: string | undefined): Promise<void> {
  const clients = readClients().filter((c) => !clientId || c.id === clientId);

  for (const client of clients) {
    const startMs = Date.now();
    const entry = appendLog({
      date: new Date().toISOString(),
      job: "weekly-refresh",
      clientId: client.id,
      clientName: client.name,
      status: "running",
      message: `Atualizando semana seguinte para ${client.name}…`,
    });
    try {
      const result = await runWeeklyRefresh(client);
      updateLog(entry.id, {
        status: "success",
        durationMs: Date.now() - startMs,
        message: `Refresh concluído: ${result.postsReplaced + result.postsAdded} alterações`,
        details: [
          { label: "Semana alvo", value: `Semana ${result.weekNum}` },
          { label: "Posts substituídos", value: result.postsReplaced },
          { label: "Posts adicionados", value: result.postsAdded },
          ...result.changes.slice(0, 3).map((c) => ({ label: "→", value: c })),
        ],
      });
    } catch (err) {
      updateLog(entry.id, {
        status: "error",
        durationMs: Date.now() - startMs,
        message: err instanceof Error ? err.message : "Erro no refresh",
      });
    }
  }
}

// ─── POST handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { clientId, job } = body as { clientId?: string; job?: string };

  if (!job || !VALID_JOBS.includes(job as Job)) {
    return NextResponse.json(
      { error: `job must be one of: ${VALID_JOBS.join(", ")}` },
      { status: 400 }
    );
  }

  // Executa em background — resposta imediata
  (async () => {
    try {
      if (job === "metrics") await runMetrics(clientId);
      else if (job === "calendar") await runCalendar(clientId);
      else if (job === "weekly-analysis") await runAnalysis(clientId);
      else if (job === "weekly-refresh") await runRefresh(clientId);
      else if (job === "weekly-full") {
        await runAnalysis(clientId);
        await runRefresh(clientId);
      }
    } catch (err) {
      console.error(`[pipeline] Unhandled error in job "${job}":`, err);
    }
  })();

  return NextResponse.json({ ok: true, job, label: JOB_LABELS[job] });
}
