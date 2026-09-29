import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Sobe } from '@/components/animacao';
import { useCarregamento } from '@/components/carregamento/Carregamento';
import { conteudoCentralizado } from '@/components/layout/Tela';
import { Logo, NOME_DO_APP } from '@/components/marca/Logo';
import { Botao, Campo, type Resultado } from '@/components/ui';
import { useSessao } from '@/lib/sessao';
import { cores, espaco, fonte, MARGEM_FORMULARIO } from '@/lib/theme';

const ESPERA_MAXIMA_POR_ETAPA = 3000;
const PAUSA_NO_RESULTADO = 900;

type Etapa = 'formulario' | 'enviando' | 'campos' | 'botao' | 'pausa';

const ETAPAS_DO_RESULTADO: Etapa[] = ['campos', 'botao', 'pausa'];

export default function Login() {
  const { entrar, concluirLogin } = useSessao();
  const { executar } = useCarregamento();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [etapa, setEtapa] = useState<Etapa>('formulario');
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const campoSenha = useRef<TextInput>(null);

  const finalizar = useCallback(() => {
    if (resultado === 'sucesso') concluirLogin();
    else setEtapa('formulario');
  }, [resultado, concluirLogin]);

  const camposMostrados = useCallback(() => setEtapa('botao'), []);
  const botaoMostrado = useCallback(() => setEtapa('pausa'), []);

  useEffect(() => {
    if (etapa !== 'pausa') return;
    const pausa = setTimeout(finalizar, PAUSA_NO_RESULTADO);
    return () => clearTimeout(pausa);
  }, [etapa, finalizar]);

  useEffect(() => {
    if (!ETAPAS_DO_RESULTADO.includes(etapa)) return;
    const limite = setTimeout(finalizar, ESPERA_MAXIMA_POR_ETAPA);
    return () => clearTimeout(limite);
  }, [etapa, finalizar]);

  function editar(atualizar: (valor: string) => void) {
    return (valor: string) => {
      atualizar(valor);
      if (etapa === 'formulario' && resultado === 'erro') setResultado(null);
    };
  }

  function mostrar(novo: Resultado, mensagem?: string) {
    if (mensagem) AccessibilityInfo.announceForAccessibility(mensagem);
    setResultado(novo);
    setEtapa('campos');
  }

  async function aoEntrar() {
    if (etapa !== 'formulario') return;
    Keyboard.dismiss();
    setResultado(null);
    if (!email.trim() || !senha) {
      mostrar('erro', 'Preencha o e-mail e a senha.');
      return;
    }
    setEtapa('enviando');
    try {
      await executar(() => entrar(email, senha), 'Verificando seu acesso…');
      mostrar('sucesso');
    } catch (e) {
      mostrar('erro', e instanceof Error ? e.message : 'Não consegui entrar.');
    }
  }

  const resultadoDosCampos = etapa === 'enviando' || !resultado ? undefined : resultado;
  const resultadoDoBotao = (etapa === 'botao' || etapa === 'pausa') && resultado ? resultado : undefined;

  function esqueciASenha() {
    Alert.alert(
      'Esqueceu a senha?',
      'As contas são criadas por quem administra o app. Peça para redefinirem a sua senha.',
    );
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <KeyboardAvoidingView style={estilos.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[conteudoCentralizado, estilos.conteudo]}
          keyboardShouldPersistTaps="handled"
        >
          <Sobe indice={0} style={estilos.marca}>
            <Logo tamanho={88} />
            <Text style={estilos.titulo} accessibilityRole="header">
              Bem-vindo ao{'\n'}
              {NOME_DO_APP}
            </Text>
            <Text style={estilos.subtitulo}>As finanças da família, num lugar só.</Text>
          </Sobe>

          <Sobe indice={1} style={estilos.formulario}>
            <Campo
              icone="mail-outline"
              value={email}
              onChangeText={editar(setEmail)}
              placeholder="E-mail"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => campoSenha.current?.focus()}
              resultado={resultadoDosCampos}
              aoMostrarResultado={camposMostrados}
            />
            <Campo
              ref={campoSenha}
              icone="lock-closed-outline"
              value={senha}
              onChangeText={editar(setSenha)}
              placeholder="Senha"
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
              autoComplete="password"
              returnKeyType="go"
              onSubmitEditing={aoEntrar}
              resultado={resultadoDosCampos}
            />

            <Botao
              titulo="Entrar"
              onPress={aoEntrar}
              carregando={etapa === 'enviando'}
              desabilitado={etapa === 'campos'}
              resultado={resultadoDoBotao}
              aoMostrarResultado={botaoMostrado}
            />

            <Pressable onPress={esqueciASenha} hitSlop={12} accessibilityRole="button" style={estilos.link}>
              <Text style={estilos.linkTexto}>Esqueci minha senha</Text>
            </Pressable>
          </Sobe>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudo: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: MARGEM_FORMULARIO,
    paddingVertical: espaco.secao,
    gap: espaco.secao,
  },
  marca: { alignItems: 'center', gap: espaco.md },
  titulo: {
    fontSize: fonte.titulo,
    lineHeight: 34,
    fontWeight: '800',
    color: cores.verdeEscuro,
    textAlign: 'center',
  },
  subtitulo: { fontSize: fonte.corpo, color: cores.textoSuave, textAlign: 'center' },
  formulario: { gap: espaco.md },
  link: { alignSelf: 'center', paddingVertical: espaco.sm },
  linkTexto: { fontSize: fonte.apoio, fontWeight: '700', color: cores.primaria },
});
