import path from "path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "../../.env") });

import http from "http";
import { exec } from "child_process";
import { getClient, upsertClient } from "../src/lib/clients";

const clientId = process.argv[2];
if (!clientId) {
  console.error("Uso: npm run meta-auth <clientId>");
  process.exit(1);
}

const appId = process.env.META_APP_ID;
const appSecret = process.env.META_APP_SECRET;
if (!appId || !appSecret) {
  console.error("META_APP_ID e META_APP_SECRET são obrigatórios no .env");
  process.exit(1);
}

const PORT = 3333;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

const PERMISSIONS = [
  "instagram_basic",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
].join(",");

const authUrl = `https://www.facebook.com/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${PERMISSIONS}&response_type=code&state=${clientId}`;

// Sobe servidor local para capturar o código automaticamente
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url!, `http://localhost:${PORT}`);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<h2>❌ Erro: ${url.searchParams.get("error_description") ?? error}</h2><p>Feche esta aba.</p>`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(`<h2>✅ Autorização concluída!</h2><p>Pode fechar esta aba e voltar para o terminal.</p>`);
  server.close();

  console.log(`\n✅ Código recebido! Trocando pelo token...`);

  // Troca código por token curto
  const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${appSecret}&code=${code}`);
  const tokenData = await tokenRes.json() as { access_token?: string; error?: { message: string } };

  if (!tokenData.access_token) {
    console.error("❌ Erro ao obter token:", tokenData.error?.message);
    process.exit(1);
  }

  // Troca por token longo
  const longRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`);
  const longData = await longRes.json() as { access_token?: string; expires_in?: number; error?: { message: string } };

  if (!longData.access_token) {
    console.error("❌ Erro ao obter token longo:", longData.error?.message);
    process.exit(1);
  }

  const days = Math.round((longData.expires_in ?? 0) / 86400);
  console.log(`✅ Token longo obtido (válido por ~${days} dias)`);

  // Salva token direto no cliente
  const client = await getClient(clientId);
  if (client) {
    await upsertClient({ ...client, metaAccessToken: longData.access_token });
    console.log(`✅ Token salvo para ${client.name}`);
    console.log(`\nAgora rode: npm run test-meta ${clientId}\n`);
  } else {
    console.log(`⚠️  Cliente ${clientId} não encontrado`);
    console.log(`Token: ${longData.access_token}\n`);
  }
});

server.listen(PORT, () => {
  console.log(`\n🔐 Autorização Meta para cliente: ${clientId}`);
  console.log(`\n🌐 Abrindo browser para autorização...`);
  exec(`open "${authUrl}"`);
  console.log(`\nSe o browser não abrir, acesse manualmente:\n${authUrl}\n`);
  console.log(`⏳ Aguardando autorização...`);
});
