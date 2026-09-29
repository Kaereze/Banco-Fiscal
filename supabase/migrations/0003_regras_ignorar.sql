alter table public.regras
  add column if not exists ignorar boolean not null default false;

comment on column public.regras.ignorar is 'Quando verdadeiro, a regra marca a transação como "não contar" em vez de dar categoria.';
