import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { avisar, mensagemDeErro } from '@/lib/dialogos';
import { moeda, numeroDoTexto } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';
import type { Categoria } from '@/lib/types';

export function LinhaOrcamento({
  categoria,
  gasto,
  limite,
  onSalvar,
}: {
  categoria: Categoria;
  gasto: number;
  limite: number | null;
  onSalvar: (valor: number) => Promise<void>;
}) {
  const [texto, setTexto] = useState(limite ? String(limite).replace('.', ',') : '');
  const estourou = limite !== null && limite > 0 && gasto > limite;

  async function salvar() {
    const valor = numeroDoTexto(texto);
    if (valor === (limite ?? 0)) return;
    try {
      await onSalvar(valor);
    } catch (e) {
      avisar('Não consegui salvar', mensagemDeErro(e));
    }
  }

  return (
    <View style={estilos.linha}>
      <Text style={estilos.emoji}>{categoria.emoji}</Text>
      <View style={estilos.textos}>
        <Text style={estilos.nome}>{categoria.nome}</Text>
        <Text style={[estilos.gasto, estourou && estilos.estourou]}>gasto: {moeda(gasto)}</Text>
      </View>
      <TextInput
        value={texto}
        onChangeText={setTexto}
        onBlur={salvar}
        onSubmitEditing={salvar}
        placeholder="—"
        placeholderTextColor={cores.textoFraco}
        keyboardType="numeric"
        returnKeyType="done"
        style={estilos.campo}
        accessibilityLabel={`Limite mensal para ${categoria.nome}`}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  emoji: { width: 28, fontSize: 20, textAlign: 'center' },
  textos: { flex: 1 },
  nome: { fontSize: fonte.corpo, fontWeight: '600', color: cores.texto },
  gasto: { fontSize: fonte.mini, color: cores.textoFraco },
  estourou: { color: cores.saida, fontWeight: '700' },
  campo: {
    width: 112,
    minHeight: 48,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.campo,
    paddingHorizontal: espaco.md,
    textAlign: 'right',
    fontSize: fonte.corpo,
    fontWeight: '600',
    color: cores.texto,
    backgroundColor: cores.superficie,
  },
});
