import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { aoTerminar } from '@/components/animacao';
import { NOME_DO_APP } from '@/components/marca/Logo';
import { ETAPAS_DO_DESENHO, VIEWBOX_TRACO, type Etapa } from '@/components/marca/geometriaTraco';
import { cores } from '@/lib/theme';

export const DURACAO_DO_DESENHO = 2300;

const ESPESSURA = 1.1;

const PathAnimado = Animated.createAnimatedComponent(Path);

export function LogoTraco({
  tamanho = 180,
  cor = cores.verdeEscuro,
  aoConcluir,
}: {
  tamanho?: number;
  cor?: string;
  aoConcluir?: () => void;
}) {
  const progresso = useSharedValue(0);

  useEffect(() => {
    progresso.value = withTiming(
      1,
      { duration: DURACAO_DO_DESENHO, easing: Easing.linear },
      aoConcluir ? aoTerminar(aoConcluir) : undefined,
    );
  }, [progresso, aoConcluir]);

  return (
    <Svg
      width={tamanho}
      height={tamanho}
      viewBox={VIEWBOX_TRACO}
      accessibilityRole="image"
      accessibilityLabel={NOME_DO_APP}
    >
      {ETAPAS_DO_DESENHO.map((etapa) => (
        <Parte key={etapa.chave} etapa={etapa} progresso={progresso} cor={cor} />
      ))}
    </Svg>
  );
}

function Parte({ etapa, progresso, cor }: { etapa: Etapa; progresso: SharedValue<number>; cor: string }) {
  const propsAnimadas = useAnimatedProps(() => {
    const local = Math.min(Math.max((progresso.value - etapa.inicio) / (etapa.fim - etapa.inicio), 0), 1);
    if (etapa.modo === 'surgir') return { strokeOpacity: local, strokeDashoffset: 0 };
    return { strokeOpacity: local > 0 ? 1 : 0, strokeDashoffset: etapa.comprimento * (1 - local) };
  });

  return (
    <PathAnimado
      d={etapa.caminho}
      fill="none"
      stroke={cor}
      strokeWidth={ESPESSURA}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={etapa.modo === 'tracar' ? [etapa.comprimento, etapa.comprimento] : undefined}
      animatedProps={propsAnimadas}
    />
  );
}
