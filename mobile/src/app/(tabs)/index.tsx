import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Desce, Sobe, chaveDeEntrada } from '@/components/animacao';
import { ItemTransacao } from '@/components/ItemTransacao';
import { conteudoCentralizado } from '@/components/Pagina';
import { Aviso, Cartao, Titulo } from '@/components/ui';
import { resumirMes, useDados } from '@/lib/dados';
import { mesPorExtenso, moeda, tempoDesde } from '@/lib/format';
import { useSessao } from '@/lib/sessao';
import { cores, espaco, fonte, raio, sombra } from '@/lib/theme';

export default function Home() {
  const router = useRouter();
  const { perfil, perfilResolvido } = useSessao();
  const {
    carregando,
    sincronizando,
    erro,
    mes,
    categorias,
    contas,
    transacoes,
    orcamentos,
    ultimaSync,
    gastoMesAnterior,
    recarregar,
    sincronizarPluggy,
  } = useDados();

  const [atualizando, setAtualizando] = useState(false);

  const resumo = useMemo(
    () => resumirMes(transacoes, categorias, orcamentos),
    [transacoes, categorias, orcamentos],
  );

  const saldoEmConta = contas
    .filter((c) => c.tipo !== 'CREDIT')
    .reduce((soma, c) => soma + (c.saldo ?? 0), 0);

  const faturas = contas
    .filter((c) => c.tipo === 'CREDIT')
    .reduce((soma, c) => soma + (c.saldo ?? 0), 0);

  const ultimas = useMemo(
    () => transacoes.filter((t) => !t.ignorada).slice(0, 5),
    [transacoes],
  );

  const topCategorias = resumo.porCategoria.slice(0, 3);
  const semCategoria = transacoes.filter((t) => !t.ignorada && t.valor < 0 && !t.categoria_id).length;

  async function puxarParaAtualizar() {
    setAtualizando(true);
    await recarregar();
    setAtualizando(false);
  }

  // Trocar de mês troca os dados, não o desenho: a chave faz os blocos
  // renascerem e reexecutarem a mesma entrada, com os números novos.
  const chave = chaveDeEntrada(mes, transacoes.length);

  return (
    <ScrollView
      contentContainerStyle={[estilos.conteudo, conteudoCentralizado]}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={puxarParaAtualizar} tintColor={cores.primaria} />
      }
    >
      <Desce>
        <Text style={estilos.saudacao}>{saudacao()},</Text>
        <Text style={estilos.nome}>{perfil?.nome ?? 'bem-vindo'}</Text>
      </Desce>

      {perfilResolvido && !perfil ? (
        <Sobe indice={1}>
          <Aviso
            tipo="alerta"
            texto="Esta conta ainda não foi liberada para a família. Peça para quem administra o app cadastrar o seu e-mail."
          />
        </Sobe>
      ) : null}

      {erro ? (
        <Sobe indice={1}>
          <Aviso texto={erro} />
        </Sobe>
      ) : null}

      {/* ---------- Saldo ---------- */}
      <Sobe key={`saldo-${chave}`} indice={1}>
        <Cartao style={estilos.heroi}>
          <View style={estilos.heroiTopo}>
            <Text style={estilos.heroiRotulo}>Disponível em conta</Text>
            <View style={estilos.pontoVerde} />
          </View>
          <Text style={[estilos.heroiValor, saldoEmConta < 0 && { color: cores.saida }]}>
            {saldoEmConta < 0 ? '− ' : ''}
            {moeda(saldoEmConta)}
          </Text>
          {faturas > 0 ? (
            <Text style={estilos.heroiApoio}>
              Fatura do cartão: <Text style={{ color: cores.saida }}>{moeda(faturas)}</Text>
            </Text>
          ) : null}
        </Cartao>
      </Sobe>

      {/* ---------- O mês ---------- */}
      <Sobe key={`mes-${chave}`} indice={2}>
        <Cartao style={{ gap: espaco.md }}>
          <Text style={estilos.secaoRotulo}>{mesPorExtenso(mes)}</Text>
          <View style={estilos.grade}>
            <Metrica titulo="Saiu" valor={resumo.gastos} cor={cores.saida} />
            <Metrica titulo="Entrou" valor={resumo.receitas} cor={cores.entrada} />
            <Metrica
              titulo="Sobrou"
              valor={resumo.saldo}
              cor={resumo.saldo >= 0 ? cores.entrada : cores.saida}
            />
          </View>
          <Comparacao atual={resumo.gastos} anterior={gastoMesAnterior} />
        </Cartao>
      </Sobe>

      {/* ---------- Atalhos ---------- */}
      <Sobe indice={3}>
        <View style={estilos.atalhos}>
          <Atalho
            icone="add-circle"
            texto="Lançar gasto"
            cor={cores.entrada}
            onPress={() => router.push('/lancamento')}
          />
          <Atalho
            icone={sincronizando ? 'sync' : 'cloud-download'}
            texto={sincronizando ? 'Buscando...' : 'Buscar no banco'}
            cor={cores.primaria}
            onPress={() => !sincronizando && void sincronizarPluggy()}
          />
        </View>
      </Sobe>

      {semCategoria > 0 ? (
        <Sobe indice={4}>
          <Pressable onPress={() => router.push('/transacoes')}>
            <Aviso
              tipo="alerta"
              texto={`${semCategoria} ${
                semCategoria === 1 ? 'gasto está' : 'gastos estão'
              } sem categoria. Toque para organizar.`}
            />
          </Pressable>
        </Sobe>
      ) : null}

      {/* ---------- Top categorias ---------- */}
      {topCategorias.length > 0 ? (
        <Sobe key={`cats-${chave}`} indice={5}>
          <View style={estilos.secao}>
            <View style={estilos.cabecalhoSecao}>
              <Titulo>Onde mais gastou</Titulo>
              <Pressable onPress={() => router.push('/resumo')}>
                <Text style={estilos.verTudo}>ver tudo</Text>
              </Pressable>
            </View>
            <Cartao style={{ gap: espaco.lg }}>
              {topCategorias.map((fatia) => (
                <View key={fatia.categoria?.id ?? 'sem'} style={estilos.linhaCategoria}>
                  <Text style={estilos.emoji}>{fatia.categoria?.emoji ?? '❓'}</Text>
                  <View style={{ flex: 1, gap: espaco.xs }}>
                    <View style={estilos.linhaEntre}>
                      <Text style={estilos.categoriaNome} numberOfLines={1}>
                        {fatia.categoria?.nome ?? 'Sem categoria'}
                      </Text>
                      <Text style={estilos.categoriaValor}>{moeda(fatia.total)}</Text>
                    </View>
                    <View style={estilos.trilho}>
                      <View
                        style={[
                          estilos.preenchimento,
                          {
                            width: `${Math.round(fatia.fatia * 100)}%`,
                            backgroundColor: fatia.categoria?.cor ?? cores.textoFraco,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </Cartao>
          </View>
        </Sobe>
      ) : null}

      {/* ---------- Últimos lançamentos ---------- */}
      {ultimas.length > 0 ? (
        <Sobe key={`ult-${chave}`} indice={6}>
          <View style={estilos.secao}>
            <View style={estilos.cabecalhoSecao}>
              <Titulo>Últimos lançamentos</Titulo>
              <Pressable onPress={() => router.push('/transacoes')}>
                <Text style={estilos.verTudo}>ver tudo</Text>
              </Pressable>
            </View>
            <View style={estilos.lista}>
              {ultimas.map((transacao, indice) => (
                <View key={transacao.id}>
                  {indice > 0 ? <View style={estilos.separador} /> : null}
                  <ItemTransacao
                    transacao={transacao}
                    categoria={categorias.find((c) => c.id === transacao.categoria_id) ?? null}
                  />
                </View>
              ))}
            </View>
          </View>
        </Sobe>
      ) : null}

      {!carregando && transacoes.length === 0 ? (
        <Sobe indice={2}>
          <Cartao style={{ alignItems: 'center', gap: espaco.sm, paddingVertical: espaco.xxl }}>
            <Text style={{ fontSize: 40 }}>🌱</Text>
            <Text style={estilos.vazioTitulo}>Nada neste mês ainda</Text>
            <Text style={estilos.vazioTexto}>
              Toque em "Buscar no banco" para trazer seus lançamentos.
            </Text>
          </Cartao>
        </Sobe>
      ) : null}

      <Sobe indice={7}>
        <Text style={estilos.rodape}>
          Dados do banco atualizados {tempoDesde(ultimaSync?.terminada_em ?? null)}
        </Text>
      </Sobe>
    </ScrollView>
  );
}

// ------------------------------------------------------------
function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function Metrica({ titulo, valor, cor }: { titulo: string; valor: number; cor: string }) {
  return (
    <View style={estilos.metrica}>
      <Text style={estilos.metricaTitulo}>{titulo}</Text>
      <Text style={[estilos.metricaValor, { color: cor }]} numberOfLines={1} adjustsFontSizeToFit>
        {moeda(valor)}
      </Text>
    </View>
  );
}

/** Quanto o mês corrente gastou a mais ou a menos que o anterior. */
function Comparacao({ atual, anterior }: { atual: number; anterior: number | null }) {
  if (anterior === null || anterior === 0) return null;

  const diferenca = atual - anterior;
  const percentual = Math.round((diferenca / anterior) * 100);
  if (Math.abs(percentual) < 1) return null;

  const gastouMais = diferenca > 0;
  const cor = gastouMais ? cores.saida : cores.entrada;

  return (
    <View style={estilos.comparacao}>
      <Ionicons name={gastouMais ? 'trending-up' : 'trending-down'} size={16} color={cor} />
      <Text style={estilos.comparacaoTexto}>
        <Text style={{ color: cor, fontWeight: '700' }}>{Math.abs(percentual)}%</Text>
        {gastouMais ? ' a mais' : ' a menos'} que no mês passado
      </Text>
    </View>
  );
}

function Atalho({
  icone,
  texto,
  cor,
  onPress,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  texto: string;
  cor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [estilos.atalho, pressed && { opacity: 0.7 }]}
    >
      <View style={[estilos.atalhoIcone, { backgroundColor: `${cor}22` }]}>
        <Ionicons name={icone} size={20} color={cor} />
      </View>
      <Text style={estilos.atalhoTexto}>{texto}</Text>
    </Pressable>
  );
}

// ------------------------------------------------------------
const estilos = StyleSheet.create({
  conteudo: { padding: espaco.lg, gap: espaco.lg, paddingBottom: espaco.xxl },

  saudacao: { fontSize: fonte.corpo, color: cores.textoSuave },
  nome: { fontSize: fonte.titulo, fontWeight: '800', color: cores.texto },

  heroi: { gap: espaco.xs },
  heroiTopo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroiRotulo: { fontSize: fonte.apoio, fontWeight: '600', color: cores.textoSuave },
  pontoVerde: { width: 8, height: 8, borderRadius: 4, backgroundColor: cores.entrada },
  heroiValor: {
    fontSize: fonte.gigante,
    fontWeight: '800',
    color: cores.texto,
    fontVariant: ['tabular-nums'],
  },
  heroiApoio: { fontSize: fonte.mini, color: cores.textoFraco },

  secaoRotulo: {
    fontSize: fonte.mini,
    fontWeight: '700',
    color: cores.textoFraco,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  grade: { flexDirection: 'row', gap: espaco.md },
  metrica: { flex: 1, gap: 2 },
  metricaTitulo: { fontSize: fonte.mini, color: cores.textoFraco },
  metricaValor: { fontSize: fonte.corpo, fontWeight: '700', fontVariant: ['tabular-nums'] },

  comparacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    paddingTop: espaco.md,
  },
  comparacaoTexto: { fontSize: fonte.mini, color: cores.textoSuave },

  atalhos: { flexDirection: 'row', gap: espaco.md },
  atalho: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    padding: espaco.md,
    minHeight: 56,
    ...sombra,
  },
  atalhoIcone: {
    width: 34,
    height: 34,
    borderRadius: raio.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atalhoTexto: { flex: 1, fontSize: fonte.apoio, fontWeight: '600', color: cores.texto },

  secao: { gap: espaco.md },
  cabecalhoSecao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  verTudo: { fontSize: fonte.apoio, fontWeight: '600', color: cores.primaria },

  linhaCategoria: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  linhaEntre: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emoji: { fontSize: 20 },
  categoriaNome: { flex: 1, fontSize: fonte.apoio, fontWeight: '600', color: cores.texto },
  categoriaValor: {
    fontSize: fonte.apoio,
    fontWeight: '700',
    color: cores.texto,
    fontVariant: ['tabular-nums'],
  },
  trilho: {
    height: 6,
    borderRadius: raio.pilula,
    backgroundColor: cores.superficieSuave,
    overflow: 'hidden',
  },
  preenchimento: { height: '100%', borderRadius: raio.pilula },

  lista: {
    backgroundColor: cores.superficie,
    borderRadius: raio.lg,
    overflow: 'hidden',
    ...sombra,
  },
  separador: {
    height: 1,
    backgroundColor: cores.borda,
    marginLeft: espaco.lg + 44 + espaco.md,
  },

  vazioTitulo: { fontSize: fonte.subtitulo, fontWeight: '700', color: cores.texto },
  vazioTexto: { fontSize: fonte.apoio, color: cores.textoSuave, textAlign: 'center' },

  rodape: { fontSize: fonte.mini, color: cores.textoFraco, textAlign: 'center' },
});
