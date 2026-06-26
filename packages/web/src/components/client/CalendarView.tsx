"use client";

import { useState, useCallback } from "react";
import { ExternalLink, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";

const FORMAT_COLORS: Record<string, string> = {
  Reel: "#8b5cf6",
  Carrossel: "#3b82f6",
  Carousel: "#3b82f6",
  Stories: "#10b981",
  Post: "#f59e0b",
  Imagem: "#6b7280",
  Image: "#6b7280",
  Vídeo: "#ef4444",
  Video: "#ef4444",
  Foto: "#f59e0b",
};

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#e1306c",
  LinkedIn: "#0077b5",
  TikTok: "#000000",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; next: string }> = {
  rascunho:  { label: "Rascunho",  color: "#6b7280", bg: "#f3f4f6", next: "pendente" },
  pendente:  { label: "Pendente",  color: "#d97706", bg: "#fef3c7", next: "aprovado" },
  aprovado:  { label: "Aprovado",  color: "#059669", bg: "#d1fae5", next: "publicado" },
  publicado: { label: "Publicado", color: "#7c3aed", bg: "#ede9fe", next: "rascunho" },
};

export interface Post {
  id: string;
  day: number;
  week?: number;
  weekday?: string;
  theme: string;
  format: string;
  platform?: string;
  hook?: string;
  caption?: string;
  hashtags?: string[];
  objective?: string;
  cta?: string;
  pillar?: string;
  notes?: string;
  trelloUrl?: string;
  listName?: string;
  status?: string;
}

// Parser de markdown legado (para Obsidian)
function parsePosts(markdown: string): Post[] {
  const posts: Post[] = [];
  const lines = markdown.split("\n");
  let current: Partial<Post> | null = null;
  let idx = 0;

  for (const line of lines) {
    const dateMatch = line.match(/##\s+\d{4}-\d{2}-(\d{2})/);
    if (dateMatch) {
      if (current?.day) posts.push(current as Post);
      current = { day: parseInt(dateMatch[1]), format: "Reel", id: `md-${idx++}` };
      continue;
    }
    if (!current) continue;
    if (line.match(/\*?\*?tema[:\s]/i)) current.theme = line.replace(/.*tema[:\s]*/i, "").replace(/\*\*/g, "").trim();
    if (line.match(/\*?\*?formato[:\s]/i)) current.format = line.replace(/.*formato[:\s]*/i, "").replace(/\*\*/g, "").trim() || "Reel";
    if (line.match(/\*?\*?gancho[:\s]/i)) current.hook = line.replace(/.*gancho[:\s]*/i, "").replace(/\*\*/g, "").trim();
    if (line.match(/\*?\*?objetivo[:\s]/i)) current.objective = line.replace(/.*objetivo[:\s]*/i, "").replace(/\*\*/g, "").trim();
    if (line.match(/\*?\*?notas[:\s]/i)) current.notes = line.replace(/.*notas[:\s]*/i, "").replace(/\*\*/g, "").trim();
  }
  if (current?.day) posts.push(current as Post);
  return posts;
}

function StatusBadge({
  status,
  postId,
  clientId,
  onUpdated,
}: {
  status: string;
  postId: string;
  clientId: string;
  onUpdated: (postId: string, newStatus: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.rascunho;

  const advance = async () => {
    setLoading(true);
    try {
      await fetch(`/api/clients/${clientId}/calendar/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, status: cfg.next }),
      });
      onUpdated(postId, cfg.next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={advance}
      disabled={loading}
      title={`Avançar para: ${STATUS_CONFIG[cfg.next]?.label}`}
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full transition-opacity hover:opacity-70 disabled:opacity-40 cursor-pointer"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      {cfg.label}
    </button>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-[#ccc] hover:text-[#555] transition-colors"
      title="Copiar"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  );
}

function PostListItem({
  post,
  clientId,
  onStatusUpdated,
}: {
  post: Post;
  clientId: string;
  onStatusUpdated: (postId: string, newStatus: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const status = post.status ?? "rascunho";

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Day badge */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: FORMAT_COLORS[post.format] ?? "#8b5cf6" }}
        >
          {post.day}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {post.weekday && (
              <span className="text-[10px] text-[#aaa] font-medium">{post.weekday}</span>
            )}
            {post.platform && (
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ background: PLATFORM_COLORS[post.platform] ?? "#888" }}
              >
                {post.platform}
              </span>
            )}
            {post.pillar && (
              <span className="text-[9px] text-[#aaa] truncate max-w-[120px]">{post.pillar}</span>
            )}
          </div>
          <h4 className="text-sm font-semibold text-[#111] leading-snug truncate">{post.theme}</h4>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge
            status={status}
            postId={post.id}
            clientId={clientId}
            onUpdated={onStatusUpdated}
          />
          <span
            className="text-[10px] font-medium px-2 py-0.5 rounded text-white hidden sm:inline"
            style={{ background: FORMAT_COLORS[post.format] ?? "#6b7280" }}
          >
            {post.format}
          </span>
          {post.trelloUrl && (
            <a
              href={post.trelloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#ccc] hover:text-[#0052cc] transition-colors"
              title="Ver no Trello"
            >
              <ExternalLink size={13} />
            </a>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[#ccc] hover:text-[#555] transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-[#f0f0f0] px-4 py-3 flex flex-col gap-2.5 bg-[#fafafa]">
          {post.hook && (
            <div>
              <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-0.5">Gancho</p>
              <div className="flex items-start gap-2">
                <p className="text-xs text-[#333] flex-1">"{post.hook}"</p>
                <CopyButton text={post.hook} />
              </div>
            </div>
          )}

          {post.caption && (
            <div>
              <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-0.5">Legenda</p>
              <div className="flex items-start gap-2">
                <p className="text-xs text-[#333] flex-1 whitespace-pre-wrap leading-relaxed">{post.caption}</p>
                <CopyButton text={post.caption} />
              </div>
            </div>
          )}

          {post.hashtags && post.hashtags.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-0.5">Hashtags</p>
              <div className="flex items-start gap-2">
                <p className="text-xs text-[#8b5cf6] flex-1">
                  {post.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")}
                </p>
                <CopyButton text={post.hashtags.map((h) => `#${h.replace(/^#/, "")}`).join(" ")} />
              </div>
            </div>
          )}

          {post.cta && (
            <div>
              <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-0.5">CTA</p>
              <p className="text-xs text-[#333]">{post.cta}</p>
            </div>
          )}

          {post.objective && (
            <div>
              <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-0.5">Objetivo</p>
              <p className="text-xs text-[#555]">{post.objective}</p>
            </div>
          )}

          {post.notes && (
            <div>
              <p className="text-[10px] font-semibold text-[#aaa] uppercase tracking-wide mb-0.5">Notas</p>
              <p className="text-xs text-[#555]">{post.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function CalendarView({
  markdown,
  posts: postsProp,
  month,
  clientId,
}: {
  markdown?: string;
  posts?: Post[];
  month: string;
  clientId: string;
}) {
  const [view, setView] = useState<"grid" | "list">("list");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Estado local para status dos posts (sem reload)
  const [statusOverride, setStatusOverride] = useState<Record<string, string>>({});

  const posts: Post[] = postsProp ?? (markdown ? parsePosts(markdown) : []);

  const handleStatusUpdated = useCallback((postId: string, newStatus: string) => {
    setStatusOverride((prev) => ({ ...prev, [postId]: newStatus }));
  }, []);

  // Aplica overrides de status
  const postsWithStatus = posts.map((p) => ({
    ...p,
    status: statusOverride[p.id] ?? p.status ?? "rascunho",
  }));

  const [year, monthNum] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNum - 1, 1).getDay();
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const postsByDay = new Map<number, Post[]>();
  for (const p of postsWithStatus) {
    if (!postsByDay.has(p.day)) postsByDay.set(p.day, []);
    postsByDay.get(p.day)!.push(p);
  }

  const selectedPosts = selectedDay ? (postsByDay.get(selectedDay) ?? []) : [];

  // Contagem de status para o sumário
  const statusCounts = postsWithStatus.reduce<Record<string, number>>((acc, p) => {
    const s = p.status ?? "rascunho";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-[#111]">
            {new Date(year, monthNum - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" })}
            <span className="ml-2 text-xs font-normal text-[#888]">{postsWithStatus.length} posts</span>
          </h3>
          {/* Status summary */}
          <div className="flex gap-1.5">
            {Object.entries(statusCounts).map(([s, count]) => {
              const cfg = STATUS_CONFIG[s];
              if (!cfg) return null;
              return (
                <span
                  key={s}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ color: cfg.color, background: cfg.bg }}
                >
                  {count} {cfg.label.toLowerCase()}
                </span>
              );
            })}
          </div>
        </div>
        <div className="flex gap-1">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                view === v ? "bg-[#8b5cf6] text-white" : "bg-[#f5f5f5] text-[#888]"
              }`}
            >
              {v === "grid" ? "Grade" : "Lista"}
            </button>
          ))}
        </div>
      </div>

      {view === "grid" ? (
        <div className="flex gap-4">
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 shrink-0">
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                <div key={d} className="text-[10px] text-[#888] font-medium w-8 py-1">{d}</div>
              ))}
              {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map((_, i) => <div key={`e${i}`} className="w-8 h-8" />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dayPosts = postsByDay.get(day) ?? [];
                const hasPosts = dayPosts.length > 0;
                const primaryColor = hasPosts ? (FORMAT_COLORS[dayPosts[0].format] ?? "#8b5cf6") : null;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium flex flex-col items-center justify-center transition-colors relative ${
                      selectedDay === day ? "ring-2 ring-[#8b5cf6]" : ""
                    } ${hasPosts ? "text-white" : "text-[#333] hover:bg-[#f5f5f5]"}`}
                    style={primaryColor ? { background: primaryColor } : {}}
                  >
                    {day}
                    {dayPosts.length > 1 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#111] text-white text-[8px] rounded-full flex items-center justify-center">
                        {dayPosts.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-xl border border-[#e5e5e5] p-4 min-h-[200px]">
            {selectedPosts.length > 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-[#888]">Dia {selectedDay} · {selectedPosts.length} post{selectedPosts.length > 1 ? "s" : ""}</p>
                {selectedPosts.map((post) => (
                  <PostListItem
                    key={post.id}
                    post={post}
                    clientId={clientId}
                    onStatusUpdated={handleStatusUpdated}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#888]">Selecione um dia com post no calendário.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {postsWithStatus.length === 0 && (
            <p className="text-sm text-[#888] py-4">Nenhum post no calendário deste mês.</p>
          )}
          {postsWithStatus.map((post, i) => (
            <PostListItem
              key={`${post.id}-${i}`}
              post={post}
              clientId={clientId}
              onStatusUpdated={handleStatusUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}
