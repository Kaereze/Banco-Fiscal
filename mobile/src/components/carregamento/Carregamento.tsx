import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { Surge, useTransicao } from '@/components/animacao';
import { DURACAO_DO_DESENHO, LogoTraco } from '@/components/marca/LogoTraco';
import { cores, espaco, fonte } from '@/lib/theme';

const TAMANHO_LOGO = 220;
const DURACAO_SAIDA = 300;
const TETO_DA_ANIMACAO = DURACAO_DO_DESENHO + 2000;

type Etapa = 'entrando' | 'desenhando' | 'esperando' | 'saindo';

type Pedido = { id: number; mensagem: string; finalizar: () => void };

type ContextoCarregamento = {
  executar: <T>(tarefa: () => Promise<T>, mensagem: string) => Promise<T>;
};

const Contexto = createContext<ContextoCarregamento | null>(null);

export function ProvedorCarregamento({ children }: { children: ReactNode }) {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [concluidos, setConcluidos] = useState<number[]>([]);
  const proximoId = useRef(0);
  const ocupado = useRef(false);

  const executar = useCallback(<T,>(tarefa: () => Promise<T>, mensagem: string) => {
    if (ocupado.current) return tarefa();
    ocupado.current = true;
    const id = ++proximoId.current;

    return new Promise<T>((resolver, rejeitar) => {
      let desfecho: { ok: true; valor: T } | { ok: false; erro: unknown } | null = null;

      tarefa()
        .then(
          (valor) => {
            desfecho = { ok: true, valor };
          },
          (erro: unknown) => {
            desfecho = { ok: false, erro };
          },
        )
        .finally(() => setConcluidos((atuais) => [...atuais, id]));

      setPedido({
        id,
        mensagem,
        finalizar: () => {
          ocupado.current = false;
          setPedido(null);
          setConcluidos((atuais) => atuais.filter((outro) => outro !== id));
          const final = desfecho as { ok: true; valor: T } | { ok: false; erro: unknown };
          if (final.ok) resolver(final.valor);
          else rejeitar(final.erro);
        },
      });
    });
  }, []);

  const valor = useMemo(() => ({ executar }), [executar]);

  return (
    <Contexto.Provider value={valor}>
      {children}
      {pedido ? (
        <TelaCarregamento
          key={pedido.id}
          mensagem={pedido.mensagem}
          tarefaConcluida={concluidos.includes(pedido.id)}
          aoSair={pedido.finalizar}
        />
      ) : null}
    </Contexto.Provider>
  );
}

export function useCarregamento(): ContextoCarregamento {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('useCarregamento precisa estar dentro de <ProvedorCarregamento>.');
  return contexto;
}

function TelaCarregamento({
  mensagem,
  tarefaConcluida,
  aoSair,
}: {
  mensagem: string;
  tarefaConcluida: boolean;
  aoSair: () => void;
}) {
  const [etapa, setEtapa] = useState<Etapa>('entrando');

  const entrou = useCallback(() => setEtapa('desenhando'), []);
  const desenhou = useCallback(() => setEtapa('esperando'), []);

  useEffect(() => {
    if (etapa !== 'entrando' && etapa !== 'desenhando') return;
    const limite = setTimeout(desenhou, TETO_DA_ANIMACAO);
    return () => clearTimeout(limite);
  }, [etapa, desenhou]);

  const saindo = etapa === 'esperando' && tarefaConcluida;
  const saida = useTransicao(saindo, aoSair, undefined, DURACAO_SAIDA);
  const estiloSaida = useAnimatedStyle(() => ({ opacity: 1 - saida.value }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, estilos.camada, estiloSaida, { pointerEvents: saindo ? 'none' : 'auto' }]}
      accessibilityViewIsModal
      accessibilityLabel={mensagem}
    >
      <Surge aoTerminar={entrou} style={estilos.tela}>
        <View style={estilos.logo}>
          {etapa !== 'entrando' ? <LogoTraco tamanho={TAMANHO_LOGO} aoConcluir={desenhou} /> : null}
        </View>
        <Text style={estilos.mensagem}>{mensagem}</Text>
      </Surge>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  camada: { zIndex: 20, elevation: 20 },
  tela: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.xl,
    padding: espaco.xxl,
    backgroundColor: cores.fundo,
  },
  logo: { width: TAMANHO_LOGO, height: TAMANHO_LOGO },
  mensagem: { fontSize: fonte.corpo, fontWeight: '600', color: cores.textoSuave, textAlign: 'center' },
});
