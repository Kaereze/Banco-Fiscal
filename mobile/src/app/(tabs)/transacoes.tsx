import { useMemo, useState } from 'react';
import { ScrollView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { ItemTransacao } from '@/components/ItemTransacao';
import { SeletorMes } from '@/components/SeletorMes';
import { Pilula, Vazio } from '@/components/ui';
import { conteudoCentralizado } from '@/components/Pagina';
import { useDados } from '@/lib/dados';
import { diaRelativo, moeda } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';
import type { Transacao } from '@/lib/types';

/** 'todas' | 'sem-categoria' | 'entradas' | id de uma categoria */
type Filtro = string;

export default function Transacoes() {
  const { transacoes, categorias, carregando, recarregar } = useDados();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [atualizando, setAtualizando] = useState(false);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return transacoes.filter((t) => {
      if (filtro === 'sem-categoria' && (t.categoria_id || t.valor >= 0)) return false;
      if (filtro === 'entradas' && t.valor <= 0) return false;
      if (filtro !== 'todas' && filtro !== 'sem-categoria' && filtro !== 'entradas') {
        if (t.categoria_id !== filtro) return false;
      }
      if (!termo) return true;
      return (
        t.descricao.toLowerCase().includes(termo) ||
        (t.estabelecimento ?? '').toLowerCase().includes(termo) ||
        (t.pessoa ?? '').toLowerCase().includes(termo)
      );
    });
  }, [transacoes, busca, filtro]);

  // A lista já vem ordenada por data desc do banco; aqui só agrupamos por dia.
  const secoes = useMemo(() => {
    const porDia = new Map<string, Transacao[]>();
    for (const transacao of visiveis) {
      const lista = porDia.get(transacao.data) ?? [];
      lista.push(transacao);
      porDia.set(transacao.data, lista);
    }
    return [...porDia.entries()].map(([data, itens]) => ({
      title: diaRelativo(data),
      total: itens.reduce((soma, t) => (t.ignorada ? soma : soma + t.valor), 0),
      data: itens,
    }));
  }, [visiveis]);

  const totalFiltrado = visiveis.reduce((soma, t) => (t.ignorada ? soma : soma + t.valor), 0);

  const categoriasUsadas = useMemo(
    () => categorias.filter((c) => transacoes.some((t) => t.categoria_id === c.id)),
    [categorias, transacoes],
  );

  async function puxarParaAtualizar() {
    setAtualizando(true);
    await recarregar();
    setAtualizando(false);
  }

  return (
    <SectionList
      sections={secoes}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={[estilos.conteudo, conteudoCentralizado]}
      refreshing={atualizando}
      onRefresh={puxarParaAtualizar}
      keyboardShouldPersistTaps="handled"
      ListHeaderComponent={
        <View style={estilos.cabecalho}>
          <SeletorMes />

          <TextInput
            value={busca}
            onChangeText={setBusca}
            placeholder="Buscar por descrição, lugar ou pessoa"
            placeholderTextColor={cores.textoFraco}
            style={estilos.busca}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={estilos.filtros}
          >
            <Pilula texto="Todas" ativa={filtro === 'todas'} onPress={() => setFiltro('todas')} />
            <Pilula
              texto="Sem categoria"
              ativa={filtro === 'sem-categoria'}
              cor={cores.alerta}
              onPress={() => setFiltro('sem-categoria')}
            />
            <Pilula
              texto="Entradas"
              ativa={filtro === 'entradas'}
              cor={cores.entrada}
              onPress={() => setFiltro('entradas')}
            />
            {categoriasUsadas.map((categoria) => (
              <Pilula
                key={categoria.id}
                texto={`${categoria.emoji} ${categoria.nome}`}
                ativa={filtro === categoria.id}
                cor={categoria.cor}
                onPress={() => setFiltro(filtro === categoria.id ? 'todas' : categoria.id)}
              />
            ))}
          </ScrollView>

          {visiveis.length > 0 ? (
            <Text style={estilos.resumoFiltro}>
              {visiveis.length} {visiveis.length === 1 ? 'lançamento' : 'lançamentos'} ·{' '}
              <Text style={{ color: totalFiltrado < 0 ? cores.texto : cores.entrada }}>
                {totalFiltrado < 0 ? '−' : '+'} {moeda(totalFiltrado)}
              </Text>
            </Text>
          ) : null}
        </View>
      }
      renderSectionHeader={({ section }) => (
        <View style={estilos.secaoCabecalho}>
          <Text style={estilos.secaoTitulo}>{section.title}</Text>
          <Text style={estilos.secaoTotal}>
            {section.total < 0 ? '−' : '+'} {moeda(section.total)}
          </Text>
        </View>
      )}
      renderItem={({ item, index, section }) => {
        const primeiro = index === 0;
        const ultimo = index === section.data.length - 1;
        return (
          <View
            style={[
              estilos.envolveItem,
              primeiro && estilos.topoArredondado,
              ultimo && estilos.baseArredondada,
            ]}
          >
            {!primeiro ? <View style={estilos.separador} /> : null}
            <ItemTransacao
              transacao={item}
              categoria={categorias.find((c) => c.id === item.categoria_id) ?? null}
            />
          </View>
        );
      }}
      ListEmptyComponent={
        carregando ? null : (
          <Vazio
            emoji={busca || filtro !== 'todas' ? '🔍' : '🌱'}
            titulo={busca || filtro !== 'todas' ? 'Nada encontrado' : 'Nenhum lançamento no mês'}
            texto={
              busca || filtro !== 'todas'
                ? 'Tente outro termo ou toque em "Todas" para limpar os filtros.'
                : 'Sincronize com o banco na aba Resumo para trazer os gastos.'
            }
          />
        )
      }
    />
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    padding: espaco.lg,
    paddingBottom: espaco.xxl,
  },
  cabecalho: { gap: espaco.md, marginBottom: espaco.sm },
  busca: {
    minHeight: 48,
    borderRadius: raio.md,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.superficie,
    paddingHorizontal: espaco.md,
    fontSize: fonte.corpo,
    color: cores.texto,
  },
  filtros: { flexDirection: 'row', gap: espaco.sm, paddingRight: espaco.lg },
  resumoFiltro: {
    fontSize: fonte.mini,
    color: cores.textoFraco,
    fontWeight: '600',
  },
  secaoCabecalho: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingTop: espaco.lg,
    paddingBottom: espaco.sm,
  },
  secaoTitulo: {
    fontSize: fonte.apoio,
    fontWeight: '700',
    color: cores.textoSuave,
  },
  secaoTotal: {
    fontSize: fonte.mini,
    fontWeight: '600',
    color: cores.textoFraco,
    fontVariant: ['tabular-nums'],
  },
  envolveItem: {
    backgroundColor: cores.superficie,
    overflow: 'hidden',
  },
  topoArredondado: {
    borderTopLeftRadius: raio.lg,
    borderTopRightRadius: raio.lg,
  },
  baseArredondada: {
    borderBottomLeftRadius: raio.lg,
    borderBottomRightRadius: raio.lg,
  },
  separador: {
    height: 1,
    backgroundColor: cores.borda,
    marginLeft: espaco.lg + 44 + espaco.md,
  },
});
