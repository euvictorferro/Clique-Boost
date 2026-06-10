/**
 * Gera o PDF "Checklist de Proteção Patrimonial" para Laís Daltrozo.
 * Execução: npx tsx scripts/gerar-checklist-lais.ts
 * Saída: data/checklist-protecao-patrimonial-lais.pdf
 */

import { jsPDF } from "jspdf";
import * as path from "path";
import * as fs from "fs";

// ─── Cores ────────────────────────────────────────────────────────────────────
const ROSA   = "#E91E8C";
const DOURADO = "#C9A84C";
const BRANCO = "#FFFFFF";
const CINZA_ESCURO = "#1A1A1A";
const CINZA_MEDIO  = "#444444";
const CINZA_CLARO  = "#F7F7F7";
const ROSA_CLARO   = "#FDE8F5";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function setFill(doc: jsPDF, hex: string) {
  doc.setFillColor(...hexToRgb(hex));
}

function setTextColor(doc: jsPDF, hex: string) {
  doc.setTextColor(...hexToRgb(hex));
}

function setDrawColor(doc: jsPDF, hex: string) {
  doc.setDrawColor(...hexToRgb(hex));
}

// ─── Conteúdo ─────────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    number: "01",
    title: "Sucessão e Inventário Internacional",
    subtitle: "A maior dor do brasileiro nos EUA",
    color: ROSA,
    items: [
      {
        label: "Planejamento Sucessório Transfronteiriço",
        desc: "Meus bens no Brasil estão estruturados para que meus herdeiros nos EUA não fiquem presos em um inventário judicial lento?",
      },
      {
        label: "Seguro de Vida Americano na Sucessão Brasileira",
        desc: "Tenho uma apólice nos EUA com liquidez imediata para cobrir ITCMD, taxas de cartório e custos de inventário no Brasil sem vender bens?",
      },
      {
        label: "Testamento Duplo (EUA + Brasil)",
        desc: "Tenho um testamento válido nos EUA e outro no Brasil, evitando conflito de jurisdições e leis entre os dois países?",
      },
    ],
  },
  {
    number: "02",
    title: "Proteção Patrimonial & Gestão de Risco",
    subtitle: "Blindar o que você construiu",
    color: DOURADO,
    items: [
      {
        label: "Blindagem de Bens no Brasil",
        desc: "Meus imóveis e ativos no Brasil estão protegidos por holding patrimonial ou cláusulas de incomunicabilidade e impenhorabilidade?",
      },
      {
        label: "Contratos e Negócios no Brasil",
        desc: "Meus contratos comerciais e empresariais no Brasil têm cláusulas de resolução extrajudicial para evitar litígios à distância?",
      },
    ],
  },
  {
    number: "03",
    title: "Resolução de Conflitos sem Judiciário",
    subtitle: "Solução digital, sigilosa e sem juiz",
    color: ROSA,
    items: [
      {
        label: "Mediação e Arbitragem Internacional",
        desc: "Sei como resolver disputas familiares, societárias ou de partilha de bens de forma 100% digital, sigilosa e sem depender do judiciário brasileiro?",
      },
      {
        label: "Cumprimento Extrajudicial de Obrigações",
        desc: "Tenho mecanismos para cobrar, notificar ou encerrar contratos no Brasil à distância, sem precisar estar presente ou contratar um advogado local caro?",
      },
    ],
  },
  {
    number: "04",
    title: "Transição de Carreira e Aposentadoria",
    subtitle: "Não perder o que você contribuiu",
    color: DOURADO,
    items: [
      {
        label: "Planejamento de Aposentadoria Cruzada",
        desc: "Conheço o Acordo Previdenciário Brasil-EUA e sei como usar meu tempo de contribuição no INSS junto com o sistema americano para não perder anos de previdência?",
      },
      {
        label: "Saída Definitiva e Patrimônio no Brasil",
        desc: "Entendo o impacto jurídico de manter contas, imóveis alugados ou empresas no Brasil após a entrega da Declaração de Saída Definitiva do País (DSDP)?",
      },
    ],
  },
];

// ─── Geração do PDF ──────────────────────────────────────────────────────────
function gerarPDF() {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const H = 297;

  // ── Capa ──────────────────────────────────────────────────────────────────
  // Fundo rosa na parte superior
  setFill(doc, ROSA);
  doc.rect(0, 0, W, 110, "F");

  // Fundo branco inferior
  setFill(doc, BRANCO);
  doc.rect(0, 110, W, H - 110, "F");

  // Ícone / badge "ISCA"
  setFill(doc, DOURADO);
  doc.roundedRect(75, 18, 60, 8, 2, 2, "F");
  setTextColor(doc, BRANCO);
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("GUIA GRATUITO • CLIQUE BOOST", 105, 23.5, { align: "center" });

  // Título principal
  setTextColor(doc, BRANCO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("Checklist de", 105, 45, { align: "center" });
  doc.setFontSize(30);
  doc.text("Proteção Patrimonial", 105, 57, { align: "center" });

  // Subtítulo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("para Brasileiros nos EUA", 105, 68, { align: "center" });

  // Linha dourada
  setDrawColor(doc, DOURADO);
  doc.setLineWidth(0.8);
  doc.line(60, 75, 150, 75);

  // Descrição
  doc.setFontSize(10);
  const descLines = doc.splitTextToSize(
    "Use este checklist para identificar lacunas na sua proteção patrimonial e descobrir quais passos tomar para proteger o que você construiu nos dois países.",
    110
  );
  doc.text(descLines, 105, 83, { align: "center" });

  // Nome no rodapé da capa
  setTextColor(doc, DOURADO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Laís Daltrozo", 105, 103, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTextColor(doc, BRANCO);
  doc.text("Life Insurance & Estate Planning Specialist", 105, 109, { align: "center" });

  // ── Instruções ──────────────────────────────────────────────────────────
  setFill(doc, ROSA_CLARO);
  doc.roundedRect(14, 116, W - 28, 18, 3, 3, "F");
  setTextColor(doc, CINZA_ESCURO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Como usar este checklist:", 20, 122);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  setTextColor(doc, CINZA_MEDIO);
  doc.text(
    "Marque ✓ nos itens que você JÁ tem resolvido. Os itens em branco são lacunas que precisam de atenção — e são exatamente esses que podemos resolver juntos.",
    20,
    128,
    { maxWidth: W - 40 }
  );

  // ── Seções ────────────────────────────────────────────────────────────────
  let y = 142;

  for (const section of SECTIONS) {
    // Verifica se cabe na página, se não, adiciona nova
    const estimatedHeight = 16 + section.items.length * 24 + 6;
    if (y + estimatedHeight > H - 20) {
      doc.addPage();
      y = 20;
    }

    // Header da seção
    setFill(doc, section.color);
    doc.roundedRect(14, y, W - 28, 12, 2, 2, "F");

    setTextColor(doc, BRANCO);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${section.number}  ${section.title}`, 20, y + 5.5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(section.subtitle, 20, y + 10);

    y += 15;

    // Itens
    for (const item of section.items) {
      const descLines = doc.splitTextToSize(item.desc, W - 60);
      const rowH = Math.max(20, 10 + descLines.length * 4.5);

      if (y + rowH > H - 20) {
        doc.addPage();
        y = 20;
      }

      // Fundo do item (alternado)
      setFill(doc, CINZA_CLARO);
      doc.roundedRect(14, y, W - 28, rowH, 2, 2, "F");

      // Checkbox
      setDrawColor(doc, section.color);
      doc.setLineWidth(0.6);
      doc.roundedRect(20, y + (rowH - 6) / 2, 6, 6, 1, 1, "S");

      // Label
      setTextColor(doc, CINZA_ESCURO);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.text(item.label, 30, y + 6);

      // Descrição
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      setTextColor(doc, CINZA_MEDIO);
      doc.text(descLines, 30, y + 11.5);

      y += rowH + 3;
    }

    y += 4;
  }

  // ── Última página: CTA ────────────────────────────────────────────────────
  if (y > H - 55) {
    doc.addPage();
    y = 30;
  } else {
    y += 6;
  }

  // Linha dourada divisória
  setDrawColor(doc, DOURADO);
  doc.setLineWidth(0.5);
  doc.line(14, y, W - 14, y);
  y += 10;

  // Caixa CTA rosa
  setFill(doc, ROSA);
  doc.roundedRect(14, y, W - 28, 44, 4, 4, "F");

  setTextColor(doc, BRANCO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Ficou com algum item em branco?", 105, y + 11, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const ctaLines = doc.splitTextToSize(
    "Cada item sem ✓ é uma vulnerabilidade real no seu patrimônio. A boa notícia: todos eles têm solução. Agende uma conversa gratuita de 20 minutos comigo — sem compromisso, em português.",
    W - 50
  );
  doc.text(ctaLines, 105, y + 20, { align: "center" });

  setFill(doc, DOURADO);
  doc.roundedRect(65, y + 33, 80, 8, 2, 2, "F");
  setTextColor(doc, BRANCO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("Manda 'CHECKLIST' no meu direct →  @laisdaltrozo", 105, y + 38.5, { align: "center" });

  // Rodapé
  y += 55;
  setTextColor(doc, "#AAAAAA" as any);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setTextColor(doc, doc.setTextColor(170, 170, 170) as any);
  doc.setTextColor(170, 170, 170);
  doc.text("Este material foi produzido pela Clique Boost para Laís Daltrozo — Life Insurance & Estate Planning Specialist", 105, y, { align: "center" });
  doc.text("As informações aqui apresentadas têm caráter educativo e não substituem consultoria jurídica ou financeira especializada.", 105, y + 4.5, { align: "center" });

  // ── Salvar ────────────────────────────────────────────────────────────────
  const outDir = path.join(process.cwd(), "..", "data");
  const outPath = path.join(outDir, "checklist-protecao-patrimonial-lais.pdf");

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const buf = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(outPath, buf);

  console.log(`✅ PDF gerado: ${outPath}`);
  console.log(`   Tamanho: ${(buf.length / 1024).toFixed(1)} KB`);
}

gerarPDF();
