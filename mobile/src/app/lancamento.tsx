import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Aviso, Botao, Campo, Pilula, Rotulo } from '@/components/ui';
import { useDados } from '@/lib/dados';
import { numeroDoTexto, paraISO } from '@/lib/format';
import { useSessao } from '@/lib/sessao';
import { cores, espaco, fonte, raio } from '@/lib/theme';

export default function Lancamento() {
  const router = useRouter();
  const { categorias, criarLancamento } = useDados();
  const { perfil } = useSessao();

  const [tipo, setTipo] = useState<'gasto' | 'receita'>('gasto');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [pessoa, setPessoa] = useState(perfil?.nome ?? '');
  const [quando, setQuando] = useState<'hoje' | 'ontem'>('hoje');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const relevantes = categorias.filter((c) => c.tipo === tipo);

  async function salvar() {
    const numero = numeroDoTexto(valor);
    if (numero <= 0) {
      setErro('Digite um valor maior que zero.');
      return;
    }
    if (!descricao.trim()) {
      setErro('Escreva com o que foi o gasto.');
      return;
    }

    setSalvando(true);
    setErro(null);
    try {
      const data = new Date();
      if (quando === 'ontem') data.setDate(data.getDate() - 1);

      await criarLancamento({
        data: paraISO(data),
        descricao,
        valor: numero,
        tipo,
        categoria_id: categoriaId,
        pessoa: pessoa.trim() || null,
        observacao: observacao.trim() || null,
      });
      router.back();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={estilos.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={estilos.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={estilos.explicacao}>
          Para o que o banco não enxerga: dinheiro vivo, um troco, uma vaquinha. O que passa no
          cartão ou no Pix chega sozinho pela sincronização.
        </Text>

        {/* ---------- Tipo ---------- */}
        <View style={{ gap: espaco.sm }}>
          <Rotulo>Tipo</Rotulo>
          <View style={estilos.linhaPilulas}>
            <Pilula
              texto="Saiu dinheiro"
              ativa={tipo === 'gasto'}
              cor={cores.saida}
              onPress={() => {
                setTipo('gasto');
                setCategoriaId(null);
              }}
            />
            <Pilula
              texto="Entrou dinheiro"
              ativa={tipo === 'receita'}
              cor={cores.entrada}
              onPress={() => {
                setTipo('receita');
                setCategoriaId(null);
              }}
            />
          </View>
        </View>

        {/* ---------- Valor ---------- */}
        <View style={{ gap: espaco.xs }}>
          <Rotulo>Valor</Rotulo>
          <View style={estilos.caixaValor}>
            <Text style={estilos.prefixo}>R$</Text>
            <TextInput
              value={valor}
              onChangeText={setValor}
              placeholder="0,00"
              placeholderTextColor={cores.textoFraco}
              keyboardType="decimal-pad"
              style={estilos.campoValor}
              accessibilityLabel="Valor do lançamento"
              autoFocus
            />
          </View>
        </View>

        <Campo
          rotulo="Com o que foi"
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Ex.: feira da praça, gasolina, remédio"
        />

        {/* ---------- Quando ---------- */}
        <View style={{ gap: espaco.sm }}>
          <Rotulo>Quando</Rotulo>
          <View style={estilos.linhaPilulas}>
            <Pilula texto="Hoje" ativa={quando === 'hoje'} onPress={() => setQuando('hoje')} />
            <Pilula texto="Ontem" ativa={quando === 'ontem'} onPress={() => setQuando('ontem')} />
          </View>
        </View>

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
          placeholder="Opcional"
        />

        {erro ? <Aviso texto={erro} /> : null}

        <Botao titulo="Salvar lançamento" onPress={salvar} carregando={salvando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: { padding: espaco.lg, gap: espaco.lg, paddingBottom: espaco.xxl },
  explicacao: { fontSize: fonte.apoio, color: cores.textoSuave, lineHeight: 22 },
  linhaPilulas: { flexDirection: 'row', gap: espaco.sm },
  grade: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm },
  caixaValor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    backgroundColor: cores.superficie,
    paddingHorizontal: espaco.md,
    minHeight: 64,
  },
  prefixo: { fontSize: fonte.titulo, fontWeight: '700', color: cores.textoFraco },
  campoValor: {
    flex: 1,
    fontSize: fonte.gigante,
    fontWeight: '800',
    color: cores.texto,
    paddingVertical: espaco.sm,
  },
});
