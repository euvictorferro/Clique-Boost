/**
 * copySkills.ts
 *
 * Instruções de copy por formato para geração de conteúdo via Claude.
 * Cada skill define a estrutura, regras e proibições específicas do formato.
 */

export const GLOBAL_COPY_RULES = `
REGRAS GLOBAIS DE COPY (NÃO NEGOCIÁVEL):
- NUNCA use travessão "—" em nenhum texto
- NUNCA comece com "Você sabia que..."
- NUNCA use bullet points genéricos com "•" ou "-" na legenda
- NUNCA escreva em tom de robô ou AI: sem "No mundo atual", "É fundamental", "Vale ressaltar"
- NUNCA use frases de abertura clichês como "Hoje vou te contar", "Isso vai mudar sua vida"
- Escreva como um humano que domina o assunto conversando com um amigo
- Frases curtas. Uma ideia por vez.
- Use números concretos quando possível ("3 de cada 10 clientes" > "muitos clientes")
`.trim();

export const FORMAT_SKILLS: Record<string, string> = {
  Reel: `
SKILL DE COPY — REEL:
- Gancho (primeiros 3 segundos do vídeo): frase de choque ou promessa específica que força continuar assistindo
  Ex bom: "Você está perdendo dinheiro toda vez que faz isso no seguro"
  Ex ruim: "Hoje vou falar sobre seguros de vida"
- Legenda: 1 frase de hook + 2-3 frases de contexto + CTA direto
- CTA: específico e com urgência ("Comenta QUERO que eu te mando o link" / "Salva esse vídeo")
- Tom: energia alta, linguagem de vídeo, como se estivesse falando direto para câmera
- Hashtags: 3-5 no máximo, específicas do nicho
`.trim(),

  Carrossel: `
SKILL DE COPY — CARROSSEL:
Estrutura obrigatória slide a slide:
- Slide 1 (GANCHO): pergunta ou afirmação provocadora que força o swipe. Máx 8 palavras.
  Ex bom: "Por que seu seguro não vai te pagar quando precisar"
  Ex ruim: "Veja neste carrossel sobre seguros de vida"
- Slides 2-4 (DESENVOLVIMENTO): 1 ideia por slide. Frase curta + contexto. Sem listar tópicos aleatórios.
- Slide final (CTA): ação única e clara. Nunca dois CTAs ao mesmo tempo.
- Legenda: reforça o gancho do Slide 1 + CTA de comentário/salvamento
- Tom: didático mas direto, como um expert ensinando sem enrolação
`.trim(),

  Stories: `
SKILL DE COPY — STORIES:
- Frase única de impacto (máx 6 palavras na tela)
- CTA imediato: "Arrasta pra cima" / "Responde aqui" / "Clica no link"
- Tom: conversa direta, informal, como uma mensagem de WhatsApp para o seguidor
- Objetivo: gerar resposta ou clique, nunca só "informar"
- Pode usar pergunta direta que a pessoa responda no direct
`.trim(),

  Foto: `
SKILL DE COPY — FOTO:
- Legenda começa com frase de parada (sem precisar do visual para fazer sentido)
- Conta uma história curta ou compartilha um insight inesperado
- Estrutura: situação → virada → lição ou CTA
- Tom: pessoal, reflexivo, humanizado
- Evite legendas descritivas da foto ("Aqui estou eu em...")
`.trim(),
};

/**
 * Retorna o bloco de instruções de copy para um formato específico.
 * Inclui as regras globais + skill do formato.
 */
export function getCopySkill(format: string): string {
  const skill = FORMAT_SKILLS[format] ?? FORMAT_SKILLS["Reel"];
  return `${GLOBAL_COPY_RULES}\n\n${skill}`;
}

/**
 * Retorna todas as skills de copy formatadas para injetar em prompts de calendário
 * (onde o Claude define o formato de cada post).
 */
export function getAllCopySkills(): string {
  return `${GLOBAL_COPY_RULES}

${Object.entries(FORMAT_SKILLS)
  .map(([format, skill]) => skill)
  .join("\n\n")}`;
}
