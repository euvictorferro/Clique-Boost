#!/usr/bin/env npx tsx
/**
 * Define o role de um usuário Supabase (agency | client).
 * Uso: npx tsx scripts/set-user-role.ts <userId> <agency|client>
 */
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no .env");
  process.exit(1);
}

const [userId, role] = process.argv.slice(2);

if (!userId || !["agency", "client"].includes(role)) {
  console.error("Uso: npx tsx scripts/set-user-role.ts <userId> <agency|client>");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

const { data, error } = await supabase.auth.admin.updateUserById(userId, {
  app_metadata: { role },
});

if (error) {
  console.error("Erro:", error.message);
  process.exit(1);
}

console.log(`✓ Role '${role}' definido para ${data.user.email} (${userId})`);
