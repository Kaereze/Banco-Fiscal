import { useCallback, useEffect, useState } from 'react';

import { dataDoBanco, limitesDoMes, numeroDoTexto } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import type { ContaAPagar } from '@/lib/types';

export type NovaContaAPagar = {
  descricao: string;
  valor: number | null;
  vencimento: string | null;
  identificador: string | null;
  observacao: string | null;
};

export type EdicaoContaAPagar = Partial<
  Pick<ContaAPagar, 'descricao' | 'valor' | 'vencimento' | 'identificador' | 'observacao' | 'conciliar'>
>;

export function vencimentoNoMes(mes: string, textoDoDia: string): string | null {
  const dia = Math.trunc(numeroDoTexto(textoDoDia));
  if (dia < 1) return null;
  const ultimoDia = dataDoBanco(limitesDoMes(mes).fim).getDate();
  return `${mes.slice(0, 8)}${String(Math.min(dia, ultimoDia)).padStart(2, '0')}`;
}

const COLUNAS = '*, transacao:transacoes(data, descricao, contraparte, estabelecimento, valor)';

type Linha = Omit<ContaAPagar, 'valor' | 'transacao'> & {
  valor: number | string | null;
  transacao: (Omit<NonNullable<ContaAPagar['transacao']>, 'valor'> & { valor: number | string }) | null;
};

function converter(linha: Linha): ContaAPagar {
  return {
    ...linha,
    valor: linha.valor === null ? null : Number(linha.valor),
    transacao: linha.transacao ? { ...linha.transacao, valor: Number(linha.transacao.valor) } : null,
  };
}

async function buscar(mes: string): Promise<ContaAPagar[]> {
  const { data, error } = await supabase
    .from('contas_a_pagar')
    .select(COLUNAS)
    .eq('mes', mes)
    .order('vencimento', { ascending: true, nullsFirst: false })
    .order('criado_em', { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Linha[]).map(converter);
}

async function conciliar(): Promise<number> {
  const { data, error } = await supabase.rpc('conciliar_contas_a_pagar');
  if (error) return 0;
  return Number(data ?? 0);
}

async function conciliarEBuscar(mes: string): Promise<ContaAPagar[]> {
  await conciliar();
  return buscar(mes);
}

export function useContasAPagar(mes: string) {
  const [contas, setContas] = useState<ContaAPagar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mesCarregado, setMesCarregado] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    try {
      setContas(await conciliarEBuscar(mes));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui carregar as contas.');
    }
  }, [mes]);

  useEffect(() => {
    let cancelado = false;
    conciliarEBuscar(mes)
      .then(
        (lista) => {
          if (cancelado) return;
          setContas(lista);
          setErro(null);
        },
        (e: unknown) => {
          if (!cancelado) setErro(e instanceof Error ? e.message : 'Não consegui carregar as contas.');
        },
      )
      .finally(() => {
        if (cancelado) return;
        setCarregando(false);
        setMesCarregado(mes);
      });
    return () => {
      cancelado = true;
    };
  }, [mes]);

  const adicionar = useCallback(
    async (nova: NovaContaAPagar) => {
      const { error } = await supabase.from('contas_a_pagar').insert({ ...nova, mes });
      if (error) throw new Error(error.message);
      setContas(await conciliarEBuscar(mes));
    },
    [mes],
  );

  const editar = useCallback(
    async (id: string, mudancas: EdicaoContaAPagar) => {
      setContas((atuais) => atuais.map((c) => (c.id === id ? { ...c, ...mudancas } : c)));
      const { error } = await supabase.from('contas_a_pagar').update(mudancas).eq('id', id);
      if (error) throw new Error(error.message);
      if (['valor', 'vencimento', 'identificador', 'conciliar'].some((campo) => campo in mudancas)) {
        setContas(await conciliarEBuscar(mes));
      }
    },
    [mes],
  );

  const alternarPaga = useCallback(async (conta: ContaAPagar) => {
    const mudancas = conta.paga
      ? { paga: false, paga_em: null, transacao_id: null, conciliar: false }
      : { paga: true, paga_em: new Date().toISOString() };
    setContas((atuais) =>
      atuais.map((c) => (c.id === conta.id ? { ...c, ...mudancas, ...(conta.paga ? { transacao: null } : {}) } : c)),
    );
    const { error } = await supabase.from('contas_a_pagar').update(mudancas).eq('id', conta.id);
    if (error) throw new Error(error.message);
  }, []);

  const remover = useCallback(async (id: string) => {
    const { error } = await supabase.from('contas_a_pagar').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setContas((atuais) => atuais.filter((c) => c.id !== id));
  }, []);

  return {
    contas,
    carregando: carregando || mesCarregado !== mes,
    erro,
    recarregar,
    adicionar,
    editar,
    alternarPaga,
    remover,
  };
}
