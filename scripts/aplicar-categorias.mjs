#!/usr/bin/env node
/**
 * Le categorias.json e deixa o banco igual: cria/atualiza as categorias,
 * regrava as regras de cada uma e classifica o que ja esta la.
 *
 *   node scripts/aplicar-categorias.mjs --sugerir    o que falta classificar
 *   node scripts/aplicar-categorias.mjs --conferir   o que mudaria
 *   node scripts/aplicar-categorias.mjs              aplica
 *
 * As credenciais vem do familia.json, que ja esta no .gitignore.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SUGERIR = process.argv.includes('--sugerir');
const CONFERIR = process.argv.includes('--conferir');

// ------------------------------------------------------------
function morrer(mensagem) {
  console.error(`\n  ${mensagem}\n`);
  process.exit(1);
}

function lerJson(caminho, dica) {
  try {
    return JSON.parse(readFileSync(resolve(RAIZ, caminho), 'utf8'));
  } catch (e) {
    morrer(`Nao consegui ler ${caminho}: ${e.message}\n  ${dica}`);
  }
}

/** Mesma normalizacao do sincronizador, para os trechos casarem igual. */
function semAcento(texto) {
  return (texto ?? '')
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase();
}

// ------------------------------------------------------------
const familia = lerJson('familia.json', 'Copie familia.exemplo.json e preencha.');
const config = lerJson('categorias.json', 'Copie categorias.exemplo.json e edite.');

const url = familia?.supabase?.url?.replace(/\/$/, '');
const chave = familia?.supabase?.serviceRoleKey;
if (!url || !chave) morrer('familia.json sem supabase.url ou supabase.serviceRoleKey.');

const categorias = config?.categorias;
if (!Array.isArray(categorias) || categorias.length === 0) {
  morrer('categorias.json sem a lista "categorias".');
}

const cabecalhos = {
  apikey: chave,
  Authorization: `Bearer ${chave}`,
  'Content-Type': 'application/json',
};

async function api(caminho, opcoes = {}) {
  const r = await fetch(`${url}/rest/v1${caminho}`, {
    ...opcoes,
    headers: { ...cabecalhos, ...(opcoes.headers ?? {}) },
  });
  const texto = await r.text();
  let corpo = null;
  try {
    corpo = texto ? JSON.parse(texto) : null;
  } catch {
    corpo = texto;
  }
  if (!r.ok) throw new Error(`${caminho} respondeu ${r.status}: ${JSON.stringify(corpo)}`);
  return corpo;
}

// ------------------------------------------------------------
// --sugerir: agrupa o que esta sem categoria pelas primeiras palavras
// ------------------------------------------------------------
async function sugerir() {
  const linhas = await api(
    '/transacoes?select=descricao,estabelecimento,contraparte,valor&categoria_id=is.null&ignorada=is.false&valor=lt.0&limit=2000',
  );

  if (linhas.length === 0) {
    console.log('\n  Tudo classificado. Nada a sugerir.\n');
    return;
  }

  const grupos = new Map();
  for (const linha of linhas) {
    const chaveGrupo =
      trechoBuscavel(`${linha.contraparte ?? linha.estabelecimento ?? linha.descricao ?? ''}`) ||
      '(sem descricao)';

    const atual = grupos.get(chaveGrupo) ?? { quantidade: 0, total: 0 };
    atual.quantidade += 1;
    atual.total += Math.abs(Number(linha.valor));
    grupos.set(chaveGrupo, atual);
  }

  const ordenados = [...grupos.entries()].sort((a, b) => b[1].total - a[1].total);
  const totalGeral = ordenados.reduce((s, [, g]) => s + g.total, 0);

  console.log(`\n  ${linhas.length} lancamento(s) sem categoria, somando ${reais(totalGeral)}`);
  console.log('  Copie os trechos da esquerda para o "quando" da categoria certa:\n');

  const largura = Math.min(40, Math.max(...ordenados.map(([k]) => k.length)));
  for (const [trecho, g] of ordenados.slice(0, 25)) {
    const barra = '#'.repeat(Math.max(1, Math.round((g.total / ordenados[0][1].total) * 20)));
    console.log(
      `  "${trecho}"`.padEnd(largura + 5) +
        `${String(g.quantidade).padStart(3)}x  ${reais(g.total).padStart(12)}  ${barra}`,
    );
  }
  if (ordenados.length > 25) console.log(`\n  ...e mais ${ordenados.length - 25} grupo(s).`);
  console.log();
}

function reais(v) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Prefixo estavel da descricao, para virar regra.
 *
 * Corta depois da terceira palavra com conteudo, mas mantem as palavrinhas
 * de ligacao que aparecem no meio. Descartar "da" produziria
 * "total fatura anterior" para "TOTAL DA FATURA ANTERIOR" — um trecho que
 * o usuario copiaria e que nunca casaria, porque a comparacao e por
 * substring literal.
 */
function trechoBuscavel(texto) {
  const limpo = semAcento(texto)
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!limpo) return '';

  const saida = [];
  let comConteudo = 0;
  for (const palavra of limpo.split(' ')) {
    saida.push(palavra);
    if (palavra.length > 2 && !/^\d+$/.test(palavra)) comConteudo += 1;
    if (comConteudo === 3) break;
  }
  return saida.join(' ');
}

// ------------------------------------------------------------
// Aplicar
// ------------------------------------------------------------
async function aplicar() {
  const existentes = await api('/categorias?select=id,nome');
  const porNome = new Map(existentes.map((c) => [c.nome, c.id]));

  console.log(`\n  ${CONFERIR ? 'Conferindo' : 'Aplicando'} ${categorias.length} categoria(s)\n`);

  // --- 1. categorias ---
  const linhas = categorias.map((c, i) => ({
    nome: c.nome,
    emoji: c.emoji ?? '💸',
    cor: c.cor ?? '#64748b',
    tipo: c.tipo ?? 'gasto',
    essencial: Boolean(c.essencial),
    ordem: c.ordem ?? (i + 1) * 10,
  }));

  if (!CONFERIR) {
    await api('/categorias?on_conflict=nome', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(linhas),
    });
  }
  for (const c of linhas) {
    console.log(`  ${porNome.has(c.nome) ? '~' : '+'}  ${c.emoji} ${c.nome}`);
  }

  // Recarrega para pegar o id das que acabaram de nascer.
  const atualizadas = CONFERIR ? existentes : await api('/categorias?select=id,nome');
  const id = new Map(atualizadas.map((c) => [c.nome, c.id]));

  // --- 2. regras ---
  // Apagamos e recriamos: o arquivo e a verdade, e manter regras orfas de
  // uma edicao anterior faria o banco divergir do que esta escrito.
  const regras = [];
  for (const trecho of config.ignorar ?? []) {
    const padrao = semAcento(trecho).trim();
    if (padrao) regras.push({ padrao, categoria_id: null, prioridade: -10, ignorar: true });
  }
  categorias.forEach((c, ordem) => {
    for (const trecho of c.quando ?? []) {
      const padrao = semAcento(trecho).trim();
      if (!padrao) continue;
      regras.push({ padrao, categoria_id: id.get(c.nome) ?? null, prioridade: ordem * 10, ignorar: false });
    }
  });

  console.log(`\n  ${regras.length} regra(s) a partir dos "quando"`);

  if (!CONFERIR) {
    await api('/regras?id=not.is.null', { method: 'DELETE', headers: { Prefer: 'return=minimal' } });
    if (regras.length > 0) {
      await api('/regras', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify(regras.filter((r) => r.categoria_id || r.ignorar)),
      });
    }
  }

  // --- 3. classificar o que ja existe ---
  const pendentes = await api(
    '/transacoes?select=id,descricao,estabelecimento,contraparte,valor&categoria_id=is.null&ignorada=is.false&limit=5000',
  );

  const ordenadas = [...regras].sort((a, b) => a.prioridade - b.prioridade);
  const porCategoria = new Map();
  const paraIgnorar = [];
  const trechosIgnorar = (config.ignorar ?? []).map((t) => semAcento(t)).filter(Boolean);

  for (const t of pendentes) {
    const alvo = semAcento(`${t.descricao ?? ''} ${t.estabelecimento ?? ''} ${t.contraparte ?? ''}`);

    if (trechosIgnorar.some((p) => alvo.includes(p))) {
      paraIgnorar.push(t.id);
      continue;
    }

    const regra = ordenadas.find((r) => r.categoria_id && alvo.includes(r.padrao));
    if (!regra) continue;

    const lista = porCategoria.get(regra.categoria_id) ?? [];
    lista.push(t.id);
    porCategoria.set(regra.categoria_id, lista);
  }

  const totalClassificadas = [...porCategoria.values()].reduce((s, l) => s + l.length, 0);
  console.log(`\n  ${pendentes.length} sem categoria hoje`);
  console.log(`  ${totalClassificadas} seriam classificadas`);
  if (paraIgnorar.length > 0) console.log(`  ${paraIgnorar.length} marcadas como nao contar`);

  const nomePorId = new Map(atualizadas.map((c) => [c.id, c.nome]));
  for (const [catId, ids] of [...porCategoria.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`     ${String(ids.length).padStart(4)}x  ${nomePorId.get(catId) ?? catId}`);
  }

  if (CONFERIR) {
    console.log('\n  Nada foi alterado. Rode sem --conferir para aplicar.\n');
    return;
  }

  for (const [catId, ids] of porCategoria) {
    for (const lote of emLotes(ids, 100)) {
      await api(`/transacoes?id=in.(${lote.map((i) => `"${i}"`).join(',')})`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ categoria_id: catId }),
      });
    }
  }

  for (const lote of emLotes(paraIgnorar, 100)) {
    await api(`/transacoes?id=in.(${lote.map((i) => `"${i}"`).join(',')})`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ ignorada: true }),
    });
  }

  const restantes = pendentes.length - totalClassificadas - paraIgnorar.length;
  console.log(`\n  Pronto. Ainda sem categoria: ${restantes}.`);
  console.log('  Rode com --sugerir para ver o que sobrou.\n');
}

/** O filtro `in` vai na URL, entao os lotes precisam ser pequenos. */
function emLotes(itens, tamanho) {
  const lotes = [];
  for (let i = 0; i < itens.length; i += tamanho) lotes.push(itens.slice(i, i + tamanho));
  return lotes;
}

// ------------------------------------------------------------
try {
  if (SUGERIR) await sugerir();
  else await aplicar();
} catch (erro) {
  console.error(`\n  ${erro.message}\n`);
  process.exitCode = 1;
}
