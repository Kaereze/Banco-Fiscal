import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Campo, Cartao, GradePilulas, Pilula, Rotulo } from '@/components/ui';
import { lerCategoriaDoBanco } from '@/lib/categoriasDoBanco';
import { diaRelativo, moeda } from '@/lib/format';
import { cores, espaco, fonte, raio } from '@/lib/theme';
import type { Categoria, Transacao } from '@/lib/types';

export function CartaoClassificacao({
  transacao,
  nomeDaConta,
  categorias,
  aoClassificar,
  aoNaoContar,
  aoAnotar,
}: {
  transacao: Transacao;
  nomeDaConta: string | null;
  categorias: Categoria[];
  aoClassificar: (categoriaId: string) => void;
  aoNaoContar: () => void;
  aoAnotar: (texto: string) => void;
}) {
  const [anotacao, setAnotacao] = useState(transacao.observacao ?? '');
  const leitura = lerCategoriaDoBanco(transacao.categoria_pluggy);
  const sugerida = leitura?.sugestao ? categorias.find((c) => c.nome === leitura.sugestao) : undefined;
  const nome = transacao.estabelecimento ?? transacao.descricao;
  const detalhes = [transacao.metodo, nomeDaConta, transacao.origem === 'manual' ? 'lançado à mão' : null].filter(
    Boolean,
  );

  function salvarAnotacao() {
    const texto = anotacao.trim();
    if (texto !== (transacao.observacao ?? '')) aoAnotar(texto);
  }

  return (
    <Cartao style={estilos.cartao}>
      <View style={estilos.topo}>
        <View style={estilos.textos}>
          <Text style={estilos.dia}>{diaRelativo(transacao.data)}</Text>
          <Text style={estilos.nome} numberOfLines={2}>
            {nome}
          </Text>
        </View>
        <Text style={estilos.valor}>− {moeda(transacao.valor)}</Text>
      </View>

      {detalhes.length > 0 ? <Text style={estilos.detalhe}>{detalhes.join(' · ')}</Text> : null}
      {transacao.descricao_original && transacao.descricao_original !== nome ? (
        <Text style={estilos.detalhe}>{transacao.descricao_original}</Text>
      ) : null}

      {leitura ? (
        <View style={estilos.banco}>
          <Ionicons name="business-outline" size={16} color={cores.textoSuave} />
          <Text style={estilos.bancoTexto}>O banco diz: {leitura.descricao}</Text>
        </View>
      ) : null}

      {sugerida ? (
        <View style={estilos.sugestao}>
          <Rotulo>Sugestão</Rotulo>
          <Pilula
            texto={`${sugerida.emoji} ${sugerida.nome}`}
            ativa
            cor={sugerida.cor}
            onPress={() => aoClassificar(sugerida.id)}
          />
        </View>
      ) : null}

      <Campo
        value={anotacao}
        onChangeText={setAnotacao}
        onBlur={salvarAnotacao}
        onSubmitEditing={salvarAnotacao}
        placeholder="O que foi? Ex.: gás, presente, conserto"
        icone="create-outline"
        returnKeyType="done"
      />

      <Rotulo>Categoria</Rotulo>
      <GradePilulas>
        {categorias.map((categoria) => (
          <Pilula
            key={categoria.id}
            texto={`${categoria.emoji} ${categoria.nome}`}
            ativa={transacao.categoria_id === categoria.id}
            cor={categoria.cor}
            onPress={() => aoClassificar(categoria.id)}
          />
        ))}
        <Pilula
          texto="↔ Não contar"
          ativa={false}
          onPress={aoNaoContar}
        />
      </GradePilulas>
    </Cartao>
  );
}

const estilos = StyleSheet.create({
  cartao: { gap: espaco.md },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: espaco.md },
  textos: { flex: 1, gap: 2 },
  dia: { fontSize: fonte.mini, fontWeight: '700', color: cores.textoFraco, textTransform: 'uppercase' },
  nome: { fontSize: fonte.corpo, fontWeight: '700', color: cores.texto },
  valor: { fontSize: fonte.secao, fontWeight: '800', color: cores.verdeEscuro, fontVariant: ['tabular-nums'] },
  detalhe: { fontSize: fonte.mini, color: cores.textoSuave },
  banco: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    padding: espaco.sm,
    borderRadius: raio.sm,
    backgroundColor: cores.superficieSuave,
  },
  bancoTexto: { flex: 1, fontSize: fonte.mini, color: cores.textoSuave, fontWeight: '600' },
  sugestao: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
});
