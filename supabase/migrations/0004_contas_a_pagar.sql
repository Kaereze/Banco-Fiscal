create table if not exists public.contas_a_pagar (
  id            uuid primary key default gen_random_uuid(),
  mes           date not null,
  descricao     text not null check (length(trim(descricao)) > 0),
  valor         numeric(14,2) check (valor is null or valor >= 0),
  vencimento    date,
  observacao    text,
  paga          boolean not null default false,
  paga_em       timestamptz,
  criado_por    uuid references auth.users(id) on delete set null default auth.uid(),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists contas_a_pagar_mes on public.contas_a_pagar (mes);

drop trigger if exists contas_a_pagar_atualizado_em on public.contas_a_pagar;
create trigger contas_a_pagar_atualizado_em
  before update on public.contas_a_pagar
  for each row execute function public.toca_atualizado_em();

alter table public.contas_a_pagar enable row level security;

drop policy if exists "familia usa contas a pagar" on public.contas_a_pagar;
create policy "familia usa contas a pagar" on public.contas_a_pagar
  for all to authenticated using (public.eh_da_familia()) with check (public.eh_da_familia());

comment on table public.contas_a_pagar is 'Bloco de notas das contas do mês: o que vence, quanto e se já foi pago.';
comment on column public.contas_a_pagar.mes is 'Sempre o dia 1 do mês a que a conta pertence.';
