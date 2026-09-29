import type { Transacao } from '@/lib/types';

export function nomeDoPagamento(transacao: Transacao): string {
  return transacao.estabelecimento ?? transacao.contraparte ?? transacao.descricao;
}

export function formatarCnpj(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
