# Operação

O dia a dia depois que o sistema está de pé: desenvolver, publicar, distribuir
e consertar.

## Comandos frequentes

```bat
cd mobile
npx expo start              :: servidor de desenvolvimento
npx tsc --noEmit            :: conferir tipos
npx expo-doctor             :: diagnosticar dependências
```

```bat
:: republicar o sincronizador após mexer no código
npx supabase@latest functions deploy sync-pluggy --use-api --no-verify-jwt

:: disparar uma sincronização
curl -X POST "https://SEU-PROJETO.supabase.co/functions/v1/sync-pluggy" -H "x-cron-secret: SEU_CRON_SECRET" -H "Content-Type: application/json" -d "{}"
```

---

## Gerar o APK

O Expo Go serve para desenvolver, não para entregar: exigiria que cada pessoa
instalasse o Expo Go, abrisse um link toda vez, e só funcionaria com o
servidor de desenvolvimento no ar. O que se instala de verdade é um APK.

### Autenticação no Windows

O prompt interativo do Expo CLI é quebrado no cmd.exe. Use um token:

1. Abra [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)
2. Crie um token e copie

```bat
set "EXPO_TOKEN=o-token-criado"
```

### Variáveis de ambiente na nuvem

O build acontece nos servidores do Expo, que não enxergam seu `.env` local:

```bat
cd mobile
npx eas-cli@latest env:set preview --name EXPO_PUBLIC_SUPABASE_URL --value "https://SEU-PROJETO.supabase.co" --visibility plaintext
npx eas-cli@latest env:set preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "a-anon-key" --visibility plaintext
```

`preview` aparece duas vezes por motivos diferentes: é o **ambiente** onde a
variável fica guardada e o **perfil de build** do `eas.json`. Têm o mesmo nome
de propósito — o perfil declara `"environment": "preview"`, e é assim que o
build acha as variáveis.

> `env:create` existe mas está deprecado. Use `env:set`.

### Build

```bat
npx eas-cli@latest build:configure
npx eas-cli@latest build --platform android --profile preview
```

Em 10 a 20 minutos sai um link de download. Mande por WhatsApp. No Android a
pessoa precisa autorizar **"instalar de fontes desconhecidas"** uma única vez;
depois o ícone fica na tela inicial como qualquer app.

### Atualizações sem novo APK

Mudanças em JavaScript — telas, textos, cores, regras — vão pelo ar:

```bat
npx eas-cli@latest update --branch preview --message "novas categorias"
```

Os celulares pegam na próxima abertura. APK novo só é necessário ao adicionar
biblioteca com código nativo, mudar ícone, nome ou permissões.

---

## Sincronização automática

Por padrão os dados chegam quando alguém aperta **"Buscar no banco agora"**.
Para rodar sozinho duas vezes por dia, edite
[`supabase/opcional/sincronizacao_automatica.sql`](../supabase/opcional/sincronizacao_automatica.sql)
trocando `SEU-PROJETO` e `SEU_CRON_SECRET`, e rode no SQL Editor.

Ele usa `pg_cron` para agendar e `pg_net` para a chamada HTTP. O horário está
em UTC — `0 9,21 * * *` são 6h e 18h de Brasília.

```sql
select * from cron.job;                                        -- agendamentos
select * from cron.job_run_details order by start_time desc;   -- execuções
select * from sincronizacoes order by iniciada_em desc;        -- resultados
```

> As conexões do Meu Pluggy se atualizam sozinhas a cada 24 horas do lado da
> Pluggy. O agendamento só traz para o nosso banco o que já está lá.

---

## Investigar problemas

A CLI da Supabase **não tem comando de logs**. Dois caminhos:

**Painel:** Edge Functions → `sync-pluggy` → Logs.

**Tabela:** mais direto para saber o que aconteceu:

```sql
select iniciada_em, terminada_em, sucesso, contas, novas, erro
from sincronizacoes
order by iniciada_em desc
limit 10;
```

### Erros conhecidos

| Sintoma | Causa | O que fazer |
|---|---|---|
| `Invalid secret pair ... Must be NAME=VALUE` | Segredo com espaço quebrado pelo shell | Usar `secrets set --env-file` |
| `Cannot find project ref` | `link` não completou | Rodar `link`, ou usar o SQL Editor |
| `Could not find the table 'public.contas'` | Schema não aplicado | Passo 1 da [instalação](instalacao.md) |
| `Unknown subcommand "invoke"` | `functions invoke` não existe | Chamar por `curl` |
| `nao tem permissao para listar items` | Aplicação demo não lista | Definir `PLUGGY_ITEM_IDS` |
| `ENDPOINT_DEPRECATED` (410) | Endpoint v1 desligado | Já migrado para `/v2/transactions` |
| `Invalid API key` no script | Chave anon no lugar da service_role | Pegar a `service_role` |
| `The expression evaluated to a falsy value` | Prompt do Expo quebrado no cmd | `expo login -u ... -p ...` |
| App mostra "senha incorreta" | Usuário sem linha em `profiles`, ou senha diferente da digitada | Rodar `criar-membro.mjs` de novo |
| App abre vazio, sem erro | Login válido mas sem `profiles` | Rodar `criar-membro.mjs` |

### Docker

Nenhum comando aqui precisa de Docker, desde que `functions deploy` receba
`--use-api`. Sem a flag, a CLI tenta empacotar localmente e falha se o Docker
não estiver rodando.

---

## Gerenciar quem tem acesso

O jeito prático: um arquivo com todo mundo e um comando que aplica.

```bat
copy familia.exemplo.json familia.json
notepad familia.json
```

```json
{
  "supabase": {
    "url": "https://SEU-PROJETO.supabase.co",
    "serviceRoleKey": "a-service-role-key"
  },
  "membros": [
    { "nome": "João", "email": "joao@email.com", "senha": "umaSenhaBoa123", "cor": "#2563eb" },
    { "nome": "Pai",  "email": "pai@email.com",  "senha": "outraSenha456",  "cor": "#ea580c" },
    { "nome": "Mãe",  "email": "mae@email.com",  "senha": "maisUma789",     "cor": "#db2777" }
  ]
}
```

```bat
node scripts/sincronizar-familia.mjs --conferir   :: mostra o que faria
node scripts/sincronizar-familia.mjs              :: aplica
```

O script deixa o Supabase igual ao arquivo: cria quem falta, **redefine a
senha** de quem já existe e atualiza nome e cor. É idempotente — rodar duas
vezes seguidas não causa dano.

Para tirar o acesso de alguém, mantenha o e-mail e acrescente a marca:

```json
{ "email": "ex-membro@email.com", "remover": true }
```

Quem tiver acesso ao app sem estar no arquivo aparece num aviso ao fim da
execução. O script **nunca apaga por omissão** — some da lista não significa
perder o acesso, justamente para um erro de edição não derrubar ninguém.

> `familia.json` guarda senhas e a service role key. Está no `.gitignore` e
> existe só na máquina do administrador. O que sobe é o
> `familia.exemplo.json`, com placeholders.

Para um cadastro avulso, sem arquivo, o
[`scripts/criar-membro.mjs`](../scripts/criar-membro.mjs) continua servindo:

```bat
set "SUPABASE_URL=https://SEU-PROJETO.supabase.co"
set "SUPABASE_SERVICE_ROLE_KEY=a-service-role-key"
node scripts/criar-membro.mjs "email@dele.com" "novaSenha" "Nome"
```

---

## Manutenção

### Adicionar uma conta bancária

Conecte em [meu.pluggy.ai](https://meu.pluggy.ai), vincule à aplicação no
Dashboard e sincronize. Ela aparece sozinha em **Contas**.

Lembre do limite: 5 conexões, mesmo CPF.

### Recarregar o histórico completo

```bat
curl -X POST "https://SEU-PROJETO.supabase.co/functions/v1/sync-pluggy" -H "x-cron-secret: SEU_CRON_SECRET" -H "Content-Type: application/json" -d "{\"completo\":true}"
```

Como o upsert é por id, nada duplica — e as categorias já atribuídas
permanecem.

### Depois de mexer no schema

Crie uma migração nova em `supabase/migrations/` em vez de editar a existente,
e aplique pelo SQL Editor ou por `db push`.

> Só entram em `migrations/` arquivos prontos para aplicar. O
> `supabase/opcional/` existe porque aquele SQL tem placeholders que
> quebrariam um `db push` da pasta inteira.
