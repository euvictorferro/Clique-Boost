import path from "path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "../../.env") });

import { fetchNewBriefings } from "../src/lib/googleSheets";
import { onboardClient } from "../src/lib/onboarding";
import { generateICP } from "../src/lib/icp";
import { generatePalette } from "../src/lib/palette";
import { generateMonthlyCalendar } from "../src/lib/contentCalendar";
import { syncCalendarToTrello } from "../src/lib/trello";
import { analyzeClientProfile } from "../src/lib/profileAnalysis";
import { Niche } from "../src/lib/types";

async function runForSheet(sheetId: string, niche: Niche) {
  const briefings = await fetchNewBriefings(sheetId, niche);
  if (briefings.length === 0) {
    console.log(`  Nenhum briefing novo na planilha ${niche}`);
    return;
  }

  for (const briefing of briefings) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`👤 Processando: ${briefing.clientName}`);
    console.log(`${"=".repeat(50)}`);

    const client = await onboardClient(briefing);
    await analyzeClientProfile(client);
    await generateICP(client, briefing);
    await generatePalette(client, briefing);

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const calendar = await generateMonthlyCalendar(client, month);

    if (process.env.TRELLO_API_KEY && process.env.TRELLO_TOKEN) {
      await syncCalendarToTrello(client, calendar);
    } else {
      console.log("⚠️  Trello não configurado — calendário salvo apenas no Obsidian");
    }

    console.log(`\n✅ ${briefing.clientName} processado com sucesso!`);
  }
}

async function main() {
  console.log("🚀 Pipeline Social Media Clique Boost\n");

  const insuranceSheetId = process.env.GOOGLE_SHEETS_ID_INSURANCE;
  const corretorSheetId = process.env.GOOGLE_SHEETS_ID_CORRETOR;
  const geralSheetId = process.env.GOOGLE_SHEETS_ID_GERAL;

  if (insuranceSheetId) {
    console.log("📋 Verificando briefings Life Insurance...");
    try { await runForSheet(insuranceSheetId, "life-insurance"); }
    catch (e) { console.warn("⚠️  Falha na planilha Insurance:", (e as Error).message); }
  }

  if (corretorSheetId) {
    console.log("\n📋 Verificando briefings Corretor de Imóveis...");
    try { await runForSheet(corretorSheetId, "real-estate"); }
    catch (e) { console.warn("⚠️  Falha na planilha Corretor:", (e as Error).message); }
  }

  if (geralSheetId) {
    console.log("\n📋 Verificando briefings Geral...");
    try { await runForSheet(geralSheetId, "general"); }
    catch (e) { console.warn("⚠️  Falha na planilha Geral:", (e as Error).message); }
  }

  console.log("\n✅ Pipeline concluído!");
}

main().catch(console.error);
