import { NextRequest, NextResponse } from "next/server";
import { upsertClient, getClient, slugify } from "@/lib/api/clients";
import { writeNoteAsync } from "@/lib/api/obsidian";
import { getSupabase } from "@/lib/api/supabase";
import type { PaymentStatus } from "@clique-boost/shared";

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  let fields: Record<string, string> = {};
  let proofFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    for (const [key, value] of formData.entries()) {
      if (key === "paymentProof" && value instanceof File && value.size > 0) {
        proofFile = value;
      } else if (typeof value === "string") {
        fields[key] = value;
      }
    }
  } else {
    fields = await req.json();
  }

  const { name, brandName, niche, instagramHandle, toneOfVoice, contentGoal, planId } = fields;

  if (!name || !niche) {
    return NextResponse.json({ error: "name e niche são obrigatórios" }, { status: 400 });
  }

  const id = slugify(name);
  const existing = await getClient(id);
  if (existing) {
    return NextResponse.json({ error: `Cliente "${id}" já existe` }, { status: 409 });
  }

  // Upload do comprovante de pagamento (se enviado)
  let paymentProofUrl: string | undefined;
  let paymentStatus: PaymentStatus = "pending";

  if (proofFile) {
    const ext = proofFile.name.split(".").pop() ?? "bin";
    const storagePath = `${id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await getSupabase()
      .storage.from("payment-proofs")
      .upload(storagePath, proofFile, { contentType: proofFile.type });

    if (uploadError) {
      return NextResponse.json(
        { error: `Erro ao enviar comprovante: ${uploadError.message}` },
        { status: 500 }
      );
    }
    paymentProofUrl = storagePath;
    paymentStatus = "proof_submitted";
  }

  const client = {
    id,
    name,
    brandName: brandName || name,
    niche: niche as "life-insurance" | "real-estate" | "general",
    instagramHandle: instagramHandle || "",
    competitors: [] as string[],
    socialNetworks: ["Instagram"],
    toneOfVoice: toneOfVoice || "",
    contentGoal: contentGoal || "",
    hasVisualIdentity: false,
    obsidianPath: "",
    createdAt: new Date().toISOString(),
    status: "onboarding" as const,
    planId: planId || undefined,
    paymentStatus,
    paymentProofUrl,
  };

  await upsertClient(client);

  const briefingContent = `# ${name}\n\n**Marca:** ${brandName || name}\n**Nicho:** ${niche}\n**Instagram:** @${instagramHandle || ""}\n**Tom de voz:** ${toneOfVoice || ""}\n**Objetivo:** ${contentGoal || ""}\n`;
  await writeNoteAsync(id, "briefing.md", briefingContent);

  return NextResponse.json({ ok: true, client });
}
