// ============================================================
//  sync-pluggy
//  Le as contas e transacoes da Pluggy e espelha no Postgres.
//
//  As credenciais da Pluggy (PLUGGY_CLIENT_ID / PLUGGY_CLIENT_SECRET)
//  vivem SOMENTE aqui. O aplicativo nunca as ve: ele so chama esta
//  funcao e depois le as tabelas ja prontas.
//
//  Invocacao:
//    - pelo app, com o JWT de um membro da familia
//    - pelo cron, com o header x-cron-secret
// ============================================================

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

const PLUGGY_API = 'https://api.pluggy.ai';
const DIAS_PADRAO = 90;
/** Intervalo minimo entre duas sincronizacoes. */
const JANELA_MINIMA_MS = 60_000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ------------------------------------------------------------
// Tipos da Pluggy (apenas os campos que usamos)
// ------------------------------------------------------------
type PluggyItem = {
  id: string;
  status?: string;
  executionStatus?: string;
  lastUpdatedAt?: string;
  connector?: { id?: number; name?: string; institutionUrl?: string };
  error?: { code?: string; message?: string } | null;
};

type PluggyAccount = {
  id: string;
  itemId: string;
  type?: string;
  subtype?: string;
  name?: string;
  marketingName?: string | null;
  number?: string | null;
  balance?: number | null;
  currencyCode?: string | null;
  creditData?: { creditLimit?: number | null } | null;
};

type PluggyTransaction = {
  id: string;
  accountId: string;
  date: string;
  description?: string | null;
  descriptionRaw?: string | null;
  type?: 'DEBIT' | 'CREDIT';
  amount?: number | null;
  currencyCode?: string | null;
  category?: string | null;
  merchant?: {
    name?: string | null;
    businessName?: string | null;
    cnpj?: string | null;
    cnae?: string | null;
    category?: string | null;
  } | null;
  paymentData?: {
    paymentMethod?: string | null;
    reason?: string | null;
    payer?: PluggyParticipante | null;
    receiver?: PluggyParticipante | null;
  } | null;
};

type PluggyParticipante = {
  name?: string | null;
  documentNumber?: { type?: string | null; value?: string | null } | null;
};

type Pagina<T> = { results?: T[]; total?: number; totalPages?: number; page?: number };

/** Formato do /v2/transactions: `next` e a URL da proxima pagina, ou null. */
type PaginaCursor<T> = { results?: T[]; next?: string | null };

// ------------------------------------------------------------
// Cliente Pluggy
// ------------------------------------------------------------
async function autenticarPluggy(): Promise<string> {
  const clientId = Deno.env.get('PLUGGY_CLIENT_ID');
  const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET');
  if (!clientId || !clientSecret) {
    throw new Error('PLUGGY_CLIENT_ID / PLUGGY_CLIENT_SECRET nao configurados nos secrets da funcao.');
  }

  const resposta = await fetch(`${PLUGGY_API}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!resposta.ok) {
    throw new Error(`Pluggy /auth respondeu ${resposta.status}: ${await resposta.text()}`);
  }
  const { apiKey } = await resposta.json();
  if (!apiKey) throw new Error('Pluggy /auth nao devolveu apiKey.');
  return apiKey; // vale 2 horas
}

async function pluggyGet<T>(
  apiKey: string,
  caminho: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const url = new URL(PLUGGY_API + caminho);
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null) url.searchParams.set(chave, String(valor));
  }
  const resposta = await fetch(url, { headers: { 'X-API-KEY': apiKey } });
  if (!resposta.ok) {
    throw new Error(`Pluggy GET ${caminho} respondeu ${resposta.status}: ${await resposta.text()}`);
  }
  return resposta.json() as Promise<T>;
}

/**
 * Descobre as conexoes bancarias. Por padrao lista todos os items da
 * aplicacao; se PLUGGY_ITEM_IDS estiver definido, usa apenas esses.
 */
async function listarItems(apiKey: string): Promise<PluggyItem[]> {
  const fixos = (Deno.env.get('PLUGGY_ITEM_IDS') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (fixos.length > 0) {
    return await Promise.all(fixos.map((id) => pluggyGet<PluggyItem>(apiKey, `/items/${id}`)));
  }

  try {
    const pagina = await pluggyGet<Pagina<PluggyItem>>(apiKey, '/items');
    return pagina.results ?? [];
  } catch (erro) {
    // Nem toda aplicacao pode listar items — a aplicacao demo do Meu Pluggy,
    // por exemplo, devolve 401 aqui mesmo com credenciais validas. Como o
    // /auth ja passou, o problema nunca e a credencial: e a permissao de
    // listagem. Nesse caso o caminho e apontar o item pelo ID.
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    if (/ 401| 403/.test(mensagem)) {
      throw new Error(
        'Sua aplicacao na Pluggy nao tem permissao para listar items (GET /items devolveu ' +
          'nao-autorizado), embora as credenciais estejam corretas. Pegue o Item ID no dashboard ' +
          '(Aplicacoes > Demo, o codigo no topo do item) e grave em PLUGGY_ITEM_IDS. ' +
          `Detalhe original: ${mensagem}`,
      );
    }
    throw erro;
  }
}

/**
 * Puxa todas as transacoes de uma conta.
 *
 * O GET /transactions antigo (page/totalPages) foi descontinuado e responde
 * 410 ENDPOINT_DEPRECATED. O substituto e o /v2/transactions, que pagina por
 * cursor: cada resposta traz `next` com a URL completa da proxima pagina, ou
 * null quando acabou.
 */
async function listarTransacoes(
  apiKey: string,
  accountId: string,
  desde: string,
): Promise<PluggyTransaction[]> {
  // O v2 aceita apenas accountId e o cursor: mandar `from` ou `pageSize`
  // devolve 400 "property should not exist". Por isso o recorte por data e
  // feito aqui embaixo, depois de baixar as paginas.
  const primeira = new URL(`${PLUGGY_API}/v2/transactions`);
  primeira.searchParams.set('accountId', accountId);

  const todas: PluggyTransaction[] = [];
  let proxima: string | null = primeira.toString();
  let cruDoNext: string | null = null;
  let paginas = 0;

  while (proxima && paginas < 100) { // trava de seguranca
    const resposta = await fetch(proxima, { headers: { 'X-API-KEY': apiKey } });
    if (!resposta.ok) {
      // O valor cru de `next` vai junto: sem ele, diagnosticar um erro de
      // paginacao vira tentativa e erro.
      const contexto = cruDoNext === null ? '' : ` (next recebido: ${JSON.stringify(cruDoNext)})`;
      throw new Error(
        `Pluggy GET /v2/transactions respondeu ${resposta.status}: ${await resposta.text()}${contexto}`,
      );
    }

    const dados = (await resposta.json()) as PaginaCursor<PluggyTransaction>;
    todas.push(...(dados.results ?? []));
    cruDoNext = dados.next ?? null;
    proxima = proximaPagina(dados.next, accountId);
    paginas += 1;
  }

  return todas.filter((transacao) => (transacao.date ?? '').slice(0, 10) >= desde);
}

/**
 * O cursor vai embutido em `next` como base64 dentro da query string. Ele
 * precisa ser usado exatamente como veio — montar a URL de novo re-codifica
 * os caracteres e o cursor deixa de valer.
 */
function proximaPagina(
  next: string | null | undefined,
  accountId: string,
): string | null {
  const valor = (next ?? '').trim();
  if (!valor) return null;

  // URL completa: usar exatamente como veio.
  if (valor.startsWith('http://') || valor.startsWith('https://')) return valor;

  // Caso real da Pluggy: so a query string, sem caminho algum —
  // "?accountId=...&after=...". Ela ja vem com o cursor codificado, entao
  // basta grudar no caminho do endpoint, sem tocar em nada.
  if (valor.startsWith('?')) return `${PLUGGY_API}/v2/transactions${valor}`;

  // Caminho relativo, com ou sem a barra inicial.
  if (valor.startsWith('/')) return PLUGGY_API + valor;
  if (valor.startsWith('v2/')) return `${PLUGGY_API}/${valor}`;

  // Sobrou o token puro. O accountId precisa ir junto — sem ele a API
  // responde "accountId should not be null". A concatenacao e crua de
  // proposito: o token e base64, e URLSearchParams escaparia +, / e =,
  // invalidando o cursor.
  return `${PLUGGY_API}/v2/transactions?accountId=${accountId}&after=${valor}`;
}

// ------------------------------------------------------------
// Normalizacao
// ------------------------------------------------------------

/**
 * A Pluggy devolve `amount` sempre positivo e indica a direcao no campo
 * `type`. Aqui viramos isso num valor com sinal: negativo = saiu dinheiro.
 */
function valorComSinal(transacao: PluggyTransaction): number {
  const absoluto = Math.abs(Number(transacao.amount ?? 0));
  return transacao.type === 'DEBIT' ? -absoluto : absoluto;
}

function somenteCnpj(participante: PluggyParticipante | null | undefined): string | null {
  const digitos = (participante?.documentNumber?.value ?? '').replace(/\D/g, '');
  const tipo = participante?.documentNumber?.type?.toUpperCase();
  return digitos.length === 14 && tipo !== 'CPF' ? digitos : null;
}

function dadosDaContraparte(transacao: PluggyTransaction) {
  const outraParte =
    transacao.type === 'DEBIT' ? transacao.paymentData?.receiver : transacao.paymentData?.payer;
  const cnpjDoEstabelecimento = (transacao.merchant?.cnpj ?? '').replace(/\D/g, '');
  return {
    contraparte: outraParte?.name?.trim() || null,
    cnpj: cnpjDoEstabelecimento.length === 14 ? cnpjDoEstabelecimento : somenteCnpj(outraParte),
    atividade: transacao.merchant?.category ?? transacao.merchant?.cnae ?? null,
    mensagem: transacao.paymentData?.reason?.trim() || null,
  };
}

// Os acentos viram caracteres combinantes depois do normalize('NFD'),
// e e essa faixa que removemos. Montado via string para os escapes
// ficarem visiveis no editor.
const COMBINANTES = new RegExp('[\\u0300-\\u036f]', 'g');

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(COMBINANTES, '').toLowerCase();
}

/**
 * Compara dois segredos em tempo constante.
 *
 * O `===` de strings sai no primeiro byte diferente, e esse tempo de resposta
 * vaza o quanto do segredo o atacante ja acertou — da para reconstrui-lo byte
 * a byte. Aqui todos os bytes sao sempre percorridos. O tamanho vaza, e tudo
 * bem: saber o comprimento nao ajuda a adivinhar o conteudo.
 */
function comparacaoSegura(recebido: string, esperado: string): boolean {
  const codificador = new TextEncoder();
  const a = codificador.encode(recebido);
  const b = codificador.encode(esperado);
  if (a.length !== b.length) return false;

  let diferenca = 0;
  for (let i = 0; i < a.length; i += 1) diferenca |= a[i] ^ b[i];
  return diferenca === 0;
}

/** Quebra um array em pedacos, para nao mandar payloads gigantes de uma vez. */
function emLotes<T>(itens: T[], tamanho: number): T[][] {
  const lotes: T[][] = [];
  for (let i = 0; i < itens.length; i += tamanho) {
    lotes.push(itens.slice(i, i + tamanho));
  }
  return lotes;
}

// ------------------------------------------------------------
// Categorizacao automatica pelas regras da familia
// ------------------------------------------------------------
async function aplicarRegras(db: SupabaseClient): Promise<number> {
  const { data: regras } = await db
    .from('regras')
    .select('padrao, categoria_id, pessoa, prioridade')
    .order('prioridade', { ascending: true });

  if (!regras || regras.length === 0) return 0;

  const { data: pendentes } = await db
    .from('transacoes')
    .select('id, descricao, estabelecimento, contraparte')
    .is('categoria_id', null)
    .eq('ignorada', false)
    .limit(2000);

  if (!pendentes || pendentes.length === 0) return 0;

  // Agrupamos por regra para nao disparar um UPDATE por transacao: com
  // centenas de pendentes isso estouraria o tempo da funcao.
  const porRegra = new Map<string, { regra: (typeof regras)[number]; ids: string[] }>();

  for (const transacao of pendentes) {
    const alvo = semAcento(`${transacao.descricao ?? ''} ${transacao.estabelecimento ?? ''} ${transacao.contraparte ?? ''}`);
    const regra = regras.find((r) => alvo.includes(semAcento(r.padrao)));
    if (!regra) continue;

    const chave = `${regra.categoria_id}|${regra.pessoa ?? ''}`;
    const grupo = porRegra.get(chave) ?? { regra, ids: [] };
    grupo.ids.push(transacao.id);
    porRegra.set(chave, grupo);
  }

  let categorizadas = 0;
  for (const { regra, ids } of porRegra.values()) {
    // Lotes pequenos porque o filtro `in` vai na URL.
    for (const lote of emLotes(ids, 100)) {
      const { error } = await db
        .from('transacoes')
        .update({
          categoria_id: regra.categoria_id,
          ...(regra.pessoa ? { pessoa: regra.pessoa } : {}),
        })
        .in('id', lote);
      if (error) {
        console.warn('Nao consegui aplicar uma regra:', error.message);
        continue;
      }
      categorizadas += lote.length;
    }
  }
  return categorizadas;
}

// ------------------------------------------------------------
// Sincronizacao
// ------------------------------------------------------------
async function sincronizar(db: SupabaseClient, dias: number) {
  const { data: registro } = await db
    .from('sincronizacoes')
    .insert({})
    .select('id')
    .single();
  const registroId = registro?.id as string | undefined;

  try {
    const apiKey = await autenticarPluggy();
    const items = await listarItems(apiKey);
    if (items.length === 0) {
      throw new Error(
        'Nenhuma conexao encontrada na Pluggy. Conecte seus bancos em meu.pluggy.ai e vincule os items a aplicacao do dashboard.',
      );
    }

    const desde = new Date(Date.now() - dias * 86_400_000).toISOString().slice(0, 10);
    let totalContas = 0;
    let totalNovas = 0;
    let totalAtualizadas = 0;

    for (const item of items) {
      const instituicao = item.connector?.name ?? 'Banco';
      const contas = (await pluggyGet<Pagina<PluggyAccount>>(apiKey, '/accounts', { itemId: item.id }))
        .results ?? [];

      const linhasContas = contas.map((conta) => ({
        id: conta.id,
        item_id: item.id,
        instituicao,
        nome: conta.marketingName || conta.name || instituicao,
        tipo: conta.type ?? null,
        subtipo: conta.subtype ?? null,
        numero: conta.number ?? null,
        saldo: conta.balance ?? null,
        limite: conta.creditData?.creditLimit ?? null,
        moeda: conta.currencyCode ?? 'BRL',
        sincronizado_em: new Date().toISOString(),
      }));

      if (linhasContas.length > 0) {
        // `dono` e `ativa` ficam de fora de proposito: sao ajustes da familia.
        const { error } = await db.from('contas').upsert(linhasContas, { onConflict: 'id' });
        if (error) throw new Error(`Falha ao gravar contas: ${error.message}`);
        totalContas += linhasContas.length;
      }

      for (const conta of contas) {
        const transacoes = await listarTransacoes(apiKey, conta.id, desde);
        if (transacoes.length === 0) continue;

        const linhas = transacoes
          // Sem data nao da para gravar: a coluna e `date not null`.
          .filter((transacao) => Boolean(transacao.date))
          .map((transacao) => ({
            id: transacao.id,
            conta_id: conta.id,
            data: transacao.date.slice(0, 10),
            descricao: transacao.description || transacao.descriptionRaw || 'Sem descricao',
            descricao_original: transacao.descriptionRaw ?? null,
            valor: valorComSinal(transacao),
            moeda: transacao.currencyCode ?? 'BRL',
            categoria_pluggy: transacao.category ?? null,
            metodo: transacao.paymentData?.paymentMethod ?? null,
            estabelecimento: transacao.merchant?.name ?? transacao.merchant?.businessName ?? null,
            ...dadosDaContraparte(transacao),
            origem: 'pluggy' as const,
          }));
        if (linhas.length === 0) continue;

        // Quais ja conhecemos? Perguntamos pela janela de datas em vez de
        // listar os ids num filtro `in` — com 500 ids a URL estoura o limite
        // de tamanho do PostgREST.
        const { data: existentes } = await db
          .from('transacoes')
          .select('id')
          .eq('conta_id', conta.id)
          .gte('data', desde);
        const conhecidos = new Set((existentes ?? []).map((linha) => linha.id));
        const jaExistiam = linhas.filter((linha) => conhecidos.has(linha.id)).length;

        // Note que categoria_id, pessoa, observacao e ignorada NAO estao no
        // payload: sao edicoes da familia e precisam sobreviver ao re-sync.
        for (const lote of emLotes(linhas, 500)) {
          const { error } = await db.from('transacoes').upsert(lote, { onConflict: 'id' });
          if (error) throw new Error(`Falha ao gravar transacoes: ${error.message}`);
        }

        totalNovas += linhas.length - jaExistiam;
        totalAtualizadas += jaExistiam;
      }
    }

    const categorizadas = await aplicarRegras(db);

    if (registroId) {
      await db
        .from('sincronizacoes')
        .update({
          terminada_em: new Date().toISOString(),
          sucesso: true,
          contas: totalContas,
          novas: totalNovas,
          atualizadas: totalAtualizadas,
        })
        .eq('id', registroId);
    }

    return {
      ok: true,
      conexoes: items.length,
      contas: totalContas,
      novas: totalNovas,
      atualizadas: totalAtualizadas,
      categorizadas,
      desde,
    };
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    if (registroId) {
      await db
        .from('sincronizacoes')
        .update({ terminada_em: new Date().toISOString(), sucesso: false, erro: mensagem })
        .eq('id', registroId);
    }
    throw erro;
  }
}

// ------------------------------------------------------------
// Handler
// ------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const json = (corpo: unknown, status = 200) =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });

  const urlSupabase = Deno.env.get('SUPABASE_URL')!;
  const chaveServico = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const chaveAnon = Deno.env.get('SUPABASE_ANON_KEY')!;

  // --- quem esta chamando? ---
  const segredoCron = Deno.env.get('CRON_SECRET');
  // Segredo curto demais nao vale como autenticacao: melhor recusar o
  // caminho do cron do que aceitar algo adivinhavel.
  const cronUtilizavel = typeof segredoCron === 'string' && segredoCron.length >= 24;
  const veioDoCron =
    cronUtilizavel && comparacaoSegura(req.headers.get('x-cron-secret') ?? '', segredoCron);

  if (!veioDoCron) {
    const autorizacao = req.headers.get('Authorization') ?? '';
    if (!autorizacao.startsWith('Bearer ')) {
      return json({ ok: false, erro: 'Sem autorizacao.' }, 401);
    }
    const comoUsuario = createClient(urlSupabase, chaveAnon, {
      global: { headers: { Authorization: autorizacao } },
    });
    const { data: { user } } = await comoUsuario.auth.getUser();
    if (!user) return json({ ok: false, erro: 'Sessao invalida.' }, 401);

    const admin = createClient(urlSupabase, chaveServico);
    const { data: perfil } = await admin
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();
    if (!perfil) return json({ ok: false, erro: 'Usuario nao faz parte da familia.' }, 403);
  }

  // --- roda ---
  const db = createClient(urlSupabase, chaveServico, { auth: { persistSession: false } });

  // Uma sincronizacao a cada 60s basta de sobra: os dados do lado da Pluggy
  // so mudam de hora em hora. O limite existe para que ninguem consiga
  // martelar o endpoint e queimar a cota da conta.
  const { data: recente } = await db
    .from('sincronizacoes')
    .select('iniciada_em')
    .gte('iniciada_em', new Date(Date.now() - JANELA_MINIMA_MS).toISOString())
    .limit(1)
    .maybeSingle();

  if (recente) {
    return json(
      { ok: false, erro: 'Uma sincronizacao acabou de rodar. Espere um minuto e tente de novo.' },
      429,
    );
  }

  let dias = DIAS_PADRAO;
  try {
    const corpo = await req.json();
    if (corpo?.completo) dias = 730;
    else if (Number.isFinite(Number(corpo?.dias))) dias = Math.min(Number(corpo.dias), 730);
  } catch {
    // sem corpo: usa o padrao
  }

  try {
    return json(await sincronizar(db, dias));
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : String(erro);
    console.error('sync-pluggy falhou:', mensagem);
    return json({ ok: false, erro: mensagem }, 500);
  }
});
