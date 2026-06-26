import { InstagramPost } from "@clique-boost/shared";
export type { InstagramPost };

function getToken(): string {
  const token = process.env.APIFY_API_TOKEN;
  if (!token) throw new Error("APIFY_API_TOKEN not set");
  return token;
}

export async function scrapeRecentPosts(
  username: string,
  maxPosts = 50,
  nDays = 30
): Promise<InstagramPost[]> {
  const token = getToken();
  const sinceDate = new Date(Date.now() - nDays * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const response = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addParentData: false,
        directUrls: [`https://www.instagram.com/${username}/`],
        onlyPostsNewerThan: sinceDate,
        resultsLimit: maxPosts,
        resultsType: "posts",
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apify error ${response.status}: ${text}`);
  }

  return response.json() as Promise<InstagramPost[]>;
}

const NICHE_HASHTAGS: Record<string, string[]> = {
  "life-insurance": ["segurodevida", "planejamentofinanceiro", "proteçãofamiliar", "lifeinsurance", "educacaofinanceira"],
  "real-estate": ["corretordeimoveis", "mercadoimobiliario", "imoveissp", "comprarimavel", "investimentoimobiliario"],
  "general": ["marketingdigital", "empreendedorismo", "marketingbrasil", "negociosonline", "conteudodigital"],
};

export async function scrapeByHashtag(
  hashtag: string,
  maxPosts = 30
): Promise<InstagramPost[]> {
  const token = getToken();

  const response = await fetch(
    `https://api.apify.com/v2/acts/apify~instagram-hashtag-scraper/run-sync-get-dataset-items?token=${token}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hashtags: [hashtag],
        resultsLimit: maxPosts,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Apify hashtag error ${response.status}: ${text}`);
  }

  return response.json() as Promise<InstagramPost[]>;
}

export async function getViralPostsByNiche(
  niche: string,
  topK = 10
): Promise<InstagramPost[]> {
  const hashtags = NICHE_HASHTAGS[niche] ?? NICHE_HASHTAGS["general"];
  const allPosts: InstagramPost[] = [];

  for (const tag of hashtags.slice(0, 2)) {
    try {
      const posts = await scrapeByHashtag(tag, 20);
      allPosts.push(...posts);
    } catch (err) {
      console.warn(`Falha ao scraper hashtag #${tag}:`, err);
    }
  }

  return allPosts
    .sort((a, b) => (b.likesCount + (b.videoPlayCount ?? 0)) - (a.likesCount + (a.videoPlayCount ?? 0)))
    .slice(0, topK);
}

export async function getViralPosts(
  usernames: string[],
  nDays = 30,
  topK = 5
): Promise<InstagramPost[]> {
  const allPosts: InstagramPost[] = [];

  for (const username of usernames) {
    try {
      const posts = await scrapeRecentPosts(username, 30, nDays);
      allPosts.push(...posts);
    } catch (err) {
      console.warn(`Falha ao scraper @${username}:`, err);
    }
  }

  return allPosts
    .sort((a, b) => (b.likesCount + (b.videoPlayCount ?? 0)) - (a.likesCount + (a.videoPlayCount ?? 0)))
    .slice(0, topK);
}
