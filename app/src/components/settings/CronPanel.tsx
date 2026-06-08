"use client";

const DAYS = [
  { value: "monday", label: "Segunda" },
  { value: "tuesday", label: "Terça" },
  { value: "wednesday", label: "Quarta" },
  { value: "thursday", label: "Quinta" },
  { value: "friday", label: "Sexta" },
  { value: "saturday", label: "Sábado" },
  { value: "sunday", label: "Domingo" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i).padStart(2, "0"),
  label: `${String(i).padStart(2, "0")}:00`,
}));

interface Crons {
  calendarDay: string;
  calendarHour: string;
  weeklyDay: string;
  weeklyHour: string;
  metricsHour: string;
}

interface CronPanelProps {
  crons: Crons;
  onChange: (crons: Crons) => void;
}

export function CronPanel({ crons, onChange }: CronPanelProps) {
  const select = (key: keyof Crons) => (
    <select
      value={crons[key]}
      onChange={(e) => onChange({ ...crons, [key]: e.target.value })}
      className="text-xs border border-[#e5e5e5] rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-[#8b5cf6]"
    >
      {key === "weeklyDay"
        ? DAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)
        : key === "calendarDay"
        ? Array.from({ length: 28 }, (_, i) => (
            <option key={i + 1} value={String(i + 1)}>Dia {i + 1}</option>
          ))
        : HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
    </select>
  );

  return (
    <div className="bg-white rounded-xl border border-[#e5e5e5] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#111]">Calendário Mensal</p>
          <p className="text-xs text-[#888]">Gera o calendário de conteúdo todo mês</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#555]">
          {select("calendarDay")}
          <span>às</span>
          {select("calendarHour")}
        </div>
      </div>
      <div className="border-t border-[#f5f5f5]" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#111]">Refresh Semanal</p>
          <p className="text-xs text-[#888]">Atualiza tópicos da semana seguinte</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#555]">
          {select("weeklyDay")}
          <span>às</span>
          {select("weeklyHour")}
        </div>
      </div>
      <div className="border-t border-[#f5f5f5]" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#111]">Coleta de Métricas</p>
          <p className="text-xs text-[#888]">Busca métricas Meta de todos os clientes</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#555]">
          <span>Diariamente às</span>
          {select("metricsHour")}
        </div>
      </div>
    </div>
  );
}
