import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Botao, Campo, Cartao, Titulo } from '@/components/ui';
import type { NovaContaAPagar } from '@/lib/contasAPagar';
import { avisar, mensagemDeErro } from '@/lib/dialogos';
import { dataDoBanco, limitesDoMes, numeroDoTexto } from '@/lib/format';
import { espaco } from '@/lib/theme';

function vencimentoNoMes(mes: string, textoDoDia: string): string | null {
  const dia = Math.trunc(numeroDoTexto(textoDoDia));
  if (dia < 1) return null;
  const ultimoDia = dataDoBanco(limitesDoMes(mes).fim).getDate();
  return `${mes.slice(0, 8)}${String(Math.min(dia, ultimoDia)).padStart(2, '0')}`;
}

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
  const [observacao, setObservacao] = useState('');
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
        observacao: observacao.trim() || null,
      });
      setDescricao('');
      setValor('');
      setDia('');
      setObservacao('');
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
      <Campo
        icone="create-outline"
        value={observacao}
        onChangeText={setObservacao}
        placeholder="Observação (opcional)"
      />
      <Botao titulo="Adicionar" icone="add" onPress={() => void adicionar()} carregando={salvando} />
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cartao: { gap: espaco.md },
  linha: { flexDirection: 'row', gap: espaco.sm },
  metade: { flex: 1 },
});
