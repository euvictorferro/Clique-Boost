/**
 * /api/cron/briefings
 *
 * Rota de cron — verifica os dois Google Sheets (life-insurance e real-estate)
 * a cada 15 minutos. Para cada nova linha encontrada, roda o pipeline completo:
 *   1. Onboarding (cliente + briefing.md + voz.md + board Trello)
 *   2. ICP
 *   3. Paleta de cores
 *   4. Calendário mensal
 *   5. Sincroniza com Trello
 *
 * No Vercel: disparado automaticamente via vercel.json (cron schedule).
 * Localmente: chamar GET /api/cron/briefings com o header Authorization correto.
 *
 * Protegido por CRON_SECRET no ENV para evitar chamadas não autorizadas.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchNewBriefings } from "@/lib/googleSheets";
import { onboardClient } from "@/lib/onboarding";
import { generateICP } from "@/lib/icp";
import { generatePalette } from "@/lib/palette";
import { generateMonthlyCalendar } from "@/lib/contentCalendar";
import { syncCalendarToTrello } from "@/lib/trello";
import { appendLog, updateLog } from "@/lib/pipelineLog";

const SHEET_INSURANCE = process.env.GOOGLE_SHEETS_ID_INSURANCE;
const SHEET_CORRETOR  = process.env.GOOGLE_SHEETS_ID_CORRETOR;

export async function GET(req: NextRequest) {
  // Proteção: só Vercel Cron ou chamadas com o secret correto
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const results: { client: string; steps: string[]; error?: string }[] = [];

  // Coleta novos briefings dos dois sheets
  const newBriefings = [];

  if (SHEET_INSURANCE) {
    try {
      const briefings = await fetchNewBriefings(SHEET_INSURANCE, "life-insurance");
      newBriefings.push(...briefings);
    } catch (err) {
      console.error("[cron/briefings] Erro ao ler sheet life-insurance:", err);
    }
  }

  if (SHEET_CORRETOR) {
    try {
      const briefings = await fetchNewBriefings(SHEET_CORRETOR, "real-estate");
      newBriefings.push(...briefings);
    } catch (err) {
      console.error("[cron/briefings] Erro ao ler sheet real-estate:", err);
    }
  }

  if (newBriefings.length === 0) {
    return NextResponse.json({ ok: true, newClients: 0, message: "Nenhum briefing novo." });
  }

  // Processa cada novo briefing em sequência
  for (const briefing of newBriefings) {
    const steps: string[] = [];
    const logEntry = appendLog({
      date: now.toISOString(),
      job: "calendar",
      clientId: briefing.clientName,
      clientName: briefing.brandName,
      status: "running",
      message: `Pipeline automático iniciado para ${briefing.brandName}`,
    });

    try {
      // 1. Onboarding
      const client = await onboardClient(briefing);
      steps.push("✅ Onboarding (cliente + Obsidian + Trello board)");

      // 2. ICP
      await generateICP(client, briefing);
      steps.push("✅ ICP gerado");

      // 3. Paleta
      await generatePalette(client, briefing);
      steps.push("✅ Paleta de cores gerada");

      // 4. Calendário mensal
      const calendar = await generateMonthlyCalendar(client, month);
      steps.push(`✅ Calendário ${month} gerado (${calendar.posts.length} posts)`);

      // 5. Sincroniza com Trello
      if (client.trelloBoardId) {
        await syncCalendarToTrello(client, calendar);
        steps.push("✅ Calendário sincronizado com Trello");
      }

      updateLog(logEntry.id, {
        status: "success",
        message: `Pipeline completo para ${briefing.brandName}`,
        details: steps.map((s) => ({ label: s, value: "" })),
      });

      results.push({ client: briefing.brandName, steps });
      console.log(`✅ [cron/briefings] Pipeline completo: ${briefing.brandName}`);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      steps.push(`❌ Falhou: ${message}`);
      updateLog(logEntry.id, { status: "error", message });
      results.push({ client: briefing.brandName, steps, error: message });
      console.error(`❌ [cron/briefings] Erro em ${briefing.brandName}:`, err);
    }
  }

  return NextResponse.json({ ok: true, newClients: newBriefings.length, results });
}
