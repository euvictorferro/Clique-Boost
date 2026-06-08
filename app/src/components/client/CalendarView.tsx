"use client";

import { useState } from "react";

const FORMAT_COLORS: Record<string, string> = {
  Reel: "#8b5cf6",
  Carrossel: "#3b82f6",
  Stories: "#10b981",
  Imagem: "#6b7280",
};

interface Post {
  day: number;
  theme: string;
  format: string;
  hook?: string;
  objective?: string;
  notes?: string;
}

function parsePosts(markdown: string): Post[] {
  const posts: Post[] = [];
  const lines = markdown.split("\n");
  let current: Partial<Post> | null = null;

  for (const line of lines) {
    const dateMatch = line.match(/##\s+\d{4}-\d{2}-(\d{2})/);
    if (dateMatch) {
      if (current?.day) posts.push(current as Post);
      current = { day: parseInt(dateMatch[1]), format: "Reel" };
      continue;
    }
    if (!current) continue;
    if (line.match(/\*?\*?tema[:\s]/i)) current.theme = line.replace(/.*tema[:\s]*/i, "").replace(/\*\*/g, "").trim();
    if (line.match(/\*?\*?formato[:\s]/i)) current.format = line.replace(/.*formato[:\s]*/i, "").replace(/\*\*/g, "").trim() ?? "Reel";
    if (line.match(/\*?\*?gancho[:\s]/i)) current.hook = line.replace(/.*gancho[:\s]*/i, "").replace(/\*\*/g, "").trim();
    if (line.match(/\*?\*?objetivo[:\s]/i)) current.objective = line.replace(/.*objetivo[:\s]*/i, "").replace(/\*\*/g, "").trim();
    if (line.match(/\*?\*?notas[:\s]/i)) current.notes = line.replace(/.*notas[:\s]*/i, "").replace(/\*\*/g, "").trim();
  }
  if (current?.day) posts.push(current as Post);
  return posts;
}

export function CalendarView({
  markdown,
  month,
}: {
  markdown: string;
  month: string;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [year, monthNum] = month.split("-").map(Number);
  const posts = parsePosts(markdown);
  const firstDay = new Date(year, monthNum - 1, 1).getDay();
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const selectedPost = posts.find((p) => p.day === selectedDay);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#111]">
          {new Date(year, monthNum - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" })}
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
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 shrink-0">
            <div className="grid grid-cols-7 gap-1 text-center">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                <div key={i} className="text-[10px] text-[#888] font-medium w-7 py-1">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const post = posts.find((p) => p.day === day);
                const color = post ? FORMAT_COLORS[post.format] ?? "#6b7280" : null;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium flex items-center justify-center transition-colors ${selectedDay === day ? "ring-2 ring-[#8b5cf6]" : ""} ${color ? "text-white" : "text-[#333] hover:bg-[#f5f5f5]"}`}
                    style={color ? { background: color } : {}}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-xl border border-[#e5e5e5] p-4">
            {selectedPost ? (
              <>
                <p className="text-xs text-[#888] mb-1">Dia {selectedDay}</p>
                <h4 className="text-sm font-semibold text-[#111] mb-3">{selectedPost.theme ?? "Post"}</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <div>
                    <span className="text-[#888] mr-2">Formato:</span>
                    <span className="text-xs px-2 py-0.5 rounded text-white" style={{ background: FORMAT_COLORS[selectedPost.format] ?? "#6b7280" }}>
                      {selectedPost.format}
                    </span>
                  </div>
                  {selectedPost.hook && <div><span className="text-[#888]">Gancho: </span><span className="text-[#333]">{selectedPost.hook}</span></div>}
                  {selectedPost.objective && <div><span className="text-[#888]">Objetivo: </span><span className="text-[#333]">{selectedPost.objective}</span></div>}
                  {selectedPost.notes && <div><span className="text-[#888]">Notas: </span><span className="text-[#333]">{selectedPost.notes}</span></div>}
                </div>
              </>
            ) : (
              <p className="text-sm text-[#888]">Selecione um dia com post no calendário.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <div key={post.day} className="bg-white rounded-xl border border-[#e5e5e5] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs text-[#888] mb-0.5">Dia {post.day}</p>
                  <h4 className="text-sm font-semibold text-[#111]">{post.theme ?? "Post"}</h4>
                  {post.hook && <p className="text-xs text-[#555] mt-1">{post.hook}</p>}
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded text-white shrink-0" style={{ background: FORMAT_COLORS[post.format] ?? "#6b7280" }}>
                  {post.format}
                </span>
              </div>
            </div>
          ))}
          {posts.length === 0 && <p className="text-sm text-[#888]">Nenhum post no calendário deste mês.</p>}
        </div>
      )}
    </div>
  );
}
