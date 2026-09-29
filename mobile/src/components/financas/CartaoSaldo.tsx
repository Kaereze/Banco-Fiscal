import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { moeda } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';

export function CartaoSaldo({
  rotulo,
  valor,
  children,
}: {
  rotulo: string;
  valor: number;
  children?: ReactNode;
}) {
  const negativo = valor < 0;
  return (
    <View style={estilos.cartao} accessibilityLabel={`${rotulo}: ${negativo ? 'menos ' : ''}${moeda(valor)}`}>
      <View style={estilos.detalhe} />
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <Text style={estilos.valor} numberOfLines={1} adjustsFontSizeToFit>
        {negativo ? '− ' : ''}
        {moeda(valor)}
      </Text>
      {children}
    </View>
  );
}

export function LinhaSaldo({ children }: { children: ReactNode }) {
  return <Text style={estilos.apoio}>{children}</Text>;
}

const estilos = StyleSheet.create({
  cartao: {
    minHeight: 164,
    justifyContent: 'center',
    gap: espaco.sm,
    padding: espaco.xl,
    borderRadius: raio.lg,
    backgroundColor: cores.verdeEscuro,
    overflow: 'hidden',
  },
  detalhe: {
    position: 'absolute',
    right: -48,
    top: -48,
    width: 180,
    height: 180,
    borderRadius: raio.pilula,
    backgroundColor: cores.primaria,
    opacity: 0.35,
  },
  rotulo: { fontSize: fonte.apoio, fontWeight: '600', color: cores.verdeClaro },
  valor: {
    fontSize: fonte.gigante,
    fontWeight: '800',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  apoio: { fontSize: fonte.mini, color: cores.verdeClaro },
});
