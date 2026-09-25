import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { dataCurta, moeda } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';
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

  // Navegação programática em vez de <Link asChild>: no navegador o Link
  // envolve o filho numa âncora `display: inline`, que anula o
  // flexDirection da linha e empilha ícone, descrição e valor.
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/transacao/[id]', params: { id: transacao.id } })}
      accessibilityRole="button"
      accessibilityLabel={`${transacao.descricao}, ${saida ? 'saída' : 'entrada'} de ${moeda(
        transacao.valor,
      )}`}
      style={({ pressed }) => [estilos.linha, pressed && { backgroundColor: cores.superficieSuave }]}
    >
      <View
        style={[
          estilos.selo,
          { backgroundColor: categoria ? `${categoria.cor}22` : cores.superficieSuave },
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
          { color: apagada ? cores.textoFraco : saida ? cores.texto : cores.entrada },
          apagada && estilos.riscado,
        ]}
      >
        {saida ? '−' : '+'} {moeda(transacao.valor)}
      </Text>
    </Pressable>
  );
}

const estilos = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.md,
    paddingVertical: espaco.md,
    paddingHorizontal: espaco.lg,
    backgroundColor: cores.superficie,
  },
  selo: {
    width: 44,
    height: 44,
    borderRadius: raio.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seloEmoji: { fontSize: 20 },
  meio: { flex: 1, gap: 2 },
  descricao: {
    fontSize: fonte.corpo,
    fontWeight: '600',
    color: cores.texto,
  },
  detalhe: {
    fontSize: fonte.mini,
    color: cores.textoFraco,
  },
  valor: {
    fontSize: fonte.corpo,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  riscado: {
    textDecorationLine: 'line-through',
  },
});
