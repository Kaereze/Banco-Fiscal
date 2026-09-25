import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BarraCategoria } from '@/components/BarraCategoria';
import { ItemTransacao } from '@/components/ItemTransacao';
import { SeletorMes } from '@/components/SeletorMes';
import { Aviso, Botao, Cartao, Titulo, Vazio } from '@/components/ui';
import { resumirMes, useDados } from '@/lib/dados';
import { moeda, tempoDesde } from '@/lib/format';
import { useSessao } from '@/lib/sessao';
import { cores, espaco, fonte, raio, sombra } from '@/lib/theme';

export default function Resumo() {
  const { perfil, perfilResolvido } = useSessao();
  const {
    carregando,
    sincronizando,
    erro,
    categorias,
    transacoes,
    orcamentos,
    ultimaSync,
    recarregar,
    sincronizarPluggy,
  } = useDados();

  const [atualizando, setAtualizando] = useState(false);

  const resumo = useMemo(
    () => resumirMes(transacoes, categorias, orcamentos),
    [transacoes, categorias, orcamentos],
  );

  const maiores = useMemo(
    () =>
      transacoes
        .filter((t) => !t.ignorada && t.valor < 0)
        .sort((a, b) => a.valor - b.valor)
        .slice(0, 5),
    [transacoes],
  );

  const semCategoria = useMemo(
    () => transacoes.filter((t) => !t.ignorada && t.valor < 0 && !t.categoria_id).length,
    [transacoes],
  );

  async function puxarParaAtualizar() {
    setAtualizando(true);
    await recarregar();
    setAtualizando(false);
  }

  return (
    <ScrollView
      contentContainerStyle={estilos.conteudo}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={puxarParaAtualizar} tintColor={cores.primaria} />
      }
    >
      <SeletorMes />

      {perfilResolvido && !perfil ? (
        <Aviso
          tipo="alerta"
          texto="Esta conta ainda não foi liberada para a família, então nenhum dado aparece. Peça para quem administra o app cadastrar o seu e-mail."
        />
      ) : null}

      {erro ? <Aviso texto={erro} /> : null}

      {/* ---------- Cartão principal ---------- */}
      <Cartao style={estilos.destaque}>
        <Text style={estilos.rotuloDestaque}>Gasto no mês</Text>
        <Text style={estilos.numeroDestaque}>{moeda(resumo.gastos)}</Text>

        <View style={estilos.divisor} />

        <View style={estilos.linhaDupla}>
          <Metrica titulo="Entrou" valor={resumo.receitas} cor={cores.entrada} sinal="+" />
          <Metrica
            titulo="Sobrou"
            valor={resumo.saldo}
            cor={resumo.saldo >= 0 ? cores.entrada : cores.saida}
            sinal={resumo.saldo >= 0 ? '+' : '−'}
          />
        </View>
      </Cartao>

      {/* ---------- Sincronização ---------- */}
      <Cartao style={{ gap: espaco.md }}>
        <View style={estilos.linhaSync}>
          <View style={{ flex: 1 }}>
            <Text style={estilos.syncTitulo}>Dados do banco</Text>
            <Text style={estilos.syncTexto}>
              Atualizado {tempoDesde(ultimaSync?.terminada_em ?? null)}
              {ultimaSync?.sucesso === false ? ' · a última tentativa falhou' : ''}
            </Text>
          </View>
          <Ionicons
            name={ultimaSync?.sucesso === false ? 'alert-circle' : 'cloud-done'}
            size={26}
            color={ultimaSync?.sucesso === false ? cores.saida : cores.entrada}
          />
        </View>
        <Botao
          titulo={sincronizando ? 'Buscando...' : 'Buscar no banco agora'}
          variante="secundario"
          carregando={sincronizando}
          onPress={() => void sincronizarPluggy()}
        />
      </Cartao>

      {semCategoria > 0 ? (
        <Link href="/transacoes" asChild>
          <Pressable>
            <Aviso
              tipo="alerta"
              texto={`${semCategoria} ${
                semCategoria === 1 ? 'gasto ainda está' : 'gastos ainda estão'
              } sem categoria. Toque para organizar.`}
            />
          </Pressable>
        </Link>
      ) : null}

      {/* ---------- Onde foi o dinheiro ---------- */}
      <View style={estilos.secao}>
        <Titulo>Onde foi o dinheiro</Titulo>
        {resumo.porCategoria.length === 0 ? (
          <Cartao>
            {carregando ? (
              <Text style={estilos.carregando}>Carregando...</Text>
            ) : (
              <Vazio
                emoji="🌱"
                titulo="Nenhum gasto neste mês"
                texto="Sincronize com o banco ou lance um gasto em dinheiro para começar."
              />
            )}
          </Cartao>
        ) : (
          <Cartao style={{ gap: espaco.lg }}>
            {resumo.porCategoria.map((fatia) => (
              <BarraCategoria
                key={fatia.categoria?.id ?? 'sem-categoria'}
                categoria={fatia.categoria}
                total={fatia.total}
                fatia={fatia.fatia}
                limite={fatia.limite}
              />
            ))}
          </Cartao>
        )}
      </View>

      {/* ---------- Maiores gastos ---------- */}
      {maiores.length > 0 ? (
        <View style={estilos.secao}>
          <Titulo>Maiores gastos</Titulo>
          <View style={estilos.lista}>
            {maiores.map((transacao, indice) => (
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
      ) : null}

      <Link href="/lancamento" asChild>
        <Pressable style={({ pressed }) => [estilos.lancar, pressed && { opacity: 0.85 }]}>
          <Ionicons name="add-circle" size={22} color="#ffffff" />
          <Text style={estilos.lancarTexto}>Lançar gasto em dinheiro</Text>
        </Pressable>
      </Link>
    </ScrollView>
  );
}

function Metrica({
  titulo,
  valor,
  cor,
  sinal,
}: {
  titulo: string;
  valor: number;
  cor: string;
  sinal: string;
}) {
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={estilos.metricaTitulo}>{titulo}</Text>
      <Text style={[estilos.metricaValor, { color: cor }]}>
        {sinal} {moeda(valor)}
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    padding: espaco.lg,
    gap: espaco.lg,
    paddingBottom: espaco.xxl,
  },
  destaque: { gap: espaco.sm },
  rotuloDestaque: {
    fontSize: fonte.apoio,
    fontWeight: '600',
    color: cores.textoSuave,
  },
  numeroDestaque: {
    fontSize: fonte.gigante,
    fontWeight: '800',
    color: cores.texto,
    fontVariant: ['tabular-nums'],
  },
  divisor: {
    height: 1,
    backgroundColor: cores.borda,
    marginVertical: espaco.sm,
  },
  linhaDupla: { flexDirection: 'row', gap: espaco.lg },
  metricaTitulo: {
    fontSize: fonte.mini,
    fontWeight: '600',
    color: cores.textoFraco,
  },
  metricaValor: {
    fontSize: fonte.subtitulo,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  linhaSync: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  syncTitulo: { fontSize: fonte.corpo, fontWeight: '700', color: cores.texto },
  syncTexto: { fontSize: fonte.mini, color: cores.textoFraco },
  secao: { gap: espaco.md },
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
  carregando: {
    fontSize: fonte.apoio,
    color: cores.textoFraco,
    textAlign: 'center',
    paddingVertical: espaco.lg,
  },
  lancar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: espaco.sm,
    minHeight: 52,
    borderRadius: raio.md,
    backgroundColor: cores.primaria,
  },
  lancarTexto: {
    color: '#ffffff',
    fontSize: fonte.corpo,
    fontWeight: '700',
  },
});
