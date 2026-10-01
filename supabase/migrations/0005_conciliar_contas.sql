alter table public.contas_a_pagar
  add column if not exists identificador text,
  add column if not exists transacao_id text references public.transacoes(id) on delete set null,
  add column if not exists conciliar boolean not null default true;

create unique index if not exists contas_a_pagar_transacao_unica
  on public.contas_a_pagar (transacao_id) where transacao_id is not null;

comment on column public.contas_a_pagar.identificador is 'Trecho que aparece no extrato do banco para este pagamento (ex.: CELESC). Opcional.';
comment on column public.contas_a_pagar.transacao_id is 'Pagamento do banco que quitou a conta.';
comment on column public.contas_a_pagar.conciliar is 'Falso quando a pessoa desfez a quitação à mão: o banco não marca de novo.';

create or replace function public.conciliar_contas_a_pagar()
returns integer
language plpgsql
security invoker
set search_path = public
as $fn$
declare
  conta record;
  pagamento record;
  quitadas integer := 0;
begin
  for conta in
    select * from public.contas_a_pagar
    where not paga and conciliar and valor is not null and transacao_id is null
    order by vencimento nulls last, criado_em
  loop
    select t.id, t.data
      into pagamento
      from public.transacoes t
     where t.origem = 'pluggy'
       and t.valor < 0
       and (
         not t.ignorada
         or exists (select 1 from public.contas k where k.id = t.conta_id and k.tipo is distinct from 'CREDIT')
       )
       and abs(-t.valor - conta.valor) <= 0.05
       and t.data between conta.mes - 10 and (conta.mes + interval '1 month')::date + 9
       and (
         conta.identificador is null
         or lower(t.descricao || ' ' || coalesce(t.estabelecimento, '') || ' ' || coalesce(t.contraparte, ''))
            like '%' || lower(conta.identificador) || '%'
       )
       and not exists (select 1 from public.contas_a_pagar o where o.transacao_id = t.id)
     order by abs(t.data - coalesce(conta.vencimento, conta.mes)), t.data
     limit 1;

    if found then
      update public.contas_a_pagar
         set paga = true, paga_em = pagamento.data, transacao_id = pagamento.id
       where id = conta.id;
      quitadas := quitadas + 1;
    end if;
  end loop;

  return quitadas;
end;
$fn$;

grant execute on function public.conciliar_contas_a_pagar() to authenticated;
