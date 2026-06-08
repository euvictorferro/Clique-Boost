"use client";

import { useState, useEffect, use } from "react";
import { PlatformCards } from "@/components/client/PlatformCards";
import { MetricsKpis } from "@/components/client/MetricsKpis";
import { GrowthToggleChart } from "@/components/client/GrowthToggleChart";
import { TopPostsList } from "@/components/client/TopPostsList";
import { Demographics } from "@/components/client/Demographics";

const MOCK_DEMOGRAPHICS = {
  ageRanges: [
    { range: "18-24", percentage: 22 },
    { range: "25-34", percentage: 38 },
    { range: "35-44", percentage: 24 },
    { range: "45-54", percentage: 11 },
    { range: "55+", percentage: 5 },
  ],
  topCities: [
    { city: "São Paulo", percentage: 34 },
    { city: "Rio de Janeiro", percentage: 18 },
    { city: "Curitiba", percentage: 12 },
    { city: "Belo Horizonte", percentage: 9 },
    { city: "Florianópolis", percentage: 7 },
  ],
  genderSplit: { female: 62, male: 35, unknown: 3 },
};

const MOCK_GROWTH = Array.from({ length: 30 }, (_, d) => ({
  date: new Date(Date.now() - (29 - d) * 86400000).toISOString().slice(5, 10),
  followers: 1600 + Math.round(d * 2.7),
}));

export default function MetricsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const [platform, setPlatform] = useState("instagram");
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/metrics/${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setInsights(data);
      })
      .finally(() => setLoading(false));
  }, [clientId]);

  const followers = insights?.followers ?? 1681;
  const followerDelta = insights?.followerGrowth ?? 42;
  const reach30d = insights?.reach ?? 3200;
  const impressions30d = insights?.impressions ?? 8400;
  const engagementRate = insights?.engagementRate ?? 4.2;
  const topPosts = insights?.topPosts ?? [];
  const demographics = insights?.demographics ?? MOCK_DEMOGRAPHICS;
  const growthData = MOCK_GROWTH;

  return (
    <div className="p-6">
      <PlatformCards selected={platform} onSelect={setPlatform} />

      {loading ? (
        <div className="text-sm text-[#888] py-4">Carregando métricas…</div>
      ) : (
        <>
          <MetricsKpis
            followers={followers}
            followerDelta={followerDelta}
            reach30d={reach30d}
            impressions30d={impressions30d}
            engagementRate={engagementRate}
          />
          <GrowthToggleChart data30d={growthData} />
          <TopPostsList posts={topPosts} />
          <Demographics demographics={demographics} />
        </>
      )}
    </div>
  );
}
