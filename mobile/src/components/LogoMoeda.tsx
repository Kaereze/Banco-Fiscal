import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Polygon,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { ouro } from '@/lib/theme';

/**
 * A logo do Banco Fiscal nascendo de uma moeda.
 *
 * Uma moeda dourada cai girando, quica no chão, solta um brilho no impacto
 * e as peças da logo saem de dentro dela até montar o desenho. A moeda não
 * some: ela vira a moeda do "$" no centro da logo.
 *
 * Com `repetir`, a cena recomeça depois de uma pausa — é a tela de espera.
 * Sem, roda uma vez e a logo fica.
 */

// ------------------------------------------------------------
// Geometria
// ------------------------------------------------------------
// As peças estão num viewBox de 150 × 150 centrado na logo. As coordenadas
// saíram da arte original; a moeda fica em (CX, CY) com raio R.
const VIEWBOX = '21.5 21.5 150 150';
const ORIGEM = 21.5;
const LADO = 150;
const CX = 106;
const CY = 97.5;
const R = 29.5;

type Peca = { chave: string; desenho: React.ReactNode };

/**
 * Na ordem em que saem da moeda: primeiro o que está colado nela, depois
 * o que está longe. Assim a logo parece se abrir a partir do centro.
 */
const PECAS: Peca[] = [
  {
    chave: 'espessura',
    desenho: <Circle cx={CX + 1.8} cy={CY - 1.6} r={R} fill={ouro.escuro} />,
  },
  {
    chave: 'haste',
    desenho: <Rect x={60.5} y={45.5} width={22} height={102} rx={1.2} fill="url(#ouroK)" />,
  },
  {
    chave: 'bracos',
    desenho: (
      <>
        <Polygon points="82.5,79 128.5,45.5 154,45.5 82.5,97.5" fill="url(#ouroK)" />
        <Polygon points="82.5,114 128,147.5 156.5,147.5 82.5,95.5" fill="url(#ouroK)" />
      </>
    ),
  },
  {
    chave: 'triangulos',
    desenho: (
      <>
        <Polygon points="95.5,45.5 110,45.5 95.5,59" fill={ouro.medio} />
        <Polygon points="95.5,133 110,147.5 95.5,147.5" fill={ouro.medio} />
      </>
    ),
  },
  {
    chave: 'direita',
    desenho: <Polygon points="155.5,66 163,66 163,127 155.5,127 132,96.5" fill={ouro.medio} />,
  },
  {
    chave: 'esquerda',
    desenho: <Rect x={30.5} y={65.8} width={17.2} height={61.2} rx={1.2} fill={ouro.medio} />,
  },
];

// ------------------------------------------------------------
// Ritmo
// ------------------------------------------------------------
const QUEDA = 550;
const QUIQUE = [
  { altura: -0.28, duracao: 240 },
  { altura: -0.07, duracao: 130 },
];
/** Quando a moeda termina de quicar e começa a virar logo. */
const POUSO = QUEDA + QUIQUE.reduce((s, q) => s + q.duracao * 2, 0);
const ENTRADA_PECAS = POUSO + 250;
const ESCALONAMENTO = 90;
const DURACAO_PECA = 480;
/** Tamanho da moeda durante a queda, em relação ao tamanho final dela. */
const ESCALA_QUEDA = 1.7;

/** Da queda até a última peça assentar. */
export const DURACAO_TOTAL = ENTRADA_PECAS + ESCALONAMENTO * PECAS.length + DURACAO_PECA;
const PAUSA_ENTRE_CICLOS = 1400;

export function LogoMoeda({
  tamanho = 180,
  repetir = false,
}: {
  tamanho?: number;
  repetir?: boolean;
}) {
  // Remontar com outra chave é o jeito mais simples de reiniciar todas as
  // animações juntas, sem sincronizar um relógio entre elas.
  const [ciclo, setCiclo] = useState(0);

  useEffect(() => {
    if (!repetir) return;
    const id = setInterval(() => setCiclo((c) => c + 1), DURACAO_TOTAL + PAUSA_ENTRE_CICLOS);
    return () => clearInterval(id);
  }, [repetir]);

  return <Cena key={ciclo} tamanho={tamanho} />;
}

function Cena({ tamanho }: { tamanho: number }) {
  const k = tamanho / LADO;
  const raio = R * k;
  const centroX = (CX - ORIGEM) * k;
  const centroY = (CY - ORIGEM) * k;

  const altura = useSharedValue(-tamanho * 1.4);
  const giro = useSharedValue(0);
  const escala = useSharedValue(ESCALA_QUEDA);
  const impacto = useSharedValue(0);

  useEffect(() => {
    const cai = (duracao: number) =>
      withTiming(0, { duration: duracao, easing: Easing.in(Easing.quad) });
    const sobe = (h: number, duracao: number) =>
      withTiming(h * tamanho, { duration: duracao, easing: Easing.out(Easing.quad) });

    altura.value = withSequence(
      cai(QUEDA),
      ...QUIQUE.flatMap((q) => [sobe(q.altura, q.duracao), cai(q.duracao)]),
    );

    // Termina num múltiplo de 2π para a moeda parar de frente.
    giro.value = withTiming(Math.PI * 6, { duration: POUSO, easing: Easing.out(Easing.cubic) });

    impacto.value = withDelay(QUEDA, withTiming(1, { duration: 600, easing: Easing.out(Easing.quad) }));

    escala.value = withDelay(POUSO, withSpring(1, { damping: 12, stiffness: 120 }));
  }, [altura, giro, escala, impacto, tamanho]);

  const estiloMoeda = useAnimatedStyle(() => ({
    transform: [
      { translateY: altura.value },
      { scale: escala.value },
      // O cosseno achata a moeda de lado, como se girasse em pé.
      { scaleX: Math.max(Math.abs(Math.cos(giro.value)), 0.06) },
    ],
  }));

  const estiloSombra = useAnimatedStyle(() => {
    const perto = interpolate(altura.value, [-tamanho * 1.4, 0], [0, 1], 'clamp');
    return {
      opacity: perto * 0.5 * interpolate(escala.value, [1, ESCALA_QUEDA], [0, 1], 'clamp'),
      transform: [{ scaleX: 0.4 + perto * 0.6 }],
    };
  });

  const estiloOnda = useAnimatedStyle(() => ({
    opacity: impacto.value === 0 ? 0 : 0.8 * (1 - impacto.value),
    transform: [{ scale: ESCALA_QUEDA * (0.9 + impacto.value * 1.3) }, { scaleY: 0.35 }],
  }));

  const posicaoMoeda = {
    left: centroX - raio,
    top: centroY - raio,
    width: raio * 2,
    height: raio * 2,
  };

  return (
    <View style={{ width: tamanho, height: tamanho }} accessibilityLabel="Banco Fiscal">
      {/* Chão: sombra e onda de impacto, logo abaixo de onde a moeda pousa. */}
      <Animated.View
        style={[
          estilos.sombra,
          {
            left: centroX - raio * 1.3,
            top: centroY + raio * ESCALA_QUEDA - raio * 0.2,
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
          {
            left: centroX - raio,
            top: centroY + raio * ESCALA_QUEDA - raio,
            width: raio * 2,
            height: raio * 2,
            borderRadius: raio,
          },
          estiloOnda,
        ]}
      />

      {PECAS.map((peca, i) => (
        <PecaAnimada
          key={peca.chave}
          indice={i}
          tamanho={tamanho}
          origemX={centroX - tamanho / 2}
          origemY={centroY - tamanho / 2}
        >
          {peca.desenho}
        </PecaAnimada>
      ))}

      <Animated.View style={[estilos.absoluto, posicaoMoeda, estiloMoeda]}>
        <Moeda tamanho={raio * 2} />
      </Animated.View>
    </View>
  );
}

/**
 * Uma peça da logo saindo de dentro da moeda: começa pequena e em cima do
 * centro dela, e desliza até o lugar final crescendo.
 */
function PecaAnimada({
  indice,
  tamanho,
  origemX,
  origemY,
  children,
}: {
  indice: number;
  tamanho: number;
  origemX: number;
  origemY: number;
  children: React.ReactNode;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      ENTRADA_PECAS + indice * ESCALONAMENTO,
      withTiming(1, { duration: DURACAO_PECA, easing: Easing.out(Easing.back(1.6)) }),
    );
  }, [indice, p]);

  const estilo = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.25], [0, 1], 'clamp'),
    transform: [
      { translateX: origemX * (1 - p.value) },
      { translateY: origemY * (1 - p.value) },
      { scale: interpolate(p.value, [0, 1], [0.15, 1]) },
    ],
  }));

  return (
    <Animated.View style={[estilos.absoluto, { width: tamanho, height: tamanho }, estilo]}>
      <SvgLogo tamanho={tamanho}>{children}</SvgLogo>
    </Animated.View>
  );
}

function SvgLogo({ tamanho, children }: { tamanho: number; children: React.ReactNode }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox={VIEWBOX}>
      <Defs>
        <LinearGradient id="ouroK" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={ouro.claro} />
          <Stop offset="1" stopColor={ouro.base} />
        </LinearGradient>
      </Defs>
      {children}
    </Svg>
  );
}

/** A moeda: aro claro, miolo mais fundo e o "$" em relevo. */
function Moeda({ tamanho }: { tamanho: number }) {
  return (
    <Svg width={tamanho} height={tamanho} viewBox="-30 -30 60 60">
      <Defs>
        <LinearGradient id="aro" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={ouro.brilho} />
          <Stop offset="0.5" stopColor={ouro.claro} />
          <Stop offset="1" stopColor={ouro.base} />
        </LinearGradient>
        <LinearGradient id="miolo" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={ouro.base} />
          <Stop offset="1" stopColor={ouro.medio} />
        </LinearGradient>
      </Defs>
      <Circle r={R} fill="url(#aro)" />
      <Circle r={R - 4.5} fill="url(#miolo)" />
      <SvgText
        y={12.5}
        fontSize={36}
        fontWeight="bold"
        textAnchor="middle"
        fill={ouro.brilho}
        stroke={ouro.escuro}
        strokeWidth={0.6}
      >
        $
      </SvgText>
    </Svg>
  );
}

const estilos = StyleSheet.create({
  absoluto: { position: 'absolute', left: 0, top: 0 },
  sombra: { position: 'absolute', backgroundColor: '#000' },
  onda: { position: 'absolute', borderWidth: 3, borderColor: ouro.claro },
});
