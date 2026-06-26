"use client";

import { use, useEffect, useState, useRef } from "react";
import { RefreshCw, ExternalLink, Play, Heart, MessageCircle, Eye, Users, Plus, X, Link as LinkIcon, Lightbulb, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

interface CompetitorPost {
  id: string;
  username: string;
  caption: string;
  type: string;
  url: string;
  displayUrl: string;
  timestamp: string;
  likesCount: number;
  commentsCount: number;
  videoViewCount?: number;
  hashtags: string[];
  analysis?: string;
}

interface FeedData {
  posts: CompetitorPost[];
  scrapedAt: string | null;
  competitors: string[];
}

function proxyImg(url: string) {
  if (!url) return "";
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}

function PostCard({ post, clientId, onAnalyzed }: {
  post: CompetitorPost;
  clientId: string;
  onAnalyzed: (postId: string, analysis: string) => void;
}) {
  const isVideo = post.type === "Video" || post.type === "Reel";
  const engagement = post.likesCount + post.commentsCount;
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const timeAgo = (() => {
    const diff = Date.now() - new Date(post.timestamp).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "hoje";
    if (days === 1) return "ontem";
    return `${days}d atrás`;
  })();

  const requestAnalysis = async () => {
    if (post.analysis) { setShowAnalysis(!showAnalysis); return; }
    setAnalyzing(true);
    setShowAnalysis(true);
    setAnalyzeError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/competitors/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAnalyzeError(json.error ?? "Erro ao analisar");
        return;
      }
      if (json.analyzed > 0) {
        onAnalyzed(post.id, ""); // triggers reload — post.analysis will be populated
      } else {
        setAnalyzeError("Não foi possível gerar a análise. Verifique a ANTHROPIC_API_KEY.");
      }
    } catch {
      setAnalyzeError("Erro de conexão ao gerar análise.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden hover:border-[#8b5cf6] hover:shadow-sm transition-all group flex flex-col">
      {/* Thumbnail */}
      <div className="relative aspect-square bg-[#f5f5f5] overflow-hidden shrink-0">
        {post.displayUrl ? (
          <img
            src={proxyImg(post.displayUrl)}
            alt={post.caption.slice(0, 60)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#ddd]">
            <Users size={32} />
          </div>
        )}

        {/* Type badge */}
        <div className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white ${
          isVideo ? "bg-[#e1306c]" : post.type === "Sidecar" ? "bg-[#f59e0b]" : "bg-[#333]"
        }`}>
          {isVideo ? "REEL" : post.type === "Sidecar" ? "CARROSSEL" : "FOTO"}
        </div>

        {/* IA badge if analyzed */}
        {post.analysis && (
          <div className="absolute top-2 right-8 bg-[#8b5cf6] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
            <Sparkles size={8} /> IA
          </div>
        )}

        {/* External link */}
        <a
          href={post.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink size={10} className="text-white" />
        </a>

        {/* Video play overlay */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-10 h-10 bg-black/40 rounded-full flex items-center justify-center">
              <Play size={18} className="text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <a href={`https://instagram.com/${post.username}`} target="_blank" rel="noopener noreferrer"
            className="text-xs font-semibold text-[#8b5cf6] hover:underline">
            @{post.username}
          </a>
          <span className="text-[10px] text-[#aaa]">{timeAgo}</span>
        </div>

        {post.caption && (
          <p className="text-xs text-[#555] line-clamp-2 mb-2 leading-relaxed">{post.caption}</p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-2 text-[10px] text-[#888] mb-2.5">
          <span className="flex items-center gap-0.5"><Heart size={10} className="text-[#e1306c]" /> {post.likesCount.toLocaleString("pt-BR")}</span>
          <span className="flex items-center gap-0.5"><MessageCircle size={10} /> {post.commentsCount.toLocaleString("pt-BR")}</span>
          {post.videoViewCount && (
            <span className="flex items-center gap-0.5"><Eye size={10} /> {post.videoViewCount.toLocaleString("pt-BR")}</span>
          )}
          <span className="ml-auto font-semibold text-[#333]">{engagement.toLocaleString("pt-BR")} eng.</span>
        </div>

        {/* "Por que se inspirar" button */}
        <button
          onClick={requestAnalysis}
          className={`w-full flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border mt-auto ${
            post.analysis
              ? "bg-[#f5f0ff] border-[#ddd6fe] text-[#7c3aed]"
              : "bg-[#fafafa] border-[#e5e5e5] text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Lightbulb size={11} className={post.analysis ? "text-[#8b5cf6]" : ""} />
            {analyzing ? "Analisando…" : post.analysis ? "Por que se inspirar" : "Analisar com IA"}
          </span>
          {post.analysis && (showAnalysis ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
        </button>

        {/* Analysis panel */}
        {showAnalysis && (
          <div className="mt-2 rounded-lg bg-[#f5f0ff] border border-[#ddd6fe] p-3">
            {analyzing ? (
              <div className="flex items-center gap-2 text-xs text-[#8b5cf6]">
                <div className="w-3 h-3 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
                Gerando análise com IA…
              </div>
            ) : analyzeError ? (
              <div className="text-xs text-red-500">{analyzeError}</div>
            ) : post.analysis ? (
              <div className="text-xs text-[#333] leading-relaxed whitespace-pre-wrap">{post.analysis}</div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CompetitorsPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const [data, setData] = useState<FeedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [addInput, setAddInput] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/clients/${clientId}/competitors`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [clientId]);

  const addCompetitor = async () => {
    if (!addInput.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      const res = await fetch(`/api/clients/${clientId}/competitors`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", username: addInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setAddError(json.error ?? "Erro ao adicionar"); return; }
      setAddInput("");
      load();
    } finally {
      setAdding(false);
    }
  };

  const removeCompetitor = async (username: string) => {
    await fetch(`/api/clients/${clientId}/competitors`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", username }),
    });
    load();
  };

  const scrape = async () => {
    setScraping(true);
    try {
      await fetch(`/api/clients/${clientId}/competitors`, { method: "POST" });
      load();
    } finally {
      setScraping(false);
    }
  };

  const posts = data?.posts ?? [];
  const competitors = data?.competitors ?? [];

  const filtered = posts
    .filter((p) => filterUser === "all" || p.username === filterUser)
    .filter((p) => {
      if (filterType === "all") return true;
      if (filterType === "video") return p.type === "Video";
      if (filterType === "carousel") return p.type === "Sidecar";
      if (filterType === "image") return p.type === "Image";
      return true;
    });

  const scrapedLabel = data?.scrapedAt
    ? `Atualizado ${new Date(data.scrapedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}`
    : null;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-[#111]">Feed de Concorrentes</h2>
          {scrapedLabel && <p className="text-xs text-[#888] mt-0.5">{scrapedLabel}</p>}
        </div>
        <button
          onClick={scrape}
          disabled={scraping || !competitors.length}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#8b5cf6] text-white text-xs rounded-lg hover:bg-[#7c3aed] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={scraping ? "animate-spin" : ""} />
          {scraping ? "Raspando…" : "Atualizar feed"}
        </button>
      </div>

      {/* Add competitor panel */}
      <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 mb-5">
        <p className="text-xs font-semibold text-[#333] mb-3">Concorrentes monitorados</p>

        {/* Current list */}
        <div className="flex flex-wrap gap-2 mb-3">
          {competitors.map((u) => (
            <div key={u} className="flex items-center gap-1.5 bg-[#f5f5f5] border border-[#e5e5e5] rounded-full px-2.5 py-1">
              <a
                href={`https://instagram.com/${u}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-[#8b5cf6] hover:underline"
              >
                @{u}
              </a>
              <button
                onClick={() => removeCompetitor(u)}
                className="text-[#bbb] hover:text-[#e11d48] transition-colors"
                title="Remover"
              >
                <X size={11} />
              </button>
            </div>
          ))}
          {competitors.length === 0 && (
            <p className="text-xs text-[#aaa]">Nenhum concorrente adicionado ainda.</p>
          )}
        </div>

        {/* Add input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#aaa]" />
            <input
              ref={inputRef}
              value={addInput}
              onChange={(e) => { setAddInput(e.target.value); setAddError(null); }}
              onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
              placeholder="@username ou link do perfil do Instagram"
              className="w-full text-sm border border-[#e5e5e5] rounded-lg pl-8 pr-3 py-2 focus:outline-none focus:border-[#8b5cf6] bg-white"
            />
          </div>
          <button
            onClick={addCompetitor}
            disabled={adding || !addInput.trim()}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#111] text-white text-xs rounded-lg hover:bg-[#333] transition-colors disabled:opacity-40"
          >
            <Plus size={13} />
            {adding ? "Adicionando…" : "Adicionar"}
          </button>
        </div>
        {addError && <p className="text-xs text-[#e11d48] mt-1.5">{addError}</p>}
        <p className="text-[10px] text-[#bbb] mt-1.5">
          Salvo automaticamente no Obsidian em <code>concorrentes.md</code>
        </p>
      </div>

      {/* Prompt to scrape when competitors exist but no posts yet */}
      {competitors.length > 0 && !posts.length && !loading && (
        <div className="bg-white rounded-xl border border-[#e5e5e5] p-8 text-center mb-5">
          <p className="text-sm font-semibold text-[#333] mb-1">Feed ainda não raspado</p>
          <p className="text-xs text-[#888] mb-4">
            Clique em "Atualizar feed" para buscar os posts dos concorrentes agora.
          </p>
          <button
            onClick={scrape}
            disabled={scraping}
            className="flex items-center gap-2 px-4 py-2 bg-[#8b5cf6] text-white text-sm rounded-lg hover:bg-[#7c3aed] transition-colors mx-auto"
          >
            <RefreshCw size={13} className={scraping ? "animate-spin" : ""} />
            {scraping ? "Raspando Instagram…" : "Raspar agora"}
          </button>
        </div>
      )}

      {/* Filters */}
      {posts.length > 0 && (
        <>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            {/* By account */}
            <div className="flex gap-1 flex-wrap">
              <button
                onClick={() => setFilterUser("all")}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${filterUser === "all" ? "bg-[#8b5cf6] text-white" : "bg-[#f5f5f5] text-[#555] hover:bg-[#ebe8f5]"}`}
              >
                Todos ({posts.length})
              </button>
              {competitors.map((u) => (
                <button
                  key={u}
                  onClick={() => setFilterUser(u)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${filterUser === u ? "bg-[#8b5cf6] text-white" : "bg-[#f5f5f5] text-[#555] hover:bg-[#ebe8f5]"}`}
                >
                  @{u} ({posts.filter((p) => p.username === u).length})
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-[#e5e5e5]" />

            {/* By type */}
            {[
              { key: "all", label: "Todos os formatos" },
              { key: "video", label: "Reels" },
              { key: "carousel", label: "Carrossel" },
              { key: "image", label: "Foto" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterType(key)}
                className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${filterType === key ? "bg-[#111] text-white" : "bg-white border border-[#e5e5e5] text-[#555] hover:border-[#333]"}`}
              >
                {label}
              </button>
            ))}

            <span className="ml-auto text-xs text-[#bbb]">{filtered.length} posts</span>
          </div>

          {/* Analisar top posts */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={async () => {
                await fetch(`/api/clients/${clientId}/competitors/analyze`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ all: true }),
                });
                load();
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#f5f0ff] border border-[#ddd6fe] text-[#7c3aed] rounded-lg hover:bg-[#ede9fe] transition-colors"
            >
              <Sparkles size={12} />
              Analisar top 5 posts com IA
            </button>
            <span className="text-xs text-[#bbb]">
              {filtered.filter((p) => p.analysis).length}/{filtered.length} analisados
            </span>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                clientId={clientId}
                onAnalyzed={() => load()}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
