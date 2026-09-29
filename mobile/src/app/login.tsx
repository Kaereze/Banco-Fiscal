import { useRef, useState } from 'react';
import {
  Alert,
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
import { conteudoCentralizado } from '@/components/layout/Tela';
import { Logo, NOME_DO_APP } from '@/components/marca/Logo';
import { Aviso, Botao, Campo } from '@/components/ui';
import { useSessao } from '@/lib/sessao';
import { cores, espaco, fonte, MARGEM_FORMULARIO } from '@/lib/theme';

export default function Login() {
  const { entrar } = useSessao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const campoSenha = useRef<TextInput>(null);

  async function aoEntrar() {
    if (!email.trim() || !senha) {
      setErro('Preencha o e-mail e a senha.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await entrar(email, senha);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui entrar.');
    } finally {
      setEnviando(false);
    }
  }

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
              onChangeText={setEmail}
              placeholder="E-mail"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="next"
              onSubmitEditing={() => campoSenha.current?.focus()}
            />
            <Campo
              ref={campoSenha}
              icone="lock-closed-outline"
              value={senha}
              onChangeText={setSenha}
              placeholder="Senha"
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
              autoComplete="password"
              returnKeyType="go"
              onSubmitEditing={aoEntrar}
            />

            {erro ? <Aviso texto={erro} /> : null}

            <Botao titulo="Entrar" onPress={aoEntrar} carregando={enviando} />

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
