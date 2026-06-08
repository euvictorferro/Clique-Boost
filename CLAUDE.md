# Social Media Clique Boost

Sistema de gerenciamento de social media para clientes da Clique Boost. Automatiza onboarding, geração de ICP, paleta de cores, calendário estratégico de conteúdo e coleta de métricas Meta.

## Path do Projeto
```
/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost/
```

## Vault Obsidian
```
/Users/victorferro/Library/Mobile Documents/iCloud~md~obsidian/Documents/[Clique Boost] - Second Brain/
  01 - Clientes/<clientId>/
    briefing.md
    ICP.md
    paleta.md
  03 - Calendários/<clientId>-YYYY-MM.md
```

## Como Executar

```bash
cd app
npm install

# Pipeline completo (novos briefings → onboarding → ICP → paleta → calendário → Trello)
npm run pipeline

# Atualização semanal de tópicos
npm run weekly-refresh

# Testes individuais
npm run test-sheets        # valida Google Sheets
npm run test-onboarding    # cria cliente mock no Obsidian
npm run test-icp <clientId>
npm run test-palette <clientId>
npm run test-calendar <clientId>
npm run test-meta <clientId>
```

## Variáveis de Ambiente
Copie `.env.example` para `.env` (na raiz do projeto, não dentro de `app/`).

## Stack
- Next.js 16 + TypeScript
- Claude Sonnet (ICP + paleta + calendário)
- Apify (scraping de concorrentes)
- Google Sheets API (leitura de briefings)
- Trello API (cards de calendário)
- Meta Graph API (métricas orgânicas)
- Obsidian (filesystem direto via iCloud)

## Módulos (src/lib/)
| Arquivo | Função |
|---|---|
| `googleSheets.ts` | Puxa e marca briefings novos |
| `onboarding.ts` | Cria cliente no sistema e no Obsidian |
| `icp.ts` | Gera ICP via Claude e salva no Obsidian |
| `palette.ts` | Gera 10 paletas ou registra identidade existente |
| `contentCalendar.ts` | Gera calendário mensal + refresh semanal |
| `trello.ts` | Cria board e cards por semana |
| `metaInsights.ts` | Busca métricas orgânicas via Meta Graph API |
| `obsidian.ts` | Helpers para leitura/escrita no vault |
| `clients.ts` | CRUD de data/clients.json |
| `claude.ts` | Wrapper do Claude API |
| `apify.ts` | Scraping de posts do Instagram |
| `types.ts` | Interfaces TypeScript centrais |

## Credenciais Pendentes (configurar no .env)
- `GOOGLE_SHEETS_CREDENTIALS` — Service Account JSON
- `GOOGLE_SHEETS_ID_INSURANCE` — ID da planilha Life Insurance
- `GOOGLE_SHEETS_ID_CORRETOR` — ID da planilha Corretor
- `TRELLO_API_KEY` + `TRELLO_TOKEN`
- `META_APP_ID` + `META_APP_SECRET`
