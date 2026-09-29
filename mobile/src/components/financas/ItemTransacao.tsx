import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dataCurta, moeda } from '@/lib/format';
import { cores, espaco, fonte, raio, sombra } from '@/lib/theme';
import type { Categoria, Transacao } from '@/lib/types';

export function ItemTransacao({
  transacao,
  categoria,
}: {
  transacao: Transacao;
  categoria: Categoria | null;
}) {
  const router = useRouter();
  const saida = transacao.valor < 0;
  const apagada = transacao.ignorada;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/transacao/[id]', params: { id: transacao.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${transacao.descricao}, ${saida ? 'saída' : 'entrada'} de ${moeda(transacao.valor)}`}
      style={({ pressed }) => [estilos.cartao, pressed && estilos.pressionado]}
    >
      <View
        style={[
          estilos.selo,
          { backgroundColor: categoria ? `${categoria.cor}26` : cores.superficieSuave },
        ]}
      >
        <Text style={estilos.seloEmoji}>{categoria?.emoji ?? '❓'}</Text>
      </View>

      <View style={estilos.meio}>
        <Text style={[estilos.descricao, apagada && estilos.riscado]} numberOfLines={1}>
          {transacao.descricao}
        </Text>
        <Text style={estilos.detalhe} numberOfLines={1}>
          {[
            dataCurta(transacao.data),
            categoria?.nome ?? 'Sem categoria',
            transacao.pessoa,
            transacao.origem === 'manual' ? 'manual' : null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>

      <Text
        style={[
          estilos.valor,
          { color: apagada ? cores.textoFraco : saida ? cores.verdeEscuro : cores.entrada },
          apagada && estilos.riscado,
        ]}
      >
        {saida ? '−' : '+'} {moeda(transacao.valor)}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  cartao: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingVertical: espaco.md,
    paddingHorizontal: espaco.lg,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
    ...sombra,
  },
  pressionado: { backgroundColor: cores.superficieSuave },
  selo: {
    width: 42,
    height: 42,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seloEmoji: { fontSize: 20 },
  meio: { flex: 1, gap: 2 },
  descricao: { fontSize: fonte.corpo, fontWeight: '600', color: cores.texto },
  detalhe: { fontSize: fonte.mini, color: cores.textoFraco },
  valor: { fontSize: fonte.corpo, fontWeight: '700', fontVariant: ['tabular-nums'] },
  riscado: { textDecorationLine: 'line-through' },
});
