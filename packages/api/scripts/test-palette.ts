import path from "path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "../../.env") });

import { generatePalette } from "../src/lib/palette";
import { getClient } from "../src/lib/clients";

async function main() {
  const clientId = process.argv[2] ?? "lais-daltrozo";
  const client = await getClient(clientId);

  if (!client) {
    console.error(`❌ Cliente "${clientId}" não encontrado.`);
    process.exit(1);
  }

  const mockBriefing = {
    clientName: client.name,
    brandName: client.brandName,
    niche: client.niche,
    city: "Orlando, FL",
    idealClient: "",
    differentials: "",
    hasVisualIdentity: client.hasVisualIdentity,
    brandColors: client.brandColors,
    socialNetworks: client.socialNetworks,
    competitors: client.competitors,
    toneOfVoice: client.toneOfVoice,
    contentGoal: client.contentGoal,
    rawData: {},
  } as import("@clique-boost/shared").BriefingResponse;

  const result = await generatePalette(client, mockBriefing);

  if (result.hasExistingIdentity) {
    console.log(`✅ Identidade existente: ${result.existingColors}`);
  } else {
    console.log(`✅ ${result.generatedPalettes?.length ?? 0} paletas geradas`);
    for (const p of result.generatedPalettes?.slice(0, 3) ?? []) {
      console.log(`  ${p.index}. ${p.suggestedName}: ${p.colors.map((c) => c.hex).join(", ")}`);
    }
  }
}

main().catch(console.error);
