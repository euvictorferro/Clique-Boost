-- ============================================================
-- Kanban nativo — substitui integração Trello (P1)
-- ============================================================

-- Board: um por cliente
create table if not exists boards (
  id         uuid primary key default gen_random_uuid(),
  client_id  text not null references clients(id) on delete cascade,
  name       text not null,
  created_at timestamptz default now()
);

create unique index if not exists idx_boards_client on boards(client_id);
create index if not exists idx_boards_client_id on boards(client_id);

-- Colunas do board (Backlog, Semana 1-4, Postados)
create table if not exists board_columns (
  id         uuid primary key default gen_random_uuid(),
  board_id   uuid not null references boards(id) on delete cascade,
  name       text not null,
  position   int  not null,
  created_at timestamptz default now()
);

create index if not exists idx_board_columns_board on board_columns(board_id, position);

-- Cards (um por post)
create table if not exists cards (
  id           uuid primary key default gen_random_uuid(),
  column_id    uuid not null references board_columns(id) on delete cascade,
  board_id     uuid not null references boards(id) on delete cascade,
  position     int  not null default 0,
  title        text not null,
  week         int,
  day          int,
  date         date,
  theme        text,
  format       text,           -- Reel | Carrossel | Stories | TikTok
  platforms    text[] default '{}',
  hook         text,
  caption      text,
  hashtags     text,
  objective    text,
  rationale    text,
  stories_idea text,
  notes        text,
  status       text not null default 'draft' check (status in ('draft','pending','approved','published')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists idx_cards_column  on cards(column_id, position);
create index if not exists idx_cards_board   on cards(board_id);
create index if not exists idx_cards_date    on cards(date);

-- RLS
alter table boards       enable row level security;
alter table board_columns enable row level security;
alter table cards        enable row level security;

-- Service role bypassa RLS (usado pelo backend com SUPABASE_SERVICE_ROLE_KEY)
-- Políticas permissivas para service role; autenticação de usuário final será adicionada no Sprint de portal
create policy "service_role_boards"        on boards        using (true) with check (true);
create policy "service_role_board_columns" on board_columns using (true) with check (true);
create policy "service_role_cards"         on cards         using (true) with check (true);

-- Adiciona board_id na tabela clients (referência ao board nativo)
alter table clients add column if not exists board_id uuid references boards(id);
