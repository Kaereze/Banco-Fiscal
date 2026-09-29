import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Abertura, TelaDeEspera } from '@/components/marca/Abertura';
import { ProvedorDados } from '@/lib/dados';
import { ProvedorSessao, useSessao } from '@/lib/sessao';
import { cores, fonte } from '@/lib/theme';

export default function LayoutRaiz() {
  return (
    <SafeAreaProvider>
      <ProvedorSessao>
        <Navegacao />
        <StatusBar style="dark" />
      </ProvedorSessao>
    </SafeAreaProvider>
  );
}

function Navegacao() {
  const { logado, carregando, perfil, aberturaPendente, concluirAbertura } = useSessao();

  if (carregando) return <TelaDeEspera />;

  return (
    <ProvedorDados>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: cores.fundo },
          headerShadowVisible: false,
          headerTitleStyle: { fontSize: fonte.secao, fontWeight: '700', color: cores.verdeEscuro },
          headerTintColor: cores.verdeEscuro,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: cores.fundo },
        }}
      >
        <Stack.Protected guard={logado}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="transacao/[id]" options={{ title: 'Detalhes', presentation: 'modal' }} />
          <Stack.Screen name="lancamento" options={{ title: 'Novo lançamento', presentation: 'modal' }} />
          <Stack.Screen name="orcamento" options={{ title: 'Orçamento do mês' }} />
          <Stack.Screen name="sobre" options={{ title: 'Como os dados chegam' }} />
        </Stack.Protected>

        <Stack.Protected guard={!logado}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>

      {aberturaPendente && logado ? (
        <Abertura nome={perfil?.nome} aoConcluir={concluirAbertura} />
      ) : null}
    </ProvedorDados>
  );
}
