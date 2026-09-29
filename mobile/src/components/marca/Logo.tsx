import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

import { FORMAS, LADO, MOEDA, ORIGEM, VIEWBOX, type Tinta } from '@/components/marca/geometria';
import { cores, fonte, ouro } from '@/lib/theme';

export const NOME_DO_APP = 'K Financeiro';

export type NomePaleta = 'verde' | 'ouro';

type Paleta = {
  apoio: string;
  kTopo: string;
  kBase: string;
  espessura: string;
  traco: string;
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
    traco: cores.verdeEscuro,
    aroClaro: '#d6f5df',
    aroMeio: '#8fdaa6',
    aroEscuro: '#4fb97a',
    mioloTopo: '#2f9a5f',
    mioloBase: '#1f7a4c',
    cifrao: '#c8f3d4',
    contornoCifrao: cores.verdeEscuro,
  },
  ouro: {
    apoio: ouro.medio,
    kTopo: ouro.claro,
    kBase: ouro.base,
    espessura: ouro.escuro,
    traco: ouro.escuro,
    aroClaro: ouro.brilho,
    aroMeio: ouro.claro,
    aroEscuro: ouro.base,
    mioloTopo: ouro.base,
    mioloBase: ouro.medio,
    cifrao: ouro.brilho,
    contornoCifrao: ouro.escuro,
  },
};

export function tinta(paleta: NomePaleta, qual: Tinta): string {
  if (qual === 'k') return `url(#k-${paleta})`;
  return PALETAS[paleta][qual];
}

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
        <LinearGradient id={`k-${paleta}`} x1="0" y1="0" x2="0" y2="1">
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

export function posicaoDaMoeda(tamanho: number) {
  const k = tamanho / LADO;
  const raio = MOEDA.r * k;
  const centroX = (MOEDA.cx - ORIGEM) * k;
  const centroY = (MOEDA.cy - ORIGEM) * k;
  return { raio, centroX, centroY, left: centroX - raio, top: centroY - raio, width: raio * 2, height: raio * 2 };
}

export function Logo({ tamanho = 88, paleta = 'verde' }: { tamanho?: number; paleta?: NomePaleta }) {
  const moeda = posicaoDaMoeda(tamanho);
  return (
    <View style={{ width: tamanho, height: tamanho }} accessibilityRole="image" accessibilityLabel={NOME_DO_APP}>
      <SvgLogo tamanho={tamanho} paleta={paleta}>
        {FORMAS.map((forma) => (
          <Path key={forma.chave} d={forma.caminho} fill={tinta(paleta, forma.tinta)} />
        ))}
      </SvgLogo>
      <View style={[estilos.moeda, { left: moeda.left, top: moeda.top }]}>
        <MoedaSvg tamanho={moeda.width} paleta={paleta} />
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

const estilos = StyleSheet.create({
  moeda: { position: 'absolute' },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nome: { fontSize: fonte.subtitulo, fontWeight: '800', color: cores.verdeEscuro },
});
