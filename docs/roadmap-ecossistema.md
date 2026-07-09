# Roadmap — Ecossistema Clique Boost

> Visão: substituir ferramentas externas (Trello, Google Forms) por features nativas do app, com duas visualizações — **Agência** (todos os clientes) e **Cliente** (só os próprios dados).

Atualizado: 09/jul/2026

---

## O QUE JÁ EXISTE ✅

| Área | Status |
|---|---|
| Auth com 2 perfis (agência + portal do cliente via Supabase Auth) | ✅ |
| Cadastro de clientes + briefing via Google Sheets (externo) | ✅ funciona, mas depende do Google Forms |
| Planos + comprovante de pagamento + gate no pipeline (Fase 1) | ✅ jul/2026 |
| Geração por IA: ICP, paleta, estratégia, calendário mensal | ✅ |
| Calendário sincronizado com Trello (externo) | ✅ funciona, mas depende do Trello |
| Métricas orgânicas Meta + dashboard + insights comparativo | ✅ |
| Pipeline com logs + cron diário | ✅ |
| Reuniões via Granola (sync básico) | ✅ parcial |
| Geração de posts + vídeo (whisper, editor) | ✅ base existe |

## O QUE FALTA — POR PRIORIDADE

### 🥇 P1 — Kanban/Calendário nativo (substitui o Trello)
É a dependência externa mais usada no dia a dia e a feature mais visível pro cliente.
- Tabelas: `boards`, `board_columns`, `cards` (com labels, dia da semana, formato, status)
- Visualização Kanban (colunas: Ideias, Semana 1-4, Postados) + visualização Calendário (mensal)
- Drag-and-drop, tags de canal (Instagram/TikTok/Facebook) e de dia
- Pipeline passa a escrever cards no banco em vez do Trello (manter sync Trello como opção durante a transição)
- Visão agência: board de qualquer cliente | Visão cliente: só o próprio board
- Migração: importar boards existentes do Trello (a API já está integrada)

### 🥈 P2 — Formulários nativos (substitui Google Forms)
Fecha o ciclo de onboarding 100% dentro do app.
- Tabelas: `forms`, `form_fields`, `form_responses`
- Builder simples na visão agência (criar/editar perguntas, tipos: texto, múltipla escolha, arquivo)
- Página pública por link (estilo Typeform, uma pergunta por vez) — sem login
- Resposta de briefing dispara o onboarding automático (substitui o cron do Sheets)
- Reuso: o mesmo motor serve pra qualquer formulário futuro (feedback, pesquisa, etc.)

### 🥉 P3 — Tela de Estratégia consolidada
Já existe geração de estratégia; falta virar uma feature apresentável.
- Visão unificada: ICP + paleta + tipografia (Fase 2 do roadmap antigo) + funil + pilares de conteúdo
- Editável pela agência, visível (read-only) pro cliente no portal
- Versionamento simples (histórico de revisões)

### 4️⃣ P4 — Módulo de Tráfego Pago
- Estratégia de ads gerada por IA (orçamento, segmentação, ganchos) por plano
- Meta Marketing API: CTR, CPC, alcance por campanha/criativo
- Precisa de você: permissões `ads_read` no app Meta

### 5️⃣ P5 — Portal do cliente completo
Depende de P1-P3 prontos pra ter o que mostrar.
- Dashboard do cliente: briefing, ICP, estratégia, calendário (read-only ou com aprovação de posts), métricas
- Fluxo de aprovação: cliente aprova/comenta cards do calendário
- Notificações (email) quando conteúdo novo é publicado pra aprovação

### 6️⃣ P6 — Loop de inteligência
- Tabela `strategy_recommendations` (métrica → recomendação → resultado → ajuste)
- Granola: decisões de reunião alimentam a estratégia da semana seguinte

### 7️⃣ P7 — Multi-agência (comercialização)
- Entidade `agencies`, RLS por agência, white-label, billing Stripe
- Só depois de validar tudo internamente

---

## ORDEM SUGERIDA DE EXECUÇÃO

```
P1 Kanban nativo  →  P2 Formulários  →  P3 Estratégia  →  P5 Portal cliente
                                      ↘  P4 Ads (paralelo, quando Meta liberar)
P6 e P7 por último
```

**Racional:** P1 e P2 eliminam as duas dependências externas (Trello + Google Forms) e são pré-requisito do portal do cliente (P5). P4 é independente e pode rodar em paralelo. P6/P7 só fazem sentido com o ecossistema fechado.
