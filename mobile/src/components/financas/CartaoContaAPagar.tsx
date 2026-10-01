import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Surge } from '@/components/animacao';
import { SeloConta } from '@/components/financas/SeloConta';
import { Botao, Campo, Cartao } from '@/components/ui';
import { vencimentoNoMes, type EdicaoContaAPagar } from '@/lib/contasAPagar';
import { dataCurta, dataDoBanco, moeda, numeroDoTexto, paraISO } from '@/lib/format';
import { ALTURA_TOQUE, cores, espaco, fonte, raio } from '@/lib/theme';
import type { ContaAPagar } from '@/lib/types';

function situacao(conta: ContaAPagar): { texto: string; cor: string } | null {
  if (conta.paga) {
    const quando = conta.paga_em ? ` em ${dataCurta(conta.paga_em)}` : '';
    return { texto: conta.transacao ? `Paga pelo banco${quando}` : `Paga${quando}`, cor: cores.entrada };
  }
  if (!conta.vencimento) return null;
  const dia = dataDoBanco(conta.vencimento).getDate();
  const hoje = paraISO(new Date());
  if (conta.vencimento < hoje) return { texto: `Atrasada · venceu dia ${dia}`, cor: cores.saida };
  if (conta.vencimento === hoje) return { texto: 'Vence hoje', cor: cores.alerta };
  return { texto: `Vence dia ${dia}`, cor: cores.textoSuave };
}

const DURACAO_ABRIR = 160;

function textoDoValor(valor: number | null): string {
  return valor === null ? '' : valor.toFixed(2).replace('.', ',');
}

export function CartaoContaAPagar({
  conta,
  aoAlternarPaga,
  aoEditar,
  aoApagar,
}: {
  conta: ContaAPagar;
  aoAlternarPaga: () => void;
  aoEditar: (mudancas: EdicaoContaAPagar) => void;
  aoApagar: () => void;
}) {
  const [aberta, setAberta] = useState(false);
  const [descricao, setDescricao] = useState(conta.descricao);
  const [valor, setValor] = useState(textoDoValor(conta.valor));
  const [dia, setDia] = useState(conta.vencimento ? String(dataDoBanco(conta.vencimento).getDate()) : '');
  const [identificador, setIdentificador] = useState(conta.identificador ?? '');
  const [observacao, setObservacao] = useState(conta.observacao ?? '');
  const estado = situacao(conta);

  function salvarDescricao() {
    const texto = descricao.trim();
    if (!texto) setDescricao(conta.descricao);
    else if (texto !== conta.descricao) aoEditar({ descricao: texto });
  }

  function salvarValor() {
    const numero = numeroDoTexto(valor);
    const novo = numero > 0 ? numero : null;
    if (novo !== conta.valor) aoEditar({ valor: novo });
  }

  function salvarDia() {
    const novo = vencimentoNoMes(conta.mes, dia);
    if (novo !== conta.vencimento) aoEditar({ vencimento: novo });
  }

  function salvarIdentificador() {
    const texto = identificador.trim() || null;
    if (texto !== conta.identificador) aoEditar({ identificador: texto });
  }

  function salvarObservacao() {
    const texto = observacao.trim() || null;
    if (texto !== conta.observacao) aoEditar({ observacao: texto });
  }

  return (
    <Cartao style={[estilos.cartao, conta.paga && estilos.cartaoPago]}>
      <View style={estilos.topo}>
        <Pressable
          onPress={aoAlternarPaga}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: conta.paga }}
          accessibilityLabel={`${conta.descricao}: ${conta.paga ? 'paga' : 'não paga'}`}
          hitSlop={6}
          style={estilos.marca}
        >
          <Ionicons
            name={conta.paga ? 'checkmark-circle' : 'ellipse-outline'}
            size={28}
            color={conta.paga ? cores.entrada : cores.textoFraco}
          />
        </Pressable>

        <Pressable
          onPress={() => setAberta((atual) => !atual)}
          accessibilityRole="button"
          accessibilityState={{ expanded: aberta }}
          accessibilityLabel={`${conta.descricao}. ${aberta ? 'Fechar' : 'Ver'} detalhes`}
          style={estilos.cabecalho}
        >
          <SeloConta key={`${conta.descricao}|${conta.identificador}`} descricao={conta.descricao} identificador={conta.identificador} />
          <View style={estilos.textos}>
            <Text style={[estilos.descricao, conta.paga && estilos.riscado]} numberOfLines={1}>
              {conta.descricao}
            </Text>
            {estado ? <Text style={[estilos.situacao, { color: estado.cor }]}>{estado.texto}</Text> : null}
          </View>
          {conta.valor !== null ? (
            <Text style={[estilos.valor, conta.paga && estilos.valorPago]}>{moeda(conta.valor)}</Text>
          ) : null}
          <Ionicons name={aberta ? 'chevron-up' : 'chevron-down'} size={20} color={cores.textoSuave} />
        </Pressable>
      </View>

      {aberta ? (
        <Surge duracao={DURACAO_ABRIR} style={estilos.detalhes}>
          {conta.transacao ? (
            <View style={estilos.pagamento}>
              <Ionicons name="business-outline" size={18} color={cores.entrada} />
              <Text style={estilos.pagamentoTexto}>
                Quitada pelo pagamento de {dataCurta(conta.transacao.data)} ·{' '}
                {conta.transacao.contraparte ?? conta.transacao.estabelecimento ?? conta.transacao.descricao} ·{' '}
                {moeda(conta.transacao.valor)}
              </Text>
            </View>
          ) : !conta.paga && !conta.conciliar ? (
            <Pressable onPress={() => aoEditar({ conciliar: true })} accessibilityRole="button" style={estilos.pagamento}>
              <Ionicons name="link-outline" size={18} color={cores.alerta} />
              <Text style={estilos.pagamentoTexto}>
                Você desmarcou esta conta, então o banco não marca mais sozinho. Toque para religar.
              </Text>
            </Pressable>
          ) : !conta.paga ? (
            <View style={estilos.pagamento}>
              <Ionicons name="sync-outline" size={18} color={cores.textoSuave} />
              <Text style={estilos.pagamentoTexto}>
                {conta.valor === null
                  ? 'Informe o valor para o app reconhecer o pagamento no banco.'
                  : 'Quando um pagamento deste valor chegar do banco, a conta é marcada como paga.'}
              </Text>
            </View>
          ) : null}

          <Campo rotulo="Nome" value={descricao} onChangeText={setDescricao} onBlur={salvarDescricao} />
          <View style={estilos.linha}>
            <View style={estilos.metade}>
              <Campo
                rotulo="Valor"
                value={valor}
                onChangeText={setValor}
                onBlur={salvarValor}
                placeholder="0,00"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={estilos.metade}>
              <Campo
                rotulo="Vence dia"
                value={dia}
                onChangeText={setDia}
                onBlur={salvarDia}
                placeholder="—"
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
          <Campo
            rotulo="Como aparece no extrato"
            dica="Ex.: CELESC, TELEFONICA. Ajuda o app a achar o pagamento certo."
            value={identificador}
            onChangeText={setIdentificador}
            onBlur={salvarIdentificador}
            placeholder="Opcional"
            autoCapitalize="characters"
          />
          <Campo
            rotulo="Observação"
            value={observacao}
            onChangeText={setObservacao}
            onBlur={salvarObservacao}
            placeholder="Opcional"
            multiline
          />
          <Botao titulo="Apagar conta" variante="perigo" icone="trash-outline" onPress={aoApagar} />
        </Surge>
      ) : null}
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cartao: { gap: espaco.md, padding: espaco.md },
  cartaoPago: { backgroundColor: cores.entradaSuave },
  topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs },
  marca: {
    width: ALTURA_TOQUE - 8,
    height: ALTURA_TOQUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabecalho: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: espaco.sm, minHeight: ALTURA_TOQUE },
  textos: { flex: 1, gap: 2 },
  descricao: { fontSize: fonte.corpo, fontWeight: '700', color: cores.texto },
  riscado: { textDecorationLine: 'line-through', color: cores.textoSuave },
  situacao: { fontSize: fonte.mini, fontWeight: '600' },
  valor: { fontSize: fonte.apoio, fontWeight: '800', color: cores.verdeEscuro, fontVariant: ['tabular-nums'] },
  valorPago: { color: cores.entrada },
  detalhes: { gap: espaco.md, paddingTop: espaco.xs },
  pagamento: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: espaco.sm,
    padding: espaco.md,
    borderRadius: raio.sm,
    backgroundColor: cores.superficieSuave,
  },
  pagamentoTexto: { flex: 1, fontSize: fonte.mini, color: cores.texto, lineHeight: 18 },
  linha: { flexDirection: 'row', gap: espaco.sm },
  metade: { flex: 1 },
});
