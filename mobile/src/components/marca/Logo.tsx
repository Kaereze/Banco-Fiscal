import { Fragment, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Polygon, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { cores, fonte, ouro } from '@/lib/theme';

export const VIEWBOX = '21.5 21.5 150 150';
export const ORIGEM = 21.5;
export const LADO = 150;
export const MOEDA = { cx: 106, cy: 97.5, r: 29.5 } as const;

export type NomePaleta = 'verde' | 'ouro';

type Paleta = {
  apoio: string;
  kTopo: string;
  kBase: string;
  espessura: string;
  aroClaro: string;
  aroMeio: string;
  aroEscuro: string;
  mioloTopo: string;
  mioloBase: string;
  cifrao: string;
  contornoCifrao: string;
};

export const PALETAS: Record<NomePaleta, Paleta> = {
  verde: {
    apoio: cores.verdeEscuro,
    kTopo: '#7ad693',
    kBase: '#39a96b',
    espessura: '#1f7a4c',
    aroClaro: '#d6f5df',
    aroMeio: '#8fdaa6',
    aroEscuro: '#4fb97a',
    mioloTopo: '#2f9a5f',
    mioloBase: '#1f7a4c',
    cifrao: '#c8f3d4',
    contornoCifrao: '#174a3a',
  },
  ouro: {
    apoio: ouro.medio,
    kTopo: ouro.claro,
    kBase: ouro.base,
    espessura: ouro.escuro,
    aroClaro: ouro.brilho,
    aroMeio: ouro.claro,
    aroEscuro: ouro.base,
    mioloTopo: ouro.base,
    mioloBase: ouro.medio,
    cifrao: ouro.brilho,
    contornoCifrao: ouro.escuro,
  },
};

const idK = (p: NomePaleta) => `k-${p}`;

export type Peca = { chave: string; desenhar: (p: NomePaleta) => ReactNode };

export const PECAS: Peca[] = [
  {
    chave: 'espessura',
    desenhar: (p) => (
      <Circle cx={MOEDA.cx + 1.8} cy={MOEDA.cy - 1.6} r={MOEDA.r} fill={PALETAS[p].espessura} />
    ),
  },
  {
    chave: 'haste',
    desenhar: (p) => (
      <Rect x={60.5} y={45.5} width={22} height={102} rx={1.2} fill={`url(#${idK(p)})`} />
    ),
  },
  {
    chave: 'bracos',
    desenhar: (p) => (
      <>
        <Polygon points="82.5,79 128.5,45.5 154,45.5 82.5,97.5" fill={`url(#${idK(p)})`} />
        <Polygon points="82.5,114 128,147.5 156.5,147.5 82.5,95.5" fill={`url(#${idK(p)})`} />
      </>
    ),
  },
  {
    chave: 'triangulos',
    desenhar: (p) => (
      <>
        <Polygon points="95.5,45.5 110,45.5 95.5,59" fill={PALETAS[p].apoio} />
        <Polygon points="95.5,133 110,147.5 95.5,147.5" fill={PALETAS[p].apoio} />
      </>
    ),
  },
  {
    chave: 'direita',
    desenhar: (p) => (
      <Polygon points="155.5,66 163,66 163,127 155.5,127 132,96.5" fill={PALETAS[p].apoio} />
    ),
  },
  {
    chave: 'esquerda',
    desenhar: (p) => (
      <Rect x={30.5} y={65.8} width={17.2} height={61.2} rx={1.2} fill={PALETAS[p].apoio} />
    ),
  },
];

export function SvgLogo({
  tamanho,
  paleta,
  children,
}: {
  tamanho: number;
  paleta: NomePaleta;
  children: ReactNode;
}) {
  const p = PALETAS[paleta];
  return (
    <Svg width={tamanho} height={tamanho} viewBox={VIEWBOX}>
      <Defs>
        <LinearGradient id={idK(paleta)} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={p.kTopo} />
          <Stop offset="1" stopColor={p.kBase} />
        </LinearGradient>
      </Defs>
      {children}
    </Svg>
  );
}

export function MoedaSvg({ tamanho, paleta }: { tamanho: number; paleta: NomePaleta }) {
  const p = PALETAS[paleta];
  const aro = `aro-${paleta}`;
  const miolo = `miolo-${paleta}`;
  return (
    <Svg width={tamanho} height={tamanho} viewBox="-30 -30 60 60">
      <Defs>
        <LinearGradient id={aro} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={p.aroClaro} />
          <Stop offset="0.5" stopColor={p.aroMeio} />
          <Stop offset="1" stopColor={p.aroEscuro} />
        </LinearGradient>
        <LinearGradient id={miolo} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={p.mioloTopo} />
          <Stop offset="1" stopColor={p.mioloBase} />
        </LinearGradient>
      </Defs>
      <Circle r={MOEDA.r} fill={`url(#${aro})`} />
      <Circle r={MOEDA.r - 4.5} fill={`url(#${miolo})`} />
      <SvgText
        y={12.5}
        fontSize={36}
        fontWeight="bold"
        textAnchor="middle"
        fill={p.cifrao}
        stroke={p.contornoCifrao}
        strokeWidth={0.6}
      >
        $
      </SvgText>
    </Svg>
  );
}

export function Logo({ tamanho = 88, paleta = 'verde' }: { tamanho?: number; paleta?: NomePaleta }) {
  const k = tamanho / LADO;
  const raio = MOEDA.r * k;
  return (
    <View
      style={{ width: tamanho, height: tamanho }}
      accessibilityRole="image"
      accessibilityLabel="K Financeiro"
    >
      <SvgLogo tamanho={tamanho} paleta={paleta}>
        {PECAS.map((peca) => (
          <Fragment key={peca.chave}>{peca.desenhar(paleta)}</Fragment>
        ))}
      </SvgLogo>
      <View
        style={[
          estilos.moeda,
          {
            left: (MOEDA.cx - ORIGEM) * k - raio,
            top: (MOEDA.cy - ORIGEM) * k - raio,
          },
        ]}
      >
        <MoedaSvg tamanho={raio * 2} paleta={paleta} />
      </View>
    </View>
  );
}

export function Marca({ tamanho = 40 }: { tamanho?: number }) {
  return (
    <View style={estilos.marca}>
      <Logo tamanho={tamanho} />
      <Text style={estilos.nome}>{NOME_DO_APP}</Text>
    </View>
  );
}

export const NOME_DO_APP = 'K Financeiro';

const estilos = StyleSheet.create({
  moeda: { position: 'absolute' },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nome: { fontSize: fonte.subtitulo, fontWeight: '800', color: cores.verdeEscuro },
});
