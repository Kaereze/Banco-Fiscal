import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

import { SaiDeLado } from '@/components/animacao';
import { CartaoClassificacao } from '@/components/financas/CartaoClassificacao';
import { SeletorMes } from '@/components/financas/SeletorMes';
import { conteudoDeFormulario } from '@/components/layout/Tela';
import { Carregando, GradePilulas, Pilula, Vazio } from '@/components/ui';
import { useDados } from '@/lib/dados';
import { moeda } from '@/lib/format';
import type { Transacao } from '@/lib/types';
import { cores, espaco, fonte, raio } from '@/lib/theme';

type Filtro = 'pendentes' | 'todos';

export default function Classificar() {
  const { transacoes, categorias, contas, carregando, editarTransacao, recarregar } = useDados();
  const [filtro, setFiltro] = useState<Filtro>('pendentes');

  const gastos = useMemo(() => transacoes.filter((t) => t.valor < 0 && !t.ignorada), [transacoes]);
  const pendentes = useMemo(() => gastos.filter((t) => !t.categoria_id), [gastos]);
  const lista = filtro === 'pendentes' ? pendentes : gastos;
  const categoriasDeGasto = useMemo(() => categorias.filter((c) => c.tipo === 'gasto'), [categorias]);
  const totalPendente = pendentes.reduce((soma, t) => soma - t.valor, 0);
  const classificados = gastos.length - pendentes.length;

  async function salvar(id: string, mudancas: Partial<Transacao>) {
    try {
      await editarTransacao(id, mudancas);
    } catch (e) {
      Alert.alert('Não consegui salvar', e instanceof Error ? e.message : 'Tente de novo.');
      await recarregar();
    }
  }

  return (
    <Animated.FlatList
      style={estilos.tela}
      data={lista}
      keyExtractor={(item) => item.id}
      contentContainerStyle={conteudoDeFormulario}
      itemLayoutAnimation={LinearTransition.duration(260)}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      automaticallyAdjustKeyboardInsets
      ListHeaderComponent={
        <View style={estilos.cabecalho}>
          <SeletorMes />
          <View style={estilos.resumo}>
            <Text style={estilos.resumoValor}>{moeda(totalPendente)}</Text>
            <Text style={estilos.resumoTexto}>
              {pendentes.length === 1 ? '1 pagamento sem categoria' : `${pendentes.length} pagamentos sem categoria`}
            </Text>
            <View style={estilos.trilho}>
              <View
                style={[
                  estilos.preenchimento,
                  { width: `${gastos.length ? (classificados / gastos.length) * 100 : 100}%` },
                ]}
              />
            </View>
            <Text style={estilos.resumoTexto}>
              {classificados} de {gastos.length} gastos do mês já têm categoria
            </Text>
          </View>
          <GradePilulas>
            <Pilula texto="Sem categoria" ativa={filtro === 'pendentes'} onPress={() => setFiltro('pendentes')} />
            <Pilula texto="Todos os gastos" ativa={filtro === 'todos'} onPress={() => setFiltro('todos')} />
          </GradePilulas>
        </View>
      }
      renderItem={({ item }) => (
        <SaiDeLado>
          <CartaoClassificacao
            transacao={item}
            nomeDaConta={contas.find((c) => c.id === item.conta_id)?.nome ?? null}
            categorias={categoriasDeGasto}
            aoClassificar={(categoriaId) => void salvar(item.id, { categoria_id: categoriaId })}
            aoNaoContar={() => void salvar(item.id, { ignorada: true })}
            aoAnotar={(texto) => void salvar(item.id, { observacao: texto || null })}
          />
        </SaiDeLado>
      )}
      ListEmptyComponent={
        carregando ? (
          <Carregando />
        ) : (
          <Vazio
            icone="checkmark-done-outline"
            titulo={filtro === 'pendentes' ? 'Tudo classificado neste mês' : 'Nenhum gasto neste mês'}
            texto={filtro === 'pendentes' ? 'Troque o mês no topo para classificar outro.' : undefined}
          />
        )
      }
    />
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  cabecalho: { gap: espaco.lg },
  resumo: { gap: espaco.xs, alignItems: 'center' },
  resumoValor: { fontSize: fonte.gigante, fontWeight: '800', color: cores.verdeEscuro, fontVariant: ['tabular-nums'] },
  resumoTexto: { fontSize: fonte.apoio, color: cores.textoSuave },
  trilho: {
    alignSelf: 'stretch',
    height: 8,
    borderRadius: raio.pilula,
    backgroundColor: cores.superficieSuave,
    overflow: 'hidden',
    marginTop: espaco.sm,
  },
  preenchimento: { height: '100%', borderRadius: raio.pilula, backgroundColor: cores.primaria },
});
