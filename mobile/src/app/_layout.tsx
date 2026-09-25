import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

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
  const { sessao, carregando } = useSessao();

  // Enquanto não sabemos se há sessão salva, uma tela em branco evita o
  // piscar do login para quem já está logado.
  if (carregando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo }}>
        <ActivityIndicator size="large" color={cores.primaria} />
      </View>
    );
  }

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
    </ProvedorDados>
  );
}
