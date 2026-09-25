-- ============================================================
--  Sincronizacao automatica (opcional)
--
--  Sem isto o app so busca no banco quando alguem aperta o botao.
--  Com isto, o Postgres chama a Edge Function sozinho duas vezes por dia.
--
--  ANTES DE RODAR, troque os dois valores abaixo:
--    - SEU-PROJETO pela referencia do seu projeto Supabase
--    - SEU_CRON_SECRET pelo mesmo valor que voce colocou no secret
--      CRON_SECRET da funcao (supabase secrets set CRON_SECRET=...)
-- ============================================================

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net  with schema extensions;

-- Se ja existir um agendamento com esse nome, remove antes de recriar.
select cron.unschedule('sincroniza-pluggy')
where exists (select 1 from cron.job where jobname = 'sincroniza-pluggy');

select cron.schedule(
  'sincroniza-pluggy',
  '0 9,21 * * *',   -- 06h e 18h no horario de Brasilia (o cron roda em UTC)
  $cron$
    select net.http_post(
      url     := 'https://SEU-PROJETO.supabase.co/functions/v1/sync-pluggy',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'x-cron-secret', 'SEU_CRON_SECRET'
      ),
      body    := '{}'::jsonb
    );
  $cron$
);

-- Para conferir os agendamentos:      select * from cron.job;
-- Para ver as ultimas execucoes:       select * from cron.job_run_details order by start_time desc limit 10;
-- Para ver o resultado das chamadas:   select * from public.sincronizacoes order by iniciada_em desc limit 10;
