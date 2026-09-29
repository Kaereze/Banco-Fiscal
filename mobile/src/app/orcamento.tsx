import { StyleSheet, Text } from 'react-native';

import { LinhaOrcamento } from '@/components/financas/LinhaOrcamento';
import { SeletorMes } from '@/components/financas/SeletorMes';
import { TelaFormulario } from '@/components/layout/Tela';
import { Cartao } from '@/components/ui';
import { resumirMes, useDados } from '@/lib/dados';
import { mesPorExtenso, moeda } from '@/lib/format';
import { cores, espaco, fonte } from '@/lib/theme';

export default function Orcamento() {
  const { categorias, transacoes, orcamentos, mes, definirOrcamento } = useDados();

  const resumo = resumirMes(transacoes, categorias, orcamentos);
  const gastoPorCategoria = new Map(resumo.porCategoria.map((f) => [f.categoria?.id ?? null, f.total]));
  const categoriasDeGasto = categorias.filter((c) => c.tipo === 'gasto');
  const totalOrcado = orcamentos.reduce((soma, o) => soma + Number(o.limite), 0);

  return (
    <TelaFormulario>
      <SeletorMes />
      <Text style={estilos.explicacao}>
        Defina quanto a família pretende gastar em cada categoria em {mesPorExtenso(mes)}. Deixe em
        branco ou zero para não acompanhar. As barras de Relatórios passam a medir esse limite.
      </Text>

      <Cartao style={estilos.lista}>
        {categoriasDeGasto.map((categoria) => {
          const limite = orcamentos.find((o) => o.categoria_id === categoria.id)?.limite ?? null;
          return (
            <LinhaOrcamento
              key={`${categoria.id}:${mes}:${limite ?? ''}`}
              categoria={categoria}
              gasto={gastoPorCategoria.get(categoria.id) ?? 0}
              limite={limite}
              onSalvar={(valor) => definirOrcamento(categoria.id, valor)}
            />
          );
        })}
      </Cartao>

      {totalOrcado > 0 ? (
        <Cartao style={estilos.total}>
          <Text style={estilos.totalRotulo}>Orçamento total do mês</Text>
          <Text style={estilos.totalValor}>{moeda(totalOrcado)}</Text>
        </Cartao>
      ) : null}
    </TelaFormulario>
  );
}

const estilos = StyleSheet.create({
  explicacao: { fontSize: fonte.apoio, color: cores.textoSuave, lineHeight: 22 },
  lista: { gap: espaco.lg },
  total: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  totalRotulo: { fontSize: fonte.apoio, color: cores.textoSuave, fontWeight: '600' },
  totalValor: { fontSize: fonte.subtitulo, fontWeight: '800', color: cores.verdeEscuro },
});
