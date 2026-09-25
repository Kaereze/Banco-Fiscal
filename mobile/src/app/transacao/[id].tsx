import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';

import { Aviso, Botao, Campo, Cartao, Pilula, Rotulo, Vazio } from '@/components/ui';
import { useDados } from '@/lib/dados';
import { dataLonga, moeda } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { cores, espaco, fonte } from '@/lib/theme';
import type { Transacao } from '@/lib/types';

export default function DetalheTransacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transacoes, carregando } = useDados();

  const transacao = useMemo(() => transacoes.find((t) => t.id === id), [transacoes, id]);

  if (!transacao) {
    return (
      <View style={estilos.tela}>
        {carregando ? null : (
          <Vazio
            emoji="🤔"
            titulo="Lançamento não encontrado"
            texto="Ele pode ser de outro mês. Volte e troque o mês no topo da lista."
          />
        )}
      </View>
    );
  }

  // A `key` garante que o formulário renasça com os valores certos quando a
  // transação chega depois da tela (abertura por link, app voltando do fundo).
  return <Editor key={transacao.id} transacao={transacao} />;
}

function Editor({ transacao }: { transacao: Transacao }) {
  const router = useRouter();
  const { categorias, contas, editarTransacao, apagarLancamento } = useDados();

  const [categoriaId, setCategoriaId] = useState(transacao.categoria_id);
  const [pessoa, setPessoa] = useState(transacao.pessoa ?? '');
  const [observacao, setObservacao] = useState(transacao.observacao ?? '');
  const [ignorada, setIgnorada] = useState(transacao.ignorada);
  const [criarRegra, setCriarRegra] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const saida = transacao.valor < 0;
  const conta = contas.find((c) => c.id === transacao.conta_id);
  const relevantes = categorias.filter((c) => (saida ? c.tipo === 'gasto' : c.tipo === 'receita'));
  const padraoDaRegra = chaveDaRegra(transacao.estabelecimento ?? transacao.descricao);

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      await editarTransacao(transacao.id, {
        categoria_id: categoriaId,
        pessoa: pessoa.trim() || null,
        observacao: observacao.trim() || null,
        ignorada,
      });

      if (criarRegra && categoriaId && padraoDaRegra) {
        const { error } = await supabase.from('regras').insert({
          padrao: padraoDaRegra,
          categoria_id: categoriaId,
          pessoa: pessoa.trim() || null,
        });
        // A regra é um extra: se falhar, a edição principal já foi salva.
        if (error) console.warn('Não consegui criar a regra:', error.message);
      }

      router.back();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui salvar.');
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao() {
    Alert.alert('Apagar lançamento', 'Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await apagarLancamento(transacao.id);
            router.back();
          } catch (e) {
            Alert.alert('Erro', e instanceof Error ? e.message : 'Não consegui apagar.');
          }
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={estilos.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        {/* ---------- Cabeçalho ---------- */}
        <Cartao style={{ gap: espaco.xs }}>
          <Text style={estilos.descricao}>{transacao.descricao}</Text>
          <Text style={[estilos.valor, { color: saida ? cores.texto : cores.entrada }]}>
            {saida ? '−' : '+'} {moeda(transacao.valor)}
          </Text>
          <Text style={estilos.meta}>
            {[
              dataLonga(transacao.data),
              conta?.nome,
              transacao.metodo,
              transacao.origem === 'manual' ? 'lançado à mão' : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          {transacao.categoria_pluggy ? (
            <Text style={estilos.meta}>Banco classificou como: {transacao.categoria_pluggy}</Text>
          ) : null}
        </Cartao>

        {/* ---------- Categoria ---------- */}
        <View style={{ gap: espaco.sm }}>
          <Rotulo>Categoria</Rotulo>
          <View style={estilos.grade}>
            {relevantes.map((categoria) => (
              <Pilula
                key={categoria.id}
                texto={`${categoria.emoji} ${categoria.nome}`}
                ativa={categoriaId === categoria.id}
                cor={categoria.cor}
                onPress={() => setCategoriaId(categoriaId === categoria.id ? null : categoria.id)}
              />
            ))}
          </View>
        </View>

        {categoriaId && transacao.origem === 'pluggy' && padraoDaRegra ? (
          <Cartao style={estilos.linhaSwitch}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.switchTitulo}>Sempre categorizar assim</Text>
              <Text style={estilos.switchTexto}>
                Cria uma regra para &quot;{padraoDaRegra}&quot; nas próximas sincronizações.
              </Text>
            </View>
            <Switch
              value={criarRegra}
              onValueChange={setCriarRegra}
              trackColor={{ true: cores.primaria }}
            />
          </Cartao>
        ) : null}

        {/* ---------- Detalhes da família ---------- */}
        <Campo
          rotulo="Quem gastou"
          value={pessoa}
          onChangeText={setPessoa}
          placeholder="Ex.: Pai, Mãe, João"
        />

        <Campo
          rotulo="Observação"
          value={observacao}
          onChangeText={setObservacao}
          placeholder="Ex.: remédio da vó, parcela 2 de 6"
          multiline
          style={{ minHeight: 88, paddingTop: espaco.md, textAlignVertical: 'top' }}
        />

        <Cartao style={estilos.linhaSwitch}>
          <View style={{ flex: 1 }}>
            <Text style={estilos.switchTitulo}>Não contar nos totais</Text>
            <Text style={estilos.switchTexto}>
              Use para transferências entre contas da família, que não são gasto de verdade.
            </Text>
          </View>
          <Switch value={ignorada} onValueChange={setIgnorada} trackColor={{ true: cores.alerta }} />
        </Cartao>

        {erro ? <Aviso texto={erro} /> : null}

        <Botao titulo="Salvar" onPress={salvar} carregando={salvando} />

        {transacao.origem === 'manual' ? (
          <Botao titulo="Apagar lançamento" variante="perigo" onPress={confirmarExclusao} />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Pega um trecho estável da descrição para virar regra. Descrições de banco
 * costumam terminar com data ou número do documento, que mudam a cada
 * compra — por isso ficamos só com as primeiras palavras.
 */
function chaveDaRegra(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((palavra) => palavra.length > 2)
    .slice(0, 3)
    .join(' ')
    .trim();
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.lg, gap: espaco.lg, paddingBottom: espaco.xxl },
  descricao: { fontSize: fonte.subtitulo, fontWeight: '700', color: cores.texto },
  valor: {
    fontSize: fonte.gigante,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  meta: { fontSize: fonte.mini, color: cores.textoFraco },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  linhaSwitch: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  switchTitulo: { fontSize: fonte.corpo, fontWeight: '700', color: cores.texto },
  switchTexto: { fontSize: fonte.mini, color: cores.textoSuave, lineHeight: 19 },
});
