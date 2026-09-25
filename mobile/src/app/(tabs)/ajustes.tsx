import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { SeletorMes } from '@/components/SeletorMes';
import { Botao, Cartao, Titulo } from '@/components/ui';
import { conteudoCentralizado } from '@/components/Pagina';
import { resumirMes, useDados } from '@/lib/dados';
import { mesPorExtenso, moeda, numeroDoTexto } from '@/lib/format';
import { useSessao } from '@/lib/sessao';
import { cores, espaco, fonte, raio } from '@/lib/theme';
import type { Categoria } from '@/lib/types';

export default function Ajustes() {
  const { sessao, perfil, sair } = useSessao();
  const { categorias, transacoes, orcamentos, mes, definirOrcamento } = useDados();

  const resumo = resumirMes(transacoes, categorias, orcamentos);
  const gastoPorCategoria = new Map(
    resumo.porCategoria.map((f) => [f.categoria?.id ?? null, f.total]),
  );

  const categoriasDeGasto = categorias.filter((c) => c.tipo === 'gasto');
  const totalOrcado = orcamentos.reduce((soma, o) => soma + Number(o.limite), 0);

  function confirmarSaida() {
    Alert.alert('Sair do app', 'Você precisará digitar o e-mail e a senha de novo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => void sair() },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={[estilos.conteudo, conteudoCentralizado]}>
      {/* ---------- Quem está usando ---------- */}
      <Cartao style={estilos.perfil}>
        <View style={[estilos.avatar, { backgroundColor: perfil?.cor ?? cores.primaria }]}>
          <Text style={estilos.avatarTexto}>
            {(perfil?.nome ?? sessao?.user.email ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={estilos.perfilNome}>{perfil?.nome ?? 'Sem perfil'}</Text>
          <Text style={estilos.perfilEmail} numberOfLines={1}>
            {sessao?.user.email}
          </Text>
        </View>
      </Cartao>

      {!perfil ? (
        <Cartao style={{ gap: espaco.sm }}>
          <Text style={estilos.aviso}>
            Esta conta ainda não faz parte da família, então o app não enxerga nenhum dado. Peça
            para quem administra rodar o comando de cadastro com este e-mail.
          </Text>
        </Cartao>
      ) : null}

      {/* ---------- Orçamentos ---------- */}
      <View style={estilos.secao}>
        <Titulo>Orçamento do mês</Titulo>
        <SeletorMes />
        <Text style={estilos.explicacao}>
          Defina quanto a família pretende gastar em cada categoria em {mesPorExtenso(mes)}. Deixe
          em branco ou zero para não acompanhar. As barras do Resumo passam a medir esse limite.
        </Text>

        <Cartao style={{ gap: espaco.lg }}>
          {categoriasDeGasto.map((categoria) => (
            <LinhaOrcamento
              key={categoria.id}
              categoria={categoria}
              gasto={gastoPorCategoria.get(categoria.id) ?? 0}
              limite={orcamentos.find((o) => o.categoria_id === categoria.id)?.limite ?? null}
              onSalvar={(valor) => definirOrcamento(categoria.id, valor)}
            />
          ))}
        </Cartao>

        {totalOrcado > 0 ? (
          <Cartao style={estilos.totalOrcado}>
            <Text style={estilos.totalRotulo}>Orçamento total do mês</Text>
            <Text style={estilos.totalValor}>{moeda(totalOrcado)}</Text>
          </Cartao>
        ) : null}
      </View>

      {/* ---------- Como funciona ---------- */}
      <View style={estilos.secao}>
        <Titulo>Como os dados chegam aqui</Titulo>
        <Cartao style={{ gap: espaco.md }}>
          <Passo
            icone="link"
            titulo="Pluggy"
            texto="Seus bancos ficam conectados no Meu Pluggy, fora do app."
          />
          <Passo
            icone="server"
            titulo="Servidor"
            texto="Uma função no Supabase guarda as chaves e busca os extratos. O app nunca vê as credenciais do banco."
          />
          <Passo
            icone="phone-portrait"
            titulo="Este app"
            texto="Lê só o que já está organizado no banco de dados da família."
          />
        </Cartao>
      </View>

      <Botao titulo="Sair do app" variante="perigo" onPress={confirmarSaida} />
    </ScrollView>
  );
}

// ------------------------------------------------------------
function LinhaOrcamento({
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

  // Trocar de mês troca os orçamentos por baixo: o campo precisa acompanhar.
  useEffect(() => {
    setTexto(limite ? String(limite).replace('.', ',') : '');
  }, [limite]);

  async function salvar() {
    const valor = numeroDoTexto(texto);
    if (valor === (limite ?? 0)) return;
    try {
      await onSalvar(valor);
    } catch (e) {
      Alert.alert('Não consegui salvar', e instanceof Error ? e.message : 'Tente de novo.');
    }
  }

  const estourou = limite !== null && limite > 0 && gasto > limite;

  return (
    <View style={estilos.linhaOrcamento}>
      <Text style={estilos.orcamentoEmoji}>{categoria.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={estilos.orcamentoNome}>{categoria.nome}</Text>
        <Text style={[estilos.orcamentoGasto, estourou && { color: cores.saida, fontWeight: '700' }]}>
          gasto: {moeda(gasto)}
        </Text>
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
        style={estilos.campoOrcamento}
        accessibilityLabel={`Limite mensal para ${categoria.nome}`}
      />
    </View>
  );
}

function Passo({
  icone,
  titulo,
  texto,
}: {
  icone: keyof typeof Ionicons.glyphMap;
  titulo: string;
  texto: string;
}) {
  return (
    <View style={estilos.passo}>
      <View style={estilos.passoIcone}>
        <Ionicons name={icone} size={18} color={cores.primaria} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={estilos.passoTitulo}>{titulo}</Text>
        <Text style={estilos.passoTexto}>{texto}</Text>
      </View>
    </View>
  );
}

const estilos = StyleSheet.create({
  conteudo: {
    padding: espaco.lg,
    gap: espaco.lg,
    paddingBottom: espaco.xxl,
  },
  perfil: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: raio.pilula,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { fontSize: fonte.titulo, fontWeight: '800', color: '#ffffff' },
  perfilNome: { fontSize: fonte.subtitulo, fontWeight: '700', color: cores.texto },
  perfilEmail: { fontSize: fonte.apoio, color: cores.textoFraco },
  aviso: { fontSize: fonte.apoio, color: cores.alerta, lineHeight: 22, fontWeight: '600' },
  secao: { gap: espaco.md },
  explicacao: { fontSize: fonte.apoio, color: cores.textoSuave, lineHeight: 22 },
  linhaOrcamento: { flexDirection: 'row', alignItems: 'center', gap: espaco.md },
  orcamentoEmoji: { fontSize: 20 },
  orcamentoNome: { fontSize: fonte.corpo, fontWeight: '600', color: cores.texto },
  orcamentoGasto: { fontSize: fonte.mini, color: cores.textoFraco },
  campoOrcamento: {
    width: 108,
    minHeight: 44,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: raio.md,
    paddingHorizontal: espaco.sm,
    textAlign: 'right',
    fontSize: fonte.corpo,
    fontWeight: '600',
    color: cores.texto,
    backgroundColor: cores.superficie,
  },
  totalOrcado: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  totalRotulo: { fontSize: fonte.apoio, color: cores.textoSuave, fontWeight: '600' },
  totalValor: { fontSize: fonte.subtitulo, fontWeight: '700', color: cores.texto },
  passo: { flexDirection: 'row', gap: espaco.md, alignItems: 'flex-start' },
  passoIcone: {
    width: 34,
    height: 34,
    borderRadius: raio.sm,
    backgroundColor: cores.primariaSuave,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passoTitulo: { fontSize: fonte.apoio, fontWeight: '700', color: cores.texto },
  passoTexto: { fontSize: fonte.mini, color: cores.textoSuave, lineHeight: 19 },
});
