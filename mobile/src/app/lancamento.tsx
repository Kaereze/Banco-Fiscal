import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { TelaFormulario } from '@/components/layout/Tela';
import { Aviso, Botao, Campo, GradePilulas, Pilula, Rotulo, Secao } from '@/components/ui';
import { useDados } from '@/lib/dados';
import { numeroDoTexto, paraISO } from '@/lib/format';
import { useSessao } from '@/lib/sessao';
import { cores, espaco, fonte, raio } from '@/lib/theme';

type Tipo = 'gasto' | 'receita';
type Quando = 'hoje' | 'ontem';

export default function Lancamento() {
  const router = useRouter();
  const { categorias, criarLancamento } = useDados();
  const { perfil } = useSessao();

  const [tipo, setTipo] = useState<Tipo>('gasto');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [pessoa, setPessoa] = useState(perfil?.nome ?? '');
  const [quando, setQuando] = useState<Quando>('hoje');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const relevantes = categorias.filter((c) => c.tipo === tipo);

  function trocarTipo(novo: Tipo) {
    setTipo(novo);
    setCategoriaId(null);
  }

  async function salvar() {
    const numero = numeroDoTexto(valor);
    if (numero <= 0) {
      setErro('Digite um valor maior que zero.');
      return;
    }
    if (!descricao.trim()) {
      setErro('Escreva com o que foi o lançamento.');
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
    <TelaFormulario>
      <Text style={estilos.explicacao}>
        Para o que o banco não enxerga: dinheiro vivo, um troco, uma vaquinha. O que passa no cartão
        ou no Pix chega sozinho pela sincronização.
      </Text>

      <Secao>
        <Rotulo>Tipo</Rotulo>
        <GradePilulas>
          <Pilula texto="Saiu dinheiro" ativa={tipo === 'gasto'} cor={cores.saida} onPress={() => trocarTipo('gasto')} />
          <Pilula
            texto="Entrou dinheiro"
            ativa={tipo === 'receita'}
            cor={cores.entrada}
            onPress={() => trocarTipo('receita')}
          />
        </GradePilulas>
      </Secao>

      <Secao>
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
      </Secao>

      <Campo
        rotulo="Com o que foi"
        value={descricao}
        onChangeText={setDescricao}
        placeholder="Ex.: feira da praça, gasolina, remédio"
      />

      <Secao>
        <Rotulo>Quando</Rotulo>
        <GradePilulas>
          <Pilula texto="Hoje" ativa={quando === 'hoje'} onPress={() => setQuando('hoje')} />
          <Pilula texto="Ontem" ativa={quando === 'ontem'} onPress={() => setQuando('ontem')} />
        </GradePilulas>
      </Secao>

      <Secao>
        <Rotulo>Categoria</Rotulo>
        <GradePilulas>
          {relevantes.map((categoria) => (
            <Pilula
              key={categoria.id}
              texto={`${categoria.emoji} ${categoria.nome}`}
              ativa={categoriaId === categoria.id}
              cor={categoria.cor}
              onPress={() => setCategoriaId(categoriaId === categoria.id ? null : categoria.id)}
            />
          ))}
        </GradePilulas>
      </Secao>

      <Campo rotulo="Quem gastou" value={pessoa} onChangeText={setPessoa} placeholder="Ex.: Pai, Mãe, João" />
      <Campo rotulo="Observação" value={observacao} onChangeText={setObservacao} placeholder="Opcional" />

      {erro ? <Aviso texto={erro} /> : null}

      <Botao titulo="Salvar lançamento" onPress={salvar} carregando={salvando} />
    </TelaFormulario>
  );
}

const estilos = StyleSheet.create({
  explicacao: { fontSize: fonte.apoio, color: cores.textoSuave, lineHeight: 22 },
  caixaValor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.sm,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.campo,
    backgroundColor: cores.superficie,
    paddingHorizontal: espaco.lg,
    minHeight: 64,
  },
  prefixo: { fontSize: fonte.titulo, fontWeight: '700', color: cores.textoFraco },
  campoValor: {
    flex: 1,
    minWidth: 0,
    fontSize: fonte.gigante,
    fontWeight: '800',
    color: cores.verdeEscuro,
    paddingVertical: espaco.sm,
  },
});
