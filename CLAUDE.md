# Social Media Clique Boost

Sistema de gerenciamento de social media para clientes da Clique Boost. Automatiza onboarding, geração de ICP, paleta de cores, calendário estratégico de conteúdo e coleta de métricas Meta.

## Path do Projeto
```
/Users/victorferro/Projetos/Clique Boost/Social Media Clique Boost/
```

## Vault Obsidian — REGRA OBRIGATÓRIA
**SEMPRE salvar documentos de clientes no Obsidian. O Obsidian é o Second Brain da Clique Boost — é a fonte de verdade de toda estratégia, ICP, calendário e análise. Nunca salvar apenas em Downloads ou pastas locais avulsas.**

```
/Users/victorferro/Library/Mobile Documents/iCloud~md~obsidian/Documents/[Clique Boost] - Second Brain/
  01 - Clientes/<clientId>/
    briefing.md          ← briefing do cliente
    ICP.md               ← perfil do cliente ideal
    paleta.md            ← paleta de cores
    estrategia-conteudo.md  ← estratégia e pilares
    funil-organico.md    ← funil de conversão
    mapa-mental.md       ← formatos virais + ganchos + temas
    concorrentes.md      ← análise de concorrentes
  03 - Calendários/<clientId>-YYYY-MM.md
```

**IDs de clientes existentes no Obsidian:**
- `isabela-castro` — Vida Bela (wellness/coaching)
- `lais-daltrozo` — Life Insurance
- `sam-fernandes` — Imóveis
- `tiago-zamboni` — Imóveis
- `bela-castro` — (pasta alternativa Bela)
- `nelson`, `fabricia`, `cantarelli`, `travis`, `victor-hugo-ferro`

**Ao criar ou atualizar qualquer documento de cliente: SEMPRE escrever no Obsidian primeiro, nunca só em Downloads.**

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

## Paletas de Cores Predefinidas

**Sistema de 10 paletas com 5 cores cada.** Cada cliente escolhe uma paleta ou cria variação personalizada.

### Paleta 1: Luxo Clássico
`#1A3A66` Azul Navy | `#2D5491` Azul Médio | `#B8941F` Dourado Escuro | `#D4AF37` Dourado Claro | `#FFFFFF` Branco

### Paleta 2: Moderno Clean  
`#1A3A66` Azul Navy | `#2D5491` Azul Claro | `#E6C563` Dourado Claro | `#1F2937` Preto | `#F5F5F5` Off-White

### Paleta 3: Nature Green
`#1B5E20` Verde Escuro | `#2C7A5E` Verde Médio | `#4CAF50` Verde Claro | `#FFFFFF` Branco | `#263238` Carvão

### Paleta 4: Minimalista
`#000000` Preto | `#FFFFFF` Branco | `#9CA3AF` Cinza | `#D4AF37` Dourado | `#87CEEB` Azul Claro

### Paleta 5: Tropical Vibes
`#2C7A5E` Verde Palmeira | `#E07B67` Coral | `#87CEEB` Azul Céu | `#FAFAFA` Branco | `#1F2937` Preto

### Paleta 6: Sunset Glow
`#E07B67` Coral | `#FF9800` Laranja | `#D4AF37` Dourado | `#000000` Preto | `#F5F5F5` Off-White

### Paleta 7: Tech Modern
`#2D5491` Azul Médio | `#00BCD4` Ciano | `#9CA3AF` Cinza | `#000000` Preto | `#FFFFFF` Branco

### Paleta 8: Elegância Escura
`#0F2441` Azul Escuro | `#7C3AED` Roxo | `#D4AF37` Dourado | `#000000` Preto | `#FFFFFF` Branco

### Paleta 9: Earth Tones
`#6B4423` Marrom | `#D2B48C` Bege | `#D4AF37` Dourado | `#2C7A5E` Verde | `#1F2937` Carvão

### Paleta 10: Vibrant Energy
`#DC2626` Vermelho | `#FF9800` Laranja | `#FBC02D` Amarelo | `#000000` Preto | `#FFFFFF` Branco

---

## Processo de Geração de Paleta

Ao gerar `paleta.md` para um cliente:

1. **Se cliente TEM identidade visual:** Registrar as cores principais + gerar 4 paletas complementares (variações)
2. **Se cliente NÃO TEM identidade visual:** Gerar 10 paletas completas (usar as predefinidas como base + personalizar)
3. **Formato obrigatório:** Cada paleta = 5 cores (Primária, Secundária, Acento 1, Acento 2, Neutro)
4. **Incluir no paleta.md:** HEX + RGB + nome + uso prático + quando usar

---

## Credenciais Pendentes (configurar no .env)
- `GOOGLE_SHEETS_CREDENTIALS` — Service Account JSON
- `GOOGLE_SHEETS_ID_INSURANCE` — ID da planilha Life Insurance
- `GOOGLE_SHEETS_ID_CORRETOR` — ID da planilha Corretor
- `TRELLO_API_KEY` + `TRELLO_TOKEN`
- `META_APP_ID` + `META_APP_SECRET`
