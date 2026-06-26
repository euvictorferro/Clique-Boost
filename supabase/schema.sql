-- ============================================================
-- Social Media Clique Boost — Supabase Schema
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================

-- Clientes
create table if not exists clients (
  id                   text primary key,           -- slug: 'lais-daltrozo'
  name                 text not null,
  brand_name           text not null default '',
  niche                text not null default 'general',
  instagram_handle     text,
  competitors          text[] default '{}',
  social_networks      text[] default '{}',
  tone_of_voice        text default '',
  content_goal         text default '',
  has_visual_identity  boolean default false,
  brand_colors         text,
  palette_names        text,
  trello_board_id      text,
  meta_access_token    text,
  meta_token_expires_at timestamptz,
  profile_picture_url  text,
  supabase_user_id     text unique,                -- Sprint 1: Supabase Auth
  ad_account_id        text,                       -- Sprint 3: Meta Ads Manager
  status               text default 'active' check (status in ('onboarding','active','paused')),
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Documentos do cliente (substitui Obsidian como storage programático)
create table if not exists client_documents (
  id          uuid primary key default gen_random_uuid(),
  client_id   text not null references clients(id) on delete cascade,
  doc_type    text not null,  -- 'icp' | 'palette' | 'brand-guidelines' | 'strategy' | 'funnel' | 'mental-map' | 'competitors' | 'briefing' | 'calendar' | 'analysis' | 'voice' | 'profile'
  month       text,           -- apenas para calendários: '2026-06'
  week_label  text,           -- apenas para análises semanais: '2026-w24'
  content     text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Constraint necessária para upsert (onConflict)
create unique index if not exists idx_client_documents_upsert
  on client_documents(client_id, doc_type, coalesce(month, ''), coalesce(week_label, ''));

create index if not exists idx_client_documents_client_id on client_documents(client_id);
create index if not exists idx_client_documents_type on client_documents(client_id, doc_type);

-- Reuniões
create table if not exists meetings (
  id           uuid primary key,
  title        text not null,
  date         timestamptz,
  participants text[] default '{}',
  client_ids   text[] default '{}',
  summary      text,
  synced_at    timestamptz default now()
);

create index if not exists idx_meetings_client_ids on meetings using gin(client_ids);

-- Logs do pipeline
create table if not exists pipeline_logs (
  id          text primary key,
  date        timestamptz default now(),
  job         text not null,
  client_id   text,
  client_name text,
  status      text not null check (status in ('success','error','running')),
  message     text,
  duration_ms integer,
  details     jsonb
);

create index if not exists idx_pipeline_logs_client on pipeline_logs(client_id);
create index if not exists idx_pipeline_logs_date on pipeline_logs(date desc);

-- Posts de concorrentes (scraping via Apify)
create table if not exists competitor_posts (
  id               uuid primary key default gen_random_uuid(),
  client_id        text references clients(id) on delete cascade,
  username         text not null,
  url              text,
  video_url        text,
  likes_count      integer default 0,
  comments_count   integer default 0,
  video_play_count integer,
  caption          text,
  type             text,
  timestamp        timestamptz,
  fetched_at       timestamptz default now()
);

create index if not exists idx_competitor_posts_client on competitor_posts(client_id);

-- ============================================================
-- Row Level Security (ativar após Sprint 1 — Clerk + Auth)
-- ============================================================

-- alter table clients enable row level security;
-- alter table client_documents enable row level security;
-- alter table meetings enable row level security;
-- alter table pipeline_logs enable row level security;
-- alter table competitor_posts enable row level security;

-- Políticas serão adicionadas no Sprint 1 com Supabase Auth
