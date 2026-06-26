"use client";

import { use, useEffect, useState, useRef } from "react";
import {
  Film,
  Upload,
  Play,
  CheckCircle2,
  Clock,
  FolderOpen,
  RefreshCw,
  Scissors,
  Captions,
  Music,
  Layers,
  AlertCircle,
} from "lucide-react";

interface VideoFiles {
  raw: string[];
  processing: string[];
  ready: string[];
}

type JobStatus = "idle" | "processing" | "done" | "error";

interface Job {
  file: string;
  status: JobStatus;
  message?: string;
}

const PIPELINE_STEPS = [
  { icon: Scissors, label: "Auto-cut silêncios" },
  { icon: Captions, label: "Transcrição Whisper" },
  { icon: Captions, label: "Legendas Netflix" },
  { icon: Layers, label: "Montagem (intro + outro + música)" },
];

export default function VideoPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = use(params);
  const [files, setFiles] = useState<VideoFiles>({ raw: [], processing: [], ready: [] });
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchFiles = () => {
    fetch(`/api/clients/${clientId}/video/process`)
      .then((r) => r.json())
      .then((d) => setFiles(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFiles();
  }, [clientId]);

  // Poll when there are jobs processing
  useEffect(() => {
    const hasProcessing = jobs.some((j) => j.status === "processing");
    if (hasProcessing) {
      pollRef.current = setInterval(fetchFiles, 4000);
    } else {
      if (pollRef.current) clearInterval(pollRef.current);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobs]);

  // Detect when a processing job moved to ready
  useEffect(() => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.status === "processing") {
          const readyFile = `${j.file.replace(/\.[^.]+$/, "")}_final.mp4`;
          if (files.ready.includes(readyFile)) {
            return { ...j, status: "done", message: `Pronto: ${readyFile}` };
          }
        }
        return j;
      })
    );
  }, [files.ready]);

  const processFile = async (file: string) => {
    setJobs((prev) => {
      const exists = prev.find((j) => j.file === file);
      if (exists) return prev.map((j) => j.file === file ? { ...j, status: "processing", message: undefined } : j);
      return [...prev, { file, status: "processing" }];
    });

    try {
      const res = await fetch(`/api/clients/${clientId}/video/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file }),
      });
      if (!res.ok) throw new Error(await res.text());
    } catch (err: any) {
      setJobs((prev) =>
        prev.map((j) => j.file === file ? { ...j, status: "error", message: err.message } : j)
      );
    }
  };

  const getJobForFile = (file: string) => jobs.find((j) => j.file === file);

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-[#111]">Edição de Vídeo</h2>
          <p className="text-xs text-[#888] mt-0.5">
            Pipeline automático · Auto-cut + Legendas Netflix + Montagem
          </p>
        </div>
        <button
          onClick={fetchFiles}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-[#e5e5e5] text-[#555] hover:border-[#8b5cf6] hover:text-[#8b5cf6] transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Pipeline steps */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {PIPELINE_STEPS.map(({ icon: Icon, label }) => (
          <div key={label} className="bg-[#f9f9f9] border border-[#e5e5e5] rounded-lg p-3 text-center">
            <Icon size={16} className="mx-auto mb-1.5 text-[#8b5cf6]" />
            <p className="text-[10px] text-[#666] leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Raw videos — ready to process */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FolderOpen size={14} className="text-[#888]" />
          <h3 className="text-xs font-semibold text-[#555] uppercase tracking-wide">
            Fila de Entrada ({files.raw.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-[#888] py-4">
            <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
            Carregando…
          </div>
        ) : files.raw.length === 0 ? (
          <div className="border-2 border-dashed border-[#e5e5e5] rounded-xl py-10 text-center">
            <Upload size={24} className="mx-auto mb-2 text-[#ccc]" />
            <p className="text-sm text-[#999]">Nenhum vídeo na fila</p>
            <p className="text-xs text-[#bbb] mt-1">
              Adicione arquivos em{" "}
              <code className="bg-[#f0f0f0] px-1 rounded text-[10px]">
                data/video-inbox/{clientId}/raw/
              </code>
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {files.raw.map((file) => {
              const job = getJobForFile(file);
              return (
                <div
                  key={file}
                  className="flex items-center gap-3 bg-white border border-[#e5e5e5] rounded-xl p-3 hover:border-[#8b5cf6]/30 transition-colors"
                >
                  <Film size={16} className="shrink-0 text-[#aaa]" />
                  <span className="flex-1 text-sm text-[#333] font-medium truncate">{file}</span>

                  {job?.status === "processing" && (
                    <div className="flex items-center gap-1.5 text-[11px] text-[#f59e0b]">
                      <div className="w-3 h-3 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin" />
                      Processando…
                    </div>
                  )}
                  {job?.status === "done" && (
                    <div className="flex items-center gap-1 text-[11px] text-[#10b981]">
                      <CheckCircle2 size={12} />
                      Pronto
                    </div>
                  )}
                  {job?.status === "error" && (
                    <div className="flex items-center gap-1 text-[11px] text-[#ef4444]" title={job.message}>
                      <AlertCircle size={12} />
                      Erro
                    </div>
                  )}

                  <button
                    onClick={() => processFile(file)}
                    disabled={job?.status === "processing"}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-[#8b5cf6] text-white hover:bg-[#7c3aed] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <Play size={11} />
                    Editar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Ready videos */}
      {files.ready.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} className="text-[#10b981]" />
            <h3 className="text-xs font-semibold text-[#555] uppercase tracking-wide">
              Prontos ({files.ready.length})
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {files.ready.map((file) => (
              <div
                key={file}
                className="flex items-center gap-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl p-3"
              >
                <Film size={16} className="shrink-0 text-[#10b981]" />
                <span className="flex-1 text-sm text-[#166534] font-medium truncate">{file}</span>
                <span className="text-[11px] text-[#10b981] flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  Editado
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Processing */}
      {files.processing.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-[#f59e0b]" />
            <h3 className="text-xs font-semibold text-[#555] uppercase tracking-wide">
              Processando ({files.processing.length})
            </h3>
          </div>
          <div className="flex flex-col gap-2">
            {files.processing.map((file) => (
              <div
                key={file}
                className="flex items-center gap-3 bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3"
              >
                <div className="w-4 h-4 border-2 border-[#f59e0b] border-t-transparent rounded-full animate-spin shrink-0" />
                <span className="flex-1 text-sm text-[#92400e] font-medium truncate">{file}</span>
                <span className="text-[11px] text-[#f59e0b]">Processando…</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Instructions */}
      <div className="mt-4 p-3 bg-[#f5f5f5] rounded-lg text-[11px] text-[#888]">
        <p className="font-medium text-[#555] mb-1">📁 Como usar</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>Coloque o vídeo bruto em <code className="bg-white px-1 rounded">data/video-inbox/{clientId}/raw/</code></li>
          <li>Clique em <strong>Atualizar</strong> para ver o arquivo na fila</li>
          <li>Clique em <strong>Editar</strong> para iniciar o pipeline</li>
          <li>O vídeo final aparece em <code className="bg-white px-1 rounded">data/video-inbox/{clientId}/ready/</code></li>
        </ol>
        <p className="mt-2 text-[#aaa]">
          Para intro/outro personalizados, adicione em{" "}
          <code className="bg-white px-1 rounded">data/video-assets/intros/{clientId}.mp4</code>
        </p>
      </div>
    </div>
  );
}
