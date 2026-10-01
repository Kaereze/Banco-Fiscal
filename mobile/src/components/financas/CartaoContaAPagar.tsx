import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BotaoIcone, Campo, Cartao } from '@/components/ui';
import { dataCurta, dataDoBanco, moeda, paraISO } from '@/lib/format';
import { ALTURA_TOQUE, cores, espaco, fonte, raio } from '@/lib/theme';
import type { ContaAPagar } from '@/lib/types';

function situacao(conta: ContaAPagar): { texto: string; cor: string } | null {
  if (conta.paga) {
    return { texto: conta.paga_em ? `Paga em ${dataCurta(conta.paga_em)}` : 'Paga', cor: cores.entrada };
  }
  if (!conta.vencimento) return null;
  const hoje = paraISO(new Date());
  if (conta.vencimento < hoje) return { texto: `Atrasada · venceu dia ${dataDoBanco(conta.vencimento).getDate()}`, cor: cores.saida };
  if (conta.vencimento === hoje) return { texto: 'Vence hoje', cor: cores.alerta };
  return { texto: `Vence dia ${dataDoBanco(conta.vencimento).getDate()}`, cor: cores.textoSuave };
}

export function CartaoContaAPagar({
  conta,
  aoAlternarPaga,
  aoAnotar,
  aoApagar,
}: {
  conta: ContaAPagar;
  aoAlternarPaga: () => void;
  aoAnotar: (texto: string) => void;
  aoApagar: () => void;
}) {
  const [observacao, setObservacao] = useState(conta.observacao ?? '');
  const estado = situacao(conta);

  function salvarObservacao() {
    const texto = observacao.trim();
    if (texto !== (conta.observacao ?? '')) aoAnotar(texto);
  }

  return (
    <Cartao style={[estilos.cartao, conta.paga && estilos.cartaoPago]}>
      <View style={estilos.topo}>
        <Pressable
          onPress={aoAlternarPaga}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: conta.paga }}
          accessibilityLabel={`${conta.descricao}: ${conta.paga ? 'paga' : 'não paga'}`}
          hitSlop={8}
          style={estilos.marca}
        >
          <Ionicons
            name={conta.paga ? 'checkmark-circle' : 'ellipse-outline'}
            size={30}
            color={conta.paga ? cores.entrada : cores.textoFraco}
          />
        </Pressable>

        <View style={estilos.textos}>
          <Text style={[estilos.descricao, conta.paga && estilos.riscado]} numberOfLines={2}>
            {conta.descricao}
          </Text>
          {estado ? <Text style={[estilos.situacao, { color: estado.cor }]}>{estado.texto}</Text> : null}
        </View>

        {conta.valor !== null ? (
          <Text style={[estilos.valor, conta.paga && estilos.valorPago]}>{moeda(conta.valor)}</Text>
        ) : null}

        <BotaoIcone icone="trash-outline" rotulo={`Apagar ${conta.descricao}`} onPress={aoApagar} />
      </View>

      <Campo
        value={observacao}
        onChangeText={setObservacao}
        onBlur={salvarObservacao}
        onSubmitEditing={salvarObservacao}
        placeholder="Observação"
        icone="create-outline"
        returnKeyType="done"
      />
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cartao: { gap: espaco.md, padding: espaco.lg },
  cartaoPago: { backgroundColor: cores.entradaSuave },
  topo: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  marca: {
    width: ALTURA_TOQUE,
    height: ALTURA_TOQUE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: raio.pilula,
  },
  textos: { flex: 1, gap: 2 },
  descricao: { fontSize: fonte.corpo, fontWeight: '700', color: cores.texto },
  riscado: { textDecorationLine: 'line-through', color: cores.textoSuave },
  situacao: { fontSize: fonte.mini, fontWeight: '600' },
  valor: { fontSize: fonte.corpo, fontWeight: '800', color: cores.verdeEscuro, fontVariant: ['tabular-nums'] },
  valorPago: { color: cores.entrada },
});
