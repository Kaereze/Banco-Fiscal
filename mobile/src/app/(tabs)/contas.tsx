import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Aviso, Botao, Cartao, Titulo, Vazio } from '@/components/ui';
import { Sobe } from '@/components/animacao';
import { conteudoCentralizado } from '@/components/Pagina';
import { useDados } from '@/lib/dados';
import { moeda, tempoDesde } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';
import type { Conta } from '@/lib/types';

export default function Contas() {
  const { contas, ultimaSync, sincronizando, sincronizarPluggy, recarregar, carregando } = useDados();
  const [atualizando, setAtualizando] = useState(false);

  const emConta = contas.filter((c) => c.tipo !== 'CREDIT');
  const cartoes = contas.filter((c) => c.tipo === 'CREDIT');
  const totalEmConta = emConta.reduce((soma, c) => soma + (c.saldo ?? 0), 0);

  async function puxarParaAtualizar() {
    setAtualizando(true);
    await recarregar();
    setAtualizando(false);
  }

  return (
    <ScrollView
      contentContainerStyle={[estilos.conteudo, conteudoCentralizado]}
      refreshControl={
        <RefreshControl refreshing={atualizando} onRefresh={puxarParaAtualizar} tintColor={cores.primaria} />
      }
    >
      {contas.length === 0 ? (
        <Cartao>
          {carregando ? (
            <Text style={estilos.carregando}>Carregando...</Text>
          ) : (
            <Vazio
              emoji="🔌"
              titulo="Nenhuma conta conectada ainda"
              texto="Conecte seus bancos em meu.pluggy.ai e toque no botão abaixo para trazê-los."
            />
          )}
        </Cartao>
      ) : (
        <>
          <Sobe indice={0}>
          <Cartao style={estilos.destaque}>
            <Text style={estilos.rotuloDestaque}>Saldo somado das contas</Text>
            <Text style={[estilos.numeroDestaque, totalEmConta < 0 && { color: cores.saida }]}>
              {totalEmConta < 0 ? '− ' : ''}
              {moeda(totalEmConta)}
            </Text>
          </Cartao>
          </Sobe>

          {emConta.length > 0 ? (
            <Sobe indice={1}>
              <View style={estilos.secao}>
                <Titulo>Contas</Titulo>
                {emConta.map((conta) => (
                  <CartaoConta key={conta.id} conta={conta} />
                ))}
              </View>
            </Sobe>
          ) : null}

          {cartoes.length > 0 ? (
            <Sobe indice={2}>
              <View style={estilos.secao}>
                <Titulo>Cartões de crédito</Titulo>
                {cartoes.map((conta) => (
                  <CartaoConta key={conta.id} conta={conta} cartao />
                ))}
              </View>
            </Sobe>
          ) : null}
        </>
      )}

      {ultimaSync?.sucesso === false && ultimaSync.erro ? (
        <Aviso texto={`Última sincronização falhou: ${ultimaSync.erro}`} />
      ) : null}

      <Cartao style={{ gap: espaco.md }}>
        <Text style={estilos.syncTexto}>
          Última atualização {tempoDesde(ultimaSync?.terminada_em ?? null)}.
        </Text>
        <Botao
          titulo={sincronizando ? 'Buscando...' : 'Buscar no banco agora'}
          carregando={sincronizando}
          onPress={() => void sincronizarPluggy()}
        />
        <Botao
          titulo="Recarregar 2 anos de histórico"
          variante="secundario"
          desabilitado={sincronizando}
          onPress={() => void sincronizarPluggy(true)}
        />
      </Cartao>
    </ScrollView>
  );
}

function CartaoConta({ conta, cartao = false }: { conta: Conta; cartao?: boolean }) {
  const saldo = conta.saldo ?? 0;

  return (
    <Cartao style={estilos.conta}>
      <View style={estilos.contaTopo}>
        <View style={estilos.icone}>
          <Ionicons
            name={cartao ? 'card' : 'business'}
            size={20}
            color={cores.primaria}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={estilos.contaNome} numberOfLines={1}>
            {conta.nome}
          </Text>
          <Text style={estilos.contaDetalhe} numberOfLines={1}>
            {[conta.instituicao, conta.numero, conta.dono].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>

      <View style={estilos.contaRodape}>
        <Text style={estilos.contaRotulo}>{cartao ? 'Fatura atual' : 'Saldo'}</Text>
        <Text style={[estilos.contaSaldo, saldo < 0 && { color: cores.saida }]}>
          {saldo < 0 ? '− ' : ''}
          {moeda(saldo)}
        </Text>
      </View>

      {cartao && conta.limite ? (
        <Text style={estilos.contaDetalhe}>Limite total {moeda(conta.limite)}</Text>
      ) : null}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    padding: espaco.lg,
    gap: espaco.lg,
    paddingBottom: espaco.xxl,
  },
  destaque: { gap: espaco.xs },
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
  secao: { gap: espaco.md },
  conta: { gap: espaco.md },
  contaTopo: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  icone: {
    width: 40,
    height: 40,
    borderRadius: raio.md,
    backgroundColor: cores.primariaSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contaNome: { fontSize: fonte.corpo, fontWeight: '700', color: cores.texto },
  contaDetalhe: { fontSize: fonte.mini, color: cores.textoFraco },
  contaRodape: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  contaRotulo: { fontSize: fonte.apoio, color: cores.textoSuave },
  contaSaldo: {
    fontSize: fonte.titulo,
    fontWeight: '700',
    color: cores.texto,
    fontVariant: ['tabular-nums'],
  },
  syncTexto: { fontSize: fonte.apoio, color: cores.textoSuave },
  carregando: {
    fontSize: fonte.apoio,
    color: cores.textoFraco,
    textAlign: 'center',
    paddingVertical: espaco.lg,
  },
});
