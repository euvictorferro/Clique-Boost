"use client";

import { useState, useEffect, use } from "react";
import { PlatformCards } from "@/components/client/PlatformCards";
import { ExportButton } from "@/components/shared/ExportButton";
import { MetricsKpis } from "@/components/client/MetricsKpis";
import { GrowthToggleChart } from "@/components/client/GrowthToggleChart";
import { TopPostsList } from "@/components/client/TopPostsList";
import { Demographics } from "@/components/client/Demographics";

type Period = "7" | "30";

const PERIOD_LABELS: Record<Period, string> = {
  "7": "7 dias",
  "30": "30 dias",
};

export default function MetricsPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const [platform, setPlatform] = useState("instagram");
  const [period, setPeriod] = useState<Period>("30");
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/metrics/${clientId}?period=${period}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setInsights(data);
      })
      .catch(() => setError("Erro ao carregar métricas"))
      .finally(() => setLoading(false));
  }, [clientId, period]);

  const followers = insights?.followerCount ?? 0;
  const followerDelta = insights?.followerGrowth ?? 0;
  const reach = insights?.reach ?? 0;
  const impressions = insights?.impressions ?? 0;
  const engagementRate = insights?.engagementRate ?? 0;

  const topPosts = (insights?.topPosts ?? []).map((p: any) => ({
    id: p.id,
    mediaType: p.mediaType ?? "IMAGE",
    caption: p.caption ?? "",
    likes: p.likeCount ?? 0,
    comments: p.commentsCount ?? 0,
    saves: p.saves ?? 0,
    permalink: p.permalink,
    thumbnailUrl: p.thumbnailUrl ?? "",
  }));

  const demographics = insights?.demographics;

  const growthData: Array<{ date: string; followers: number }> =
    insights?.dailyFollowers?.length > 0
      ? insights.dailyFollowers
      : Array.from({ length: Number(period) }, (_, d) => ({
          date: new Date(Date.now() - (Number(period) - 1 - d) * 86400000)
            .toISOString()
            .slice(5, 10),
          followers,
        }));

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-[#111]">Métricas</h2>
          {/* Filtro de período — controla TUDO na página */}
          <div className="flex gap-1">
            {(["7", "30"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  period === p
                    ? "bg-[#8b5cf6] text-white"
                    : "bg-[#f5f5f5] text-[#888] hover:text-[#111]"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>
        <ExportButton
          href={`/api/export/report/${clientId}`}
          label="Exportar Relatório"
          filename={`relatorio-${clientId}.pdf`}
        />
      </div>

      <PlatformCards selected={platform} onSelect={setPlatform} />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-[#888] py-8">
          <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
          Carregando métricas dos últimos {PERIOD_LABELS[period]}…
        </div>
      )}

      {error && !loading && (
        <div className="text-sm text-[#e11d48] bg-[#fee2e2] px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <MetricsKpis
            followers={followers}
            followerDelta={followerDelta}
            reach30d={reach}
            impressions30d={impressions}
            engagementRate={engagementRate}
            periodLabel={PERIOD_LABELS[period]}
          />
          <GrowthToggleChart data={growthData} />
          <TopPostsList posts={topPosts} periodLabel={PERIOD_LABELS[period]} />
          {demographics && <Demographics demographics={demographics} />}
        </>
      )}
    </div>
  );
}
