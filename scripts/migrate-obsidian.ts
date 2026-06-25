/**
 * migrate-obsidian.ts
 *
 * Reorganiza o vault Obsidian da Clique Boost para a nova estrutura:
 *
 * 00 - Clique Boost/          ← tudo da agência
 * 01 - Clientes/<cliente>/    ← cada cliente com subpastas
 *   Briefing/
 *   Estratégia/
 *   Branding/
 *   Calendários/
 *   Análises/
 *   Reuniões/
 * 02 - Prompts e Skills/      ← espelho legível dos prompts do código
 *
 * Execute: npx ts-node scripts/migrate-obsidian.ts
 */

import fs from "fs";
import path from "path";

const VAULT = process.env.OBSIDIAN_VAULT_PATH
  ?? "/Users/victorferro/Library/Mobile Documents/iCloud~md~obsidian/Documents/[Clique Boost] - Second Brain";

const CLIENTES = path.join(VAULT, "01 - Clientes");
const CALENDARIOS_GLOBAL = path.join(VAULT, "03 - Calendários");
const PROMPTS_DIR = path.join(VAULT, "02 - Prompts e Skills");

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mkdir(p: string) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
    log(`📁 Criada: ${rel(p)}`);
  }
}

function moveFile(src: string, dest: string) {
  if (!fs.existsSync(src)) return;
  mkdir(path.dirname(dest));
  if (fs.existsSync(dest)) {
    log(`⏭  Já existe, pulando: ${rel(dest)}`);
    return;
  }
  fs.renameSync(src, dest);
  log(`✅ Movido: ${rel(src)} → ${rel(dest)}`);
}

function deleteFile(p: string, reason: string) {
  if (!fs.existsSync(p)) return;
  fs.unlinkSync(p);
  log(`🗑  Deletado (${reason}): ${rel(p)}`);
}

function deleteEmptyDir(p: string) {
  if (!fs.existsSync(p)) return;
  const files = fs.readdirSync(p).filter(f => !f.startsWith("."));
  if (files.length === 0) {
    fs.rmdirSync(p);
    log(`🗑  Pasta vazia removida: ${rel(p)}`);
  } else {
    log(`⚠️  Pasta não vazia, mantida: ${rel(p)} (${files.join(", ")})`);
  }
}

function rel(p: string) {
  return p.replace(VAULT + "/", "");
}

function log(msg: string) {
  console.log(msg);
}

// ─── Adiciona frontmatter YAML para o grafo do Obsidian ──────────────────────

function addFrontmatter(filePath: string, tags: string[], clientId: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf-8");
  if (content.startsWith("---")) return; // já tem frontmatter
  const fm = `---\ntags: [${tags.join(", ")}]\ncliente: ${clientId}\n---\n\n`;
  fs.writeFileSync(filePath, fm + content, "utf-8");
}

// ─── Migração por cliente ─────────────────────────────────────────────────────

function migrateClient(clientId: string) {
  const base = path.join(CLIENTES, clientId);
  if (!fs.existsSync(base)) return;

  log(`\n── Migrando cliente: ${clientId} ──`);

  const briefingDir   = path.join(base, "Briefing");
  const estrategiaDir = path.join(base, "Estratégia");
  const brandingDir   = path.join(base, "Branding");
  const calDir        = path.join(base, "Calendários");
  const analisesDir   = path.join(base, "Análises");
  const reunioesDir   = path.join(base, "Reuniões");

  // Garante que as subpastas existem
  [briefingDir, estrategiaDir, brandingDir, calDir, analisesDir, reunioesDir].forEach(mkdir);

  // Mapa: arquivo atual → pasta de destino
  const moves: [string, string][] = [
    ["briefing.md",             "Briefing/briefing.md"],
    ["ICP.md",                  "Estratégia/ICP.md"],
    ["estrategia-conteudo.md",  "Estratégia/estrategia-conteudo.md"],
    ["funil-organico.md",       "Estratégia/funil-organico.md"],
    ["mapa-mental.md",          "Estratégia/mapa-mental.md"],
    ["mapa-mental-posicionamento.md", "Estratégia/mapa-mental-posicionamento.md"],
    ["linha-editorial.md",      "Estratégia/linha-editorial.md"],
    ["produtos-copys.md",       "Estratégia/produtos-copys.md"],
    ["perfil.md",               "Estratégia/perfil.md"],
    ["analise-perfis.md",       "Branding/analise-perfis.md"],
    ["paleta.md",               "Branding/paleta.md"],
    ["concorrentes.md",         "Branding/concorrentes.md"],
    // Conteúdo avulso útil da Laís
    ["carrossel-trust-quarta.md", "Estratégia/carrossel-trust-quarta.md"],
  ];

  for (const [filename, dest] of moves) {
    moveFile(path.join(base, filename), path.join(base, dest));
  }

  // Move pasta reunioes/ → Reuniões/
  const reunioesOld = path.join(base, "reunioes");
  if (fs.existsSync(reunioesOld)) {
    const files = fs.readdirSync(reunioesOld);
    for (const f of files) {
      moveFile(path.join(reunioesOld, f), path.join(reunioesDir, f));
    }
    deleteEmptyDir(reunioesOld);
  }

  // Move pasta analises/ → Análises/
  const analisesOld = path.join(base, "analises");
  if (fs.existsSync(analisesOld)) {
    const files = fs.readdirSync(analisesOld);
    for (const f of files) {
      moveFile(path.join(analisesOld, f), path.join(analisesDir, f));
    }
    deleteEmptyDir(analisesOld);
  }

  // Adiciona frontmatter para grafo
  addFrontmatter(path.join(base, "Estratégia/ICP.md"), ["icp", "estrategia", clientId], clientId);
  addFrontmatter(path.join(base, "Estratégia/estrategia-conteudo.md"), ["estrategia", "conteudo", clientId], clientId);
  addFrontmatter(path.join(base, "Branding/paleta.md"), ["branding", "paleta", clientId], clientId);
  addFrontmatter(path.join(base, "Briefing/briefing.md"), ["briefing", clientId], clientId);
}

// ─── Migra calendários globais para dentro de cada cliente ───────────────────

function migrateCalendars() {
  if (!fs.existsSync(CALENDARIOS_GLOBAL)) return;
  log("\n── Migrando calendários globais ──");

  const files = fs.readdirSync(CALENDARIOS_GLOBAL).filter(f => f.endsWith(".md"));
  for (const file of files) {
    // Formato: <clientId>-YYYY-MM.md
    const match = file.match(/^(.+)-(\d{4}-\d{2})\.md$/);
    if (!match) { log(`⚠️  Calendário ignorado (formato inesperado): ${file}`); continue; }
    const [, clientId, month] = match;
    const dest = path.join(CLIENTES, clientId, "Calendários", `${month}.md`);
    moveFile(path.join(CALENDARIOS_GLOBAL, file), dest);
  }

  deleteEmptyDir(CALENDARIOS_GLOBAL);
}

// ─── Limpa arquivos redundantes ───────────────────────────────────────────────

function cleanupRedundant() {
  log("\n── Limpando redundâncias ──");

  // Versões originais da Laís (os arquivos finais já existem)
  deleteFile(
    path.join(CLIENTES, "lais-daltrozo/ICP-original.md"),
    "versão original substituída por ICP.md"
  );
  deleteFile(
    path.join(CLIENTES, "lais-daltrozo/briefing-original.md"),
    "versão original substituída por briefing.md"
  );

  // sam/ é duplicata de sam-fernandes/
  const samMd = path.join(CLIENTES, "sam/Sam.md");
  const samDest = path.join(CLIENTES, "sam-fernandes/notas-gerais.md");
  moveFile(samMd, samDest);
  deleteEmptyDir(path.join(CLIENTES, "sam"));
}

// ─── Cria espelho de Prompts e Skills ────────────────────────────────────────

function createPromptseMirror() {
  log("\n── Criando 02 - Prompts e Skills ──");
  mkdir(PROMPTS_DIR);

  const skillsCopy = `---
tags: [prompts, copy, skills]
---

# Skills de Copy — Regras de Geração de Conteúdo

> Espelho de \`app/src/prompts/copySkills.ts\`. Para alterar, avise no VS Code.

---

## Regras Globais (todos os formatos)

- **Nunca** use travessão "—" em nenhum texto
- **Nunca** comece com "Você sabia que..."
- **Nunca** use bullet points genéricos com "•" ou "-" na legenda
- **Nunca** escreva em tom de robô: sem "No mundo atual", "É fundamental", "Vale ressaltar"
- **Nunca** use clichês: "Hoje vou te contar", "Isso vai mudar sua vida"
- Escreva como um humano que domina o assunto conversando com um amigo
- Frases curtas. Uma ideia por vez.
- Use números concretos quando possível

---

## Reel

- **Gancho (primeiros 3 segundos):** frase de choque ou promessa específica que força continuar assistindo
  - ✅ "Você está perdendo dinheiro toda vez que faz isso no seguro"
  - ❌ "Hoje vou falar sobre seguros de vida"
- **Legenda:** 1 frase de hook + 2-3 frases de contexto + CTA direto
- **CTA:** específico e com urgência ("Comenta QUERO que eu mando o link")
- **Tom:** energia alta, linguagem de vídeo, como se falasse direto para câmera
- **Hashtags:** 3-5 no máximo, específicas do nicho

---

## Carrossel

- **Slide 1 (GANCHO):** pergunta ou afirmação provocadora que força o swipe. Máx 8 palavras.
  - ✅ "Por que seu seguro não vai te pagar quando precisar"
  - ❌ "Veja neste carrossel sobre seguros de vida"
- **Slides 2-4 (DESENVOLVIMENTO):** 1 ideia por slide. Frase curta + contexto.
- **Slide final (CTA):** ação única e clara. Nunca dois CTAs ao mesmo tempo.
- **Legenda:** reforça o gancho do Slide 1 + CTA de comentário/salvamento
- **Tom:** didático mas direto, como um expert ensinando sem enrolação

---

## Stories

- Frase única de impacto (máx 6 palavras na tela)
- CTA imediato: "Arrasta pra cima" / "Responde aqui" / "Clica no link"
- Tom: conversa direta, informal, como uma mensagem de WhatsApp
- Objetivo: gerar resposta ou clique, nunca só "informar"

---

## Foto

- Legenda começa com frase de parada (sem precisar do visual para fazer sentido)
- Conta uma história curta ou compartilha um insight inesperado
- Estrutura: situação → virada → lição ou CTA
- Tom: pessoal, reflexivo, humanizado
- Evite legendas descritivas da foto ("Aqui estou eu em...")
`;

  const fluxos = `---
tags: [prompts, fluxos, automacao]
---

# Fluxos Automatizados — Clique Boost

> Documentação dos processos automáticos do sistema.

---

## Pipeline de Onboarding (novo cliente)

\`\`\`
Google Forms (briefing)
  → googleSheets.ts (detecta novo briefing)
  → onboarding.ts (cria cliente + salva Briefing/briefing.md no Obsidian)
  → icp.ts (Claude gera Estratégia/ICP.md)
  → palette.ts (Claude gera Branding/paleta.md)
  → contentCalendar.ts (Claude + Apify → Calendários/YYYY-MM.md)
  → trello.ts (cria board + cards por semana)
\`\`\`

## Ciclo Semanal Completo

\`\`\`
weekly-full (toda segunda-feira)
  → weeklyAnalysis.ts (Meta API → Análises/YYYY-WXX.md)
  → weeklyRefresh.ts (ajusta próxima semana no Trello)
  → postGenerator.ts (gera posts detalhados da próxima semana)
\`\`\`

## Geração de Conteúdo

O Claude lê do Obsidian:
- \`Estratégia/ICP.md\` — quem é o cliente ideal
- \`Estratégia/estrategia-conteudo.md\` — pilares e objetivos
- \`Estratégia/funil-organico.md\` — jornada de compra

Combina com posts virais dos concorrentes (Apify) e gera calendário mensal.
`;

  fs.writeFileSync(path.join(PROMPTS_DIR, "skills-de-copy.md"), skillsCopy, "utf-8");
  fs.writeFileSync(path.join(PROMPTS_DIR, "fluxos-automatizados.md"), fluxos, "utf-8");
  log("✅ Criados: skills-de-copy.md, fluxos-automatizados.md");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
  log("🚀 Iniciando migração do vault Obsidian...\n");

  // Clientes ativos com dados reais
  const activeClients = [
    "isabela-castro",
    "lais-daltrozo",
    "sam-fernandes",
    "tiago-zamboni",
    "victor-hugo-ferro",
    "debora-segnini",
  ];

  for (const clientId of activeClients) {
    migrateClient(clientId);
  }

  cleanupRedundant();
  migrateCalendars();
  createPromptseMirror();

  log("\n✅ Migração concluída!");
  log(`\nClientes não migrados (dados insuficientes para subpastas):`);
  log(`  bela-castro, cantarelli, fabricia, nelson, travis`);
  log(`  → Mantidos como estão em 01 - Clientes/`);
}

main();
