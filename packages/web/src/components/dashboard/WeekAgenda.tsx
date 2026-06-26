"use client";

interface AgendaItem {
  day: string;
  label: string;
  client: string;
  type: "entrega" | "reuniao" | "pipeline";
}

const TYPE_COLORS: Record<AgendaItem["type"], string> = {
  entrega: "#8b5cf6",
  reuniao: "#06b6d4",
  pipeline: "#f59e0b",
};

const TYPE_LABELS: Record<AgendaItem["type"], string> = {
  entrega: "Entrega",
  reuniao: "Reunião",
  pipeline: "Pipeline",
};

function getDayOfWeek(offsetDays: number) {
  const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${days[d.getDay()]} ${d.getDate()}`;
}

const AGENDA: AgendaItem[] = [
  { day: getDayOfWeek(0), label: "Calendário de conteúdo", client: "Isabela Castro", type: "entrega" },
  { day: getDayOfWeek(1), label: "Refresh semanal", client: "Todos", type: "pipeline" },
  { day: getDayOfWeek(2), label: "Paleta de cores", client: "Sam Fernandes", type: "entrega" },
  { day: getDayOfWeek(3), label: "Análise de métricas", client: "Laís Daltrozo", type: "reuniao" },
  { day: getDayOfWeek(4), label: "ICP gerado", client: "Tiago Zamboni", type: "pipeline" },
];

export function WeekAgenda() {
  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5">
      <h3 className="text-sm font-semibold text-[#111] mb-4">Agenda da Semana</h3>
      <div className="flex flex-col gap-2">
        {AGENDA.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-xs text-[#888] w-12 pt-0.5 shrink-0">{item.day}</span>
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#fafafa] border border-[#f0f0f0]">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0 mt-0.5"
                style={{ background: TYPE_COLORS[item.type] }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#333]">{item.label}</p>
                <p className="text-[10px] text-[#888]">{item.client}</p>
              </div>
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  background: `${TYPE_COLORS[item.type]}18`,
                  color: TYPE_COLORS[item.type],
                }}
              >
                {TYPE_LABELS[item.type]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
