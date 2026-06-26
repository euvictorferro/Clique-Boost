import path from "path";
import { config } from "dotenv";

config({ path: path.join(__dirname, "../../.env") });

import { onboardClient } from "../src/lib/onboarding";
import { BriefingResponse } from "@clique-boost/shared";

const mockBriefing: BriefingResponse = {
  clientName: "Laís Daltrozo",
  brandName: "Laís Daltrozo",
  niche: "life-insurance",
  city: "Orlando, FL",
  idealClient: "Famílias brasileiras nos EUA que querem proteger seu patrimônio e futuro financeiro.",
  differentials: "Atendimento bilíngue, especialização em IUL, foco em famílias imigrantes.",
  hasVisualIdentity: true,
  brandColors: "Rosa (#E91E8C), Branco, Dourado",
  socialNetworks: ["Instagram", "TikTok"],
  competitors: ["laisdaltrozo", "brunafinancias"],
  toneOfVoice: "Próximo e humano",
  contentGoal: "Gerar leads qualificados",
  insuranceProducts: ["IUL", "Term Life", "Final Expense"],
  targetAudience: "Famílias latinas / hispânicas",
  clientObjection: "É muito caro",
  rawData: {},
};

async function main() {
  console.log("🚀 Testando onboarding de cliente...\n");
  const client = await onboardClient(mockBriefing);
  console.log("\n📄 Cliente criado:");
  console.log(JSON.stringify(client, null, 2));
}

main().catch(console.error);
