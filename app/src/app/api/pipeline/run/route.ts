import { NextRequest, NextResponse } from "next/server";
import { appendLog } from "@/lib/pipelineLog";

const VALID_JOBS = ["calendar", "icp", "palette", "metrics", "weekly-refresh"] as const;
type Job = (typeof VALID_JOBS)[number];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { clientId, job } = body as { clientId?: string; job?: string };

  if (!job || !VALID_JOBS.includes(job as Job)) {
    return NextResponse.json(
      { error: `job must be one of: ${VALID_JOBS.join(", ")}` },
      { status: 400 }
    );
  }

  const entry = appendLog({
    date: new Date().toISOString(),
    job,
    clientId: clientId ?? "all",
    status: "running",
    message: `Job ${job} disparado manualmente`,
  });

  // Fire-and-forget
  try {
    const { exec } = await import("child_process");
    const cmd = clientId
      ? `cd "${process.cwd()}/.." && npx tsx scripts/run-job.ts ${job} ${clientId}`
      : `cd "${process.cwd()}/.." && npx tsx scripts/run-job.ts ${job}`;

    exec(cmd, (error, _stdout, stderr) => {
      appendLog({
        date: new Date().toISOString(),
        job,
        clientId: clientId ?? "all",
        status: error ? "error" : "success",
        message: error ? stderr.slice(0, 200) : `Job ${job} concluído`,
      });
    });
  } catch {
    // ignorar — log já criado como "running"
  }

  return NextResponse.json({ ok: true, logId: entry.id });
}
