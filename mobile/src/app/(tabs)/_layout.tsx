import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { LARGURA_MAXIMA, NO_PC } from '@/components/Pagina';
import { cores, fonte } from '@/lib/theme';

export default function LayoutAbas() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: cores.fundo },
        headerShadowVisible: false,
        headerTitleStyle: { fontSize: fonte.titulo, fontWeight: '800', color: cores.texto },
        // No PC o cabeçalho ocupa a tela inteira enquanto o conteúdo fica
        // centralizado; com o título à esquerda os dois se desalinham. No
        // celular a largura é a mesma e o alinhamento à esquerda continua.
        headerTitleAlign: NO_PC ? 'center' : 'left',
        tabBarActiveTintColor: cores.primaria,
        tabBarInactiveTintColor: cores.textoFraco,
        // Numa tela larga, 4 abas espalhadas por 1920px ficam longe demais
        // umas das outras. O limite acompanha o do conteudo; no celular a
        // tela e mais estreita que ele e nada muda.
        tabBarStyle: {
          backgroundColor: cores.superficie,
          borderTopColor: cores.borda,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
          width: '100%',
          maxWidth: LARGURA_MAXIMA,
          alignSelf: 'center',
        },
        tabBarLabelStyle: { fontSize: fonte.mini, fontWeight: '600' },
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="resumo"
        options={{
          title: 'Resumo',
          tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="transacoes"
        options={{
          title: 'Gastos',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="contas"
        options={{
          title: 'Contas',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
