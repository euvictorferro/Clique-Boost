"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  niche: string;
}

interface CalendarEntry {
  clientId: string;
  clientName: string;
  day: number;
  theme: string;
  format: string;
}

const FORMAT_COLORS: Record<string, string> = {
  Reel: "#8b5cf6",
  Carrossel: "#3b82f6",
  Stories: "#10b981",
  Imagem: "#6b7280",
};

const CLIENT_COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#f43f5e"];

function parsePostsFromMarkdown(
  markdown: string,
  clientId: string,
  clientName: string
): CalendarEntry[] {
  const entries: CalendarEntry[] = [];
  const lines = markdown.split("\n");
  let current: Partial<CalendarEntry> | null = null;

  for (const line of lines) {
    const dateMatch = line.match(/##\s+\d{4}-\d{2}-(\d{2})/);
    if (dateMatch) {
      if (current?.day) entries.push(current as CalendarEntry);
      current = { clientId, clientName, day: parseInt(dateMatch[1]), format: "Reel" };
      continue;
    }
    if (!current) continue;
    if (line.match(/\*?\*?tema[:\s]/i))
      current.theme = line.replace(/.*tema[:\s]*/i, "").replace(/\*\*/g, "").trim();
    if (line.match(/\*?\*?formato[:\s]/i))
      current.format =
        line.replace(/.*formato[:\s]*/i, "").replace(/\*\*/g, "").trim() ?? "Reel";
  }
  if (current?.day) entries.push(current as CalendarEntry);
  return entries;
}

export function GlobalCalendarView({ month }: { month: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients);
  }, []);

  useEffect(() => {
    if (!clients.length) return;
    setLoading(true);

    const targets =
      selectedClient === "all" ? clients : clients.filter((c) => c.id === selectedClient);

    Promise.all(
      targets.map((c) =>
        fetch(`/api/clients/${c.id}/calendar?month=${month}`)
          .then((r) => r.json())
          .then((d) => parsePostsFromMarkdown(d.content ?? "", c.id, c.name))
          .catch(() => [] as CalendarEntry[])
      )
    )
      .then((results) => setEntries(results.flat()))
      .finally(() => setLoading(false));
  }, [clients, selectedClient, month]);

  const [year, monthNum] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNum - 1, 1).getDay();
  const daysInMonth = new Date(year, monthNum, 0).getDate();

  const dayEntries = (day: number) => entries.filter((e) => e.day === day);
  const selectedEntries = selectedDay ? dayEntries(selectedDay) : [];

  return (
    <div>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedClient("all")}
          className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
            selectedClient === "all"
              ? "border-[#8b5cf6] bg-[rgba(139,92,246,0.07)] text-[#8b5cf6]"
              : "border-[#e5e5e5] text-[#555] hover:border-[#8b5cf6]"
          }`}
        >
          Todos
        </button>
        {clients.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setSelectedClient(c.id)}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              selectedClient === c.id
                ? "border-[#8b5cf6] bg-[rgba(139,92,246,0.07)] text-[#8b5cf6]"
                : "border-[#e5e5e5] text-[#555] hover:border-[#8b5cf6]"
            }`}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-1.5"
              style={{ background: CLIENT_COLORS[i % CLIENT_COLORS.length] }}
            />
            {c.name}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-[#888] py-4">Carregando calendário…</p>
      ) : (
        <div className="flex gap-4">
          <div className="bg-white rounded-xl border border-[#e5e5e5] p-4 shrink-0">
            <p className="text-xs font-semibold text-[#111] mb-3 capitalize">
              {new Date(year, monthNum - 1).toLocaleString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </p>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                <div key={i} className="text-[10px] text-[#888] font-medium w-7 py-1">
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`e${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const de = dayEntries(day);
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium flex items-center justify-center transition-colors relative ${
                      selectedDay === day ? "ring-2 ring-[#8b5cf6]" : ""
                    } ${
                      de.length
                        ? "bg-[rgba(139,92,246,0.07)] text-[#8b5cf6]"
                        : "text-[#333] hover:bg-[#f5f5f5]"
                    }`}
                  >
                    {day}
                    {de.length > 1 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#8b5cf6] text-white text-[8px] rounded-full flex items-center justify-center">
                        {de.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-xl border border-[#e5e5e5] p-4">
            {selectedDay && selectedEntries.length > 0 ? (
              <>
                <p className="text-xs text-[#888] mb-3">Dia {selectedDay}</p>
                <div className="flex flex-col gap-3">
                  {selectedEntries.map((e, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 pb-3 border-b border-[#f5f5f5] last:border-0"
                    >
                      <span
                        className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                        style={{
                          background:
                            CLIENT_COLORS[
                              clients.findIndex((c) => c.id === e.clientId) %
                                CLIENT_COLORS.length
                            ],
                        }}
                      />
                      <div className="flex-1">
                        <Link
                          href={`/clients/${e.clientId}/metrics`}
                          className="text-[10px] text-[#888] hover:text-[#8b5cf6]"
                        >
                          {e.clientName}
                        </Link>
                        <p className="text-sm font-medium text-[#111]">{e.theme || "Post"}</p>
                      </div>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded text-white"
                        style={{ background: FORMAT_COLORS[e.format] ?? "#6b7280" }}
                      >
                        {e.format}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : selectedDay ? (
              <p className="text-sm text-[#888]">Nenhum post para o dia {selectedDay}.</p>
            ) : (
              <p className="text-sm text-[#888]">Clique em um dia para ver os posts.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
