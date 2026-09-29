import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';

import { cores, espaco, fonte, raio, sombra } from '@/lib/theme';

export function Cartao({ style, ...resto }: ViewProps) {
  return <View style={[estilos.cartao, style]} {...resto} />;
}

export function CabecalhoTela({
  titulo,
  subtitulo,
  direita,
}: {
  titulo: string;
  subtitulo?: string;
  direita?: ReactNode;
}) {
  return (
    <View style={estilos.cabecalho}>
      <View style={estilos.cabecalhoTextos}>
        <Text style={estilos.cabecalhoTitulo} accessibilityRole="header">
          {titulo}
        </Text>
        {subtitulo ? <Text style={estilos.cabecalhoSubtitulo}>{subtitulo}</Text> : null}
      </View>
      {direita}
    </View>
  );
}

export function Titulo({
  children,
  acao,
}: {
  children: ReactNode;
  acao?: { texto: string; onPress: () => void };
}) {
  return (
    <View style={estilos.titulo}>
      <Text style={estilos.tituloTexto} accessibilityRole="header">
        {children}
      </Text>
      {acao ? (
        <Pressable onPress={acao.onPress} hitSlop={12} accessibilityRole="button">
          <Text style={estilos.tituloAcao}>{acao.texto}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Secao({ children }: { children: ReactNode }) {
  return <View style={estilos.secao}>{children}</View>;
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <Text style={estilos.rotulo}>{children}</Text>;
}

export function Separador() {
  return <View style={estilos.separador} />;
}

const estilos = StyleSheet.create({
  cartao: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    padding: espaco.xl,
    ...sombra,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    minHeight: 56,
  },
  cabecalhoTextos: { flex: 1 },
  cabecalhoTitulo: { fontSize: fonte.titulo, fontWeight: '800', color: cores.verdeEscuro },
  cabecalhoSubtitulo: { fontSize: fonte.apoio, color: cores.textoSuave, marginTop: 2 },
  titulo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tituloTexto: { fontSize: fonte.secao, fontWeight: '700', color: cores.texto },
  tituloAcao: { fontSize: fonte.apoio, fontWeight: '700', color: cores.primaria },
  secao: { gap: espaco.md },
  rotulo: { fontSize: fonte.apoio, fontWeight: '600', color: cores.textoSuave },
  separador: { height: 1, backgroundColor: cores.borda },
});
