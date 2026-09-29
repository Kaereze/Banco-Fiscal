import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ProvedorCarregamento } from '@/components/carregamento/Carregamento';
import { Abertura } from '@/components/marca/Abertura';
import { ProvedorDados } from '@/lib/dados';
import { ProvedorSessao, useSessao } from '@/lib/sessao';
import { cores, fonte } from '@/lib/theme';

export default function LayoutRaiz() {
  return (
    <SafeAreaProvider>
      <ProvedorSessao>
        <ProvedorDados>
          <ProvedorCarregamento>
            <Navegacao />
          </ProvedorCarregamento>
        </ProvedorDados>
        <StatusBar style="dark" />
      </ProvedorSessao>
    </SafeAreaProvider>
  );
}

function Navegacao() {
  const { logado, carregando } = useSessao();
  const [aberturaVista, setAberturaVista] = useState(false);
  const concluirAbertura = useCallback(() => setAberturaVista(true), []);

  return (
    <View style={estilos.raiz}>
      {carregando ? null : (
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
      )}

      {aberturaVista ? null : <Abertura aoConcluir={concluirAbertura} />}
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.fundo },
});
