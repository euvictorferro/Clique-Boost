import path from "path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "../../.env") });

import { generateMonthlyCalendar } from "../src/lib/contentCalendar";
import { syncCalendarToTrello } from "../src/lib/trello";
import { getClient } from "../src/lib/clients";

async function main() {
  const clientId = process.argv[2] ?? "lais-daltrozo";
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const client = getClient(clientId);
  if (!client) {
    console.error(`❌ Cliente "${clientId}" não encontrado.`);
    process.exit(1);
  }

  const calendar = await generateMonthlyCalendar(client, month);
  console.log(`\n✅ ${calendar.posts.length} posts gerados para ${month}`);

  if (process.env.TRELLO_API_KEY && process.env.TRELLO_TOKEN) {
    console.log("\n📋 Sincronizando com Trello...");
    await syncCalendarToTrello(client, calendar);
  } else {
    console.log("\n⚠️  TRELLO_API_KEY/TOKEN não configurados — pulando sync Trello");
  }
}

main().catch(console.error);
