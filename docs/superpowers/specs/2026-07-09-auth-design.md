# Auth MVP — Design Spec
**Data:** 2026-07-09  
**Status:** Aprovado

---

## Contexto

O sistema tem dois tipos de usuário com experiências completamente separadas:

- **Agência** (`role: agency`) — time interno da Clique Boost. Acessa o painel em `/` (clients, pipeline, calendário, insights).
- **Cliente** (`role: client`) — cada cliente da agência. Acessa apenas o próprio portal em `/client/dashboard`.

O Supabase Auth já está configurado com `app_metadata.role` distinguindo os dois tipos. O middleware redireciona corretamente. O que falta é completar as telas de acesso.

---

## Fluxo de Autenticação

### Agência

1. Qualquer pessoa do time acessa `/sign-up`, preenche nome + email + senha → conta criada com `role: agency`.
2. Login via `/sign-in` (já existe) com email + senha → redireciona para `/`.
3. `/sign-in` recebe link "Criar conta" apontando para `/sign-up`.

### Cliente

1. A agência, ao cadastrar um cliente no sistema (tela de novo cliente), aciona `POST /api/auth/invite-client`.
2. A API usa o **Supabase Admin SDK** (service role key) para criar o usuário com:
   - `app_metadata.role = "client"`
   - `app_metadata.clientId = "<id do cliente>"`
3. O Supabase envia email automático de convite (link para definir senha).
4. O cliente clica no link → cai em `/auth/callback` → troca o token → é redirecionado para `/client/sign-in` já autenticado (ou direto para `/client/dashboard` se a sessão estiver ativa).
5. Login futuro via `/client/sign-in` com email + senha → `/client/dashboard`.

---

## Páginas

### `/sign-in` (agência) — já existe, ajuste mínimo
- Adicionar link "Criar conta" → `/sign-up`
- Visual: mantém o card atual (Clique Boost, Acesso interno da agência)

### `/sign-up` (agência) — nova
- Campos: Nome completo, Email, Senha, Confirmar senha
- Submit → `supabase.auth.signUp({ email, password, options: { data: { name } } })`
- Após signup: chama `POST /api/auth/set-agency-role` para setar `app_metadata.role = "agency"` via service role (signUp não seta app_metadata diretamente no client)
- Redireciona para `/` após sucesso
- Link "Já tenho conta" → `/sign-in`

### `/client/sign-in` — nova
- Campos: Email, Senha
- Submit → `supabase.auth.signInWithPassword`
- Redireciona para `/client/dashboard`
- Visual: variante do card com identidade da Clique Boost (mas sem link "Criar conta" — cliente não se auto-registra)
- Mensagem de boas-vindas: "Portal do Cliente — Clique Boost"

### `/auth/callback` — nova
- Route handler (não page): troca o `code` da URL por sessão via `supabase.auth.exchangeCodeForSession(code)`
- Detecta o role do usuário após troca:
  - `agency` → redireciona para `/`
  - `client` → redireciona para `/client/dashboard`
  - Sem role → redireciona para `/sign-in`

---

## API Routes

### `POST /api/auth/invite-client`
**Corpo:** `{ clientId: string, email: string, name: string }`  
**Auth:** apenas usuários com `role: agency`  
**Ação:**
```ts
supabaseAdmin.auth.admin.inviteUserByEmail(email, {
  data: { role: "client", clientId }
})
```
**Resposta:** `{ ok: true }` ou erro

### `POST /api/auth/set-agency-role`
**Corpo:** `{ userId: string }`  
**Sem auth pública** — chamado imediatamente após `signUp` passando o `user.id` retornado  
**Ação:**
```ts
supabaseAdmin.auth.admin.updateUserById(userId, {
  app_metadata: { role: "agency" }
})
```
**Nota de segurança:** esse endpoint é chamado pelo próprio front logo após o signup. No MVP isso é aceitável. Em produção, mover para um trigger no Supabase (database webhook no `auth.users`).

---

## Middleware (ajuste)

Adicionar `/sign-up` e `/auth/callback` à lista `PUBLIC_PATHS`:

```ts
const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/client/sign-in", "/auth/callback"];
```

---

## Fora do escopo (MVP)

- Recuperação de senha (o Supabase tem a tela nativa — basta habilitar no dashboard)
- Roles granulares dentro da agência (owner vs colaborador)
- Verificação de email obrigatória no signup da agência
- Expiração / revogação de convites

---

## Arquivos a criar/modificar

| Arquivo | Ação |
|---|---|
| `src/middleware.ts` | Adicionar `/sign-up` e `/auth/callback` em `PUBLIC_PATHS` |
| `src/app/sign-in/[[...sign-in]]/page.tsx` | Adicionar link "Criar conta" |
| `src/app/sign-up/page.tsx` | Criar página de signup da agência |
| `src/app/client/sign-in/page.tsx` | Criar página de login do cliente |
| `src/app/auth/callback/route.ts` | Criar route handler de callback |
| `src/app/api/auth/invite-client/route.ts` | Criar endpoint de convite |
| `src/app/api/auth/set-agency-role/route.ts` | Criar endpoint de role pós-signup |
