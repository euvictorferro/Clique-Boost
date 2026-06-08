import { Client, InstagramPost } from "./types";
import { scrapeRecentPosts } from "./apify";
import { callClaude } from "./claude";
import { writeNote } from "./obsidian";

interface ProfileData {
  username: string;
  recentPosts: InstagramPost[];
  postCount: number;
  avgLikes: number;
  avgComments: number;
  avgViews: number;
  topPosts: InstagramPost[];
  postTypes: Record<string, number>;
  postingFrequencyPerWeek: number;
}

function analyzeProfileData(posts: InstagramPost[]): ProfileData {
  if (posts.length === 0) {
    return {
      username: "",
      recentPosts: [],
      postCount: 0,
      avgLikes: 0,
      avgComments: 0,
      avgViews: 0,
      topPosts: [],
      postTypes: {},
      postingFrequencyPerWeek: 0,
    };
  }

  const avgLikes = Math.round(posts.reduce((s, p) => s + p.likesCount, 0) / posts.length);
  const avgComments = Math.round(posts.reduce((s, p) => s + p.commentsCount, 0) / posts.length);
  const avgViews = Math.round(posts.reduce((s, p) => s + (p.videoPlayCount ?? 0), 0) / posts.length);

  const postTypes: Record<string, number> = {};
  for (const p of posts) {
    const type = p.type ?? "image";
    postTypes[type] = (postTypes[type] ?? 0) + 1;
  }

  const topPosts = [...posts]
    .sort((a, b) => (b.likesCount + b.commentsCount) - (a.likesCount + a.commentsCount))
    .slice(0, 5);

  // Frequência: posts nos últimos 30 dias / 4 semanas
  const postingFrequencyPerWeek = Math.round((posts.length / 30) * 7 * 10) / 10;

  return {
    username: posts[0]?.ownerUsername ?? "",
    recentPosts: posts,
    postCount: posts.length,
    avgLikes,
    avgComments,
    avgViews,
    topPosts,
    postTypes,
    postingFrequencyPerWeek,
  };
}

function buildAnalysisPrompt(client: Client, profile: ProfileData): string {
  const topPostsSummary = profile.topPosts
    .map((p, i) => `${i + 1}. ${p.likesCount} likes, ${p.commentsCount} comentários — "${p.caption?.slice(0, 120) ?? "sem legenda"}"`)
    .join("\n");

  const typesSummary = Object.entries(profile.postTypes)
    .map(([type, count]) => `${type}: ${count} posts`)
    .join(", ");

  return `Você é um especialista em marketing digital e gestão de perfis no Instagram. Analise o perfil abaixo e gere um diagnóstico completo com recomendações de primeiras ações.

CLIENTE: ${client.brandName} (@${profile.username})
NICHO: ${client.niche === "life-insurance" ? "Life Insurance" : client.niche === "real-estate" ? "Corretor de Imóveis" : "Marketing Digital"}
TOM DE VOZ DESEJADO: ${client.toneOfVoice}
OBJETIVO: ${client.contentGoal}

DADOS DO PERFIL (últimos 30 dias):
- Posts publicados: ${profile.postCount}
- Frequência média: ${profile.postingFrequencyPerWeek}x/semana
- Média de likes: ${profile.avgLikes}
- Média de comentários: ${profile.avgComments}
- Média de visualizações (vídeos): ${profile.avgViews}
- Tipos de conteúdo: ${typesSummary || "não identificado"}

TOP 5 POSTS POR ENGAJAMENTO:
${topPostsSummary || "Nenhum post encontrado"}

Gere um diagnóstico estruturado com:

## 1. Diagnóstico Atual
- Pontos fortes do perfil
- Pontos fracos e gaps de conteúdo
- Avaliação da frequência de postagem
- Quais tipos de conteúdo estão performando melhor

## 2. Recomendações de Primeiras Ações
Liste de 5 a 8 ações prioritárias ordenadas por impacto, incluindo:
- Bio (reescreva a bio ideal para este perfil, com CTA claro)
- Foto de perfil (descrição do que a foto ideal deve transmitir)
- Destaques (quais categorias de Destaques criar)
- Conteúdo (quais tipos de post priorizar nas primeiras 4 semanas)
- Frequência recomendada

## 3. Plano de Conteúdo para as Primeiras 2 Semanas
Sugira 6 posts específicos para começar — com tema, formato e gancho — que ataquem os gaps identificados e gerem resultado rápido.

## 4. Bio Sugerida
Escreva a nova bio do Instagram (máximo 150 caracteres), com emojis se adequado ao tom de voz, incluindo CTA.

Seja direto e específico. Cada recomendação deve ter uma justificativa baseada nos dados.`;
}

function formatAnalysisNote(client: Client, profile: ProfileData, analysisContent: string): string {
  const now = new Date().toLocaleDateString("pt-BR");
  return [
    `# Análise de Perfil — @${profile.username}`,
    ``,
    `**Cliente:** ${client.brandName}`,
    `**Analisado em:** ${now}`,
    `**Período analisado:** últimos 30 dias`,
    ``,
    `## Métricas Capturadas`,
    `| Métrica | Valor |`,
    `|---|---|`,
    `| Posts no período | ${profile.postCount} |`,
    `| Frequência | ${profile.postingFrequencyPerWeek}x/semana |`,
    `| Média de likes | ${profile.avgLikes} |`,
    `| Média de comentários | ${profile.avgComments} |`,
    `| Média de views | ${profile.avgViews} |`,
    ``,
    `---`,
    ``,
    analysisContent,
  ].join("\n");
}

export async function analyzeClientProfile(client: Client): Promise<void> {
  if (!client.instagramHandle) {
    console.log(`⚠️ ${client.name} não tem Instagram configurado — pulando análise de perfil`);
    return;
  }

  console.log(`📊 Analisando perfil @${client.instagramHandle}...`);

  let posts: InstagramPost[] = [];
  try {
    posts = await scrapeRecentPosts(client.instagramHandle, 50, 30);
    console.log(`✅ ${posts.length} posts capturados de @${client.instagramHandle}`);
  } catch (err) {
    console.warn(`⚠️ Falha ao scraper @${client.instagramHandle}:`, (err as Error).message);
    console.log(`📝 Gerando análise sem dados de scraping...`);
  }

  const profile = analyzeProfileData(posts);
  profile.username = client.instagramHandle;

  const prompt = buildAnalysisPrompt(client, profile);
  const analysisContent = await callClaude(prompt, 4000);

  const note = formatAnalysisNote(client, profile, analysisContent);
  writeNote(client.id, "analise-perfil.md", note);

  console.log(`✅ Análise de perfil salva: ${client.id}/analise-perfil.md`);
}
