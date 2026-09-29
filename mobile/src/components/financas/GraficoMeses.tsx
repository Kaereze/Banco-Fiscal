import { StyleSheet, Text, View } from 'react-native';

import type { MesDoHistorico } from '@/lib/dados';
import { mesCurto, mesPorExtenso, moeda } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';

const ALTURA_BARRAS = 150;

export function GraficoMeses({ historico, mesEmFoco }: { historico: MesDoHistorico[]; mesEmFoco: string }) {
  const maior = Math.max(1, ...historico.flatMap((m) => [m.gastos, m.receitas]));

  return (
    <View style={estilos.grafico}>
      <View style={estilos.barras}>
        {historico.map((item) => {
          const emFoco = item.mes === mesEmFoco;
          const nome = mesCurto(item.mes);
          return (
            <View
              key={item.mes}
              style={estilos.coluna}
              accessible
              accessibilityLabel={`${mesPorExtenso(item.mes)}: entrou ${moeda(item.receitas)}, saiu ${moeda(item.gastos)}`}
            >
              <View style={estilos.par}>
                <Barra valor={item.receitas} maior={maior} cor={emFoco ? cores.primaria : cores.verdeClaro} />
                <Barra valor={item.gastos} maior={maior} cor={emFoco ? cores.verdeEscuro : cores.borda} />
              </View>
              <Text style={[estilos.mes, emFoco && estilos.mesEmFoco]}>{nome}</Text>
            </View>
          );
        })}
      </View>

      <View style={estilos.legenda}>
        <Legenda cor={cores.primaria} texto="Entrou" />
        <Legenda cor={cores.verdeEscuro} texto="Saiu" />
      </View>
    </View>
  );
}

function Barra({ valor, maior, cor }: { valor: number; maior: number; cor: string }) {
  const altura = valor > 0 ? Math.max(4, (valor / maior) * ALTURA_BARRAS) : 0;
  return <View style={[estilos.barra, { height: altura, backgroundColor: cor }]} />;
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <View style={estilos.legendaItem}>
      <View style={[estilos.legendaPonto, { backgroundColor: cor }]} />
      <Text style={estilos.legendaTexto}>{texto}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  grafico: { gap: espaco.md },
  barras: {
    height: ALTURA_BARRAS + 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  coluna: { flex: 1, alignItems: 'center', gap: espaco.xs },
  par: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: ALTURA_BARRAS },
  barra: { width: 12, borderRadius: raio.pilula },
  mes: { fontSize: fonte.mini, color: cores.textoFraco, textTransform: 'capitalize' },
  mesEmFoco: { color: cores.verdeEscuro, fontWeight: '700' },
  legenda: { flexDirection: 'row', justifyContent: 'center', gap: espaco.xl },
  legendaItem: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  legendaPonto: { width: 10, height: 10, borderRadius: raio.pilula },
  legendaTexto: { fontSize: fonte.mini, color: cores.textoSuave },
});
