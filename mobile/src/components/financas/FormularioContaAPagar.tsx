import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Surge } from '@/components/animacao';
import { Botao, Campo, Cartao, Titulo } from '@/components/ui';
import { vencimentoNoMes, type NovaContaAPagar } from '@/lib/contasAPagar';
import { avisar, mensagemDeErro } from '@/lib/dialogos';
import { numeroDoTexto } from '@/lib/format';
import { cores, espaco, fonte } from '@/lib/theme';

export function FormularioContaAPagar({
  mes,
  aoAdicionar,
}: {
  mes: string;
  aoAdicionar: (nova: NovaContaAPagar) => Promise<void>;
}) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dia, setDia] = useState('');
  const [identificador, setIdentificador] = useState('');
  const [observacao, setObservacao] = useState('');
  const [maisDetalhes, setMaisDetalhes] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function adicionar() {
    if (!descricao.trim()) {
      avisar('Falta o nome da conta', 'Escreva o que é a conta, por exemplo "Luz" ou "Aluguel".');
      return;
    }
    setSalvando(true);
    try {
      const numero = numeroDoTexto(valor);
      await aoAdicionar({
        descricao: descricao.trim(),
        valor: numero > 0 ? numero : null,
        vencimento: vencimentoNoMes(mes, dia),
        identificador: identificador.trim() || null,
        observacao: observacao.trim() || null,
      });
      setDescricao('');
      setValor('');
      setDia('');
      setIdentificador('');
      setObservacao('');
      setMaisDetalhes(false);
    } catch (e) {
      avisar('Não consegui adicionar', mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Cartao style={estilos.cartao}>
      <Titulo>Nova conta</Titulo>
      <Campo
        icone="document-text-outline"
        value={descricao}
        onChangeText={setDescricao}
        placeholder="O que é? Ex.: Luz, Aluguel, Internet"
        returnKeyType="next"
      />
      <View style={estilos.linha}>
        <View style={estilos.metade}>
          <Campo
            icone="cash-outline"
            value={valor}
            onChangeText={setValor}
            placeholder="Valor"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={estilos.metade}>
          <Campo
            icone="calendar-outline"
            value={dia}
            onChangeText={setDia}
            placeholder="Vence dia"
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
      </View>
      <Pressable
        onPress={() => setMaisDetalhes((atual) => !atual)}
        accessibilityRole="button"
        accessibilityState={{ expanded: maisDetalhes }}
        style={estilos.maisDetalhes}
      >
        <Text style={estilos.maisDetalhesTexto}>Mais detalhes</Text>
        <Ionicons name={maisDetalhes ? 'chevron-up' : 'chevron-down'} size={18} color={cores.primaria} />
      </Pressable>
      {maisDetalhes ? (
        <Surge style={estilos.detalhes}>
          <Campo
            icone="business-outline"
            value={identificador}
            onChangeText={setIdentificador}
            placeholder="Como aparece no extrato (ex.: CELESC)"
            autoCapitalize="characters"
          />
          <Campo
            icone="create-outline"
            value={observacao}
            onChangeText={setObservacao}
            placeholder="Observação"
          />
        </Surge>
      ) : null}
      <Botao titulo="Adicionar" icone="add" onPress={() => void adicionar()} carregando={salvando} />
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cartao: { gap: espaco.md },
  linha: { flexDirection: 'row', gap: espaco.sm },
  metade: { flex: 1 },
  maisDetalhes: { flexDirection: 'row', alignItems: 'center', gap: espaco.xs, alignSelf: 'flex-start', paddingVertical: espaco.xs },
  maisDetalhesTexto: { fontSize: fonte.apoio, fontWeight: '700', color: cores.primaria },
  detalhes: { gap: espaco.md },
});
