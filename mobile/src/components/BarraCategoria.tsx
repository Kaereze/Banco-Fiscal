import { StyleSheet, Text, View } from 'react-native';

import { moeda } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';
import type { Categoria } from '@/lib/types';

type Props = {
  categoria: Categoria | null;
  total: number;
  /** Fatia do gasto do mês, de 0 a 1. */
  fatia: number;
  limite: number | null;
};

/**
 * Quando existe orçamento, a barra passa a medir o consumo dele (e fica
 * vermelha se estourar). Sem orçamento, mede a fatia do gasto do mês.
 */
export function BarraCategoria({ categoria, total, fatia, limite }: Props) {
  const temOrcamento = limite !== null && limite > 0;
  const consumo = temOrcamento ? total / limite : fatia;
  const estourou = temOrcamento && total > limite;

  const cor = estourou ? cores.saida : categoria?.cor ?? cores.textoFraco;
  const largura = `${Math.min(Math.max(consumo, 0), 1) * 100}%` as const;

  return (
    <View style={estilos.bloco}>
      <View style={estilos.topo}>
        <Text style={estilos.emoji}>{categoria?.emoji ?? '❓'}</Text>
        <Text style={estilos.nome} numberOfLines={1}>
          {categoria?.nome ?? 'Sem categoria'}
        </Text>
        <Text style={estilos.total}>{moeda(total)}</Text>
      </View>

      <View style={estilos.trilho}>
        <View style={[estilos.preenchimento, { width: largura, backgroundColor: cor }]} />
      </View>

      <Text style={[estilos.legenda, estourou && { color: cores.saida, fontWeight: '700' }]}>
        {temOrcamento
          ? estourou
            ? `Passou ${moeda(total - limite)} do limite de ${moeda(limite)}`
            : `${Math.round(consumo * 100)}% do limite de ${moeda(limite)}`
          : `${Math.round(fatia * 100)}% dos gastos do mês`}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  bloco: { gap: espaco.xs },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
  },
  emoji: { fontSize: 18 },
  nome: {
    flex: 1,
    fontSize: fonte.corpo,
    fontWeight: '600',
    color: cores.texto,
  },
  total: {
    fontSize: fonte.corpo,
    fontWeight: '700',
    color: cores.texto,
    fontVariant: ['tabular-nums'],
  },
  trilho: {
    height: 10,
    borderRadius: raio.pilula,
    backgroundColor: cores.superficieSuave,
    overflow: 'hidden',
  },
  preenchimento: {
    height: '100%',
    borderRadius: raio.pilula,
  },
  legenda: {
    fontSize: fonte.mini,
    color: cores.textoFraco,
  },
});
