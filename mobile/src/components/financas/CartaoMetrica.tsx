import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { NomeIcone } from '@/components/ui';
import { moeda } from '@/lib/format';
import { cores, espaco, fonte, raio, sombra } from '@/lib/theme';

export function CartaoMetrica({
  titulo,
  valor,
  icone,
  cor,
}: {
  titulo: string;
  valor: number;
  icone: NomeIcone;
  cor: string;
}) {
  return (
    <View style={estilos.cartao} accessibilityLabel={`${titulo}: ${moeda(valor)}`}>
      <View style={[estilos.icone, { backgroundColor: `${cor}1f` }]}>
        <Ionicons name={icone} size={18} color={cor} />
      </View>
      <Text style={estilos.titulo}>{titulo}</Text>
      <Text style={[estilos.valor, { color: cor }]} numberOfLines={1} adjustsFontSizeToFit>
        {moeda(valor)}
      </Text>
    </View>
  );
}

export function LinhaMetricas({ children }: { children: ReactNode }) {
  return <View style={estilos.linha}>{children}</View>;
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', gap: espaco.sm },
  cartao: {
    flex: 1,
    minHeight: 92,
    gap: espaco.xs,
    padding: espaco.md,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
    ...sombra,
  },
  icone: {
    width: 32,
    height: 32,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: fonte.mini, color: cores.textoSuave, fontWeight: '600' },
  valor: { fontSize: fonte.apoio, fontWeight: '800', fontVariant: ['tabular-nums'] },
});
