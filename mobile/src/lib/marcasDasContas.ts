type Marca = { nome: string; dominio: string; trechos: string[] };

const MARCAS: Marca[] = [
  { nome: 'Vivo', dominio: 'vivo.com.br', trechos: ['vivo', 'telefonica'] },
  { nome: 'Claro', dominio: 'claro.com.br', trechos: ['claro', 'net servicos'] },
  { nome: 'TIM', dominio: 'tim.com.br', trechos: ['tim'] },
  { nome: 'Oi', dominio: 'oi.com.br', trechos: ['oi fibra', 'telemar'] },
  { nome: 'Bradesco', dominio: 'bradesco.com.br', trechos: ['bradesco'] },
  { nome: 'Caixa', dominio: 'caixa.gov.br', trechos: ['caixa'] },
  { nome: 'Itaú', dominio: 'itau.com.br', trechos: ['itau'] },
  { nome: 'Santander', dominio: 'santander.com.br', trechos: ['santander'] },
  { nome: 'Banco do Brasil', dominio: 'bb.com.br', trechos: ['banco do brasil'] },
  { nome: 'Nubank', dominio: 'nubank.com.br', trechos: ['nubank', 'nu pagamentos'] },
  { nome: 'Inter', dominio: 'bancointer.com.br', trechos: ['banco inter'] },
  { nome: 'PagBank', dominio: 'pagbank.com.br', trechos: ['pagseguro', 'pagbank'] },
  { nome: 'Mercado Pago', dominio: 'mercadopago.com.br', trechos: ['mercado pago'] },
  { nome: 'Celesc', dominio: 'celesc.com.br', trechos: ['celesc'] },
  { nome: 'Casan', dominio: 'casan.com.br', trechos: ['casan'] },
  { nome: 'Netflix', dominio: 'netflix.com', trechos: ['netflix'] },
  { nome: 'Spotify', dominio: 'spotify.com', trechos: ['spotify'] },
  { nome: 'Disney+', dominio: 'disneyplus.com', trechos: ['disney'] },
  { nome: 'Max', dominio: 'max.com', trechos: ['hbo', 'max'] },
  { nome: 'Amazon', dominio: 'amazon.com.br', trechos: ['amazon', 'prime video'] },
  { nome: 'YouTube', dominio: 'youtube.com', trechos: ['youtube'] },
  { nome: 'Apple', dominio: 'apple.com', trechos: ['apple', 'icloud'] },
  { nome: 'Google', dominio: 'google.com', trechos: ['google'] },
  { nome: 'Mercado Livre', dominio: 'mercadolivre.com.br', trechos: ['mercado livre', 'mercadolivre'] },
  { nome: 'Unimed', dominio: 'unimed.coop.br', trechos: ['unimed'] },
  { nome: 'Sky', dominio: 'sky.com.br', trechos: ['sky'] },
];

const EMOJIS: [string[], string][] = [
  [['luz', 'energia', 'eletric'], '💡'],
  [['agua', 'saneamento'], '💧'],
  [['aluguel'], '🏠'],
  [['condominio'], '🏢'],
  [['internet', 'wifi', 'fibra'], '🌐'],
  [['celular', 'telefone', 'plano'], '📱'],
  [['cartao', 'fatura'], '💳'],
  [['moto'], '🏍️'],
  [['carro', 'veiculo', 'ipva', 'licenciamento'], '🚗'],
  [['gas'], '🔥'],
  [['escola', 'faculdade', 'curso', 'mensalidade'], '📚'],
  [['academia'], '🏋️'],
  [['seguro'], '🛡️'],
  [['saude', 'medico', 'dentista', 'farmacia'], '🩺'],
  [['mercado', 'feira'], '🛒'],
  [['financiamento', 'emprestimo', 'consorcio'], '🏦'],
  [['streaming', 'tv'], '📺'],
  [['pet', 'racao', 'veterinar'], '🐾'],
  [['imposto', 'iptu', 'das', 'boleto'], '🧾'],
];

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase();
}

function contemPalavra(texto: string, trecho: string): boolean {
  return new RegExp(`(^|[^a-z0-9])${trecho.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`).test(texto);
}

export type SeloDaConta = { logo: string | null; marca: string | null; emoji: string };

export function seloDaConta(descricao: string, identificador: string | null): SeloDaConta {
  const texto = normalizar(`${descricao} ${identificador ?? ''}`);
  const marca = MARCAS.find((m) => m.trechos.some((t) => contemPalavra(texto, t)));
  const emoji = EMOJIS.find(([trechos]) => trechos.some((t) => texto.includes(t)))?.[1] ?? '🧾';
  return {
    logo: marca ? `https://www.google.com/s2/favicons?domain=${marca.dominio}&sz=128` : null,
    marca: marca?.nome ?? null,
    emoji,
  };
}
