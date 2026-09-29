import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { chaveDeEntrada, Desce, Sobe } from '@/components/animacao';
import { BarraCategoria } from '@/components/financas/BarraCategoria';
import { CartaoMetrica, LinhaMetricas } from '@/components/financas/CartaoMetrica';
import { GraficoCategorias } from '@/components/financas/GraficoCategorias';
import { GraficoMeses } from '@/components/financas/GraficoMeses';
import { ListaTransacoes } from '@/components/financas/ListaTransacoes';
import { SeletorMes } from '@/components/financas/SeletorMes';
import { TelaAba } from '@/components/layout/Tela';
import { Aviso, Botao, CabecalhoTela, Carregando, Cartao, Secao, Titulo, Vazio } from '@/components/ui';
import { MESES_NO_HISTORICO, resumirMes, useDados } from '@/lib/dados';
import { useSessao } from '@/lib/sessao';
import { cores, espaco } from '@/lib/theme';

const MAIORES_GASTOS = 5;

export default function Relatorios() {
  const router = useRouter();
  const { perfil, perfilResolvido } = useSessao();
  const { carregando, erro, mes, categorias, transacoes, orcamentos, historico, recarregar } = useDados();

  const resumo = useMemo(
    () => resumirMes(transacoes, categorias, orcamentos),
    [transacoes, categorias, orcamentos],
  );

  const maiores = useMemo(
    () =>
      transacoes
        .filter((t) => !t.ignorada && t.valor < 0)
        .sort((a, b) => a.valor - b.valor)
        .slice(0, MAIORES_GASTOS),
    [transacoes],
  );

  const semCategoria = transacoes.filter((t) => !t.ignorada && t.valor < 0 && !t.categoria_id).length;
  const chave = chaveDeEntrada(mes, transacoes.length);

  return (
    <TelaAba aoAtualizar={recarregar}>
      <Desce>
        <CabecalhoTela titulo="Relatórios" subtitulo="Para onde o dinheiro da família foi" />
      </Desce>
      <Desce indice={1}>
        <SeletorMes />
      </Desce>

      {perfilResolvido && !perfil ? (
        <Aviso
          tipo="alerta"
          texto="Esta conta ainda não foi liberada para a família, então nenhum dado aparece. Peça para quem administra o app cadastrar o seu e-mail."
        />
      ) : null}
      {erro ? <Aviso texto={erro} /> : null}

      <Sobe key={`metricas-${chave}`} indice={2}>
        <LinhaMetricas>
          <CartaoMetrica titulo="Entrou" valor={resumo.receitas} icone="arrow-down" cor={cores.entrada} />
          <CartaoMetrica titulo="Saiu" valor={resumo.gastos} icone="arrow-up" cor={cores.saida} />
          <CartaoMetrica
            titulo="Sobrou"
            valor={resumo.saldo}
            icone="wallet-outline"
            cor={resumo.saldo >= 0 ? cores.verdeEscuro : cores.saida}
          />
        </LinhaMetricas>
      </Sobe>

      {historico.length > 0 ? (
        <Sobe key={`historico-${chave}`} indice={3}>
          <Secao>
            <Titulo>Últimos {MESES_NO_HISTORICO} meses</Titulo>
            <Cartao>
              <GraficoMeses historico={historico} mesEmFoco={mes} />
            </Cartao>
          </Secao>
        </Sobe>
      ) : null}

      {semCategoria > 0 ? (
        <Pressable onPress={() => router.push('/transacoes')} accessibilityRole="button">
          <Aviso
            tipo="alerta"
            texto={`${semCategoria} ${semCategoria === 1 ? 'gasto ainda está' : 'gastos ainda estão'} sem categoria. Toque para organizar.`}
          />
        </Pressable>
      ) : null}

      <Sobe key={`categorias-${chave}`} indice={4}>
        <Secao>
          <Titulo>Gastos por categoria</Titulo>
          {resumo.porCategoria.length === 0 ? (
            <Cartao>
              {carregando ? (
                <Carregando />
              ) : (
                <Vazio
                  icone="pie-chart-outline"
                  titulo="Nenhum gasto neste mês"
                  texto="Busque no banco ou lance um gasto em dinheiro para começar."
                />
              )}
            </Cartao>
          ) : (
            <>
              <Cartao>
                <GraficoCategorias porCategoria={resumo.porCategoria} total={resumo.gastos} />
              </Cartao>
              <Cartao style={estilos.barras}>
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
            </>
          )}
        </Secao>
      </Sobe>

      {maiores.length > 0 ? (
        <Sobe key={`maiores-${chave}`} indice={5}>
          <Secao>
            <Titulo>Maiores gastos</Titulo>
            <ListaTransacoes transacoes={maiores} categorias={categorias} />
          </Secao>
        </Sobe>
      ) : null}

      <Botao titulo="Lançar gasto em dinheiro" icone="add" onPress={() => router.push('/lancamento')} />
    </TelaAba>
  );
}

const estilos = StyleSheet.create({
  barras: { gap: espaco.lg },
});
