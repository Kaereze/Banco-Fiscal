import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { chaveMes, deslocaMes, limitesDoMes } from '@/lib/format';
import { useSessao } from '@/lib/sessao';
import { supabase } from '@/lib/supabase';
import type {
  Categoria,
  Conta,
  Orcamento,
  ResultadoSync,
  Sincronizacao,
  Transacao,
} from '@/lib/types';

type NovoLancamento = {
  data: string;
  descricao: string;
  valor: number;
  tipo: 'gasto' | 'receita';
  categoria_id: string | null;
  pessoa: string | null;
  observacao: string | null;
};

type ContextoDados = {
  carregando: boolean;
  sincronizando: boolean;
  erro: string | null;

  mes: string;
  irParaMes: (chave: string) => void;

  categorias: Categoria[];
  contas: Conta[];
  transacoes: Transacao[];
  orcamentos: Orcamento[];
  ultimaSync: Sincronizacao | null;
  gastoMesAnterior: number | null;
  historico: MesDoHistorico[];

  recarregar: () => Promise<void>;
  sincronizarPluggy: (completo?: boolean) => Promise<ResultadoSync>;
  editarTransacao: (id: string, mudancas: Partial<Transacao>) => Promise<void>;
  criarLancamento: (dados: NovoLancamento) => Promise<void>;
  apagarLancamento: (id: string) => Promise<void>;
  definirOrcamento: (categoriaId: string, limite: number) => Promise<void>;
};

export type MesDoHistorico = { mes: string; gastos: number; receitas: number };

export const MESES_NO_HISTORICO = 6;

type DadosDoMes = {
  categorias: Categoria[];
  contas: Conta[];
  transacoes: Transacao[];
  orcamentos: Orcamento[];
  ultimaSync: Sincronizacao | null;
  historico: MesDoHistorico[];
};

async function buscarDados(mes: string): Promise<DadosDoMes> {
  const { inicio, fim } = limitesDoMes(mes);
  const mesesDoHistorico = Array.from({ length: MESES_NO_HISTORICO }, (_, i) =>
    deslocaMes(mes, i - (MESES_NO_HISTORICO - 1)),
  );

  const [resCategorias, resContas, resTransacoes, resOrcamentos, resSync, ...resHistorico] =
    await Promise.all([
      supabase.from('categorias').select('*').order('ordem'),
      supabase.from('contas').select('*').eq('ativa', true).order('instituicao'),
      supabase
        .from('transacoes')
        .select('*')
        .gte('data', inicio)
        .lte('data', fim)
        .order('data', { ascending: false })
        .order('criado_em', { ascending: false }),
      supabase.from('orcamentos').select('*').eq('mes', mes),
      supabase
        .from('sincronizacoes')
        .select('*')
        .order('iniciada_em', { ascending: false })
        .limit(1)
        .maybeSingle(),
      ...mesesDoHistorico.map((chave) => {
        const limites = limitesDoMes(chave);
        return supabase
          .from('transacoes')
          .select('valor')
          .gte('data', limites.inicio)
          .lte('data', limites.fim)
          .eq('ignorada', false);
      }),
    ]);

  const falha = [resCategorias, resContas, resTransacoes, resOrcamentos].find((r) => r.error);
  if (falha?.error) throw new Error(falha.error.message);

  return {
    categorias: (resCategorias.data ?? []) as Categoria[],
    contas: (resContas.data ?? []) as Conta[],
    transacoes: (resTransacoes.data ?? []) as Transacao[],
    orcamentos: (resOrcamentos.data ?? []) as Orcamento[],
    ultimaSync: (resSync.data ?? null) as Sincronizacao | null,
    historico: resHistorico.some((r) => r.error)
      ? []
      : mesesDoHistorico.map((chave, i) => {
          const valores = ((resHistorico[i].data ?? []) as { valor: number }[]).map((l) =>
            Number(l.valor),
          );
          return {
            mes: chave,
            gastos: valores.reduce((soma, v) => (v < 0 ? soma - v : soma), 0),
            receitas: valores.reduce((soma, v) => (v > 0 ? soma + v : soma), 0),
          };
        }),
  };
}

const Contexto = createContext<ContextoDados | null>(null);

export function ProvedorDados({ children }: { children: ReactNode }) {
  const { sessao, perfil, perfilResolvido } = useSessao();
  const usuarioId = sessao?.user.id ?? null;
  const perfilId = perfil?.id ?? null;

  const [mes, setMes] = useState(() => chaveMes(new Date()));
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [ultimaSync, setUltimaSync] = useState<Sincronizacao | null>(null);
  const [historico, setHistorico] = useState<MesDoHistorico[]>([]);
  const [buscando, setBuscando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const aplicar = useCallback((dados: DadosDoMes) => {
    setErro(null);
    setCategorias(dados.categorias);
    setContas(dados.contas);
    setTransacoes(dados.transacoes);
    setOrcamentos(dados.orcamentos);
    setUltimaSync(dados.ultimaSync);
    setHistorico(dados.historico);
  }, []);

  const falhar = useCallback((e: unknown) => {
    setErro(e instanceof Error ? e.message : 'Não consegui carregar os dados.');
  }, []);

  const recarregar = useCallback(async () => {
    if (!usuarioId) return;
    try {
      aplicar(await buscarDados(mes));
    } catch (e) {
      falhar(e);
    } finally {
      setBuscando(false);
    }
  }, [usuarioId, mes, aplicar, falhar]);

  useEffect(() => {
    if (!usuarioId || !perfilId) return;
    let cancelado = false;
    buscarDados(mes)
      .then(
        (dados) => {
          if (!cancelado) aplicar(dados);
        },
        (e) => {
          if (!cancelado) falhar(e);
        },
      )
      .finally(() => {
        if (!cancelado) setBuscando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [usuarioId, perfilId, mes, aplicar, falhar]);

  const carregando = !sessao ? false : !perfil ? !perfilResolvido : buscando;

  const gastoMesAnterior = historico.length > 1 ? historico[historico.length - 2].gastos : null;

  const sincronizarPluggy = useCallback(
    async (completo = false): Promise<ResultadoSync> => {
      setSincronizando(true);
      setErro(null);
      try {
        const { data, error } = await supabase.functions.invoke<ResultadoSync>('sync-pluggy', {
          body: { completo },
        });
        if (error) throw new Error(error.message);
        if (!data?.ok) throw new Error(data?.erro ?? 'A sincronização falhou.');
        await recarregar();
        return data;
      } catch (e) {
        const mensagem = e instanceof Error ? e.message : 'A sincronização falhou.';
        setErro(mensagem);
        return { ok: false, erro: mensagem };
      } finally {
        setSincronizando(false);
      }
    },
    [recarregar],
  );

  const editarTransacao = useCallback(async (id: string, mudancas: Partial<Transacao>) => {
    setTransacoes((atuais) =>
      atuais.map((t) => (t.id === id ? { ...t, ...mudancas } : t)),
    );
    const { error } = await supabase.from('transacoes').update(mudancas).eq('id', id);
    if (error) throw new Error(error.message);
  }, []);

  const criarLancamento = useCallback(
    async (dados: NovoLancamento) => {
      const valor = dados.tipo === 'gasto' ? -Math.abs(dados.valor) : Math.abs(dados.valor);
      const linha = {
        id: `man_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        conta_id: null,
        data: dados.data,
        descricao: dados.descricao.trim(),
        valor,
        categoria_id: dados.categoria_id,
        pessoa: dados.pessoa,
        observacao: dados.observacao,
        origem: 'manual' as const,
        metodo: 'Dinheiro',
        criado_por: sessao?.user.id ?? null,
      };
      const { error } = await supabase.from('transacoes').insert(linha);
      if (error) throw new Error(error.message);
      await recarregar();
    },
    [sessao, recarregar],
  );

  const apagarLancamento = useCallback(async (id: string) => {
    const { error } = await supabase.from('transacoes').delete().eq('id', id);
    if (error) throw new Error(error.message);
    setTransacoes((atuais) => atuais.filter((t) => t.id !== id));
  }, []);

  const definirOrcamento = useCallback(
    async (categoriaId: string, limite: number) => {
      if (limite <= 0) {
        const { error } = await supabase
          .from('orcamentos')
          .delete()
          .eq('categoria_id', categoriaId)
          .eq('mes', mes);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from('orcamentos')
          .upsert({ categoria_id: categoriaId, mes, limite }, { onConflict: 'categoria_id,mes' });
        if (error) throw new Error(error.message);
      }
      const { data } = await supabase.from('orcamentos').select('*').eq('mes', mes);
      setOrcamentos((data ?? []) as Orcamento[]);
    },
    [mes],
  );

  const irParaMes = useCallback((chave: string) => {
    setBuscando(true);
    setMes(chave);
  }, []);

  const valor = useMemo<ContextoDados>(
    () => ({
      carregando,
      sincronizando,
      erro,
      mes,
      irParaMes,
      categorias,
      contas,
      transacoes,
      orcamentos,
      ultimaSync,
      gastoMesAnterior,
      historico,
      recarregar,
      sincronizarPluggy,
      editarTransacao,
      criarLancamento,
      apagarLancamento,
      definirOrcamento,
    }),
    [
      carregando,
      sincronizando,
      erro,
      mes,
      irParaMes,
      categorias,
      contas,
      transacoes,
      orcamentos,
      ultimaSync,
      gastoMesAnterior,
      historico,
      recarregar,
      sincronizarPluggy,
      editarTransacao,
      criarLancamento,
      apagarLancamento,
      definirOrcamento,
    ],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useDados(): ContextoDados {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useDados precisa estar dentro de <ProvedorDados>.');
  return contexto;
}

export type ResumoMes = {
  gastos: number;
  receitas: number;
  saldo: number;
  porCategoria: {
    categoria: Categoria | null;
    total: number;
    fatia: number;
    limite: number | null;
  }[];
  semCategoria: number;
};

export function resumirMes(
  transacoes: Transacao[],
  categorias: Categoria[],
  orcamentos: Orcamento[],
): ResumoMes {
  const validas = transacoes.filter((t) => !t.ignorada);

  const gastos = validas.reduce((soma, t) => (t.valor < 0 ? soma - t.valor : soma), 0);
  const receitas = validas.reduce((soma, t) => (t.valor > 0 ? soma + t.valor : soma), 0);

  const totais = new Map<string | null, number>();
  for (const t of validas) {
    if (t.valor >= 0) continue;
    const chave = t.categoria_id;
    totais.set(chave, (totais.get(chave) ?? 0) + -t.valor);
  }

  const porCategoria = [...totais.entries()]
    .map(([id, total]) => ({
      categoria: categorias.find((c) => c.id === id) ?? null,
      total,
      fatia: gastos > 0 ? total / gastos : 0,
      limite: orcamentos.find((o) => o.categoria_id === id)?.limite ?? null,
    }))
    .sort((a, b) => b.total - a.total);

  return {
    gastos,
    receitas,
    saldo: receitas - gastos,
    porCategoria,
    semCategoria: totais.get(null) ?? 0,
  };
}
