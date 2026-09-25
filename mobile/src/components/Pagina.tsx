import { Platform, useWindowDimensions, View, type ViewProps } from 'react-native';

/**
 * No navegador não existe safe area nem inset automático da barra de abas:
 * o conteúdo rola por baixo dela e as últimas linhas ficam encobertas. No
 * celular o react-navigation já reserva esse espaço, então lá some.
 */
export const NO_PC = Platform.OS === 'web';
export const ESPACO_ABAS = NO_PC ? 86 : 0;

/**
 * Largura acima da qual o conteudo para de crescer.
 *
 * Num monitor de 1920px, uma lista de transacoes esticada de ponta a ponta
 * fica ilegivel: o olho perde a linha entre a descricao, na esquerda, e o
 * valor, na direita. 560px mantem a mesma proporcao confortavel do celular.
 */
export const LARGURA_MAXIMA = 560;

/** A partir daqui consideramos que ha espaco de sobra (tablet ou desktop). */
export const LARGURA_AMPLA = 700;

export function useTelaAmpla(): boolean {
  const { width } = useWindowDimensions();
  return width >= LARGURA_AMPLA;
}

/**
 * Centraliza e limita a largura do conteudo. No celular nao muda nada — a
 * tela e mais estreita que o limite, entao o flex continua mandando.
 */
export function Pagina({ style, ...resto }: ViewProps) {
  return (
    <View
      style={[{ width: '100%', maxWidth: LARGURA_MAXIMA, alignSelf: 'center' }, style]}
      {...resto}
    />
  );
}

/**
 * Versao para usar no `contentContainerStyle` de ScrollView e FlatList,
 * onde nao da para embrulhar o conteudo num componente sem quebrar o
 * scroll ou a virtualizacao.
 */
export const conteudoCentralizado = {
  width: '100%',
  maxWidth: LARGURA_MAXIMA,
  alignSelf: 'center',
  paddingBottom: ESPACO_ABAS,
} as const;
