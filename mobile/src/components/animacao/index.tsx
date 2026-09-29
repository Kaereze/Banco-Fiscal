import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOutLeft,
  LinearTransition,
  ZoomIn,
  type BaseAnimationBuilder,
} from 'react-native-reanimated';

import { aoTerminar as quandoTerminar } from './sequencia';

export { aoTerminar } from './sequencia';
export { DURACAO_TRANSICAO, useTransicao } from './transicao';

const DURACAO = 420;
const DURACAO_ESTOURO = 700;
const ESCALONAMENTO = 55;
const ATRASO_MAXIMO = 400;

type EntradaProps = ViewProps & {
  children: ReactNode;
  indice?: number;
  aoTerminar?: () => void;
};

type Construtor = typeof FadeInDown | typeof FadeInUp | typeof FadeIn | typeof ZoomIn;

function entrada(
  construtor: Construtor,
  indice: number,
  aoTerminar?: () => void,
  duracao = DURACAO,
): BaseAnimationBuilder {
  const animacao = construtor
    .duration(duracao)
    .delay(Math.min(indice * ESCALONAMENTO, ATRASO_MAXIMO));
  return aoTerminar ? animacao.withCallback(quandoTerminar(aoTerminar)) : animacao;
}

export function Sobe({ children, indice = 0, aoTerminar, ...resto }: EntradaProps) {
  return (
    <Animated.View entering={entrada(FadeInDown, indice, aoTerminar)} {...resto}>
      {children}
    </Animated.View>
  );
}

export function Desce({ children, indice = 0, aoTerminar, ...resto }: EntradaProps) {
  return (
    <Animated.View entering={entrada(FadeInUp, indice, aoTerminar)} {...resto}>
      {children}
    </Animated.View>
  );
}

export function Surge({ children, indice = 0, aoTerminar, ...resto }: EntradaProps) {
  return (
    <Animated.View entering={entrada(FadeIn, indice, aoTerminar)} {...resto}>
      {children}
    </Animated.View>
  );
}

export function Estoura({ children, indice = 0, aoTerminar, ...resto }: EntradaProps) {
  return (
    <Animated.View entering={entrada(ZoomIn, indice, aoTerminar, DURACAO_ESTOURO)} {...resto}>
      {children}
    </Animated.View>
  );
}

export function SaiDeLado({ children, ...resto }: ViewProps & { children: ReactNode }) {
  return (
    <Animated.View exiting={FadeOutLeft.duration(DURACAO)} layout={LinearTransition.duration(260)} {...resto}>
      {children}
    </Animated.View>
  );
}

export function Acomoda({ children, ...resto }: ViewProps & { children: ReactNode }) {
  return (
    <Animated.View layout={LinearTransition.duration(260)} {...resto}>
      {children}
    </Animated.View>
  );
}

export function chaveDeEntrada(...partes: (string | number | null | undefined)[]): string {
  return partes.map((p) => p ?? '-').join(':');
}
