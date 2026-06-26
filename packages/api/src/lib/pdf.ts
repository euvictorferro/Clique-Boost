import { jsPDF } from "jspdf";

export interface ReportData {
  clientName: string;
  period: string;
  followers: number;
  followerDelta: number;
  reach30d: number;
  impressions30d: number;
  engagementRate: number;
  topPosts: Array<{
    theme: string;
    mediaType: string;
    likes: number;
    comments: number;
    saves: number;
  }>;
  demographics?: {
    ageRanges: Array<{ range: string; percentage: number }>;
    topCities: Array<{ city: string; percentage: number }>;
    genderSplit: { male: number; female: number; unknown: number };
  };
}

export function generateReportPDF(data: ReportData): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const ACCENT = [139, 92, 246] as const;
  const GRAY = [136, 136, 136] as const;
  const BLACK = [17, 17, 17] as const;

  let y = 20;

  doc.setFillColor(...ACCENT);
  doc.rect(0, 0, W, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Clique Boost — Relatorio de Performance", 14, 9);

  y = 28;

  doc.setTextColor(...BLACK);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.clientName, 14, y);
  y += 7;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GRAY);
  doc.text(`Periodo: ${data.period}`, 14, y);
  y += 12;

  doc.setTextColor(...ACCENT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("METRICAS PRINCIPAIS", 14, y);
  y += 6;

  const kpis = [
    { label: "Seguidores", value: data.followers.toLocaleString("pt-BR") },
    { label: "Crescimento 30d", value: `+${data.followerDelta.toLocaleString("pt-BR")}` },
    { label: "Alcance 30d", value: data.reach30d.toLocaleString("pt-BR") },
    { label: "Impressoes 30d", value: data.impressions30d.toLocaleString("pt-BR") },
    { label: "Engajamento", value: `${data.engagementRate.toFixed(2)}%` },
  ];

  const colW = (W - 28) / kpis.length;
  kpis.forEach((kpi, i) => {
    const x = 14 + i * colW;
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, y, colW - 3, 18, 2, 2, "F");
    doc.setTextColor(...GRAY);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(kpi.label, x + 3, y + 6);
    doc.setTextColor(...BLACK);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(kpi.value, x + 3, y + 14);
  });
  y += 26;

  doc.setTextColor(...ACCENT);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("TOP 5 POSTS", 14, y);
  y += 6;

  data.topPosts.slice(0, 5).forEach((post, i) => {
    doc.setFillColor(i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 250 : 255, i % 2 === 0 ? 250 : 255);
    doc.rect(14, y - 1, W - 28, 8, "F");
    doc.setTextColor(...GRAY);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`${i + 1}.`, 14, y + 5);
    doc.setTextColor(...BLACK);
    const theme = post.theme.length > 50 ? post.theme.slice(0, 47) + "..." : post.theme;
    doc.text(theme, 22, y + 5);
    doc.setTextColor(...GRAY);
    doc.text(`L ${post.likes}  C ${post.comments}  S ${post.saves}`, W - 60, y + 5);
    y += 9;
  });
  y += 6;

  if (data.demographics) {
    doc.setTextColor(...ACCENT);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("DEMOGRAPHICS", 14, y);
    y += 6;

    const { male, female, unknown } = data.demographics.genderSplit;
    doc.setTextColor(...BLACK);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(`Genero: Feminino ${female}%  Masculino ${male}%  Outro ${unknown}%`, 14, y);
    y += 7;

    doc.text("Top Cidades:", 14, y);
    y += 5;
    data.demographics.topCities.slice(0, 5).forEach((city) => {
      const barW = (W - 80) * (city.percentage / 100);
      doc.setFillColor(...ACCENT);
      doc.rect(40, y - 3, barW, 4, "F");
      doc.setTextColor(...GRAY);
      doc.text(`${city.city}`, 14, y);
      doc.text(`${city.percentage}%`, W - 20, y);
      y += 6;
    });
  }

  doc.setFillColor(...ACCENT);
  doc.rect(0, 285, W, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")} · Clique Boost`, 14, 292);

  return Buffer.from(doc.output("arraybuffer"));
}

export interface PalettePageData {
  clientName: string;
  paletteName: string;
  colors: Array<{ label: string; hex: string }>;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function generatePalettePDF(pages: PalettePageData[], brandName: string): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;
  const year = new Date().getFullYear();

  pages.forEach((page, pageIdx) => {
    if (pageIdx > 0) doc.addPage();

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, W, H, "F");

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(136, 136, 136);
    doc.text(brandName.toUpperCase(), 14, 18);
    doc.text(String(year), W - 14, 18, { align: "right" });

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(17, 17, 17);
    doc.text(page.paletteName, 14, 36);

    const swatchH = 100;
    const swatchY = 50;
    const colors = page.colors.slice(0, 4);
    const swatchW = (W - 28) / colors.length;

    colors.forEach((c, i) => {
      const x = 14 + i * swatchW;
      const rgb = hexToRgb(c.hex);
      doc.setFillColor(...rgb);
      doc.rect(x, swatchY, swatchW - 2, swatchH, "F");
    });

    const infoY = swatchY + swatchH + 12;
    colors.forEach((c, i) => {
      const x = 14 + i * swatchW;
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 17, 17);
      doc.text(c.label, x, infoY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(136, 136, 136);
      doc.text(c.hex.toUpperCase(), x, infoY + 5);
    });

    doc.setFontSize(7);
    doc.setTextColor(200, 200, 200);
    doc.text("Clique Boost · Identidade Visual", 14, H - 10);
    doc.text(`${pageIdx + 1} / ${pages.length}`, W - 14, H - 10, { align: "right" });
  });

  return Buffer.from(doc.output("arraybuffer"));
}
