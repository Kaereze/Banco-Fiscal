import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { DURACAO_TOTAL, LogoMoeda } from '@/components/LogoMoeda';
import { useDados } from '@/lib/dados';
import { cores, espaco, fonte } from '@/lib/theme';

/**
 * Abertura que cobre o app logo depois de um login com senha.
 *
 * Fica por cima das abas enquanto elas carregam os dados por baixo, com a
 * moeda virando logo em ciclo, e some quando os dados chegam. Não aparece
 * quando o app reabre com a sessão já salva — ali a pessoa quer ver os
 * números, não uma cerimônia.
 */

/** Tempo mínimo na tela, para a moeda virar logo ao menos uma vez. */
const MINIMO = DURACAO_TOTAL + 400;

/** Teto: se o banco demorar, a abertura sai e as telas mostram o próprio "Carregando". */
const MAXIMO = 8000;

const SAIDA = 350;

type Props = {
  nome?: string | null;
  aoConcluir: () => void;
};

export function Abertura({ nome, aoConcluir }: Props) {
  const { carregando } = useDados();
  const [minimoPassou, setMinimoPassou] = useState(false);
  const [estourou, setEstourou] = useState(false);
  const opacidade = useSharedValue(1);

  useEffect(() => {
    const minimo = setTimeout(() => setMinimoPassou(true), MINIMO);
    const maximo = setTimeout(() => setEstourou(true), MAXIMO);
    return () => {
      clearTimeout(minimo);
      clearTimeout(maximo);
    };
  }, []);

  const pronto = estourou || (minimoPassou && !carregando);

  useEffect(() => {
    if (!pronto) return;
    opacidade.value = withTiming(0, { duration: SAIDA });
    const fim = setTimeout(aoConcluir, SAIDA);
    return () => clearTimeout(fim);
  }, [pronto, opacidade, aoConcluir]);

  const estiloTela = useAnimatedStyle(() => ({ opacity: opacidade.value }));

  const primeiroNome = nome?.trim().split(/\s+/)[0];

  return (
    <Animated.View style={[StyleSheet.absoluteFill, estilos.tela, estiloTela]}>
      <View style={estilos.centro}>
        <LogoMoeda tamanho={200} repetir />

        <Animated.Text entering={FadeInDown.duration(420).delay(1500)} style={estilos.titulo}>
          {primeiroNome ? `Olá, ${primeiroNome}!` : 'Bem-vindo!'}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.duration(420).delay(1650)} style={estilos.subtitulo}>
          Preparando as finanças da família…
        </Animated.Text>
      </View>
    </Animated.View>
  );
}

/** Tela de espera enquanto o app ainda procura a sessão salva no aparelho. */
export function TelaDeEspera() {
  return (
    <View style={[estilos.tela, estilos.centro]}>
      <LogoMoeda tamanho={200} repetir />
      <Text style={estilos.marca}>Banco Fiscal</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  tela: {
    backgroundColor: cores.fundo,
    zIndex: 10,
    elevation: 10,
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espaco.xl,
    gap: espaco.md,
  },
  titulo: {
    fontSize: fonte.gigante,
    fontWeight: '800',
    color: cores.texto,
    textAlign: 'center',
    marginTop: espaco.lg,
  },
  subtitulo: {
    fontSize: fonte.corpo,
    color: cores.textoSuave,
    textAlign: 'center',
  },
  marca: {
    fontSize: fonte.titulo,
    fontWeight: '800',
    color: cores.texto,
    marginTop: espaco.lg,
  },
});
