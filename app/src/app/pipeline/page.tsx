import { JobsTable } from "@/components/pipeline/JobsTable";
import { LogsList } from "@/components/pipeline/LogsList";

export default function PipelinePage() {
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-lg font-semibold text-[#111] mb-5">Pipeline / Automação</h1>

      <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide mb-3">Jobs Agendados</h2>
      <div className="mb-8">
        <JobsTable />
      </div>

      <h2 className="text-sm font-semibold text-[#888] uppercase tracking-wide mb-3">Log de Execuções</h2>
      <LogsList />
    </div>
  );
}
