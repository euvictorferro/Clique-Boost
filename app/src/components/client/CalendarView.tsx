"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

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
};

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#e1306c",
  LinkedIn: "#0077b5",
};

interface Post {
  id: string;
  day: number;
  week?: number;
  theme: string;
  format: string;
  platform?: string;
  hook?: string;
  objective?: string;
  notes?: string;
  trelloUrl?: string;
  listName?: string;
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

export function CalendarView({
  markdown,
  posts: postsProp,
  month,
}: {
  markdown?: string;
  posts?: Post[];
  month: string;
}) {
  const [view, setView] = useState<"grid" | "list">("list");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Aceita posts diretos (Trello) ou parseia markdown (Obsidian)
  const posts: Post[] = postsProp ?? (markdown ? parsePosts(markdown) : []);

  const [year, monthNum] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNum - 1, 1).getDay();
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  // Agrupa posts por dia
  const postsByDay = new Map<number, Post[]>();
  for (const p of posts) {
    if (!postsByDay.has(p.day)) postsByDay.set(p.day, []);
    postsByDay.get(p.day)!.push(p);
  }

  const selectedPosts = selectedDay ? (postsByDay.get(selectedDay) ?? []) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#111]">
          {new Date(year, monthNum - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" })}
          <span className="ml-2 text-xs font-normal text-[#888]">{posts.length} posts</span>
        </h3>
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
          {/* Grade do calendário */}
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 shrink-0">
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((d) => (
                <div key={d} className="text-[10px] text-[#888] font-medium w-8 py-1">{d}</div>
              ))}
              {/* Offset ISO: 0=Dom→6 espaços, 1=Seg→0, 2=Ter→1, etc. */}
              {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map((_, i) => <div key={`e${i}`} className="w-8 h-8" />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dayPosts = postsByDay.get(day) ?? [];
                const hasPosts = dayPosts.length > 0;
                const primaryColor = hasPosts
                  ? (FORMAT_COLORS[dayPosts[0].format] ?? "#8b5cf6")
                  : null;
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
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#111] text-white text-[8px] rounded-full flex items-center justify-center leading-none">
                        {dayPosts.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Painel de detalhes do dia */}
          <div className="flex-1 bg-white rounded-xl border border-[#e5e5e5] p-4 min-h-[200px]">
            {selectedPosts.length > 0 ? (
              <div className="flex flex-col gap-4">
                <p className="text-xs text-[#888]">Dia {selectedDay} · {selectedPosts.length} post{selectedPosts.length > 1 ? "s" : ""}</p>
                {selectedPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#888]">Selecione um dia com post no calendário.</p>
            )}
          </div>
        </div>
      ) : (
        /* Vista em lista */
        <div className="flex flex-col gap-2">
          {posts.length === 0 && (
            <p className="text-sm text-[#888] py-4">Nenhum post no calendário deste mês.</p>
          )}
          {posts.map((post, i) => (
            <div key={`${post.id}-${i}`} className="bg-white rounded-xl border border-[#e5e5e5] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#888]">
                      Dia {post.day}
                      {post.listName && post.listName !== "Backlog" && (
                        <span className="text-[#ccc]"> · {post.listName}</span>
                      )}
                    </span>
                    {post.platform && (
                      <span
                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                        style={{ background: PLATFORM_COLORS[post.platform] ?? "#888" }}
                      >
                        {post.platform}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-[#111] leading-snug truncate">{post.theme}</h4>
                  {post.hook && <p className="text-xs text-[#555] mt-1 line-clamp-2">{post.hook}</p>}
                  {post.objective && (
                    <p className="text-xs text-[#888] mt-0.5">
                      <span className="font-medium">Objetivo:</span> {post.objective}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded text-white"
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  return (
    <div className="border-l-2 pl-3" style={{ borderColor: FORMAT_COLORS[post.format] ?? "#8b5cf6" }}>
      {post.platform && (
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white mb-1 inline-block"
          style={{ background: PLATFORM_COLORS[post.platform] ?? "#888" }}
        >
          {post.platform}
        </span>
      )}
      <h4 className="text-sm font-semibold text-[#111] mb-1">{post.theme}</h4>
      <div className="flex flex-col gap-1 text-xs">
        <span>
          <span className="text-[#888]">Formato: </span>
          <span className="font-medium" style={{ color: FORMAT_COLORS[post.format] ?? "#333" }}>{post.format}</span>
        </span>
        {post.hook && <span><span className="text-[#888]">Gancho: </span><span className="text-[#333]">{post.hook}</span></span>}
        {post.objective && <span><span className="text-[#888]">Objetivo: </span><span className="text-[#333]">{post.objective}</span></span>}
        {post.notes && <span><span className="text-[#888]">Notas: </span><span className="text-[#333]">{post.notes}</span></span>}
        {post.trelloUrl && (
          <a href={post.trelloUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#0052cc] hover:underline w-fit mt-1">
            <ExternalLink size={10} /> Ver no Trello
          </a>
        )}
      </div>
    </div>
  );
}
