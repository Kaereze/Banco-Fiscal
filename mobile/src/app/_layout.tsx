import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Abertura, TelaDeEspera } from '@/components/Abertura';
import { ProvedorDados } from '@/lib/dados';
import { ProvedorSessao, useSessao } from '@/lib/sessao';
import { cores, fonte } from '@/lib/theme';

export default function LayoutRaiz() {
  return (
    <SafeAreaProvider>
      <ProvedorSessao>
        <Navegacao />
        <StatusBar style="light" />
      </ProvedorSessao>
    </SafeAreaProvider>
  );
}

function Navegacao() {
  const { sessao, carregando, perfil, aberturaPendente, concluirAbertura } = useSessao();

  // Enquanto não sabemos se há sessão salva, a tela de espera evita o
  // piscar do login para quem já está logado.
  if (carregando) return <TelaDeEspera />;

  return (
    <ProvedorDados>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: cores.fundo },
          headerShadowVisible: false,
          headerTitleStyle: { fontSize: fonte.subtitulo, fontWeight: '700', color: cores.texto },
          headerTintColor: cores.primaria,
          contentStyle: { backgroundColor: cores.fundo },
        }}
      >
        <Stack.Protected guard={Boolean(sessao)}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="transacao/[id]"
            options={{ title: 'Transação', presentation: 'modal' }}
          />
          <Stack.Screen
            name="lancamento"
            options={{ title: 'Novo lançamento', presentation: 'modal' }}
          />
        </Stack.Protected>

        <Stack.Protected guard={!sessao}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>

      {/* Cobre as abas enquanto elas carregam os dados por baixo. */}
      {aberturaPendente && sessao ? (
        <Abertura nome={perfil?.nome} aoConcluir={concluirAbertura} />
      ) : null}
    </ProvedorDados>
  );
}
