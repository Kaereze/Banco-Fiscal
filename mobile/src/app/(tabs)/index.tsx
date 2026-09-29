import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { chaveDeEntrada, Desce, Sobe } from '@/components/animacao';
import { BarraCategoria } from '@/components/financas/BarraCategoria';
import { CartaoMetrica, LinhaMetricas } from '@/components/financas/CartaoMetrica';
import { CartaoSaldo, LinhaSaldo } from '@/components/financas/CartaoSaldo';
import { ListaTransacoes } from '@/components/financas/ListaTransacoes';
import { TelaAba } from '@/components/layout/Tela';
import { Marca } from '@/components/marca/Logo';
import { Aviso, Botao, BotaoIcone, Cartao, Secao, Titulo, Vazio } from '@/components/ui';
import { resumirMes, useDados } from '@/lib/dados';
import { mesPorExtenso, moeda, tempoDesde } from '@/lib/format';
import { useSessao } from '@/lib/sessao';
import { cores, espaco, fonte } from '@/lib/theme';

const TOP_CATEGORIAS = 3;
const ULTIMOS_LANCAMENTOS = 5;

export default function Inicio() {
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
    () => transacoes.filter((t) => !t.ignorada).slice(0, ULTIMOS_LANCAMENTOS),
    [transacoes],
  );
  const semCategoria = transacoes.filter((t) => !t.ignorada && t.valor < 0 && !t.categoria_id).length;
  const chave = chaveDeEntrada(mes, transacoes.length);

  return (
    <TelaAba aoAtualizar={recarregar}>
      <Desce style={estilos.topo}>
        <Marca />
        <BotaoIcone icone="person-outline" rotulo="Abrir perfil" onPress={() => router.push('/perfil')} />
      </Desce>

      <Desce indice={1}>
        <Text style={estilos.saudacao}>{saudacao()},</Text>
        <Text style={estilos.nome}>{perfil?.nome ?? 'bem-vindo'}</Text>
      </Desce>

      {perfilResolvido && !perfil ? (
        <Aviso
          tipo="alerta"
          texto="Esta conta ainda não foi liberada para a família. Peça para quem administra o app cadastrar o seu e-mail."
        />
      ) : null}
      {erro ? <Aviso texto={erro} /> : null}

      <Sobe key={`saldo-${chave}`} indice={2}>
        <CartaoSaldo rotulo="Saldo disponível" valor={saldoEmConta}>
          {faturas > 0 ? <LinhaSaldo>Fatura do cartão: {moeda(faturas)}</LinhaSaldo> : null}
          <LinhaSaldo>Atualizado {tempoDesde(ultimaSync?.terminada_em ?? null)}</LinhaSaldo>
        </CartaoSaldo>
      </Sobe>

      <Sobe key={`mes-${chave}`} indice={3}>
        <Secao>
          <Text style={estilos.mes}>{mesPorExtenso(mes)}</Text>
          <LinhaMetricas>
            <CartaoMetrica titulo="Entradas" valor={resumo.receitas} icone="arrow-down" cor={cores.entrada} />
            <CartaoMetrica titulo="Saídas" valor={resumo.gastos} icone="arrow-up" cor={cores.saida} />
            <CartaoMetrica
              titulo="Sobrou"
              valor={resumo.saldo}
              icone="wallet-outline"
              cor={resumo.saldo >= 0 ? cores.verdeEscuro : cores.saida}
            />
          </LinhaMetricas>
          <Comparacao atual={resumo.gastos} anterior={gastoMesAnterior} />
        </Secao>
      </Sobe>

      <Sobe indice={4} style={estilos.atalhos}>
        <View style={estilos.atalho}>
          <Botao titulo="Lançar gasto" icone="add" onPress={() => router.push('/lancamento')} />
        </View>
        <View style={estilos.atalho}>
          <Botao
            titulo="Buscar"
            icone="sync"
            variante="secundario"
            carregando={sincronizando}
            onPress={() => void sincronizarPluggy()}
          />
        </View>
      </Sobe>

      {semCategoria > 0 ? (
        <Pressable onPress={() => router.push('/transacoes')} accessibilityRole="button">
          <Aviso
            tipo="alerta"
            texto={`${semCategoria} ${semCategoria === 1 ? 'gasto está' : 'gastos estão'} sem categoria. Toque para organizar.`}
          />
        </Pressable>
      ) : null}

      {resumo.porCategoria.length > 0 ? (
        <Sobe key={`cats-${chave}`} indice={5}>
          <Secao>
            <Titulo acao={{ texto: 'ver tudo', onPress: () => router.push('/relatorios') }}>
              Onde mais gastou
            </Titulo>
            <Cartao style={estilos.categorias}>
              {resumo.porCategoria.slice(0, TOP_CATEGORIAS).map((fatia) => (
                <BarraCategoria
                  key={fatia.categoria?.id ?? 'sem-categoria'}
                  categoria={fatia.categoria}
                  total={fatia.total}
                  fatia={fatia.fatia}
                  limite={fatia.limite}
                />
              ))}
            </Cartao>
          </Secao>
        </Sobe>
      ) : null}

      {ultimas.length > 0 ? (
        <Sobe key={`ult-${chave}`} indice={6}>
          <Secao>
            <Titulo acao={{ texto: 'ver tudo', onPress: () => router.push('/transacoes') }}>
              Últimos lançamentos
            </Titulo>
            <ListaTransacoes transacoes={ultimas} categorias={categorias} />
          </Secao>
        </Sobe>
      ) : null}

      {!carregando && transacoes.length === 0 ? (
        <Cartao>
          <Vazio
            icone="leaf-outline"
            titulo="Nada neste mês ainda"
            texto='Toque em "Buscar" para trazer seus lançamentos do banco.'
          />
        </Cartao>
      ) : null}
    </TelaAba>
  );
}

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

function Comparacao({ atual, anterior }: { atual: number; anterior: number | null }) {
  if (anterior === null || anterior === 0) return null;

  const percentual = Math.round(((atual - anterior) / anterior) * 100);
  if (Math.abs(percentual) < 1) return null;

  const gastouMais = percentual > 0;
  const cor = gastouMais ? cores.saida : cores.entrada;

  return (
    <View style={estilos.comparacao}>
      <Ionicons name={gastouMais ? 'trending-up' : 'trending-down'} size={16} color={cor} />
      <Text style={estilos.comparacaoTexto}>
        <Text style={[estilos.comparacaoValor, { color: cor }]}>{Math.abs(percentual)}%</Text>
        {gastouMais ? ' a mais' : ' a menos'} de gasto que no mês passado
      </Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 },
  saudacao: { fontSize: fonte.corpo, color: cores.textoSuave },
  nome: { fontSize: fonte.titulo, fontWeight: '800', color: cores.verdeEscuro },
  mes: {
    fontSize: fonte.mini,
    fontWeight: '700',
    color: cores.textoFraco,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  comparacao: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  comparacaoTexto: { flex: 1, fontSize: fonte.mini, color: cores.textoSuave },
  comparacaoValor: { fontWeight: '700' },
  atalhos: { flexDirection: 'row', gap: espaco.sm },
  atalho: { flex: 1 },
  categorias: { gap: espaco.lg },
});
