import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type { ResumoMes } from '@/lib/dados';
import { moeda } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';

const TAMANHO = 160;
const ESPESSURA = 22;
const RAIO = (TAMANHO - ESPESSURA) / 2;
const CIRCUNFERENCIA = 2 * Math.PI * RAIO;
const FATIAS_VISIVEIS = 4;

type Fatia = { chave: string; nome: string; emoji: string; cor: string; total: number; fatia: number };

export function GraficoCategorias({ porCategoria, total }: { porCategoria: ResumoMes['porCategoria']; total: number }) {
  const fatias = agrupar(porCategoria);
  const inicios = fatias.map((_, i) =>
    fatias.slice(0, i).reduce((soma, fatia) => soma + fatia.fatia * CIRCUNFERENCIA, 0),
  );

  return (
    <View style={estilos.bloco}>
      <View style={estilos.rosca} accessibilityLabel={`Gasto total do mês: ${moeda(total)}`}>
        <Svg width={TAMANHO} height={TAMANHO}>
          <Circle
            cx={TAMANHO / 2}
            cy={TAMANHO / 2}
            r={RAIO}
            stroke={cores.superficieSuave}
            strokeWidth={ESPESSURA}
            fill="none"
          />
          {fatias.map((fatia, i) => {
            const comprimento = fatia.fatia * CIRCUNFERENCIA;
            return (
              <Circle
                key={fatia.chave}
                cx={TAMANHO / 2}
                cy={TAMANHO / 2}
                r={RAIO}
                stroke={fatia.cor}
                strokeWidth={ESPESSURA}
                fill="none"
                strokeDasharray={`${comprimento} ${CIRCUNFERENCIA - comprimento}`}
                strokeDashoffset={-inicios[i]}
                rotation={-90}
                origin={`${TAMANHO / 2}, ${TAMANHO / 2}`}
              />
            );
          })}
        </Svg>
        <View style={estilos.centro}>
          <Text style={estilos.centroRotulo}>Gasto</Text>
          <Text style={estilos.centroValor} numberOfLines={1} adjustsFontSizeToFit>
            {moeda(total)}
          </Text>
        </View>
      </View>

      <View style={estilos.legenda}>
        {fatias.map((fatia) => (
          <View key={fatia.chave} style={estilos.legendaItem}>
            <View style={[estilos.legendaPonto, { backgroundColor: fatia.cor }]} />
            <Text style={estilos.legendaNome} numberOfLines={1}>
              {fatia.emoji} {fatia.nome}
            </Text>
            <Text style={estilos.legendaPercentual}>{Math.round(fatia.fatia * 100)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function agrupar(porCategoria: ResumoMes['porCategoria']): Fatia[] {
  const principais: Fatia[] = porCategoria.slice(0, FATIAS_VISIVEIS).map((item) => ({
    chave: item.categoria?.id ?? 'sem-categoria',
    nome: item.categoria?.nome ?? 'Sem categoria',
    emoji: item.categoria?.emoji ?? '❓',
    cor: item.categoria?.cor ?? cores.textoFraco,
    total: item.total,
    fatia: item.fatia,
  }));

  const resto = porCategoria.slice(FATIAS_VISIVEIS);
  if (resto.length === 0) return principais;

  return [
    ...principais,
    {
      chave: 'outras',
      nome: 'Outras',
      emoji: '•',
      cor: cores.verdeClaro,
      total: resto.reduce((soma, item) => soma + item.total, 0),
      fatia: resto.reduce((soma, item) => soma + item.fatia, 0),
    },
  ];
}

const estilos = StyleSheet.create({
  bloco: { alignItems: 'center', gap: espaco.lg },
  rosca: { width: TAMANHO, height: TAMANHO },
  centro: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ESPESSURA + espaco.sm,
  },
  centroRotulo: { fontSize: fonte.mini, color: cores.textoSuave },
  centroValor: { fontSize: fonte.apoio, fontWeight: '800', color: cores.verdeEscuro },
  legenda: { alignSelf: 'stretch', gap: espaco.sm },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  legendaPonto: { width: 12, height: 12, borderRadius: raio.pilula },
  legendaNome: { flex: 1, fontSize: fonte.apoio, color: cores.texto },
  legendaPercentual: {
    fontSize: fonte.apoio,
    fontWeight: '700',
    color: cores.verdeEscuro,
    fontVariant: ['tabular-nums'],
  },
});
