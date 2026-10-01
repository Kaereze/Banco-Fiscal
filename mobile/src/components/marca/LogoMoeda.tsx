import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { Path } from 'react-native-svg';

import { aoTerminar, useTransicao } from '@/components/animacao';
import { FORMAS, type Forma } from '@/components/marca/geometria';
import { MoedaSvg, NOME_DO_APP, PALETAS, posicaoDaMoeda, SvgLogo, tinta } from '@/components/marca/Logo';
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
const DURACAO_PREENCHER = 350;
const VELOCIDADE_DO_TRACO = 0.7;
const ESPESSURA_DO_TRACO = 1.6;
const ESCALA_QUEDA = 1.7;
const ALTURA_QUEDA = 1.4;

const ETAPA_QUEDA = -2;
const ETAPA_ENCOLHER = -1;
const ETAPA_PREENCHER = FORMAS.length;
const ETAPA_PRONTA = FORMAS.length + 1;

const PathAnimado = Animated.createAnimatedComponent(Path);

export function LogoMoeda({ tamanho = 180, aoConcluir }: { tamanho?: number; aoConcluir?: () => void }) {
  const moeda = posicaoDaMoeda(tamanho);
  const chao = moeda.centroY + moeda.raio * ESCALA_QUEDA;

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
  const preenchimento = useTransicao(etapa >= ETAPA_PREENCHER, avancar, undefined, DURACAO_PREENCHER);

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
    giro.value = withTiming(Math.PI * 6, { duration: DURACAO_QUEDA, easing: Easing.out(Easing.cubic) });
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
    <View style={{ width: tamanho, height: tamanho }} accessibilityRole="image" accessibilityLabel={NOME_DO_APP}>
      <Animated.View
        style={[
          estilos.sombra,
          {
            left: moeda.centroX - moeda.raio * 1.3,
            top: chao - moeda.raio * 0.2,
            width: moeda.raio * 2.6,
            height: moeda.raio * 0.4,
            borderRadius: moeda.raio,
          },
          estiloSombra,
        ]}
      />
      <Animated.View
        style={[
          estilos.onda,
          {
            left: moeda.left,
            top: chao - moeda.raio,
            width: moeda.width,
            height: moeda.height,
            borderRadius: moeda.raio,
          },
          estiloOnda,
        ]}
      />

      <View style={StyleSheet.absoluteFill}>
        <SvgLogo tamanho={tamanho} paleta={PALETA}>
          {FORMAS.map((forma, i) => (
            <Traco
              key={forma.chave}
              forma={forma}
              desenhando={etapa === i}
              preenchimento={preenchimento}
              aoTerminar={avancar}
            />
          ))}
        </SvgLogo>
      </View>

      <Animated.View
        style={[
          estilos.absoluto,
          { left: moeda.left, top: moeda.top, width: moeda.width, height: moeda.height },
          estiloMoeda,
        ]}
      >
        <MoedaSvg tamanho={moeda.width} paleta={PALETA} />
      </Animated.View>
    </View>
  );
}

function Traco({
  forma,
  desenhando,
  preenchimento,
  aoTerminar: fim,
}: {
  forma: Forma;
  desenhando: boolean;
  preenchimento: SharedValue<number>;
  aoTerminar: () => void;
}) {
  const desenhado = useSharedValue(0);

  useEffect(() => {
    if (!desenhando) return;
    desenhado.value = withTiming(
      1,
      { duration: forma.comprimento / VELOCIDADE_DO_TRACO, easing: Easing.linear },
      aoTerminar(fim),
    );
  }, [desenhando, desenhado, forma.comprimento, fim]);

  const propsAnimadas = useAnimatedProps(() => ({
    strokeDashoffset: forma.comprimento * (1 - desenhado.value),
    strokeOpacity: desenhado.value > 0 ? 1 : 0,
    fillOpacity: preenchimento.value,
  }));

  return (
    <PathAnimado
      d={forma.caminho}
      fill={tinta(PALETA, forma.tinta)}
      stroke={PALETAS[PALETA].traco}
      strokeWidth={ESPESSURA_DO_TRACO}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={[forma.comprimento, forma.comprimento]}
      animatedProps={propsAnimadas}
    />
  );
}

const estilos = StyleSheet.create({
  absoluto: { position: 'absolute', left: 0, top: 0 },
  sombra: { position: 'absolute', backgroundColor: cores.verdeEscuro },
  onda: { position: 'absolute', borderWidth: 3, borderColor: ouro.base },
});
