# Banco Fiscal

Controle de gastos da família. Puxa os extratos do Caixa e do PagSeguro pela
Pluggy, organiza por categoria e mostra num aplicativo Android que o pai e a
mãe instalam uma vez e usam sem mexer em mais nada.

```text
Meu Pluggy  ──►  Edge Function  ──►  Postgres  ──►  App Android
(seus bancos)    (guarda as         (histórico,     (Expo / React
                  credenciais)       categorias)     Native)
```

A regra que orienta todo o desenho: **as credenciais da Pluggy nunca entram no
aplicativo.** Um APK é um arquivo ZIP — qualquer pessoa extrai strings de
dentro dele. Se o `clientSecret` estivesse ali, quem pegasse o telefone teria
acesso total ao extrato bancário. Por isso existe a Edge Function no meio: ela
guarda os segredos, fala com a Pluggy e grava o resultado já mastigado no
banco. O app só lê tabelas.

---

## O que você vai precisar

| | Conta | Custo |
|---|---|---|
| 1 | [Meu Pluggy](https://meu.pluggy.ai) com os bancos conectados | grátis |
| 2 | [Dashboard Pluggy](https://dashboard.pluggy.ai) (mesma conta, pega as credenciais) | grátis |
| 3 | [Supabase](https://supabase.com) | plano grátis basta |
| 4 | [Expo](https://expo.dev) (para gerar o APK) | grátis |

---

## Passo 1 — Banco de dados

Crie um projeto no Supabase. Depois, no **SQL Editor**, cole e rode o conteúdo
de [`supabase/migrations/0001_schema.sql`](supabase/migrations/0001_schema.sql).

Isso cria as tabelas, liga o Row Level Security e já deixa 13 categorias
prontas (Mercado, Moradia, Transporte, Saúde...).

> **Sobre o RLS:** quem não tiver uma linha na tabela `profiles` enxerga o
> banco vazio, mesmo tendo login válido. É o que impede que alguém que
> descubra a chave pública do app veja os seus gastos.

---

## Passo 2 — Credenciais da Pluggy

1. Conecte Caixa e PagSeguro em [meu.pluggy.ai](https://meu.pluggy.ai).
2. Entre no [dashboard.pluggy.ai](https://dashboard.pluggy.ai) com a **mesma
   conta** e abra **Aplicações**.
3. Nas configurações de conectores da aplicação, **habilite o conector
   "MeuPluggy"** — ele não vem ligado por padrão.
4. Volte ao Meu Pluggy e **vincule cada conta conectada à aplicação**.
5. De volta em **Aplicações**, copie o `Client ID` e o `Client Secret`.

> **O passo 4 é o que mais derruba gente.** Sem o vínculo, a API responde
> `200 OK` com lista vazia — não dá erro, simplesmente não vem nada. Deu certo
> quando a conexão aparece dentro da aplicação e sai do estado de espera.
>
> **Ignore o aviso de "trial expirado".** Aquela faixa vermelha e a checklist
> "Solicitar Acesso à Produção" (webhooks, due diligence, dados reais) são a
> trilha comercial, para quem atende clientes terceiros. Uso pessoal via Meu
> Pluggy é grátis por tempo indeterminado.

### Limite do plano grátis

Até **5 conexões ativas, todas do mesmo titular (mesmo CPF)**.

Isso cobre bem o uso atual — as contas são todas suas. Mas inviabiliza a
expansão "cada um conecta o próprio banco": as contas do pai e da mãe são
outro CPF. Quando isso for necessário, cada pessoa precisa do próprio Meu
Pluggy com credenciais próprias, e o sincronizador tem que percorrer vários
pares de credenciais — hoje ele lida com um só.

---

## Passo 3 — Edge Function

Conecte a CLI ao projeto (use `npx` — o pacote `supabase` não suporta
instalação global via npm):

```bat
npx supabase@latest login
npx supabase@latest link --project-ref SEU_PROJECT_REF
```

Guarde os segredos **por arquivo**, não por argumento na linha de comando:
se o secret tiver espaço, vírgula, `&` ou `|`, o shell quebra o valor e a CLI
responde `Invalid secret pair ... Must be NAME=VALUE`.

```bat
copy supabase\.env.secrets.example supabase\.env.secrets
notepad supabase\.env.secrets
npx supabase@latest secrets set --env-file supabase/.env.secrets
npx supabase@latest secrets list
```

Publique a função:

```bat
npx supabase@latest functions deploy sync-pluggy --use-api --no-verify-jwt
```

- `--use-api` empacota no servidor da Supabase e **dispensa o Docker**.
- `--no-verify-jwt` desliga a checagem de JWT **do gateway**, não a
  autenticação: a própria função exige um usuário cadastrado em `profiles` ou
  o header `x-cron-secret`, e devolve 401 sem isso. É o que permite o
  agendamento chamá-la sem um token de usuário.

Teste na hora. A CLI **não tem** `functions invoke` — chame por HTTP:

```bat
curl -X POST "https://SEU-PROJETO.supabase.co/functions/v1/sync-pluggy" -H "x-cron-secret: SEU_CRON_SECRET" -H "Content-Type: application/json" -d "{}"
```

Deve responder algo como
`{"ok":true,"conexoes":2,"contas":3,"novas":412,"atualizadas":0}`.

> Se vier `Nenhuma conexao encontrada` ou `"contas":0`, o vínculo com o Meu
> Pluggy ficou incompleto. Pegue o Item ID no dashboard e acrescente
> `PLUGGY_ITEM_IDS=...` ao `supabase/.env.secrets`, rodando o
> `secrets set --env-file` de novo.

### Sincronização automática (opcional)

Por padrão, os dados chegam quando alguém aperta **"Buscar no banco agora"**.
Para atualizar sozinho duas vezes por dia, edite
[`supabase/opcional/sincronizacao_automatica.sql`](supabase/opcional/sincronizacao_automatica.sql)
trocando `SEU-PROJETO` e `SEU_CRON_SECRET`, e rode no SQL Editor.

---

## Passo 4 — Cadastrar a família

Cada pessoa precisa de um login **e** de uma linha em `profiles`. O script faz
os dois:

No **cmd.exe** (prompt `C:\...>`):

```bat
set SUPABASE_URL=https://xxxx.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=eyJ...

node scripts/criar-membro.mjs "voce@email.com" "umaSenhaBoa123" "João"
node scripts/criar-membro.mjs "pai@email.com" "outraSenha456" "Pai"
node scripts/criar-membro.mjs "mae@email.com" "maisUmaSenha78" "Mãe"
```

No **PowerShell** (prompt `PS C:\...>`) a sintaxe das variáveis muda:

```powershell
$env:SUPABASE_URL="https://xxxx.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

A chave está em **Configurações → Chaves de API**, como `service_role` ou
como uma *secret key* `sb_secret_...`.

> A `service_role` key ignora o RLS por completo. Use só no seu computador,
> nunca dentro do app, nunca num repositório público.

---

## Passo 5 — Rodar o app

```powershell
cd mobile
copy .env.example .env      # preencha com a URL e a chave anon do Supabase
npm install
npx expo start
```

Escaneie o QR Code com o **Expo Go** no seu celular. É assim que você
desenvolve e testa — rápido, recarrega sozinho a cada mudança.

---

## Passo 6 — Gerar o APK para o celular dos seus pais

O Expo Go **não** serve para entregar: ele exige que seus pais instalem o Expo
Go, abram um link toda vez, e só funciona com o servidor de desenvolvimento
rodando. O que você quer é um APK de verdade.

```powershell
cd mobile
npx eas-cli@latest login
npx eas-cli@latest build:configure

# as variáveis precisam existir na nuvem também, não só no seu .env
npx eas-cli@latest env:set preview --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxx.supabase.co" --visibility plaintext
npx eas-cli@latest env:set preview --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..." --visibility plaintext

npx eas-cli@latest build --platform android --profile preview
```

> `preview` aqui aparece duas vezes por motivos diferentes: é o *ambiente*
> onde a variável fica guardada e o *perfil de build* do `eas.json`. Eles têm
> o mesmo nome de propósito — o perfil declara `"environment": "preview"`, e é
> assim que o build encontra as variáveis.

Em 10–20 minutos sai um link de download. Mande por WhatsApp para seus pais.
No Android eles precisam autorizar **"instalar de fontes desconhecidas"** uma
única vez — depois o ícone fica na tela inicial como qualquer outro app.

### Atualizar sem gerar APK de novo

Mudanças em JavaScript (telas, textos, cores, regras) vão pelo ar:

```powershell
npx eas-cli@latest update --branch preview --message "novas categorias"
```

Os celulares pegam a atualização sozinhos na próxima abertura. Só é preciso
gerar um APK novo quando você adiciona uma biblioteca com código nativo.

---

## Bibliotecas e serviços

### Aplicativo

| Biblioteca | Versão | Para quê |
|---|---|---|
| [expo](https://docs.expo.dev) | ~57.0.25 | Plataforma e build (EAS) |
| [react-native](https://reactnative.dev) | 0.86.3 | Base do app nativo |
| [react](https://react.dev) | 19.2.3 | Biblioteca de UI |
| [expo-router](https://docs.expo.dev/router/introduction/) | ~57.0.23 | Navegação por arquivos |
| [@supabase/supabase-js](https://supabase.com/docs/reference/javascript) | ^2.117.2 | Login e acesso ao banco |
| [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) | 2.2.0 | Guarda a sessão no aparelho |
| [react-native-url-polyfill](https://github.com/charpeni/react-native-url-polyfill) | ^4.0.0 | `URL` que o supabase-js exige |
| [@expo/vector-icons](https://icons.expo.fyi) | ^15.0.2 | Ícones das abas |
| [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context) | ~5.7.0 | Respeita notch e barras |
| [react-native-screens](https://github.com/software-mansion/react-native-screens) | ~4.26.0 | Telas nativas na navegação |
| [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) | 4.5.1 | Animações das transições |
| [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/) | ~2.32.0 | Gestos da navegação |
| [expo-font](https://docs.expo.dev/versions/latest/sdk/font/) | ~57.0.4 | Fontes dos ícones |
| TypeScript | ~6.0.3 | Tipagem |

Os gráficos de barras são `View` com largura proporcional — nenhuma biblioteca
de charts. Para barras simples, uma dependência a mais não se pagaria.

### Servidor

| | Para quê |
|---|---|
| [Supabase](https://supabase.com) | Postgres, autenticação, RLS e Edge Functions |
| [Deno](https://deno.com) | Runtime da Edge Function |
| [Pluggy](https://pluggy.ai) | Open Finance — traz os extratos dos bancos |

Nenhuma dependência externa no sincronizador além do próprio cliente Supabase:
a conversa com a Pluggy é `fetch` puro.

## Como o app está organizado

```text
mobile/src/
  app/                    telas (cada arquivo é uma rota do Expo Router)
    (tabs)/
      index.tsx           Resumo: total do mês, gastos por categoria
      transacoes.tsx      lista com busca e filtros
      contas.tsx          saldos e sincronização
      ajustes.tsx         orçamentos, perfil, sair
    transacao/[id].tsx    editar categoria, pessoa, observação
    lancamento.tsx        gasto em dinheiro (o que o banco não vê)
    login.tsx
  components/             peças de interface reutilizáveis
  lib/
    dados.tsx             estado compartilhado e consultas
    sessao.tsx            login e perfil
    supabase.ts           cliente
    format.ts             moeda e datas em português
    theme.ts              cores e medidas

supabase/
  migrations/             schema e agendamento
  functions/sync-pluggy/  a única coisa que fala com a Pluggy

scripts/criar-membro.mjs  cadastra uma pessoa da família
```

---

## Decisões que valem saber

**Sinal do valor.** A Pluggy manda `amount` sempre positivo e indica a direção
num campo separado (`type: DEBIT | CREDIT`). O sincronizador normaliza isso
para um número com sinal — negativo saiu, positivo entrou — para que somar uma
coluna seja suficiente em qualquer tela.

**Transações vêm por cursor, não por página.** O `GET /transactions` antigo
foi descontinuado e responde `410 ENDPOINT_DEPRECATED`. O sincronizador usa
`GET /v2/transactions`, onde cada resposta traz `next` com a URL completa da
próxima página. Essa URL é usada **exatamente como veio** — o cursor é base64
dentro da query string, e remontar a URL o re-codifica e invalida.

**Suas edições sobrevivem à sincronização.** Quando o sincronizador regrava
uma transação, ele manda só os campos que vêm do banco. Categoria, pessoa,
observação e a marca de "não contar" ficam de fora do payload de propósito, e
por isso não são sobrescritas.

**Transferências não são gasto.** Mandar dinheiro do Caixa para o PagSeguro
apareceria como saída de um lado e entrada do outro, inflando os dois totais.
Marque a transação como "não contar nos totais" e ela some das somas sem
sumir do histórico.

**Categorização que aprende.** Ao categorizar um gasto, ligue *"sempre
categorizar assim"*. Isso cria uma regra a partir das primeiras palavras da
descrição, e as próximas sincronizações já chegam classificadas.

**Gastos em dinheiro.** Banco nenhum enxerga a feira paga em espécie. O botão
"Lançar gasto em dinheiro" no Resumo existe para isso, e esses lançamentos
entram nos totais junto com o resto.

---

## Comandos do dia a dia

```bat
cd mobile
npx expo start              :: desenvolver
npx tsc --noEmit            :: conferir tipos
npx expo-doctor             :: diagnosticar dependências
```

```bat
:: publicar mudanças no sincronizador
npx supabase@latest functions deploy sync-pluggy --use-api --no-verify-jwt

:: disparar uma sincronização
curl -X POST "https://SEU-PROJETO.supabase.co/functions/v1/sync-pluggy" -H "x-cron-secret: SEU_CRON_SECRET" -H "Content-Type: application/json" -d "{}"
```

Para ver o que aconteceu, a CLI não ajuda — ela não tem comando de logs.
Use o painel em **Edge Functions → sync-pluggy → Logs**, ou consulte a tabela
`sincronizacoes`, que guarda o resultado de cada execução:

```sql
select * from sincronizacoes order by iniciada_em desc limit 10;
```
