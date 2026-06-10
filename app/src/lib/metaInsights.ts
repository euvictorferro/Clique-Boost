import { Client, MetaDemographics, MetaInsights, MetaPost } from "./types";
import { upsertClient } from "./clients";

const GRAPH = "https://graph.facebook.com/v19.0";

async function graphFetch(path: string, token: string): Promise<unknown> {
  const separator = path.includes("?") ? "&" : "?";
  const res = await fetch(`${GRAPH}${path}${separator}access_token=${token}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Meta Graph API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function getIgAccountId(token: string, instagramHandle?: string): Promise<{ igId: string; pageToken: string }> {
  const pages = await graphFetch(`/me/accounts?fields=id,name,access_token,instagram_business_account`, token) as {
    data?: Array<{ id: string; name: string; access_token: string; instagram_business_account?: { id: string } }>;
  };

  if (!pages.data?.length) throw new Error("Nenhuma Página do Facebook encontrada.");

  const candidates: Array<{ igId: string; pageToken: string; username: string }> = [];

  for (const page of pages.data) {
    const igId = page.instagram_business_account?.id;
    if (!igId) continue;

    if (instagramHandle) {
      const ig = await graphFetch(`/${igId}?fields=username`, page.access_token) as { username?: string };
      const handle = instagramHandle.replace(/^@/, "").toLowerCase();
      if (ig.username?.toLowerCase() === handle) {
        return { igId, pageToken: page.access_token };
      }
      candidates.push({ igId, pageToken: page.access_token, username: ig.username ?? "" });
    } else {
      return { igId, pageToken: page.access_token };
    }
  }

  if (candidates.length > 0) {
    console.warn(`⚠️  Instagram @${instagramHandle} não encontrado. Contas disponíveis: ${candidates.map(c => "@" + c.username).join(", ")}`);
    console.warn(`   Usando @${candidates[0].username}`);
    return candidates[0];
  }

  throw new Error("Nenhuma conta Instagram Business encontrada.");
}

async function fetchDemographics(igId: string, pageToken: string): Promise<MetaDemographics | undefined> {
  try {
    // Age + gender breakdown
    const ageGenderData = await graphFetch(
      `/${igId}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=age,gender`,
      pageToken
    ) as { data?: Array<{ name: string; total_value?: { breakdowns: Array<{ dimension_keys: string[]; results: Array<{ dimension_values: string[]; value: number }> }> } }> };

    // City breakdown
    const cityData = await graphFetch(
      `/${igId}/insights?metric=follower_demographics&period=lifetime&metric_type=total_value&breakdown=city`,
      pageToken
    ) as { data?: Array<{ name: string; total_value?: { breakdowns: Array<{ dimension_keys: string[]; results: Array<{ dimension_values: string[]; value: number }> }> } }> };

    const ageGenderBreakdown = ageGenderData.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? [];
    const cityBreakdown = cityData.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? [];

    // Aggregate totals
    const totalAgeGender = ageGenderBreakdown.reduce((s, r) => s + r.value, 0) || 1;
    const totalCity = cityBreakdown.reduce((s, r) => s + r.value, 0) || 1;

    // Age ranges (merge across genders)
    const ageMap = new Map<string, number>();
    let maleCount = 0;
    let femaleCount = 0;
    let unknownCount = 0;

    for (const r of ageGenderBreakdown) {
      const [age, gender] = r.dimension_values;
      ageMap.set(age, (ageMap.get(age) ?? 0) + r.value);
      const g = (gender ?? "").toLowerCase();
      if (g === "m" || g === "male") maleCount += r.value;
      else if (g === "f" || g === "female") femaleCount += r.value;
      else unknownCount += r.value;
    }

    const ageRanges = Array.from(ageMap.entries())
      .map(([range, count]) => ({ range, percentage: Math.round((count / totalAgeGender) * 100) }))
      .sort((a, b) => b.percentage - a.percentage);

    const topCities = cityBreakdown
      .map(r => ({ city: r.dimension_values[0], percentage: Math.round((r.value / totalCity) * 100) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);

    const genderSplit = {
      male: Math.round((maleCount / totalAgeGender) * 100),
      female: Math.round((femaleCount / totalAgeGender) * 100),
      unknown: Math.round((unknownCount / totalAgeGender) * 100),
    };

    return { ageRanges, topCities, genderSplit };
  } catch (err) {
    console.warn("⚠️  Demographics não disponíveis:", (err as Error).message);
    return undefined;
  }
}

async function fetchFollowerGrowth(igId: string, pageToken: string, since: number, until: number): Promise<number> {
  try {
    const data = await graphFetch(
      `/${igId}/insights?metric=follows_and_unfollows&period=day&since=${since}&until=${until}&metric_type=total_value`,
      pageToken
    ) as { data?: Array<{ name: string; total_value?: { breakdowns: Array<{ results: Array<{ dimension_values: string[]; value: number }> }> } }> };

    const results = data.data?.[0]?.total_value?.breakdowns?.[0]?.results ?? [];
    let follows = 0;
    let unfollows = 0;
    for (const r of results) {
      const action = (r.dimension_values[0] ?? "").toLowerCase();
      if (action === "follow") follows += r.value;
      else if (action === "unfollow") unfollows += r.value;
    }
    return follows - unfollows;
  } catch (err) {
    console.warn("⚠️  Follower growth não disponível:", (err as Error).message);
    return 0;
  }
}

export async function fetchClientInsights(client: Client, days = 30): Promise<MetaInsights> {
  const token = client.metaAccessToken;
  if (!token) throw new Error(`Cliente ${client.name} não tem metaAccessToken configurado`);

  console.log(`📊 Buscando métricas Meta para ${client.name} (${days}d)...`);

  const { igId, pageToken } = await getIgAccountId(token, client.instagramHandle);
  console.log(`📷 Instagram Business Account: ${igId}`);

  const since = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
  const until = Math.floor(Date.now() / 1000);

  const profile = await graphFetch(
    `/${igId}?fields=followers_count,media_count,name,username,profile_picture_url`,
    pageToken
  ) as { followers_count?: number; media_count?: number; name?: string; username?: string; profile_picture_url?: string };

  let totalReach = 0;
  let totalImpressions = 0;
  try {
    const reachData = await graphFetch(
      `/${igId}/insights?metric=reach&period=day&since=${since}&until=${until}`,
      pageToken
    ) as { data?: Array<{ name: string; values: Array<{ value: number }> }> };
    totalReach = (reachData.data?.[0]?.values ?? []).reduce((s, v) => s + (v.value ?? 0), 0);

    const viewsData = await graphFetch(
      `/${igId}/insights?metric=views&period=day&since=${since}&until=${until}&metric_type=total_value`,
      pageToken
    ) as { data?: Array<{ name: string; total_value?: { value: number } }> };
    totalImpressions = viewsData.data?.[0]?.total_value?.value ?? 0;
  } catch (err) {
    console.warn("⚠️  Insights de alcance não disponíveis:", (err as Error).message);
  }

  // Posts com saves, shares, thumbnail e caption (limit proporcional ao período)
  const mediaLimit = days <= 7 ? 10 : days <= 30 ? 20 : 50;
  const mediaData = await graphFetch(
    `/${igId}/media?fields=id,permalink,media_type,timestamp,like_count,comments_count,saved,shares,caption,media_url,thumbnail_url&limit=${mediaLimit}`,
    pageToken
  ) as { data?: Array<{
    id: string; permalink: string; media_type: string; timestamp: string;
    like_count: number; comments_count: number;
    saved?: number;
    shares?: { count: number };
    caption?: string;
    media_url?: string;
    thumbnail_url?: string;
  }> };

  // Filtra apenas posts dentro do período selecionado
  const sinceDate = new Date(since * 1000);
  const topPosts: MetaPost[] = (mediaData.data ?? [])
    .filter((p) => new Date(p.timestamp) >= sinceDate)
    .sort((a, b) => (b.like_count + b.comments_count) - (a.like_count + a.comments_count))
    .slice(0, 5)
    .map((p) => ({
      id: p.id,
      permalink: p.permalink,
      mediaType: p.media_type,
      timestamp: p.timestamp,
      likeCount: p.like_count,
      commentsCount: p.comments_count,
      saves: p.saved ?? 0,
      shares: p.shares?.count ?? 0,
      reach: 0,
      impressions: 0,
      caption: p.caption ?? "",
      thumbnailUrl: p.thumbnail_url ?? p.media_url ?? "",
    }));

  const followerCount = profile.followers_count ?? 0;
  const avgEngagement = topPosts.length > 0
    ? topPosts.reduce((s, p) => s + p.likeCount + p.commentsCount + p.saves, 0) / topPosts.length
    : 0;
  const engagementRate = followerCount > 0
    ? Number(((avgEngagement / followerCount) * 100).toFixed(2))
    : 0;

  // Dados diários de seguidores para o gráfico
  let dailyFollowers: Array<{ date: string; followers: number }> = [];
  try {
    const followerDailyData = await graphFetch(
      `/${igId}/insights?metric=follower_count&period=day&since=${since}&until=${until}`,
      pageToken
    ) as { data?: Array<{ name: string; values: Array<{ value: number; end_time: string }> }> };
    const values = followerDailyData.data?.[0]?.values ?? [];
    dailyFollowers = values.map((v) => ({
      date: new Date(v.end_time).toISOString().slice(5, 10),
      followers: v.value,
    }));
  } catch {
    // fallback: sem dados diários
  }

  // Se não conseguiu dados diários, simula crescimento linear
  if (dailyFollowers.length === 0) {
    const followerBase = followerCount;
    dailyFollowers = Array.from({ length: 30 }, (_, d) => ({
      date: new Date(since * 1000 + d * 86400000).toISOString().slice(5, 10),
      followers: followerBase,
    }));
  }

  const [followerGrowth, demographics] = await Promise.all([
    fetchFollowerGrowth(igId, pageToken, since, until),
    fetchDemographics(igId, pageToken),
  ]);

  const insights: MetaInsights = {
    clientId: client.id,
    period: `${new Date(since * 1000).toLocaleDateString("pt-BR")} – ${new Date(until * 1000).toLocaleDateString("pt-BR")}`,
    reach: totalReach,
    impressions: totalImpressions,
    engagementRate,
    followerCount,
    followerGrowth,
    topPosts,
    demographics,
    dailyFollowers,
    profilePictureUrl: profile.profile_picture_url,
    fetchedAt: new Date().toISOString(),
  };

  // Persiste foto de perfil no clients.json para a sidebar
  if (profile.profile_picture_url) {
    try {
      upsertClient({ ...client, profilePictureUrl: profile.profile_picture_url });
    } catch { /* non-critical */ }
  }

  console.log(`✅ Métricas coletadas para ${client.name} (@${profile.username}):`);
  console.log(`   Seguidores: ${followerCount} (${followerGrowth >= 0 ? "+" : ""}${followerGrowth} em ${days}d)`);
  console.log(`   Alcance 30d: ${totalReach} | Impressões: ${totalImpressions} | Engajamento: ${engagementRate}%`);
  if (demographics) {
    console.log(`   Gênero: ${demographics.genderSplit.female}% F / ${demographics.genderSplit.male}% M`);
    console.log(`   Top cidade: ${demographics.topCities[0]?.city ?? "n/a"} (${demographics.topCities[0]?.percentage ?? 0}%)`);
    console.log(`   Faixa etária principal: ${demographics.ageRanges[0]?.range ?? "n/a"} (${demographics.ageRanges[0]?.percentage ?? 0}%)`);
  }
  if (topPosts[0]) {
    console.log(`   Top post: ❤️${topPosts[0].likeCount} 💬${topPosts[0].commentsCount} 🔖${topPosts[0].saves} ↗️${topPosts[0].shares} — ${topPosts[0].permalink}`);
  }

  return insights;
}
