import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';

import { TelaFormulario } from '@/components/layout/Tela';
import { NOME_DO_APP } from '@/components/marca/Logo';
import {
  Aviso,
  Botao,
  Campo,
  Carregando,
  Cartao,
  Chave,
  GradePilulas,
  Pilula,
  Rotulo,
  Secao,
  Separador,
  Vazio,
} from '@/components/ui';
import { useDados } from '@/lib/dados';
import { lerCategoriaDoBanco } from '@/lib/categoriasDoBanco';
import { avisar, confirmar, mensagemDeErro } from '@/lib/dialogos';
import { dataLonga, moeda } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { formatarCnpj, nomeDoPagamento } from '@/lib/transacoes';
import { cores, espaco, fonte } from '@/lib/theme';
import type { Categoria, Conta, Transacao } from '@/lib/types';

export default function DetalheTransacao() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transacoes, carregando } = useDados();
  const transacao = useMemo(() => transacoes.find((t) => t.id === id), [transacoes, id]);

  if (!transacao) {
    return (
      <TelaFormulario>
        {carregando ? (
          <Carregando />
        ) : (
          <Vazio
            icone="help-circle-outline"
            titulo="Lançamento não encontrado"
            texto="Ele pode ser de outro mês. Volte e troque o mês no topo da lista."
          />
        )}
      </TelaFormulario>
    );
  }

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
  const categoria = categorias.find((c) => c.id === categoriaId) ?? null;
  const relevantes = categorias.filter((c) => (saida ? c.tipo === 'gasto' : c.tipo === 'receita'));
  const nome = nomeDoPagamento(transacao);
  const leitura = lerCategoriaDoBanco(transacao.categoria_pluggy);
  const padraoDaRegra = chaveDaRegra(nome);

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
        if (error) avisar('A regra não foi criada', error.message);
      }

      router.back();
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui salvar.');
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    const quer = await confirmar('Apagar lançamento', 'Essa ação não pode ser desfeita.', 'Apagar');
    if (!quer) return;
    try {
      await apagarLancamento(transacao.id);
      router.back();
    } catch (e) {
      avisar('Não consegui apagar', mensagemDeErro(e));
    }
  }

  async function compartilhar() {
    try {
      await Share.share({ message: comprovante(transacao, conta, categoria) });
    } catch (e) {
      avisar('Não consegui compartilhar', mensagemDeErro(e));
    }
  }

  return (
    <TelaFormulario>
      <View style={estilos.topo}>
        <Text style={estilos.descricao} numberOfLines={2}>
          {nome}
        </Text>
        <Text style={[estilos.valor, { color: saida ? cores.verdeEscuro : cores.entrada }]}>
          {saida ? '−' : '+'} {moeda(transacao.valor)}
        </Text>
      </View>

      <Cartao style={estilos.detalhes}>
        <Linha rotulo="Data" valor={dataLonga(transacao.data)} />
        <Separador />
        <Linha rotulo="Conta" valor={conta?.nome ?? (transacao.origem === 'manual' ? 'Lançado à mão' : '—')} />
        <Separador />
        <Linha rotulo="Forma" valor={transacao.metodo ?? '—'} />
        <Separador />
        <Linha rotulo="Categoria" valor={categoria ? `${categoria.emoji} ${categoria.nome}` : 'Sem categoria'} />
        {transacao.descricao !== nome ? (
          <>
            <Separador />
            <Linha rotulo="No extrato" valor={transacao.descricao} />
          </>
        ) : null}
        {transacao.cnpj ? (
          <>
            <Separador />
            <Linha rotulo="CNPJ" valor={formatarCnpj(transacao.cnpj)} />
          </>
        ) : null}
        {transacao.mensagem ? (
          <>
            <Separador />
            <Linha rotulo="Mensagem" valor={transacao.mensagem} />
          </>
        ) : null}
        {leitura ? (
          <>
            <Separador />
            <Linha rotulo="O banco diz" valor={leitura.descricao} />
          </>
        ) : null}
      </Cartao>

      <Botao titulo="Compartilhar comprovante" icone="share-outline" variante="secundario" onPress={compartilhar} />

      <Secao>
        <Rotulo>Categoria</Rotulo>
        <GradePilulas>
          {relevantes.map((item) => (
            <Pilula
              key={item.id}
              texto={`${item.emoji} ${item.nome}`}
              ativa={categoriaId === item.id}
              cor={item.cor}
              onPress={() => setCategoriaId(categoriaId === item.id ? null : item.id)}
            />
          ))}
        </GradePilulas>
      </Secao>

      {categoriaId && transacao.origem === 'pluggy' && padraoDaRegra ? (
        <Chave
          titulo="Sempre categorizar assim"
          texto={`Cria uma regra para "${padraoDaRegra}" nas próximas sincronizações.`}
          valor={criarRegra}
          aoMudar={setCriarRegra}
        />
      ) : null}

      <Campo rotulo="Quem gastou" value={pessoa} onChangeText={setPessoa} placeholder="Ex.: Pai, Mãe, João" />
      <Campo
        rotulo="Observação"
        value={observacao}
        onChangeText={setObservacao}
        placeholder="Ex.: remédio da vó, parcela 2 de 6"
        multiline
        style={estilos.observacao}
      />

      <Chave
        titulo="Não contar nos totais"
        texto="Use para transferências entre contas da família, que não são gasto de verdade."
        valor={ignorada}
        aoMudar={setIgnorada}
        cor={cores.alerta}
      />

      {erro ? <Aviso texto={erro} /> : null}

      <Botao titulo="Salvar" onPress={salvar} carregando={salvando} />
      {transacao.origem === 'manual' ? (
        <Botao titulo="Apagar lançamento" variante="perigo" onPress={() => void confirmarExclusao()} />
      ) : null}
    </TelaFormulario>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <View style={estilos.linha}>
      <Text style={estilos.linhaRotulo}>{rotulo}</Text>
      <Text style={estilos.linhaValor} numberOfLines={2}>
        {valor}
      </Text>
    </View>
  );
}

function comprovante(transacao: Transacao, conta: Conta | undefined, categoria: Categoria | null): string {
  const saida = transacao.valor < 0;
  return [
    `${NOME_DO_APP} — comprovante`,
    nomeDoPagamento(transacao),
    `${saida ? 'Saída' : 'Entrada'}: ${moeda(transacao.valor)}`,
    `Data: ${dataLonga(transacao.data)}`,
    conta ? `Conta: ${conta.nome}` : null,
    transacao.metodo ? `Forma: ${transacao.metodo}` : null,
    `Categoria: ${categoria?.nome ?? 'Sem categoria'}`,
    transacao.observacao ? `Observação: ${transacao.observacao}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

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
  topo: { alignItems: 'center', gap: espaco.xs, paddingVertical: espaco.sm },
  descricao: { fontSize: fonte.corpo, fontWeight: '600', color: cores.textoSuave, textAlign: 'center' },
  valor: { fontSize: fonte.gigante, fontWeight: '800', fontVariant: ['tabular-nums'] },
  detalhes: { gap: espaco.md },
  linha: { flexDirection: 'row', justifyContent: 'space-between', gap: espaco.lg },
  linhaRotulo: { fontSize: fonte.apoio, color: cores.textoSuave },
  linhaValor: { flex: 1, textAlign: 'right', fontSize: fonte.apoio, fontWeight: '600', color: cores.texto },
  observacao: { minHeight: 88, paddingTop: espaco.md, textAlignVertical: 'top' },
});
