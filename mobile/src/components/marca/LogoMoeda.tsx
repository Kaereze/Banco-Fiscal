import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { LADO, MOEDA, MoedaSvg, NOME_DO_APP, ORIGEM, PECAS, SvgLogo } from '@/components/marca/Logo';
import { aoTerminar } from '@/components/animacao/sequencia';
import { cores, ouro } from '@/lib/theme';

const PALETA = 'ouro';

const QUEDA = 550;
const QUIQUE = [
  { altura: -0.28, duracao: 240 },
  { altura: -0.07, duracao: 130 },
];
const DURACAO_QUEDA = QUEDA + QUIQUE.reduce((soma, q) => soma + q.duracao * 2, 0);
const DURACAO_ONDA = 600;
const DURACAO_ENCOLHER = 320;
const DURACAO_PECA = 260;
const ESCALA_QUEDA = 1.7;
const ALTURA_QUEDA = 1.4;

const ETAPA_QUEDA = -2;
const ETAPA_ENCOLHER = -1;
const ETAPA_PRONTA = PECAS.length;

export function LogoMoeda({ tamanho = 180, aoConcluir }: { tamanho?: number; aoConcluir?: () => void }) {
  const k = tamanho / LADO;
  const raio = MOEDA.r * k;
  const centroX = (MOEDA.cx - ORIGEM) * k;
  const centroY = (MOEDA.cy - ORIGEM) * k;
  const chao = centroY + raio * ESCALA_QUEDA;

  const [etapa, setEtapa] = useState(ETAPA_QUEDA);
  const avancar = useCallback(() => setEtapa((atual) => atual + 1), []);

  const aoConcluirAtual = useRef(aoConcluir);
  useEffect(() => {
    aoConcluirAtual.current = aoConcluir;
  }, [aoConcluir]);

  const altura = useSharedValue(-tamanho * ALTURA_QUEDA);
  const giro = useSharedValue(0);
  const escala = useSharedValue(ESCALA_QUEDA);
  const impacto = useSharedValue(0);

  useEffect(() => {
    const iniciarOnda = () => {
      impacto.value = withTiming(1, { duration: DURACAO_ONDA, easing: Easing.out(Easing.quad) });
    };
    const cai = (duracao: number, fim?: () => void) =>
      withTiming(0, { duration: duracao, easing: Easing.in(Easing.quad) }, fim && aoTerminar(fim));
    const sobe = (h: number, duracao: number) =>
      withTiming(h * tamanho, { duration: duracao, easing: Easing.out(Easing.quad) });

    const ultimo = QUIQUE.length - 1;
    altura.value = withSequence(
      cai(QUEDA, iniciarOnda),
      ...QUIQUE.flatMap((q, i) => [
        sobe(q.altura, q.duracao),
        cai(q.duracao, i === ultimo ? () => setEtapa(ETAPA_ENCOLHER) : undefined),
      ]),
    );
    giro.value = withTiming(Math.PI * 6, {
      duration: DURACAO_QUEDA,
      easing: Easing.out(Easing.cubic),
    });
  }, [altura, giro, impacto, tamanho]);

  useEffect(() => {
    if (etapa !== ETAPA_ENCOLHER) return;
    escala.value = withTiming(
      1,
      { duration: DURACAO_ENCOLHER, easing: Easing.out(Easing.back(1.4)) },
      aoTerminar(() => setEtapa(0)),
    );
  }, [etapa, escala]);

  useEffect(() => {
    if (etapa === ETAPA_PRONTA) aoConcluirAtual.current?.();
  }, [etapa]);

  const estiloMoeda = useAnimatedStyle(() => ({
    transform: [
      { translateY: altura.value },
      { scale: escala.value },
      { scaleX: Math.max(Math.abs(Math.cos(giro.value)), 0.06) },
    ],
  }));

  const estiloSombra = useAnimatedStyle(() => {
    const perto = interpolate(altura.value, [-tamanho * ALTURA_QUEDA, 0], [0, 1], 'clamp');
    return {
      opacity: perto * 0.25 * interpolate(escala.value, [1, ESCALA_QUEDA], [0, 1], 'clamp'),
      transform: [{ scaleX: 0.4 + perto * 0.6 }],
    };
  });

  const estiloOnda = useAnimatedStyle(() => ({
    opacity: impacto.value === 0 ? 0 : 0.9 * (1 - impacto.value),
    transform: [{ scale: ESCALA_QUEDA * (0.9 + impacto.value * 1.3) }, { scaleY: 0.35 }],
  }));

  return (
    <View
      style={{ width: tamanho, height: tamanho }}
      accessibilityRole="image"
      accessibilityLabel={NOME_DO_APP}
    >
      <Animated.View
        style={[
          estilos.sombra,
          {
            left: centroX - raio * 1.3,
            top: chao - raio * 0.2,
            width: raio * 2.6,
            height: raio * 0.4,
            borderRadius: raio,
          },
          estiloSombra,
        ]}
      />
      <Animated.View
        style={[
          estilos.onda,
          { left: centroX - raio, top: chao - raio, width: raio * 2, height: raio * 2, borderRadius: raio },
          estiloOnda,
        ]}
      />

      {PECAS.map((peca, i) => (
        <PecaAnimada
          key={peca.chave}
          ativa={etapa === i}
          tamanho={tamanho}
          deslocamentoX={centroX - tamanho / 2}
          deslocamentoY={centroY - tamanho / 2}
          aoTerminar={avancar}
        >
          {peca.desenhar(PALETA)}
        </PecaAnimada>
      ))}

      <Animated.View
        style={[
          estilos.absoluto,
          { left: centroX - raio, top: centroY - raio, width: raio * 2, height: raio * 2 },
          estiloMoeda,
        ]}
      >
        <MoedaSvg tamanho={raio * 2} paleta={PALETA} />
      </Animated.View>
    </View>
  );
}

function PecaAnimada({
  ativa,
  tamanho,
  deslocamentoX,
  deslocamentoY,
  aoTerminar: fim,
  children,
}: {
  ativa: boolean;
  tamanho: number;
  deslocamentoX: number;
  deslocamentoY: number;
  aoTerminar: () => void;
  children: ReactNode;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    if (!ativa) return;
    p.value = withTiming(
      1,
      { duration: DURACAO_PECA, easing: Easing.out(Easing.back(1.6)) },
      aoTerminar(fim),
    );
  }, [ativa, p, fim]);

  const estilo = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.25], [0, 1], 'clamp'),
    transform: [
      { translateX: deslocamentoX * (1 - p.value) },
      { translateY: deslocamentoY * (1 - p.value) },
      { scale: interpolate(p.value, [0, 1], [0.15, 1]) },
    ],
  }));

  return (
    <Animated.View style={[estilos.absoluto, { width: tamanho, height: tamanho }, estilo]}>
      <SvgLogo tamanho={tamanho} paleta={PALETA}>
        {children}
      </SvgLogo>
    </Animated.View>
  );
}

const estilos = StyleSheet.create({
  absoluto: { position: 'absolute', left: 0, top: 0 },
  sombra: { position: 'absolute', backgroundColor: cores.verdeEscuro },
  onda: { position: 'absolute', borderWidth: 3, borderColor: ouro.base },
});
