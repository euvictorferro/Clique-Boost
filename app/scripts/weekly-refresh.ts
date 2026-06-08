import path from "path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "../../.env") });

import { loadClients } from "../src/lib/clients";
import { refreshWeeklyTopics } from "../src/lib/contentCalendar";

async function main() {
  console.log("🔄 Weekly refresh — atualizando tópicos de todos os clientes ativos\n");

  const clients = loadClients().filter((c) => c.status === "active");
  if (clients.length === 0) {
    console.log("Nenhum cliente ativo encontrado.");
    return;
  }

  for (const client of clients) {
    console.log(`📅 Atualizando: ${client.name}`);
    try {
      await refreshWeeklyTopics(client.id);
    } catch (err) {
      console.warn(`⚠️  Falha para ${client.name}:`, err);
    }
  }

  console.log("\n✅ Weekly refresh concluído!");
}

main().catch(console.error);
