#!/usr/bin/env node
/**
 * Le familia.json e deixa o Supabase igual ao que esta escrito la:
 * cria quem falta, redefine a senha de quem ja existe, atualiza nome e cor,
 * e apaga quem estiver marcado com "remover": true.
 *
 *   node scripts/sincronizar-familia.mjs            aplica
 *   node scripts/sincronizar-familia.mjs --conferir  so mostra o que faria
 *
 * O arquivo familia.json guarda senhas e a service role key. Ele esta no
 * .gitignore e deve ficar so nesta maquina.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ARQUIVO = resolve(RAIZ, 'familia.json');
const CONFERIR = process.argv.includes('--conferir');

// ------------------------------------------------------------
// Leitura e validacao
// ------------------------------------------------------------
function carregar() {
  let bruto;
  try {
    bruto = readFileSync(ARQUIVO, 'utf8');
  } catch {
    erroFatal(
      `Nao encontrei ${ARQUIVO}.\n` +
        'Copie familia.exemplo.json para familia.json e preencha os dados.',
    );
  }

  let dados;
  try {
    dados = JSON.parse(bruto);
  } catch (e) {
    erroFatal(`familia.json nao e um JSON valido: ${e.message}`);
  }

  const url = dados?.supabase?.url?.replace(/\/$/, '');
  const chave = dados?.supabase?.serviceRoleKey;
  const membros = dados?.membros;

  if (!url || !chave) erroFatal('Preencha supabase.url e supabase.serviceRoleKey em familia.json.');
  if (!Array.isArray(membros) || membros.length === 0) erroFatal('A lista "membros" esta vazia.');

  // Placeholders do arquivo de exemplo: melhor parar aqui do que criar um
  // usuario chamado "cole-a-service-role-key".
  if (/^cole|^SUA_|^SEU_|exemplo\.com$/i.test(chave) || chave.length < 30) {
    erroFatal('A serviceRoleKey ainda esta com o valor de exemplo.');
  }

  const vistos = new Set();
  membros.forEach((m, i) => {
    const onde = `membros[${i}]`;
    if (!m.email?.includes('@')) erroFatal(`${onde}: e-mail invalido.`);
    if (vistos.has(m.email.toLowerCase())) erroFatal(`${onde}: e-mail repetido (${m.email}).`);
    vistos.add(m.email.toLowerCase());

    if (m.remover) return; // quem vai sair nao precisa de nome nem senha
    if (!m.nome?.trim()) erroFatal(`${onde}: falta "nome".`);
    if (!m.senha || m.senha.length < 8) {
      erroFatal(`${onde}: a senha precisa ter pelo menos 8 caracteres.`);
    }
  });

  return { url, chave, membros };
}

function erroFatal(mensagem) {
  console.error(`\n  ${mensagem}\n`);
  process.exit(1);
}

// ------------------------------------------------------------
// API do Supabase
// ------------------------------------------------------------
function criarCliente(url, chave) {
  const cabecalhos = {
    apikey: chave,
    Authorization: `Bearer ${chave}`,
    'Content-Type': 'application/json',
  };

  async function chamar(caminho, opcoes = {}) {
    const resposta = await fetch(`${url}${caminho}`, {
      ...opcoes,
      headers: { ...cabecalhos, ...(opcoes.headers ?? {}) },
    });
    const texto = await resposta.text();
    let corpo = null;
    try {
      corpo = texto ? JSON.parse(texto) : null;
    } catch {
      corpo = texto;
    }
    return { ok: resposta.ok, status: resposta.status, corpo };
  }

  return {
    async procurarUsuario(email) {
      const r = await chamar(`/auth/v1/admin/users?filter=${encodeURIComponent(email)}`);
      if (!r.ok) throw new Error(`busca falhou (${r.status}): ${JSON.stringify(r.corpo)}`);
      const lista = r.corpo?.users ?? [];
      return lista.find((u) => u.email?.toLowerCase() === email.toLowerCase()) ?? null;
    },

    async criarUsuario(email, senha) {
      const r = await chamar('/auth/v1/admin/users', {
        method: 'POST',
        body: JSON.stringify({ email, password: senha, email_confirm: true }),
      });
      if (!r.ok) throw new Error(`criacao falhou (${r.status}): ${JSON.stringify(r.corpo)}`);
      return r.corpo.id;
    },

    async trocarSenha(id, senha) {
      const r = await chamar(`/auth/v1/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ password: senha, email_confirm: true }),
      });
      if (!r.ok) throw new Error(`troca de senha falhou (${r.status}): ${JSON.stringify(r.corpo)}`);
    },

    async apagarUsuario(id) {
      const r = await chamar(`/auth/v1/admin/users/${id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error(`remocao falhou (${r.status}): ${JSON.stringify(r.corpo)}`);
    },

    async gravarPerfil(id, nome, cor) {
      const r = await chamar('/rest/v1/profiles', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ id, nome, cor }),
      });
      if (!r.ok) throw new Error(`perfil falhou (${r.status}): ${JSON.stringify(r.corpo)}`);
    },

    async listarPerfis() {
      const r = await chamar('/rest/v1/profiles?select=id,nome');
      return r.ok && Array.isArray(r.corpo) ? r.corpo : [];
    },

    async listarUsuarios() {
      const r = await chamar('/auth/v1/admin/users?per_page=200');
      return r.ok && Array.isArray(r.corpo?.users) ? r.corpo.users : [];
    },
  };
}

// ------------------------------------------------------------
// Execucao
// ------------------------------------------------------------
const CORES_PADRAO = ['#2563eb', '#db2777', '#16a34a', '#ea580c', '#7c3aed', '#0891b2'];

async function principal() {
  const { url, chave, membros } = carregar();
  const api = criarCliente(url, chave);

  console.log(`\n  ${CONFERIR ? 'Conferindo' : 'Sincronizando'} ${membros.length} membro(s)`);
  console.log(`  Projeto: ${url}\n`);

  let falhas = 0;

  for (const [indice, membro] of membros.entries()) {
    const rotulo = membro.nome?.trim() || membro.email;
    try {
      const existente = await api.procurarUsuario(membro.email);

      if (membro.remover) {
        if (!existente) {
          console.log(`  ·  ${rotulo} — marcado para remover, mas nao existe`);
        } else if (CONFERIR) {
          console.log(`  ✗  ${rotulo} — SERIA REMOVIDO`);
        } else {
          await api.apagarUsuario(existente.id);
          console.log(`  ✗  ${rotulo} — removido`);
        }
        continue;
      }

      const cor = membro.cor ?? CORES_PADRAO[indice % CORES_PADRAO.length];

      if (!existente) {
        if (CONFERIR) {
          console.log(`  +  ${rotulo} <${membro.email}> — SERIA CRIADO`);
          continue;
        }
        const id = await api.criarUsuario(membro.email, membro.senha);
        await api.gravarPerfil(id, membro.nome.trim(), cor);
        console.log(`  +  ${rotulo} <${membro.email}> — criado`);
        continue;
      }

      if (CONFERIR) {
        console.log(`  ~  ${rotulo} <${membro.email}> — senha e perfil SERIAM atualizados`);
        continue;
      }
      await api.trocarSenha(existente.id, membro.senha);
      await api.gravarPerfil(existente.id, membro.nome.trim(), cor);
      console.log(`  ~  ${rotulo} <${membro.email}> — senha redefinida, perfil atualizado`);
    } catch (erro) {
      falhas += 1;
      console.log(`  !  ${rotulo} — ${erro.message}`);
    }
  }

  // Alguem no banco que nao esta no arquivo? Avisamos, mas nao mexemos:
  // apagar por omissao seria perigoso demais.
  try {
    const [perfis, usuarios] = await Promise.all([api.listarPerfis(), api.listarUsuarios()]);
    const noArquivo = new Set(
      membros.filter((m) => !m.remover).map((m) => m.email.toLowerCase()),
    );
    const comPerfil = new Set(perfis.map((p) => p.id));

    const orfaos = usuarios.filter(
      (u) => comPerfil.has(u.id) && !noArquivo.has((u.email ?? '').toLowerCase()),
    );

    if (orfaos.length > 0) {
      console.log('\n  Estes tem acesso ao app mas nao estao no familia.json:');
      for (const u of orfaos) console.log(`     ${u.email}`);
      console.log('  Para tirar o acesso, acrescente ao arquivo com "remover": true.');
    }
  } catch {
    // o aviso e um extra; nao vale derrubar a execucao por ele
  }

  if (CONFERIR) {
    console.log('\n  Nada foi alterado. Rode sem --conferir para aplicar.\n');
  } else if (falhas === 0) {
    console.log('\n  Pronto. Todos ja conseguem entrar no app.\n');
  } else {
    console.log(`\n  Terminou com ${falhas} falha(s).\n`);
    process.exitCode = 1;
  }
}

principal().catch((erro) => {
  console.error(`\n  ${erro.message}\n`);
  process.exitCode = 1;
});
