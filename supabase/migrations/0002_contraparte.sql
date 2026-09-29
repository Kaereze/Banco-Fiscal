alter table public.transacoes
  add column if not exists contraparte text,
  add column if not exists cnpj text,
  add column if not exists atividade text,
  add column if not exists mensagem text;

comment on column public.transacoes.contraparte is 'Quem recebeu (saída) ou quem pagou (entrada), segundo o banco.';
comment on column public.transacoes.cnpj is 'CNPJ do estabelecimento ou da contraparte. CPF de pessoas não é guardado.';
comment on column public.transacoes.atividade is 'Ramo do estabelecimento segundo a Pluggy.';
comment on column public.transacoes.mensagem is 'Mensagem que acompanha o PIX, quando existe.';
