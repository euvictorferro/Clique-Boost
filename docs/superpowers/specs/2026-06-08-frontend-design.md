# Frontend — Social Media Clique Boost
**Data:** 2026-06-08

## Contexto

Dashboard interno de gestão de social media para a Clique Boost. Usado exclusivamente pelo Victor para acompanhar clientes, visualizar métricas, revisar calendários de conteúdo e exportar relatórios. Roda localmente (`localhost`) com Next.js — sem hospedagem externa por enquanto.

---

## Tecnologia

- **Framework:** Next.js 16 + TypeScript (já existente no projeto)
- **Estilo:** Tailwind CSS + shadcn/ui
- **Fonte:** Inter (Google Fonts)
- **Gráficos:** Recharts
- **PDF export:** react-pdf ou jsPDF
- **Responsividade:** otimizado para 1280px+

---

## Design System

| Token | Valor |
|---|---|
| Accent | `#8b5cf6` (Violet 500) |
| Accent light | `#8b5cf611` |
| Accent border | `#8b5cf633` |
| Background | `#f5f5f5` |
| Surface | `#ffffff` |
| Border | `#e5e5e5` |
| Text primary | `#111111` |
| Text secondary | `#888888` |
| Success | `#059669` |
| Warning | `#d97706` |
| Danger | `#e11d48` |

---

## Layout Global

Estrutura de 3 colunas fixas:

```
┌──────┬───────────────────┬────────────────────────────┐
│ 52px │      200px        │          flex:1            │
│ icons│  context panel    │     main content           │
└──────┴───────────────────┴────────────────────────────┘
```

### Coluna 1 — Ícones (52px)
- Logo Clique Boost no topo
- Ícones de navegação: Dashboard, Clientes, Calendário, Insights, Pipeline, Configurações
- Ícone ativo com fundo `accent-light` e borda `accent-border`
- Tooltip com nome da seção ao hover

### Coluna 2 — Painel de contexto (200px)
Conteúdo varia por seção ativa:
- **Clientes:** lista com avatar circular (inicial do nome em fundo colorido) + nome do cliente. Agrupado por nicho com label separador. Item ativo em roxo.
- **Outras seções:** título da seção + sub-navegação quando aplicável.

### Coluna 3 — Conteúdo principal
Área scrollável com o conteúdo de cada tela.

---

## Seções

### 1. Dashboard Geral

**URL:** `/`

Layout:
1. **KPIs** (3 cards no topo): Total de seguidores (soma de todos), Alcance médio 30d, Taxa de engajamento média
2. **Gráfico comparativo** (linha): crescimento de seguidores de todos os clientes no mesmo período. Toggle: 7d / 30d / 90d. Cada cliente com cor única.
3. **Ranking de clientes** (tabela): posição, cliente, seguidores, crescimento 30d, engajamento, alcance. Ordenável por coluna.

---

### 2. Perfil do Cliente

**URL:** `/clients/[clientId]`

Layout interno com mini-sidebar + área de conteúdo:

**Mini-sidebar (dentro do painel principal):**
- Avatar + nome + nicho + status (badge)
- Menu vertical: Métricas · Calendário · ICP · Paleta · Configurações do cliente

#### 2a. Aba Métricas

**Plataformas:**
Cards horizontais por rede social. Instagram ativo (borda roxa, clicável). TikTok, LinkedIn, Meta Ads com opacidade 40%, cursor `not-allowed`, tooltip "Em desenvolvimento" ao hover.

**KPIs** (4 cards):
- Seguidores (com variação ↑↓ em verde/vermelho)
- Alcance 30d
- Impressões 30d
- Taxa de engajamento

**Gráfico de crescimento:**
Linha de seguidores ao longo do tempo. Toggle: 7d / 30d / 90d.

**Top 5 Posts** (lista ranqueada):
Posição (1–5) · Thumbnail colorido (cor por tipo) · Tema do post · ❤️ curtidas · 💬 comentários · 🔖 saves · Tipo (badge: Reel/Carrossel/Imagem) · Link "↗" para abrir no Instagram.

**Demographics** (3 blocos lado a lado):
- Pizza de gênero (feminino/masculino/não identificado)
- Barras de faixa etária (vertical, destaque na dominante)
- Ranking de top 5 cidades (barras horizontais com percentual)

**Botão "Exportar Relatório":**
Gera PDF com: período, KPIs, gráfico de crescimento, top 5 posts e demographics. Pronto para enviar ao cliente.

#### 2b. Aba Calendário

**Visão padrão:** mini-calendário mensal à esquerda + painel de detalhe do post à direita.
- Dias com post marcados com cor por formato: Reel (roxo), Carrossel (azul), Stories (verde), Imagem (cinza)
- Clique no dia abre o post no painel direito: tema, formato, gancho, objetivo, plataformas, notas
- Toggle "Grade / Lista" no header da aba

**Visão lista:** posts ordenados por data, mesmo estilo do painel de detalhe mas em lista vertical.

Botão "Regenerar Calendário" — chama o script `test-calendar.ts` via API route.

#### 2c. Aba ICP

Conteúdo do `ICP.md` renderizado como Markdown (títulos, listas, negrito).
- Botão "Editar" — abre editor de texto com o conteúdo bruto
- Botão "Regenerar" — chama Claude, confirma antes de sobrescrever
- Auto-save ao sair do editor

#### 2d. Aba Paleta

Grade 5×2 com as 10 paletas geradas:
- Cada card: faixa de 4 cores reais + nome da paleta + nomes das cores + hex codes (primeiros 2)
- Estado "Selecionada": borda roxa, badge "✓ Selecionada", check mark
- Estado padrão: botão "Selecionar" em cinza
- Clique em "Selecionar" → salva `selectedPalette` no cliente
- Botão "Baixar PDF" no header → gera PDF no estilo do Canva (uma paleta por página, nome da marca, ano, cores com nome e hex)
- Botão "Regenerar Paletas" → chama Claude, gera 10 novas opções

#### 2e. Aba Configurações do Cliente

Formulário com os dados do cliente:
- Nome, marca, nicho, Instagram handle, status, redes sociais, concorrentes, tom de voz, objetivo de conteúdo
- Campo "Meta Access Token" com badge de validade e data de expiração
- Botão "Re-autenticar Meta" → abre fluxo OAuth
- Botão "Salvar" → atualiza `clients.json`

---

### 3. Calendário Global

**URL:** `/calendar`

Visão consolidada de todos os clientes.
- Toggle: por cliente (filtro) ou todos juntos
- Mesmo layout de mini-calendário + lista/detalhe do perfil individual

---

### 4. Insights Comparativo

**URL:** `/insights`

Comparação entre clientes:
- Seletor de clientes (multi-select)
- Gráfico de linhas comparativo (mesma métrica, múltiplos clientes)
- Seletor de métrica: Seguidores / Alcance / Impressões / Engajamento
- Toggle período: 7d / 30d / 90d
- Tabela comparativa com todas as métricas

---

### 5. Pipeline / Automação

**URL:** `/pipeline`

Tabela de jobs agendados:

| Job | Frequência | Próxima execução | Último status | Duração |
|---|---|---|---|---|
| Calendário mensal | Todo dia 1 | 01/07/2026 | ✅ Sucesso | 2m 14s |
| Refresh semanal | Toda segunda | 15/06/2026 | ✅ Sucesso | 4m 02s |
| Coleta de métricas | Todo dia | 09/06/2026 | ✅ Sucesso | 0m 38s |

Abaixo da tabela: log das últimas 20 execuções (data, job, cliente, status, mensagem).

**Crons locais** configurados via `launchd` (Mac). Cada job chama uma API route do Next.js.

---

### 6. Configurações Globais

**URL:** `/settings`

**Tokens e APIs** (com badges de status):
- `META_APP_ID` / `META_APP_SECRET`
- `APIFY_API_TOKEN`
- `GOOGLE_SHEETS_CREDENTIALS`
- `TRELLO_API_KEY` / `TRELLO_TOKEN`

Badge de status: 🟢 Válido · 🟡 Expira em X dias (alerta quando < 14 dias) · 🔴 Expirado

**Horários dos crons** (editáveis):
- Calendário mensal: dia do mês + hora
- Refresh semanal: dia da semana + hora
- Coleta de métricas: hora do dia

**Salvar** → atualiza `.env` e reinicia os `launchd` plists.

---

## Adicionar Novo Cliente

Formulário acessível via botão "+" no painel de contexto (seção Clientes):
- Campos equivalentes ao Google Forms de briefing
- Ao salvar: cria entrada em `clients.json`, pasta no Obsidian, dispara ICP + paleta automaticamente
- Google Forms continua como canal primário — app é o canal alternativo

---

## Notificações (Toast)

Toast no canto inferior direito quando o app detecta execução de cron recente (verifica ao montar o layout):
- "✅ Refresh semanal concluído há 2h — 4 clientes atualizados"
- "⚠️ Token Meta expira em 8 dias"
- "🔴 Coleta de métricas falhou ontem"

Duração: 5s auto-dismiss. Clique para fechar.

---

## Estrutura de Arquivos

```
app/src/
  app/
    page.tsx                    # Dashboard geral
    clients/[clientId]/
      page.tsx                  # Perfil do cliente
      metrics/page.tsx
      calendar/page.tsx
      icp/page.tsx
      palette/page.tsx
      settings/page.tsx
    calendar/page.tsx           # Calendário global
    insights/page.tsx           # Comparativo
    pipeline/page.tsx           # Automação
    settings/page.tsx           # Config global
    api/
      clients/route.ts          # CRUD clients.json
      pipeline/run/route.ts     # Trigger manual (fallback)
      metrics/[clientId]/route.ts
      export/report/route.ts    # Gera PDF relatório
      export/palette/route.ts   # Gera PDF paleta
  components/
    layout/
      Sidebar.tsx               # Coluna ícones
      ContextPanel.tsx          # Coluna contexto
    dashboard/
      KpiCard.tsx
      GrowthChart.tsx
      ClientRanking.tsx
    client/
      PlatformCards.tsx
      MetricsKpis.tsx
      TopPostsList.tsx
      Demographics.tsx
      CalendarView.tsx
      IcpEditor.tsx
      PaletteGrid.tsx
    shared/
      Toast.tsx
      TokenBadge.tsx
      ExportButton.tsx
```

---

## Fora do Escopo (v1)

- Autenticação/login (uso pessoal local)
- Dark mode
- Mobile (< 1280px)
- TikTok, LinkedIn, Meta Ads (placeholders "Em desenvolvimento")
- Edição de posts no Trello via frontend
