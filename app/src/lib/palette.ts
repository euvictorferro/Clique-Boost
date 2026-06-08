import { BriefingResponse, Client, ColorPalette, PaletteResult } from "./types";
import { callClaude } from "./claude";
import { writeNote } from "./obsidian";

function buildPalettePrompt(briefing: BriefingResponse): string {
  return `Você é um designer especialista em branding para profissionais liberais e empreendedores.

Crie 10 opções de paletas de cores para a marca abaixo. Cada paleta deve ter 4 a 5 cores com papel bem definido.

MARCA: ${briefing.brandName}
NICHO: ${briefing.niche === "life-insurance" ? "Agente de Life Insurance" : briefing.niche === "real-estate" ? "Corretor de Imóveis" : "Empreendedor"}
TOM DE VOZ: ${briefing.toneOfVoice}
CIDADE/ESTADO: ${briefing.city}

Responda APENAS com um JSON válido neste formato exato (sem texto fora do JSON):

[
  {
    "index": 1,
    "suggestedName": "Nome sugestivo da paleta",
    "colors": [
      { "name": "Primária", "hex": "#XXXXXX", "role": "primary" },
      { "name": "Secundária", "hex": "#XXXXXX", "role": "secondary" },
      { "name": "Acento", "hex": "#XXXXXX", "role": "accent" },
      { "name": "Neutro", "hex": "#XXXXXX", "role": "neutral" },
      { "name": "Fundo", "hex": "#XXXXXX", "role": "background" }
    ]
  }
]

Gere 10 paletas distintas com estilos variados (moderna, clássica, vibrante, sóbria, minimalista, etc.).`;
}

function formatPaletteNote(result: PaletteResult, brandName: string): string {
  const lines = [
    `# Paletas de Cores — ${brandName}`,
    ``,
    `*Gerado em: ${new Date().toLocaleDateString("pt-BR")}*`,
    ``,
    `---`,
    ``,
  ];

  if (result.hasExistingIdentity) {
    lines.push(`## Identidade Visual Existente`, ``, result.existingColors ?? "", ``);
    return lines.join("\n");
  }

  for (const palette of result.generatedPalettes ?? []) {
    lines.push(`## Opção ${palette.index} — ${palette.suggestedName}`, ``);
    for (const color of palette.colors) {
      lines.push(`- **${color.name}:** \`${color.hex}\``);
    }
    lines.push(``);
  }

  return lines.join("\n");
}

export async function generatePalette(
  client: Client,
  briefing: BriefingResponse
): Promise<PaletteResult> {
  if (briefing.hasVisualIdentity) {
    const result: PaletteResult = {
      clientId: client.id,
      hasExistingIdentity: true,
      existingColors: briefing.brandColors,
    };
    const note = formatPaletteNote(result, client.brandName);
    writeNote(client.id, "paleta.md", note);
    console.log(`✅ Identidade visual existente registrada para ${client.name}`);
    return result;
  }

  console.log(`🎨 Gerando 10 paletas para ${client.name}...`);
  const raw = await callClaude(buildPalettePrompt(briefing), 4096);

  let palettes: ColorPalette[] = [];
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      palettes = JSON.parse(jsonMatch[0]) as ColorPalette[];
    }
  } catch {
    console.warn("Erro ao parsear JSON das paletas, usando texto raw");
  }

  const result: PaletteResult = {
    clientId: client.id,
    hasExistingIdentity: false,
    generatedPalettes: palettes,
  };

  const note = formatPaletteNote(result, client.brandName);
  writeNote(client.id, "paleta.md", note);
  console.log(`✅ 10 paletas salvas em Obsidian: ${client.id}/paleta.md`);
  return result;
}
