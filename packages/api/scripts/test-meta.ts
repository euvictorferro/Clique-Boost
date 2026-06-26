import path from "path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "../../.env") });

import { fetchClientInsights } from "../src/lib/metaInsights";
import { getClient } from "../src/lib/clients";

async function main() {
  const clientId = process.argv[2];
  if (!clientId) {
    console.error("❌ Informe o ID do cliente: npm run test-meta <clientId>");
    process.exit(1);
  }

  const client = getClient(clientId);
  if (!client) {
    console.error(`❌ Cliente "${clientId}" não encontrado.`);
    process.exit(1);
  }

  if (!client.metaAccessToken) {
    console.error(`❌ Cliente não tem metaAccessToken. Configure em data/clients.json.`);
    process.exit(1);
  }

  const insights = await fetchClientInsights(client);
  console.log("\n📊 Métricas completas:");
  console.log(JSON.stringify(insights, null, 2));
}

main().catch(console.error);
