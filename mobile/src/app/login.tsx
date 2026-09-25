import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Aviso, Botao, Campo } from '@/components/ui';
import { conteudoCentralizado } from '@/components/Pagina';
import { useSessao } from '@/lib/sessao';
import { cores, espaco, fonte } from '@/lib/theme';

export default function Login() {
  const { entrar } = useSessao();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function aoEntrar() {
    if (!email.trim() || !senha) {
      setErro('Preencha o e-mail e a senha.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      await entrar(email, senha);
      // A navegação acontece sozinha: o guard do _layout solta as abas
      // assim que a sessão aparece.
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não consegui entrar.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={estilos.tela}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[estilos.conteudo, conteudoCentralizado]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={estilos.marca}>
            <Text style={estilos.emoji}>🏦</Text>
            <Text style={estilos.titulo}>Banco Fiscal</Text>
            <Text style={estilos.subtitulo}>Os gastos da família, num lugar só.</Text>
          </View>

          <View style={estilos.formulario}>
            <Campo
              rotulo="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="seu@email.com"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
            />
            <Campo
              rotulo="Senha"
              value={senha}
              onChangeText={setSenha}
              placeholder="••••••••"
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={aoEntrar}
            />

            {erro ? <Aviso texto={erro} /> : null}

            <Botao titulo="Entrar" onPress={aoEntrar} carregando={enviando} />

            <Text style={estilos.rodape}>
              As contas são criadas por quem administra o app. Se não conseguir entrar, peça para
              criarem a sua.
            </Text>
          </View>
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
    padding: espaco.xl,
    gap: espaco.xxl,
  },
  marca: { alignItems: 'center', gap: espaco.xs },
  emoji: { fontSize: 56 },
  titulo: {
    fontSize: fonte.gigante,
    fontWeight: '800',
    color: cores.texto,
  },
  subtitulo: {
    fontSize: fonte.corpo,
    color: cores.textoSuave,
    textAlign: 'center',
  },
  formulario: { gap: espaco.lg },
  rodape: {
    fontSize: fonte.mini,
    color: cores.textoFraco,
    textAlign: 'center',
    lineHeight: 19,
  },
});
