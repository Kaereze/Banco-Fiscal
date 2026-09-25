-- ============================================================
--  Banco Fiscal - controle de gastos da familia
--  Schema inicial
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Membros da familia
-- ------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users on delete cascade,
  nome       text not null,
  cor        text not null default '#2563eb',
  criado_em  timestamptz not null default now()
);

-- Usada por todas as policies. SECURITY DEFINER e essencial: sem ele a
-- policy de profiles consultaria profiles com RLS ligado e entraria em
-- recursao infinita.
create function public.eh_da_familia()
returns boolean
language sql
stable
security definer
set search_path = public
as $fn$
  select exists (select 1 from public.profiles where id = auth.uid());
$fn$;

-- ------------------------------------------------------------
-- Categorias de gasto/receita
-- ------------------------------------------------------------
create table public.categorias (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null unique,
  emoji      text not null default '💸',
  cor        text not null default '#64748b',
  tipo       text not null default 'gasto' check (tipo in ('gasto', 'receita')),
  essencial  boolean not null default false,
  ordem      integer not null default 100
);

-- ------------------------------------------------------------
-- Contas bancarias (espelho das contas da Pluggy)
-- ------------------------------------------------------------
create table public.contas (
  id              text primary key,        -- account id da Pluggy
  item_id         text not null,           -- item (conexao) da Pluggy
  instituicao     text not null,
  nome            text not null,
  tipo            text,                    -- BANK | CREDIT
  subtipo         text,
  numero          text,
  saldo           numeric(14,2),
  limite          numeric(14,2),
  moeda           text not null default 'BRL',
  dono            text,                    -- rotulo livre: "Joao", "Pai"...
  ativa           boolean not null default true,
  sincronizado_em timestamptz
);

-- ------------------------------------------------------------
-- Transacoes
-- ------------------------------------------------------------
create table public.transacoes (
  id                  text primary key,    -- id da Pluggy, ou man_<uuid> se manual
  conta_id            text references public.contas(id) on delete cascade,
  data                date not null,
  descricao           text not null,
  descricao_original  text,
  -- Sinal normalizado por nos: negativo = saida, positivo = entrada.
  -- A Pluggy manda amount sempre positivo e a direcao vem no campo type.
  valor               numeric(14,2) not null,
  moeda               text not null default 'BRL',
  categoria_id        uuid references public.categorias(id) on delete set null,
  categoria_pluggy    text,
  pessoa              text,
  origem              text not null default 'pluggy' check (origem in ('pluggy', 'manual')),
  metodo              text,
  estabelecimento     text,
  observacao          text,
  -- transferencias entre contas da familia nao sao gasto de verdade
  ignorada            boolean not null default false,
  criado_por          uuid references public.profiles(id) on delete set null,
  criado_em           timestamptz not null default now(),
  atualizado_em       timestamptz not null default now()
);

create index transacoes_data_idx      on public.transacoes (data desc);
create index transacoes_categoria_idx on public.transacoes (categoria_id);
create index transacoes_conta_idx     on public.transacoes (conta_id);

-- ------------------------------------------------------------
-- Regras de categorizacao automatica
-- ------------------------------------------------------------
create table public.regras (
  id           uuid primary key default gen_random_uuid(),
  padrao       text not null,            -- trecho procurado na descricao (minusculo, sem acento)
  categoria_id uuid references public.categorias(id) on delete cascade,
  pessoa       text,
  prioridade   integer not null default 100,
  criado_em    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Orcamento mensal por categoria
-- ------------------------------------------------------------
create table public.orcamentos (
  id           uuid primary key default gen_random_uuid(),
  categoria_id uuid not null references public.categorias(id) on delete cascade,
  mes          date not null,            -- sempre o dia 1 do mes
  limite       numeric(14,2) not null check (limite >= 0),
  unique (categoria_id, mes)
);

-- ------------------------------------------------------------
-- Registro de sincronizacoes
-- ------------------------------------------------------------
create table public.sincronizacoes (
  id             uuid primary key default gen_random_uuid(),
  iniciada_em    timestamptz not null default now(),
  terminada_em   timestamptz,
  sucesso        boolean,
  contas         integer not null default 0,
  novas          integer not null default 0,
  atualizadas    integer not null default 0,
  erro           text
);

-- ------------------------------------------------------------
-- atualizado_em automatico
-- ------------------------------------------------------------
create function public.toca_atualizado_em()
returns trigger
language plpgsql
as $fn$
begin
  new.atualizado_em = now();
  return new;
end;
$fn$;

create trigger transacoes_atualizado_em
  before update on public.transacoes
  for each row execute function public.toca_atualizado_em();

-- ------------------------------------------------------------
-- Row Level Security: quem esta em profiles enxerga tudo da familia
-- ------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.categorias     enable row level security;
alter table public.contas         enable row level security;
alter table public.transacoes     enable row level security;
alter table public.regras         enable row level security;
alter table public.orcamentos     enable row level security;
alter table public.sincronizacoes enable row level security;

create policy "familia le perfis" on public.profiles
  for select to authenticated using (public.eh_da_familia());

create policy "edita o proprio perfil" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "familia usa categorias" on public.categorias
  for all to authenticated using (public.eh_da_familia()) with check (public.eh_da_familia());

create policy "familia usa contas" on public.contas
  for all to authenticated using (public.eh_da_familia()) with check (public.eh_da_familia());

create policy "familia usa transacoes" on public.transacoes
  for all to authenticated using (public.eh_da_familia()) with check (public.eh_da_familia());

create policy "familia usa regras" on public.regras
  for all to authenticated using (public.eh_da_familia()) with check (public.eh_da_familia());

create policy "familia usa orcamentos" on public.orcamentos
  for all to authenticated using (public.eh_da_familia()) with check (public.eh_da_familia());

create policy "familia le sincronizacoes" on public.sincronizacoes
  for select to authenticated using (public.eh_da_familia());

-- ------------------------------------------------------------
-- Categorias iniciais
-- ------------------------------------------------------------
insert into public.categorias (nome, emoji, cor, tipo, essencial, ordem) values
  ('Moradia',              '🏠', '#0ea5e9', 'gasto',   true,  10),
  ('Mercado',              '🛒', '#22c55e', 'gasto',   true,  20),
  ('Transporte',           '🚗', '#f59e0b', 'gasto',   true,  30),
  ('Saúde',                '💊', '#ef4444', 'gasto',   true,  40),
  ('Educação',             '📚', '#8b5cf6', 'gasto',   true,  50),
  ('Contas e assinaturas', '🧾', '#6366f1', 'gasto',   true,  60),
  ('Restaurante',          '🍽', '#fb7185', 'gasto',   false, 70),
  ('Lazer',                '🎬', '#ec4899', 'gasto',   false, 80),
  ('Compras',              '🛍', '#14b8a6', 'gasto',   false, 90),
  ('Pets',                 '🐾', '#a3a3a3', 'gasto',   false, 100),
  ('Outros',               '💸', '#64748b', 'gasto',   false, 900),
  ('Salário',              '💰', '#16a34a', 'receita', false, 1000),
  ('Outras entradas',      '📈', '#059669', 'receita', false, 1010);
