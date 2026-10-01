import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LARGURA_MAXIMA } from '@/components/layout/Tela';
import type { NomeIcone } from '@/components/ui';
import { cores } from '@/lib/theme';

const ABAS: { nome: string; titulo: string; icone: NomeIcone; iconeAtivo: NomeIcone }[] = [
  { nome: 'index', titulo: 'Início', icone: 'home-outline', iconeAtivo: 'home' },
  { nome: 'transacoes', titulo: 'Extrato', icone: 'swap-vertical-outline', iconeAtivo: 'swap-vertical' },
  { nome: 'relatorios', titulo: 'Relatórios', icone: 'bar-chart-outline', iconeAtivo: 'bar-chart' },
  { nome: 'contas', titulo: 'Contas', icone: 'wallet-outline', iconeAtivo: 'wallet' },
  { nome: 'pagar', titulo: 'A pagar', icone: 'receipt-outline', iconeAtivo: 'receipt' },
  { nome: 'perfil', titulo: 'Perfil', icone: 'person-outline', iconeAtivo: 'person' },
];

const ALTURA_BARRA = 64;
const RESPIRO_BARRA = 4;

export default function LayoutAbas() {
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: cores.verdeEscuro,
        tabBarInactiveTintColor: cores.textoFraco,
        tabBarStyle: {
          height: ALTURA_BARRA + bottom,
          paddingTop: RESPIRO_BARRA,
          paddingBottom: bottom + RESPIRO_BARRA,
          backgroundColor: cores.superficie,
          borderTopColor: cores.borda,
          width: '100%',
          maxWidth: LARGURA_MAXIMA,
          alignSelf: 'center',
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: cores.fundo },
      }}
    >
      {ABAS.map((aba) => (
        <Tabs.Screen
          key={aba.nome}
          name={aba.nome}
          options={{
            title: aba.titulo,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? aba.iconeAtivo : aba.icone} size={24} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
