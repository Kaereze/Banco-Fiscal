#!/usr/bin/env node
/**
 * Audita a seguranca do projeto e diz o que esta aberto.
 *
 *   node scripts/verificar-seguranca.mjs
 *
 * Nao altera nada. Nao imprime nenhum segredo — so comprimentos e vereditos.
 * Roda antes de cada push e sempre que mexer em credencial.
 */

import { execSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const OK = 'OK   ';
const ALERTA = 'ALERTA';
const FALHA = 'FALHA';

const achados = [];
function registrar(nivel, area, mensagem, acao) {
  achados.push({ nivel, area, mensagem, acao });
}

function lerArquivo(caminho) {
  try {
    return readFileSync(resolve(RAIZ, caminho), 'utf8');
  } catch {
    return null;
  }
}

function git(comando) {
  try {
    return execSync(`git ${comando}`, { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

// ------------------------------------------------------------
// 1. Segredos fora do git
// ------------------------------------------------------------
function verificarGit() {
  const rastreados = git('ls-files').split('\n').filter(Boolean);

  const perigosos = rastreados.filter((f) =>
    /(^|\/)(familia\.json|\.env|\.env\.secrets)$/.test(f),
  );
  if (perigosos.length > 0) {
    registrar(FALHA, 'git', `arquivos de segredo versionados: ${perigosos.join(', ')}`,
      'Rode: git rm --cached <arquivo> e confirme o .gitignore.');
  } else {
    registrar(OK, 'git', 'nenhum arquivo de segredo versionado');
  }

  // Segredos que possam ter entrado no historico, mesmo que ja removidos.
  // O prefixo e montado em duas partes de proposito: escrito inteiro, ele
  // apareceria neste arquivo e o proprio check acusaria a si mesmo.
  const prefixoJwt = 'eyJhbGciOiJIUzI1' + 'NiIsInR5cCI6IkpXVCJ9';
  const vestigios = git(
    `grep -lIE "${prefixoJwt}" HEAD -- . ":(exclude)mobile/package-lock.json"`,
  ).trim();
  if (vestigios) {
    registrar(FALHA, 'git', `possivel JWT real commitado em: ${vestigios.replace(/\n/g, ', ')}`,
      'Rotacione a chave e limpe o historico.');
  } else {
    registrar(OK, 'git', 'nenhum JWT real no conteudo versionado');
  }

  const emails = [...new Set(git('log --pretty=%ae').split('\n').filter(Boolean))];
  const pessoais = emails.filter((e) => !e.endsWith('users.noreply.github.com') && !e.includes('anthropic'));
  if (pessoais.length > 0) {
    registrar(ALERTA, 'git', `e-mail pessoal nos commits: ${pessoais.join(', ')}`,
      'Num repositorio publico isso vira alvo de spam.');
  } else {
    registrar(OK, 'git', 'commits sem e-mail pessoal');
  }
}

// ------------------------------------------------------------
// 2. Arquivos locais
// ------------------------------------------------------------
function verificarArquivosLocais() {
  const caminhoFamilia = resolve(RAIZ, 'familia.json');

  if (!existsSync(caminhoFamilia)) {
    registrar(ALERTA, 'local', 'familia.json nao existe', 'Copie familia.exemplo.json.');
    return null;
  }

  // Pasta sincronizada com nuvem = segredo replicado para fora da maquina.
  const sincronizada = /OneDrive|Dropbox|Google Drive|iCloudDrive/i.test(caminhoFamilia);
  if (sincronizada) {
    registrar(FALHA, 'local', 'familia.json esta dentro de pasta sincronizada com nuvem',
      'Mova o projeto para fora do OneDrive/Dropbox.');
  } else {
    registrar(OK, 'local', 'familia.json fora de pasta sincronizada');
  }

  const tamanho = statSync(caminhoFamilia).size;
  if (tamanho > 100_000) {
    registrar(ALERTA, 'local', 'familia.json esta grande demais para o que deveria ser');
  }

  const segredos = lerArquivo('supabase/.env.secrets');
  if (!segredos) {
    registrar(ALERTA, 'local', 'supabase/.env.secrets nao existe nesta maquina');
  } else {
    const cron = segredos.match(/^CRON_SECRET=(.*)$/m)?.[1]?.trim() ?? '';
    if (cron.length < 24) {
      registrar(FALHA, 'segredos', `CRON_SECRET tem so ${cron.length} caracteres`,
        'Use 32+ aleatorios. A funcao recusa o caminho do cron abaixo de 24.');
    } else if (/\s/.test(cron)) {
      registrar(ALERTA, 'segredos', 'CRON_SECRET tem espaco',
        'Funciona, mas complica todo comando de terminal.');
    } else {
      registrar(OK, 'segredos', `CRON_SECRET com ${cron.length} caracteres`);
    }

    const pluggy = segredos.match(/^PLUGGY_CLIENT_SECRET=(.*)$/m)?.[1]?.trim() ?? '';
    if (!pluggy || /^cole|^SEU_/i.test(pluggy)) {
      registrar(FALHA, 'segredos', 'PLUGGY_CLIENT_SECRET nao preenchido');
    } else {
      registrar(OK, 'segredos', 'PLUGGY_CLIENT_SECRET preenchido');
    }
  }

  try {
    return JSON.parse(readFileSync(caminhoFamilia, 'utf8'));
  } catch {
    registrar(FALHA, 'local', 'familia.json nao e um JSON valido');
    return null;
  }
}

// ------------------------------------------------------------
// 3. Senhas
// ------------------------------------------------------------
function verificarSenhas(familia) {
  const membros = (familia?.membros ?? []).filter((m) => !m.remover);
  if (membros.length === 0) return;

  let fracas = 0;
  for (const m of membros) {
    const senha = m.senha ?? '';
    const baixa = senha.toLowerCase();
    const usuario = (m.email ?? '').split('@')[0].toLowerCase();
    const primeiroNome = (m.nome ?? '').trim().split(/\s+/)[0].toLowerCase();

    const motivos = [];
    if (senha.length < 6) motivos.push(`${senha.length} caracteres`);
    if (usuario.length >= 4 && baixa.includes(usuario)) motivos.push('contem o e-mail');
    if (primeiroNome.length >= 4 && baixa.includes(primeiroNome)) motivos.push('contem o nome');
    if (/^(TROQUE|COLOQUE|COLE)/i.test(senha)) motivos.push('valor de exemplo');

    if (motivos.length > 0) {
      fracas += 1;
      registrar(ALERTA, 'senhas', `${m.nome ?? m.email}: ${motivos.join(', ')}`,
        'Use 16+ caracteres aleatorios.');
    }
  }
  if (fracas === 0) registrar(OK, 'senhas', `${membros.length} senha(s) dentro do criterio`);
}

// ------------------------------------------------------------
// 4. Configuracao do Supabase
// ------------------------------------------------------------
async function verificarSupabase() {
  const env = lerArquivo('mobile/.env');
  const url = env?.match(/^EXPO_PUBLIC_SUPABASE_URL=(.*)$/m)?.[1]?.trim();
  const anon = env?.match(/^EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)$/m)?.[1]?.trim();

  if (!url || !anon) {
    registrar(ALERTA, 'supabase', 'mobile/.env incompleto — nao da para checar o projeto');
    return;
  }

  try {
    const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anon } });
    if (!r.ok) {
      registrar(ALERTA, 'supabase', `nao consegui ler as configuracoes (${r.status})`);
      return;
    }
    const s = await r.json();

    // A chave anon esta dentro do APK. Com cadastro aberto, qualquer pessoa
    // que a extraia cria conta no seu projeto. Nao vera dados (o RLS exige
    // linha em profiles), mas e superficie de ataque de graca.
    if (s.disable_signup === true) {
      registrar(OK, 'supabase', 'cadastro publico desativado');
    } else {
      registrar(FALHA, 'supabase', 'CADASTRO PUBLICO ESTA ABERTO',
        'Authentication > Sign In / Providers > desligue "Allow new users to sign up".');
    }

    // `email` e o provedor que o app usa; `phone` vem desligado por padrao.
    // O que interessa aqui e OAuth de terceiros que ninguem pediu.
    const terceiros = Object.entries(s.external ?? {})
      .filter(([nome, ligado]) => ligado && nome !== 'email' && nome !== 'phone')
      .map(([nome]) => nome);
    if (terceiros.length > 0) {
      registrar(ALERTA, 'supabase', `login de terceiros ligado: ${terceiros.join(', ')}`,
        'Desligue os provedores que o app nao usa.');
    } else {
      registrar(OK, 'supabase', 'so login por e-mail e senha, sem OAuth de terceiros');
    }
  } catch (e) {
    registrar(ALERTA, 'supabase', `nao consegui falar com o projeto: ${e.message}`);
  }
}

// ------------------------------------------------------------
// 5. Dependencias
// ------------------------------------------------------------
function verificarDependencias() {
  try {
    // `npm audit` sai com codigo != 0 quando acha algo, e o execSync lanca.
    // O JSON que interessa vem no stdout mesmo assim.
    let saida;
    try {
      saida = execSync('npm audit --json', {
        cwd: resolve(RAIZ, 'mobile'),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch (e) {
      saida = e.stdout;
    }
    if (!saida) throw new Error('sem saida');
    const j = JSON.parse(saida);
    const c = j.metadata?.vulnerabilities ?? {};
    const graves = (c.critical ?? 0) + (c.high ?? 0);
    if (graves > 0) {
      registrar(FALHA, 'dependencias', `${graves} vulnerabilidade(s) alta/critica`,
        'Rode: npm audit');
    } else {
      registrar(OK, 'dependencias',
        `nenhuma alta/critica (${c.moderate ?? 0} moderada(s), em ferramenta de build)`);
    }
  } catch {
    registrar(ALERTA, 'dependencias', 'nao consegui rodar npm audit');
  }
}

// ------------------------------------------------------------
async function principal() {
  console.log('\n  Verificacao de seguranca — Banco Fiscal\n');

  verificarGit();
  const familia = verificarArquivosLocais();
  verificarSenhas(familia);
  await verificarSupabase();
  verificarDependencias();

  const largura = Math.max(...achados.map((a) => a.area.length));
  for (const a of achados) {
    console.log(`  [${a.nivel}] ${a.area.padEnd(largura)}  ${a.mensagem}`);
    if (a.acao) console.log(`           ${' '.repeat(largura)}  -> ${a.acao}`);
  }

  const falhas = achados.filter((a) => a.nivel === FALHA).length;
  const alertas = achados.filter((a) => a.nivel === ALERTA).length;

  console.log(`\n  ${falhas} falha(s), ${alertas} alerta(s), ${achados.length} verificacoes\n`);
  if (falhas > 0) process.exitCode = 1;
}

principal();
