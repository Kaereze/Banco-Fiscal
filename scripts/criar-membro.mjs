#!/usr/bin/env node
/**
 * Cria um membro da familia: um usuario no Supabase Auth + a linha em
 * `profiles` que as policies de RLS exigem. Sem essa linha, a pessoa
 * consegue logar mas nao enxerga nada.
 *
 * Uso:
 *   SUPABASE_URL=https://xxxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   node scripts/criar-membro.mjs "mae@email.com" "senhaSegura123" "Mae"
 *
 * No PowerShell:
 *   $env:SUPABASE_URL="https://xxxx.supabase.co"
 *   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
 *   node scripts/criar-membro.mjs "mae@email.com" "senhaSegura123" "Mae"
 *
 * A service role key ignora o RLS e da acesso total ao banco. Use so no seu
 * computador, nunca dentro do aplicativo.
 */

const CORES_DISPONIVEIS = ['#2563eb', '#db2777', '#16a34a', '#ea580c', '#7c3aed', '#0891b2'];

const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY;
const [email, senha, nome] = process.argv.slice(2);

if (!url || !chaveServico) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}
if (!email || !senha || !nome) {
  console.error('Uso: node scripts/criar-membro.mjs <email> <senha> <nome>');
  process.exit(1);
}
if (senha.length < 8) {
  console.error('A senha precisa ter pelo menos 8 caracteres.');
  process.exit(1);
}

const cabecalhos = {
  apikey: chaveServico,
  Authorization: `Bearer ${chaveServico}`,
  'Content-Type': 'application/json',
};

/** Cria o usuario, ou reaproveita se o e-mail ja existir. */
async function garantirUsuario() {
  const criacao = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: cabecalhos,
    body: JSON.stringify({ email, password: senha, email_confirm: true }),
  });

  if (criacao.ok) {
    const usuario = await criacao.json();
    console.log(`Usuario criado: ${email}`);
    return usuario.id;
  }

  const detalhe = await criacao.text();
  if (!/already|exists|registered/i.test(detalhe)) {
    throw new Error(`Falha ao criar usuario (${criacao.status}): ${detalhe}`);
  }

  console.log(`Usuario ${email} ja existia.`);
  const busca = await fetch(
    `${url}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`,
    { headers: cabecalhos },
  );
  if (!busca.ok) throw new Error(`Nao consegui localizar o usuario: ${await busca.text()}`);

  const { users = [] } = await busca.json();
  const encontrado = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!encontrado) throw new Error(`Usuario ${email} existe mas nao apareceu na busca.`);

  // Redefine a senha. Sem isto, rodar o script de novo nao adianta nada
  // quando a senha da primeira vez saiu errada — e nao haveria como
  // recuperar o acesso a nao ser pelo painel.
  const troca = await fetch(`${url}/auth/v1/admin/users/${encontrado.id}`, {
    method: 'PUT',
    headers: cabecalhos,
    body: JSON.stringify({ password: senha, email_confirm: true }),
  });
  if (!troca.ok) {
    throw new Error(`Nao consegui redefinir a senha (${troca.status}): ${await troca.text()}`);
  }
  console.log('Senha redefinida.');
  return encontrado.id;
}

async function garantirPerfil(id) {
  const cor = CORES_DISPONIVEIS[Math.floor(Math.random() * CORES_DISPONIVEIS.length)];
  const resposta = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers: { ...cabecalhos, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ id, nome, cor }),
  });
  if (!resposta.ok) {
    throw new Error(`Falha ao gravar o perfil (${resposta.status}): ${await resposta.text()}`);
  }
  console.log(`Perfil pronto: ${nome} (${cor})`);
}

try {
  const id = await garantirUsuario();
  await garantirPerfil(id);
  console.log('\nPronto. Ja da para entrar no app com esse e-mail e senha.');
} catch (erro) {
  console.error('\n' + erro.message);
  process.exit(1);
}
