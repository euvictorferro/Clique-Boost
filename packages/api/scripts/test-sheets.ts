import "dotenv/config";
import path from "path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "../../.env") });

import { fetchNewBriefings } from "../src/lib/googleSheets";

async function main() {
  const sheetId = process.env.GOOGLE_SHEETS_ID_INSURANCE;
  if (!sheetId) {
    console.error("❌ GOOGLE_SHEETS_ID_INSURANCE não configurado no .env");
    process.exit(1);
  }

  console.log("📋 Buscando briefings da planilha Life Insurance...");
  const briefings = await fetchNewBriefings(sheetId, "life-insurance");
  console.log(`\n✅ ${briefings.length} briefing(s) encontrado(s):\n`);
  for (const b of briefings) {
    console.log(`  - ${b.clientName} (${b.brandName}) — ${b.city}`);
  }

  if (briefings.length > 0) {
    console.log("\n📄 Primeiro briefing completo:");
    console.log(JSON.stringify(briefings[0], null, 2));
  }
}

main().catch(console.error);
