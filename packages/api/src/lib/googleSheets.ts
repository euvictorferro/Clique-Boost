import { google } from "googleapis";
import { BriefingResponse, Niche } from "@clique-boost/shared";

function getAuth() {
  const raw = process.env.GOOGLE_SHEETS_CREDENTIALS;
  if (!raw) throw new Error("GOOGLE_SHEETS_CREDENTIALS not set");

  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function getRows(sheetId: string): Promise<string[][]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A:Z",
  });
  return (res.data.values ?? []) as string[][];
}

async function markAsProcessed(sheetId: string, rowIndex: number): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  // Get header row to find or add "Status" column
  const rows = await getRows(sheetId);
  const headers = rows[0] ?? [];
  let statusCol = headers.indexOf("Status");

  if (statusCol === -1) {
    // Add Status column at end
    statusCol = headers.length;
    const colLetter = columnLetter(statusCol);
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${colLetter}1`,
      valueInputOption: "RAW",
      requestBody: { values: [["Status"]] },
    });
  }

  const colLetter = columnLetter(statusCol);
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${colLetter}${rowIndex + 1}`,
    valueInputOption: "RAW",
    requestBody: { values: [["processado"]] },
  });
}

function columnLetter(index: number): string {
  let letter = "";
  index += 1;
  while (index > 0) {
    const rem = (index - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    index = Math.floor((index - 1) / 26);
  }
  return letter;
}

function parseRow(headers: string[], row: string[], niche: Niche): BriefingResponse {
  const get = (key: string) => row[headers.indexOf(key)] ?? "";
  const getMulti = (key: string): string[] =>
    get(key)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const hasVisualIdentity = get("Você já tem identidade visual (logo, cores, fontes)?")
    .toLowerCase()
    .includes("sim");

  return {
    clientName: get("Qual é o seu nome completo?"),
    brandName: get("Qual é o nome da sua marca ou empresa?") ||
               get("Qual é o nome da sua marca ou negócio?") ||
               get("Qual é o nome da sua marca ou imobiliária?"),
    niche,
    city: get("Em qual cidade e estado você atua?") ||
          get("Em qual estado(s) você é licenciado para atuar?"),
    instagramHandle: get("Qual é o seu @ do Instagram?").replace(/^@/, "").trim() || undefined,
    idealClient: get("Descreva o seu cliente ideal em 2 a 3 frases.") ||
                 get("Descreva o seu comprador ideal em 2 a 3 frases."),
    differentials: get("Quais são seus 3 maiores diferenciais em relação à concorrência?") ||
                   get("Quais são seus 3 maiores diferenciais como corretor?") ||
                   get("Quais são seus 3 maiores diferenciais como agente?"),
    hasVisualIdentity,
    brandColors: hasVisualIdentity
      ? get("Se tiver identidade visual, quais são as cores principais?")
      : undefined,
    socialNetworks: getMulti("Quais redes sociais você usa ou quer usar?"),
    competitors: getMulti("Liste de 3 a 5 perfis de concorrentes ou referências no Instagram/TikTok."),
    toneOfVoice: get("Qual é o tom de voz da sua marca?") ||
                 get("Qual é o tom de voz que você quer para o seu perfil?"),
    contentGoal: get("Qual é o principal objetivo do seu conteúdo?"),
    // life-insurance
    insuranceProducts: niche === "life-insurance" ? getMulti("Quais produtos de seguro você oferece?") : undefined,
    targetAudience: niche === "life-insurance" ? get("Qual é o seu público principal?") : undefined,
    clientObjection: niche === "life-insurance"
      ? get("Qual é a maior objeção que seus clientes costumam ter antes de comprar?")
      : get("Qual é o maior medo ou objeção do seu comprador na hora de fechar negócio?"),
    successCases: niche === "life-insurance"
      ? get("Você tem cases de sucesso ou histórias de clientes que gostaria de destacar?")
      : undefined,
    // real-estate
    propertyType: niche === "real-estate" ? getMulti("Com qual tipo de imóvel você trabalha principalmente?") : undefined,
    priceRange: niche === "real-estate" ? get("Qual é a faixa de preço dos imóveis que você mais vende?") : undefined,
    workModel: niche === "real-estate" ? get("Como você trabalha?") : undefined,
    builderPartners: niche === "real-estate" ? get("Se trabalha com construtoras, quais são as principais?") : undefined,
    buyerFear: niche === "real-estate" ? get("Qual é o maior medo ou objeção do seu comprador na hora de fechar negócio?") : undefined,
    hasMediaAssets: niche === "real-estate"
      ? get("Você tem fotos e vídeos de imóveis disponíveis para usar no conteúdo?")
      : undefined,
    rawData: Object.fromEntries(headers.map((h, i) => [h, row[i] ?? ""])),
  };
}

export async function fetchNewBriefings(sheetId: string, niche: Niche): Promise<BriefingResponse[]> {
  const rows = await getRows(sheetId);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const statusCol = headers.indexOf("Status");
  const results: BriefingResponse[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const status = statusCol >= 0 ? (row[statusCol] ?? "") : "";
    if (status === "processado") continue;

    const briefing = parseRow(headers, row, niche);
    if (!briefing.clientName) continue;

    results.push(briefing);
    await markAsProcessed(sheetId, i);
  }

  return results;
}
