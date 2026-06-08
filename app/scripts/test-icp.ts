import path from "path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "../../.env") });

import { generateICP } from "../src/lib/icp";
import { getClient } from "../src/lib/clients";

async function main() {
  const clientId = process.argv[2] ?? "lais-daltrozo";
  const client = getClient(clientId);

  if (!client) {
    console.error(`❌ Cliente "${clientId}" não encontrado. Execute test-onboarding.ts primeiro.`);
    process.exit(1);
  }

  console.log(`🎯 Gerando ICP para: ${client.name}\n`);

  // Usar rawData vazio se não tiver briefing salvo — o briefing.md já tem os dados
  const mockBriefing = {
    clientName: client.name,
    brandName: client.brandName,
    niche: client.niche,
    city: "Orlando, FL",
    idealClient: "Famílias brasileiras nos EUA que querem proteger seu patrimônio.",
    differentials: "Atendimento bilíngue, especialização em IUL.",
    hasVisualIdentity: client.hasVisualIdentity,
    socialNetworks: client.socialNetworks,
    competitors: client.competitors,
    toneOfVoice: client.toneOfVoice,
    contentGoal: client.contentGoal,
    rawData: {},
  } as import("../src/lib/types").BriefingResponse;

  const icp = await generateICP(client, mockBriefing);
  console.log("\n✅ ICP gerado (primeiros 500 chars):");
  console.log(icp.slice(0, 500) + "...");
}

main().catch(console.error);
