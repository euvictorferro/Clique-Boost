/**
 * Migração dos dados locais (JSON + Obsidian) para Supabase.
 * Execute uma vez: npx tsx scripts/migrate-to-supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(__dirname, "../.env") });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");
const VAULT = process.env.OBSIDIAN_VAULT_PATH ?? "";

const DOC_MAP: Record<string, string> = {
  "briefing.md": "briefing",
  "ICP.md": "icp",
  "paleta.md": "palette",
  "brand-guidelines.md": "brand-guidelines",
  "estrategia-conteudo.md": "strategy",
  "funil-organico.md": "funnel",
  "mapa-mental.md": "mental-map",
  "mapa-mental-posicionamento.md": "mental-map-positioning",
  "concorrentes.md": "competitors",
  "analise-perfis.md": "profile-analysis",
  "voz.md": "voice",
  "linha-editorial.md": "editorial-line",
  "produtos-copys.md": "products-copy",
  "perfil.md": "profile",
};

const SUBFOLDERS = ["Briefing", "Estratégia", "Branding", ""];

async function migrateClients() {
  console.log("\n📦 Migrando clients.json...");
  const raw = fs.readFileSync(path.join(DATA, "clients.json"), "utf-8");
  const clients = JSON.parse(raw) as any[];

  for (const c of clients) {
    const row = {
      id: c.id,
      name: c.name,
      brand_name: c.brandName ?? "",
      niche: c.niche ?? "general",
      instagram_handle: c.instagramHandle ?? null,
      competitors: c.competitors ?? [],
      social_networks: c.socialNetworks ?? [],
      tone_of_voice: c.toneOfVoice ?? "",
      content_goal: c.contentGoal ?? "",
      has_visual_identity: c.hasVisualIdentity ?? false,
      brand_colors: c.brandColors ?? null,
      palette_names: c.paletteNames ?? null,
      trello_board_id: c.trelloBoardId ?? null,
      meta_access_token: c.metaAccessToken ?? null,
      meta_token_expires_at: c.metaTokenExpiresAt ?? null,
      profile_picture_url: c.profilePictureUrl ?? null,
      status: c.status ?? "active",
      created_at: c.createdAt ?? new Date().toISOString(),
    };
    const { error } = await supabase.from("clients").upsert(row, { onConflict: "id" });
    if (error) console.error(`  ✗ ${c.id}:`, error.message);
    else console.log(`  ✓ ${c.id}`);
  }
}

async function migrateObsidianDocs(clientId: string) {
  if (!VAULT) return;
  const clientPath = path.join(VAULT, "01 - Clientes", clientId);
  if (!fs.existsSync(clientPath)) return;

  for (const [filename, docType] of Object.entries(DOC_MAP)) {
    for (const subfolder of SUBFOLDERS) {
      const filePath = subfolder
        ? path.join(clientPath, subfolder, filename)
        : path.join(clientPath, filename);
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, "utf-8");
      const { error } = await supabase.from("client_documents").insert(
        { client_id: clientId, doc_type: docType, content, month: null, week_label: null }
      );
      if (error && error.code !== "23505") console.error(`    ✗ ${clientId}/${docType}:`, error.message);
      else console.log(`    ✓ ${clientId}/${docType}`);
      break; // found in this subfolder, no need to check others
    }
  }

  // Calendários
  const calPath = path.join(clientPath, "Calendários");
  if (fs.existsSync(calPath)) {
    for (const file of fs.readdirSync(calPath)) {
      if (!file.endsWith(".md")) continue;
      const month = file.replace(".md", "");
      const content = fs.readFileSync(path.join(calPath, file), "utf-8");
      const { error } = await supabase.from("client_documents").insert(
        { client_id: clientId, doc_type: "calendar", content, month, week_label: null }
      );
      if (error && error.code !== "23505") console.error(`    ✗ ${clientId}/calendar/${month}:`, error.message);
      else console.log(`    ✓ ${clientId}/calendar/${month}`);
    }
  }

  // Análises
  const analysisPath = path.join(clientPath, "Análises");
  if (fs.existsSync(analysisPath)) {
    for (const file of fs.readdirSync(analysisPath)) {
      if (!file.endsWith(".md")) continue;
      const weekLabel = file.replace(".md", "");
      const content = fs.readFileSync(path.join(analysisPath, file), "utf-8");
      const { error } = await supabase.from("client_documents").insert(
        { client_id: clientId, doc_type: "analysis", content, month: null, week_label: weekLabel }
      );
      if (error && error.code !== "23505") console.error(`    ✗ ${clientId}/analysis/${weekLabel}:`, error.message);
      else console.log(`    ✓ ${clientId}/analysis/${weekLabel}`);
    }
  }
}

async function migrateMeetings() {
  console.log("\n📅 Migrando meetings.json...");
  const meetPath = path.join(DATA, "meetings.json");
  if (!fs.existsSync(meetPath)) { console.log("  (não encontrado)"); return; }
  const meetings = JSON.parse(fs.readFileSync(meetPath, "utf-8")) as any[];
  for (const m of meetings) {
    const { error } = await supabase.from("meetings").upsert({
      id: m.id,
      title: m.title,
      date: m.date,
      participants: m.participants ?? [],
      client_ids: m.clientIds ?? [],
      summary: m.summary ?? "",
      synced_at: m.syncedAt ?? new Date().toISOString(),
    }, { onConflict: "id" });
    if (error) console.error(`  ✗ ${m.id}:`, error.message);
    else console.log(`  ✓ ${m.title}`);
  }
}

async function migratePipelineLogs() {
  console.log("\n📋 Migrando pipeline-logs.json...");
  const logPath = path.join(DATA, "pipeline-logs.json");
  if (!fs.existsSync(logPath)) { console.log("  (não encontrado)"); return; }
  const logs = JSON.parse(fs.readFileSync(logPath, "utf-8")) as any[];
  const rows = logs.map((l: any) => ({
    id: l.id,
    date: l.date,
    job: l.job,
    client_id: l.clientId,
    client_name: l.clientName ?? null,
    status: l.status,
    message: l.message ?? "",
    duration_ms: l.durationMs ?? null,
    details: l.details ?? null,
  }));
  if (rows.length === 0) { console.log("  (vazio)"); return; }
  const { error } = await supabase.from("pipeline_logs").upsert(rows, { onConflict: "id" });
  if (error) console.error("  ✗", error.message);
  else console.log(`  ✓ ${rows.length} logs`);
}

async function main() {
  console.log("🚀 Iniciando migração para Supabase...");
  console.log(`   URL: ${process.env.SUPABASE_URL}`);

  await migrateClients();

  // Migra documentos do Obsidian para cada cliente
  const clientsRaw = JSON.parse(fs.readFileSync(path.join(DATA, "clients.json"), "utf-8")) as any[];
  if (VAULT) {
    console.log("\n📝 Migrando documentos do Obsidian...");
    for (const c of clientsRaw) {
      console.log(`  → ${c.id}`);
      await migrateObsidianDocs(c.id);
    }
  } else {
    console.log("\n⚠️  OBSIDIAN_VAULT_PATH não definido — pulando documentos do Obsidian");
  }

  await migrateMeetings();
  await migratePipelineLogs();

  console.log("\n✅ Migração concluída!");
}

main().catch(console.error);
