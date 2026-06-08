import path from "path";
import { config } from "dotenv";
config({ path: path.join(__dirname, "../../.env") });

import { getClient, upsertClient } from "../src/lib/clients";

// Troca o code OAuth pelo access token de longa duração e salva no cliente.
// Uso: npm run meta-token <clientId> <code>

const [clientId, code] = process.argv.slice(2);
if (!clientId || !code) {
  console.error("Uso: npm run meta-token <clientId> <code>");
  process.exit(1);
}

const appId = process.env.META_APP_ID;
const appSecret = process.env.META_APP_SECRET;
if (!appId || !appSecret) {
  console.error("META_APP_ID e META_APP_SECRET são obrigatórios no .env");
  process.exit(1);
}

const REDIRECT_URI = "https://www.facebook.com/connect/login_success.html";
const GRAPH = "https://graph.facebook.com/v19.0";

async function exchangeCodeForToken(code: string): Promise<string> {
  const url = `${GRAPH}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${appSecret}&code=${code}`;
  const res = await fetch(url);
  const data = await res.json() as { access_token?: string; error?: { message: string } };
  if (!res.ok || data.error) throw new Error(data.error?.message ?? "Erro ao trocar code por token");
  return data.access_token!;
}

async function getLongLivedToken(shortToken: string): Promise<string> {
  const url = `${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`;
  const res = await fetch(url);
  const data = await res.json() as { access_token?: string; expires_in?: number; error?: { message: string } };
  if (!res.ok || data.error) throw new Error(data.error?.message ?? "Erro ao obter token longo");
  console.log(`✅ Token válido por ~${Math.round((data.expires_in ?? 0) / 86400)} dias`);
  return data.access_token!;
}

async function getInstagramAccountToken(pageToken: string): Promise<string> {
  // Busca a página conectada ao Instagram Business
  const pagesRes = await fetch(`${GRAPH}/me/accounts?access_token=${pageToken}`);
  const pages = await pagesRes.json() as { data?: Array<{ id: string; name: string; access_token: string }> };

  if (!pages.data?.length) {
    console.warn("⚠️  Nenhuma página Facebook encontrada. Usando token de usuário diretamente.");
    return pageToken;
  }

  const page = pages.data[0];
  console.log(`📄 Página encontrada: ${page.name}`);

  // Busca conta Instagram Business conectada à página
  const igRes = await fetch(`${GRAPH}/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`);
  const igData = await igRes.json() as { instagram_business_account?: { id: string } };

  if (!igData.instagram_business_account) {
    console.warn("⚠️  Nenhuma conta Instagram Business conectada à página. Usando token da página.");
    return page.access_token;
  }

  const igId = igData.instagram_business_account.id;
  console.log(`📷 Instagram Business Account: ${igId}`);

  return page.access_token;
}

async function main() {
  const client = getClient(clientId);
  if (!client) {
    console.error(`Cliente não encontrado: ${clientId}`);
    process.exit(1);
  }

  console.log(`\n🔐 Obtendo token Meta para ${client.name}...`);

  try {
    const shortToken = await exchangeCodeForToken(code);
    console.log("✅ Token curto obtido");

    const longToken = await getLongLivedToken(shortToken);
    console.log("✅ Token longo obtido");

    const finalToken = await getInstagramAccountToken(longToken);

    upsertClient({ ...client, metaAccessToken: finalToken });
    console.log(`\n✅ Token salvo para ${client.name}`);
    console.log(`Agora você pode rodar: npm run test-meta ${clientId}\n`);
  } catch (err) {
    console.error("❌ Erro:", (err as Error).message);
    process.exit(1);
  }
}

main();
