import { useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cores, espaco, MARGEM, MARGEM_FORMULARIO } from '@/lib/theme';

export const NO_PC = Platform.OS === 'web';
export const ESPACO_ABAS = NO_PC ? 64 : 0;
export const LARGURA_MAXIMA = 560;

export const conteudoCentralizado = {
  width: '100%',
  maxWidth: LARGURA_MAXIMA,
  alignSelf: 'center',
  paddingBottom: ESPACO_ABAS,
} as const;

export function useConteudoDeAba() {
  const { top } = useSafeAreaInsets();
  return [
    conteudoCentralizado,
    estilos.conteudoAba,
    { paddingTop: top + espaco.sm, paddingBottom: espaco.secao + ESPACO_ABAS },
  ];
}

export const conteudoDeFormulario = [
  conteudoCentralizado,
  {
    paddingHorizontal: MARGEM_FORMULARIO,
    paddingTop: espaco.lg,
    paddingBottom: espaco.secao,
    gap: espaco.xl,
  },
];

export function TelaAba({
  children,
  aoAtualizar,
}: {
  children: ReactNode;
  aoAtualizar?: () => Promise<void>;
}) {
  const conteudo = useConteudoDeAba();
  const atualizacao = useAtualizacao(aoAtualizar);

  return (
    <ScrollView
      style={estilos.tela}
      contentContainerStyle={conteudo}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        aoAtualizar ? (
          <RefreshControl
            refreshing={atualizacao.atualizando}
            onRefresh={atualizacao.atualizar}
            tintColor={cores.primaria}
            colors={[cores.primaria]}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  );
}

export function TelaFormulario({ children }: { children: ReactNode }) {
  return (
    <KeyboardAvoidingView
      style={estilos.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={conteudoDeFormulario} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function useAtualizacao(aoAtualizar?: () => Promise<void>) {
  const [atualizando, setAtualizando] = useState(false);

  async function atualizar() {
    if (!aoAtualizar) return;
    setAtualizando(true);
    try {
      await aoAtualizar();
    } finally {
      setAtualizando(false);
    }
  }

  return { atualizando, atualizar };
}

const estilos = StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.fundo },
  conteudoAba: { paddingHorizontal: MARGEM, gap: espaco.xl },
});
