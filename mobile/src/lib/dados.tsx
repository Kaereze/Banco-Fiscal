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
  /** Sempre positivo aqui; o sinal é aplicado a partir de `tipo`. */
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

  /** Mês em foco, no formato 'YYYY-MM-01'. */
  mes: string;
  irParaMes: (chave: string) => void;

  categorias: Categoria[];
  contas: Conta[];
  transacoes: Transacao[];
  orcamentos: Orcamento[];
  ultimaSync: Sincronizacao | null;
  /** Total gasto no mês anterior, para a comparação da Home. */
  gastoMesAnterior: number | null;

  recarregar: () => Promise<void>;
  sincronizarPluggy: (completo?: boolean) => Promise<ResultadoSync>;
  editarTransacao: (id: string, mudancas: Partial<Transacao>) => Promise<void>;
  criarLancamento: (dados: NovoLancamento) => Promise<void>;
  apagarLancamento: (id: string) => Promise<void>;
  definirOrcamento: (categoriaId: string, limite: number) => Promise<void>;
};

const Contexto = createContext<ContextoDados | null>(null);

export function ProvedorDados({ children }: { children: ReactNode }) {
  const { sessao, perfil, perfilResolvido } = useSessao();

  const [mes, setMes] = useState(() => chaveMes(new Date()));
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contas, setContas] = useState<Conta[]>([]);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [ultimaSync, setUltimaSync] = useState<Sincronizacao | null>(null);
  const [gastoMesAnterior, setGastoMesAnterior] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    if (!sessao) return;
    setErro(null);
    const { inicio, fim } = limitesDoMes(mes);
    const anterior = limitesDoMes(deslocaMes(mes, -1));

    try {
      const [
        resCategorias,
        resContas,
        resTransacoes,
        resOrcamentos,
        resSync,
        resAnterior,
      ] = await Promise.all([
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
        // Só o necessário para somar: a Home compara com o mês passado,
        // não mostra os lançamentos dele.
        supabase
          .from('transacoes')
          .select('valor')
          .gte('data', anterior.inicio)
          .lte('data', anterior.fim)
          .eq('ignorada', false)
          .lt('valor', 0),
      ]);

      const falha = [resCategorias, resContas, resTransacoes, resOrcamentos].find((r) => r.error);
      if (falha?.error) throw new Error(falha.error.message);

      setCategorias((resCategorias.data ?? []) as Categoria[]);
      setContas((resContas.data ?? []) as Conta[]);
      setTransacoes((resTransacoes.data ?? []) as Transacao[]);
      setOrcamentos((resOrcamentos.data ?? []) as Orcamento[]);
      setUltimaSync((resSync.data ?? null) as Sincronizacao | null);

      const linhasAnteriores = (resAnterior.data ?? []) as { valor: number }[];
      setGastoMesAnterior(
        resAnterior.error
          ? null
          : linhasAnteriores.reduce((soma, l) => soma - Number(l.valor), 0),
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui carregar os dados.');
    } finally {
      setCarregando(false);
    }
  }, [sessao, mes]);

  // Só busca depois que o perfil existe: antes disso o RLS devolveria vazio
  // e a tela mostraria "nenhum gasto" em vez do estado real.
  useEffect(() => {
    if (!sessao) {
      setCarregando(false);
      return;
    }
    if (!perfil) {
      // Sem perfil e a busca já terminou: esta conta não é da família.
      // Parar de carregar deixa as telas mostrarem o aviso de Ajustes.
      setCarregando(!perfilResolvido);
      return;
    }
    void recarregar();
  }, [sessao, perfil, perfilResolvido, recarregar]);

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
    // Otimista: a edição de categoria precisa parecer instantânea.
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
    setCarregando(true);
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

// ------------------------------------------------------------
// Derivações usadas pelas telas
// ------------------------------------------------------------

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

/** Transferências marcadas como ignoradas ficam de fora de tudo. */
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
