"use client";

import { useRef } from "react";
import { JobsTable } from "@/components/pipeline/JobsTable";
import { LogsList } from "@/components/pipeline/LogsList";

export default function PipelinePage() {
  const logsRef = useRef<{ reload: () => void } | null>(null);

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-[#111] mb-1">Pipeline / Automação</h1>
      <p className="text-sm text-[#888] mb-6">
        Acompanhe os jobs agendados e o histórico completo de execuções. Clique numa linha de log para ver os dados coletados.
      </p>

      <h2 className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-3">Jobs Agendados</h2>
      <div className="mb-8">
        <JobsTable onJobRun={() => logsRef.current?.reload()} />
      </div>

      <h2 className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-3">Histórico de Execuções</h2>
      <LogsList ref={logsRef} />
    </div>
  );
}
