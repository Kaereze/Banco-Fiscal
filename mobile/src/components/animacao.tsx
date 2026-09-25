import type { ReactNode } from 'react';
import type { ViewProps } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from 'react-native-reanimated';

/**
 * As animações do app moram aqui, e só aqui.
 *
 * A regra: uma tela nunca descreve um movimento. Ela diz o *papel* do
 * elemento — é um bloco que entra, é um item de lista, é um número que
 * mudou — e o movimento vem pronto. Assim, trocar de tela reaproveita a
 * mesma linguagem em vez de reinventá-la, e ajustar o ritmo do app inteiro
 * é mexer em dois números deste arquivo.
 */

/** Quanto dura a entrada de um elemento. */
const DURACAO = 420;

/** Intervalo entre um item e o próximo numa sequência. */
const ESCALONAMENTO = 55;

/**
 * Teto do atraso acumulado. Sem ele, o vigésimo item de uma lista entraria
 * mais de um segundo depois do primeiro — o que lê como travamento, não
 * como animação.
 */
const ATRASO_MAXIMO = 400;

function atrasoDe(indice: number): number {
  return Math.min(indice * ESCALONAMENTO, ATRASO_MAXIMO);
}

// ------------------------------------------------------------
// Blocos
// ------------------------------------------------------------

type EntradaProps = ViewProps & {
  children: ReactNode;
  /** Posição na sequência. Define o atraso; 0 entra primeiro. */
  indice?: number;
};

/**
 * Sobe e aparece. É a entrada padrão de tudo que é bloco: cartões,
 * seções, itens de lista.
 */
export function Sobe({ children, indice = 0, ...resto }: EntradaProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(DURACAO).delay(atrasoDe(indice))}
      {...resto}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Desce e aparece. Para o que vem de cima na hierarquia visual —
 * cabeçalhos, saudações, o seletor de mês.
 */
export function Desce({ children, indice = 0, ...resto }: EntradaProps) {
  return (
    <Animated.View
      entering={FadeInUp.duration(DURACAO).delay(atrasoDe(indice))}
      {...resto}
    >
      {children}
    </Animated.View>
  );
}

/**
 * Só aparece, sem deslocamento. Para conteúdo que troca dentro de um
 * bloco que já está na tela: mudar o mês não deve fazer o cartão saltar
 * de novo, só o número dentro dele deve piscar para o novo valor.
 */
export function Surge({ children, indice = 0, ...resto }: EntradaProps) {
  return (
    <Animated.View entering={FadeIn.duration(DURACAO).delay(atrasoDe(indice))} {...resto}>
      {children}
    </Animated.View>
  );
}

/**
 * Acomoda mudanças de tamanho e posição sem corte.
 *
 * Usar quando a lista filtra, ordena ou perde itens: sem isto, as linhas
 * restantes saltam para a nova posição; com isto, deslizam até ela.
 */
export function Acomoda({ children, ...resto }: ViewProps & { children: ReactNode }) {
  return (
    <Animated.View layout={LinearTransition.duration(260)} {...resto}>
      {children}
    </Animated.View>
  );
}

/**
 * Chave que força a re-entrada de um bloco quando o conteúdo muda.
 *
 * O React reaproveita o componente se só as props mudam, e a animação de
 * entrada não roda de novo. Passar isto como `key` faz o bloco renascer —
 * é o que dá a sensação de "outros dados passando, mesmo desenho" ao
 * trocar de mês ou de filtro.
 */
export function chaveDeEntrada(...partes: (string | number | null | undefined)[]): string {
  return partes.map((p) => p ?? '-').join(':');
}
