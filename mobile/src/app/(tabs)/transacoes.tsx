import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, SectionList, StyleSheet, Text, View } from 'react-native';

import { ItemTransacao } from '@/components/financas/ItemTransacao';
import { SeletorMes } from '@/components/financas/SeletorMes';
import { useAtualizacao, useConteudoDeAba } from '@/components/layout/Tela';
import { BotaoIcone, CabecalhoTela, Campo, Carregando, Pilula, Vazio } from '@/components/ui';
import { useDados } from '@/lib/dados';
import { diaRelativo, moeda } from '@/lib/format';
import { cores, espaco, fonte, MARGEM } from '@/lib/theme';
import type { Transacao } from '@/lib/types';

const TODAS = 'todas';
const SEM_CATEGORIA = 'sem-categoria';
const ENTRADAS = 'entradas';

export default function Movimentacoes() {
  const router = useRouter();
  const { transacoes, categorias, carregando, recarregar } = useDados();
  const conteudo = useConteudoDeAba();
  const { atualizando, atualizar } = useAtualizacao(recarregar);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState(TODAS);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return transacoes.filter((t) => {
      if (filtro === SEM_CATEGORIA && (t.categoria_id || t.valor >= 0)) return false;
      if (filtro === ENTRADAS && t.valor <= 0) return false;
      if (filtro !== TODAS && filtro !== SEM_CATEGORIA && filtro !== ENTRADAS && t.categoria_id !== filtro) {
        return false;
      }
      if (!termo) return true;
      return [t.descricao, t.estabelecimento, t.contraparte, t.pessoa].some((campo) =>
        (campo ?? '').toLowerCase().includes(termo),
      );
    });
  }, [transacoes, busca, filtro]);

  const secoes = useMemo(() => {
    const porDia = new Map<string, Transacao[]>();
    for (const transacao of visiveis) {
      porDia.set(transacao.data, [...(porDia.get(transacao.data) ?? []), transacao]);
    }
    return [...porDia.entries()].map(([data, itens]) => ({
      title: diaRelativo(data),
      total: somar(itens),
      data: itens,
    }));
  }, [visiveis]);

  const categoriasUsadas = useMemo(
    () => categorias.filter((c) => transacoes.some((t) => t.categoria_id === c.id)),
    [categorias, transacoes],
  );

  const totalFiltrado = somar(visiveis);
  const filtrando = busca.trim() !== '' || filtro !== TODAS;

  return (
    <SectionList
      style={estilos.tela}
      sections={secoes}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={[conteudo, estilos.semEspacoEntreLinhas]}
      refreshing={atualizando}
      onRefresh={atualizar}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={Espaco}
      ListHeaderComponent={
        <View style={estilos.cabecalho}>
          <CabecalhoTela
            titulo="Movimentações"
            direita={
              <BotaoIcone icone="add" rotulo="Lançar gasto em dinheiro" onPress={() => router.push('/lancamento')} />
            }
          />
          <SeletorMes />
          <Campo
            icone="search"
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por descrição, lugar ou pessoa"
            autoCorrect={false}
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={estilos.filtros}
            style={estilos.faixaFiltros}
          >
            <Pilula texto="Todas" ativa={filtro === TODAS} onPress={() => setFiltro(TODAS)} />
            <Pilula
              texto="Sem categoria"
              ativa={filtro === SEM_CATEGORIA}
              cor={cores.alerta}
              onPress={() => setFiltro(SEM_CATEGORIA)}
            />
            <Pilula texto="Entradas" ativa={filtro === ENTRADAS} onPress={() => setFiltro(ENTRADAS)} />
            {categoriasUsadas.map((categoria) => (
              <Pilula
                key={categoria.id}
                texto={`${categoria.emoji} ${categoria.nome}`}
                ativa={filtro === categoria.id}
                cor={categoria.cor}
                onPress={() => setFiltro(filtro === categoria.id ? TODAS : categoria.id)}
              />
            ))}
          </ScrollView>

          {visiveis.length > 0 ? (
            <Text style={estilos.resumo}>
              {visiveis.length} {visiveis.length === 1 ? 'lançamento' : 'lançamentos'} ·{' '}
              <Text style={{ color: totalFiltrado < 0 ? cores.verdeEscuro : cores.entrada }}>
                {totalFiltrado < 0 ? '−' : '+'} {moeda(totalFiltrado)}
              </Text>
            </Text>
          ) : null}
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={estilos.secao}>
          <Text style={estilos.secaoTitulo}>{section.title}</Text>
          <Text style={estilos.secaoTotal}>
            {section.total < 0 ? '−' : '+'} {moeda(section.total)}
          </Text>
        </View>
      )}
      renderItem={({ item }) => (
        <ItemTransacao
          transacao={item}
          categoria={categorias.find((c) => c.id === item.categoria_id) ?? null}
        />
      )}
      ListEmptyComponent={
        carregando ? (
          <Carregando />
        ) : (
          <Vazio
            icone={filtrando ? 'search' : 'leaf-outline'}
            titulo={filtrando ? 'Nada encontrado' : 'Nenhum lançamento no mês'}
            texto={
              filtrando
                ? 'Tente outro termo ou toque em "Todas" para limpar os filtros.'
                : 'Busque os lançamentos do banco na aba Contas.'
            }
          />
        )
      }
    />
  );
}

function Espaco() {
  return <View style={estilos.espaco} />;
}

function somar(itens: Transacao[]): number {
  return itens.reduce((soma, t) => (t.ignorada ? soma : soma + t.valor), 0);
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  semEspacoEntreLinhas: { gap: 0 },
  cabecalho: { gap: espaco.md, marginBottom: espaco.xs },
  faixaFiltros: { marginHorizontal: -MARGEM },
  filtros: { flexDirection: 'row', gap: espaco.sm, paddingHorizontal: MARGEM },
  resumo: { fontSize: fonte.mini, color: cores.textoFraco, fontWeight: '600' },
  secao: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: espaco.xl,
    paddingBottom: espaco.sm,
  },
  secaoTitulo: { fontSize: fonte.apoio, fontWeight: '700', color: cores.textoSuave },
  secaoTotal: {
    fontSize: fonte.mini,
    fontWeight: '600',
    color: cores.textoFraco,
    fontVariant: ['tabular-nums'],
  },
  espaco: { height: espaco.sm },
});
