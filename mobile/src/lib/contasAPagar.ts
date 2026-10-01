import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import type { ContaAPagar } from '@/lib/types';

export type NovaContaAPagar = {
  descricao: string;
  valor: number | null;
  vencimento: string | null;
  observacao: string | null;
};

async function buscar(mes: string): Promise<ContaAPagar[]> {
  const { data, error } = await supabase
    .from('contas_a_pagar')
    .select('*')
    .eq('mes', mes)
    .order('vencimento', { ascending: true, nullsFirst: false })
    .order('criado_em', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((linha) => ({ ...linha, valor: linha.valor === null ? null : Number(linha.valor) }));
}

function ordenar(contas: ContaAPagar[]): ContaAPagar[] {
  return [...contas].sort((a, b) => {
    if (a.vencimento !== b.vencimento) {
      if (!a.vencimento) return 1;
      if (!b.vencimento) return -1;
      return a.vencimento < b.vencimento ? -1 : 1;
    }
    return a.criado_em < b.criado_em ? -1 : 1;
  });
}

export function useContasAPagar(mes: string) {
  const [contas, setContas] = useState<ContaAPagar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mesCarregado, setMesCarregado] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    try {
      setContas(await buscar(mes));
      setErro(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui carregar as contas.');
    }
  }, [mes]);

  useEffect(() => {
    let cancelado = false;
    buscar(mes)
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
      const { data, error } = await supabase
        .from('contas_a_pagar')
        .insert({ ...nova, mes })
        .select('*')
        .single();
      if (error) throw new Error(error.message);
      const criada = { ...data, valor: data.valor === null ? null : Number(data.valor) } as ContaAPagar;
      setContas((atuais) => ordenar([...atuais, criada]));
    },
    [mes],
  );

  const atualizar = useCallback(async (id: string, mudancas: Partial<ContaAPagar>) => {
    setContas((atuais) => atuais.map((c) => (c.id === id ? { ...c, ...mudancas } : c)));
    const { error } = await supabase.from('contas_a_pagar').update(mudancas).eq('id', id);
    if (error) throw new Error(error.message);
  }, []);

  const alternarPaga = useCallback(
    (conta: ContaAPagar) =>
      atualizar(conta.id, { paga: !conta.paga, paga_em: conta.paga ? null : new Date().toISOString() }),
    [atualizar],
  );

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
    atualizar,
    alternarPaga,
    remover,
  };
}
