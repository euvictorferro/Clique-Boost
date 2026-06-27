import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import path from "path";

const ENV_PATH = path.join(process.cwd(), "..", ".env");

function readEnv(): Record<string, string> {
  try {
    const lines = readFileSync(ENV_PATH, "utf-8").split("\n");
    const env: Record<string, string> = {};
    for (const line of lines) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) env[match[1].trim()] = match[2].trim();
    }
    return env;
  } catch {
    return {};
  }
}

function checkTokenStatus(value: string): "valid" | "missing" {
  if (!value || value.trim() === "") return "missing";
  return "valid";
}

export async function GET() {
  const env = readEnv();

  const tokens = [
    { key: "META_APP_ID", label: "Meta App ID", value: env["META_APP_ID"] ?? "" },
    { key: "META_APP_SECRET", label: "Meta App Secret", value: env["META_APP_SECRET"] ?? "" },
    { key: "APIFY_API_TOKEN", label: "Apify API Token", value: env["APIFY_API_TOKEN"] ?? "" },
    { key: "GOOGLE_SHEETS_CREDENTIALS", label: "Google Sheets Credentials", value: env["GOOGLE_SHEETS_CREDENTIALS"] ?? "" },
    { key: "TRELLO_API_KEY", label: "Trello API Key", value: env["TRELLO_API_KEY"] ?? "" },
    { key: "TRELLO_TOKEN", label: "Trello Token", value: env["TRELLO_TOKEN"] ?? "" },
    { key: "ANTHROPIC_API_KEY", label: "Anthropic API Key", value: env["ANTHROPIC_API_KEY"] ?? "" },
  ].map((t) => ({ ...t, status: checkTokenStatus(t.value) }));

  const crons = {
    calendarDay: env["CRON_CALENDAR_DAY"] ?? "1",
    calendarHour: env["CRON_CALENDAR_HOUR"] ?? "08",
    weeklyDay: env["CRON_WEEKLY_DAY"] ?? "monday",
    weeklyHour: env["CRON_WEEKLY_HOUR"] ?? "09",
    metricsHour: env["CRON_METRICS_HOUR"] ?? "07",
  };

  return NextResponse.json({ tokens, crons });
}

export async function POST(req: NextRequest) {
  const { crons } = await req.json().catch(() => ({}));

  if (crons) {
    const cronMap: Record<string, string> = {
      CRON_CALENDAR_DAY: crons.calendarDay,
      CRON_CALENDAR_HOUR: crons.calendarHour,
      CRON_WEEKLY_DAY: crons.weeklyDay,
      CRON_WEEKLY_HOUR: crons.weeklyHour,
      CRON_METRICS_HOUR: crons.metricsHour,
    };

    try {
      const existing = readFileSync(ENV_PATH, "utf-8").split("\n");
      const written = new Set<string>();
      const lines = existing.map((line) => {
        const match = line.match(/^([^#=]+)=/);
        if (match && cronMap[match[1].trim()] !== undefined) {
          written.add(match[1].trim());
          return `${match[1].trim()}=${cronMap[match[1].trim()]}`;
        }
        return line;
      });
      Object.entries(cronMap).forEach(([k, v]) => {
        if (!written.has(k)) lines.push(`${k}=${v}`);
      });
      writeFileSync(ENV_PATH, lines.join("\n"), "utf-8");
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
