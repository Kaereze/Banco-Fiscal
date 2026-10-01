export type Perfil = {
  id: string;
  nome: string;
  cor: string;
  criado_em: string;
};

export type Categoria = {
  id: string;
  nome: string;
  emoji: string;
  cor: string;
  tipo: 'gasto' | 'receita';
  essencial: boolean;
  ordem: number;
};

export type Conta = {
  id: string;
  item_id: string;
  instituicao: string;
  nome: string;
  tipo: string | null;
  subtipo: string | null;
  numero: string | null;
  saldo: number | null;
  limite: number | null;
  moeda: string;
  dono: string | null;
  ativa: boolean;
  sincronizado_em: string | null;
};

export type Transacao = {
  id: string;
  conta_id: string | null;
  data: string;
  descricao: string;
  descricao_original: string | null;
  /** Negativo = saiu dinheiro, positivo = entrou. */
  valor: number;
  moeda: string;
  categoria_id: string | null;
  categoria_pluggy: string | null;
  pessoa: string | null;
  origem: 'pluggy' | 'manual';
  metodo: string | null;
  estabelecimento: string | null;
  contraparte: string | null;
  cnpj: string | null;
  atividade: string | null;
  mensagem: string | null;
  observacao: string | null;
  ignorada: boolean;
  criado_por: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type ContaAPagar = {
  id: string;
  mes: string;
  descricao: string;
  valor: number | null;
  vencimento: string | null;
  observacao: string | null;
  paga: boolean;
  paga_em: string | null;
  identificador: string | null;
  transacao_id: string | null;
  conciliar: boolean;
  transacao: PagamentoDaConta | null;
  criado_em: string;
};

export type PagamentoDaConta = {
  data: string;
  descricao: string;
  contraparte: string | null;
  estabelecimento: string | null;
  valor: number;
};

export type Orcamento = {
  id: string;
  categoria_id: string;
  mes: string;
  limite: number;
};

export type Regra = {
  id: string;
  padrao: string;
  categoria_id: string | null;
  pessoa: string | null;
  prioridade: number;
};

export type Sincronizacao = {
  id: string;
  iniciada_em: string;
  terminada_em: string | null;
  sucesso: boolean | null;
  contas: number;
  novas: number;
  atualizadas: number;
  erro: string | null;
};

/** Resultado devolvido pela Edge Function sync-pluggy. */
export type ResultadoSync = {
  ok: boolean;
  conexoes?: number;
  contas?: number;
  novas?: number;
  atualizadas?: number;
  categorizadas?: number;
  desde?: string;
  erro?: string;
};
