import { Client, ContentCalendar, ContentPost, InstagramPost } from "./types";
import { getViralPosts, getViralPostsByNiche } from "./apify";
import { callClaude } from "./claude";
import { readNote, writeCalendar } from "./obsidian";
import { upsertClient, getClient } from "./clients";
import { getAllCopySkills } from "../prompts/copySkills";

function buildCalendarPrompt(
  client: Client,
  icpContent: string,
  strategyContent: string,
  vozContent: string,
  viralPosts: InstagramPost[],
  month: string
): string {
  const nicheLabel = client.niche === "life-insurance" ? "life insurance" : client.niche === "real-estate" ? "mercado imobiliário" : "marketing digital";

  const viralSummary = viralPosts.length > 0
    ? viralPosts.map((p, i) => `${i + 1}. @${p.ownerUsername} — ${p.likesCount} likes, ${p.videoPlayCount ?? 0} views — "${p.caption?.slice(0, 120) ?? "sem legenda"}"`)
        .join("\n")
    : "Nenhum post viral identificado — crie conteúdos baseados em tendências consolidadas do nicho.";

  const platforms = client.socialNetworks ?? ["Instagram"];
  const hasTikTok = platforms.some(p => p.toLowerCase().includes("tiktok"));

  return `Você é um estrategista digital sênior especializado em ${nicheLabel}. Você pensa como gestor de conteúdo de alto nível, não como redator genérico. Seu trabalho é criar uma pauta mensal que gere resultados de negócio reais para ${client.brandName}.

IDENTIDADE DO CLIENTE:
- Nome/Marca: ${client.brandName}
- Tom de voz: ${client.toneOfVoice}
- Objetivo principal: ${client.contentGoal}
- Nicho: ${nicheLabel}
- Plataformas ativas: ${platforms.join(", ")}
- Mês: ${month}

ICP (CLIENTE IDEAL):
${icpContent.slice(0, 2000)}

${strategyContent ? `ESTRATÉGIA DE CONTEÚDO DO CLIENTE:
${strategyContent.slice(0, 2000)}

` : ""}${vozContent ? `VOZ E PERSONALIDADE DO CLIENTE (siga rigorosamente):
${vozContent.slice(0, 1500)}

` : ""}REFERÊNCIAS VIRAIS DO NICHO (últimos 30 dias):
${viralSummary}

${getAllCopySkills()}

REGRAS ESTRATÉGICAS OBRIGATÓRIAS:
1. Crie exatamente 20 posts de feed para o mês (5 por semana).
2. Mix de formatos por semana: 2-3 Reels + 2 Carrosseis (sem Stories no feed — Stories são paralelos).
3. ${hasTikTok ? 'Todo Reel DEVE ir para o TikTok no mesmo dia. No campo "platforms" inclua ["Instagram", "TikTok"].' : 'No campo "platforms" coloque as plataformas onde o post será publicado.'}
4. Para cada post com Reel, sugira uma ideia de Stories complementar para o mesmo dia (campo "storiesIdea").
5. Explique a decisão estratégica de cada post no campo "rationale" — por que este tema neste momento do mês, o que ele resolve para o ICP.
6. Distribua os objetivos ao longo do mês: semanas 1-2 = awareness/educação, semanas 3-4 = conversão/prova social.
7. O gancho de cada post DEVE seguir as regras de copy do formato correspondente definidas acima.
8. Se houver estratégia de conteúdo definida, os temas e pilares devem respeitar os pilares estratégicos do cliente.

Responda APENAS com um JSON válido no seguinte formato (sem markdown, sem explicações):

[
  {
    "week": 1,
    "day": 3,
    "date": "${month}-03",
    "theme": "Tema específico do post",
    "format": "Reel",
    "platforms": ["Instagram", "TikTok"],
    "hook": "Gancho específico de abertura",
    "objective": "Objetivo do post (ex: gerar lead, educar, prova social)",
    "rationale": "Por que este conteúdo neste momento — raciocínio estratégico",
    "storiesIdea": "Ideia de Stories complementar para o mesmo dia"
  }
]`;
}

function formatCalendarNote(client: Client, calendar: ContentCalendar): string {
  const lines = [
    `# Calendário de Conteúdo — ${client.brandName}`,
    ``,
    `**Mês:** ${calendar.month}`,
    `**Gerado em:** ${new Date(calendar.generatedAt).toLocaleDateString("pt-BR")}`,
    `**Total de posts:** ${calendar.posts.length}`,
    ``,
    `---`,
    ``,
  ];

  const byWeek: Record<number, ContentPost[]> = {};
  for (const post of calendar.posts) {
    if (!byWeek[post.week]) byWeek[post.week] = [];
    byWeek[post.week].push(post);
  }

  for (const week of [1, 2, 3, 4]) {
    const posts = byWeek[week] ?? [];
    if (!posts.length) continue;
    lines.push(`## Semana ${week}`, ``);
    for (const post of posts.sort((a, b) => a.day - b.day)) {
      lines.push(
        `### Dia ${post.day} — ${post.theme}`,
        `- **Formato:** ${post.format} | **Plataformas:** ${post.platforms?.join(" + ") ?? post.format}`,
        `- **Gancho:** ${post.hook}`,
        `- **Objetivo:** ${post.objective}`,
        post.rationale ? `- **Estratégia:** ${post.rationale}` : "",
        post.storiesIdea ? `- **Stories do dia:** ${post.storiesIdea}` : "",
        post.notes ? `- **Obs:** ${post.notes}` : "",
        ``,
      );
    }
  }

  return lines.filter((l) => l !== undefined).join("\n");
}

export async function generateMonthlyCalendar(
  client: Client,
  month: string
): Promise<ContentCalendar> {
  console.log(`📅 Gerando calendário ${month} para ${client.name}...`);

  // Buscar ICP, estratégia e voz do cliente do Obsidian
  const icpContent = readNote(client.id, "ICP.md") ?? "ICP não disponível";
  const strategyContent = readNote(client.id, "estrategia-conteudo.md") ?? "";
  const vozContent = readNote(client.id, "voz.md") ?? "";

  // Scraping de concorrentes ou pesquisa de mercado por nicho
  let viralPosts: InstagramPost[] = [];
  const hasCompetitors = client.competitors.length > 0 && client.competitors.some(c => c.trim() !== "");

  if (hasCompetitors) {
    console.log(`🔍 Scrapando ${client.competitors.length} concorrentes...`);
    try {
      viralPosts = await getViralPosts(client.competitors, 30, 10);
      console.log(`✅ ${viralPosts.length} posts virais encontrados`);
    } catch (err) {
      console.warn("⚠️ Falha no scraping de concorrentes, tentando pesquisa de mercado:", err);
    }
  }

  if (!hasCompetitors || viralPosts.length === 0) {
    console.log(`🌐 Sem concorrentes — fazendo pesquisa de mercado por nicho (${client.niche})...`);
    try {
      viralPosts = await getViralPostsByNiche(client.niche, 10);
      console.log(`✅ ${viralPosts.length} posts virais do nicho encontrados`);
    } catch (err) {
      console.warn("⚠️ Falha na pesquisa de mercado, gerando calendário sem referências:", err);
    }
  }

  const prompt = buildCalendarPrompt(client, icpContent, strategyContent, vozContent, viralPosts, month);
  const raw = await callClaude(prompt, 6000);

  let posts: ContentPost[] = [];
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      posts = JSON.parse(jsonMatch[0]) as ContentPost[];
    }
  } catch {
    console.warn("Erro ao parsear JSON do calendário");
  }

  const calendar: ContentCalendar = {
    clientId: client.id,
    month,
    posts,
    generatedAt: new Date().toISOString(),
  };

  const note = formatCalendarNote(client, calendar);
  writeCalendar(client.id, month, note);
  console.log(`✅ Calendário salvo em Obsidian: ${client.id}-${month}.md`);

  return calendar;
}

export async function refreshWeeklyTopics(clientId: string): Promise<void> {
  const client = getClient(clientId);
  if (!client) throw new Error(`Cliente não encontrado: ${clientId}`);

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  console.log(`🔄 Atualizando tópicos da semana para ${client.name}...`);

  if (client.competitors.length > 0) {
    const viralPosts = await getViralPosts(client.competitors, 7, 5);
    const trending = viralPosts.map((p) => p.caption?.slice(0, 100)).filter(Boolean);

    if (trending.length > 0) {
      const refreshNote = `\n\n---\n\n## Atualização Semanal — ${new Date().toLocaleDateString("pt-BR")}\n\n### Trending nos concorrentes:\n${trending.map((t) => `- ${t}`).join("\n")}\n`;
      const calPath = require("path").join(
        process.env.OBSIDIAN_VAULT_PATH!,
        "Calendários",
        `${client.id}-${month}.md`
      );
      if (require("fs").existsSync(calPath)) {
        require("fs").appendFileSync(calPath, refreshNote, "utf-8");
        console.log(`✅ Tópicos da semana atualizados para ${client.name}`);
      }
    }
  }
}
