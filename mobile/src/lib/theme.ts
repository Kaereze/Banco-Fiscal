/**
 * Paleta e medidas do app.
 *
 * Tema escuro: fundo quase preto, com verde e azul como únicos acentos.
 * Nada aqui é literal nas telas — elas só consomem estes tokens, então
 * trocar a paleta inteira acontece neste arquivo.
 *
 * O app roda no celular dos meus pais, então a tipografia e os alvos de
 * toque são propositalmente maiores que o padrão: corpo em 17px e nenhum
 * botão com menos de 48px de altura.
 */

export const cores = {
  // Fundos, do mais profundo ao mais elevado
  fundo: '#07090d',
  superficie: '#11151d',
  superficieSuave: '#1a1f2a',

  texto: '#eef2f7',
  textoSuave: '#9aa7b8',
  textoFraco: '#606d80',

  borda: '#212836',

  // Azul — navegação, ações, seleção
  primaria: '#3b82f6',
  primariaSuave: '#13233d',

  // Verde — entradas de dinheiro e confirmações
  entrada: '#22c55e',
  entradaSuave: '#0d2a19',

  // Saídas: vermelho dessaturado, que no escuro não vibra
  saida: '#f87171',
  saidaSuave: '#2d1518',

  alerta: '#fbbf24',
  alertaSuave: '#2e2311',
} as const;

/** Dourado da logo e da moeda da abertura, do mais fundo ao brilho. */
export const ouro = {
  escuro: '#a8740f',
  medio: '#d49a1e',
  base: '#f0bb34',
  claro: '#f9d66b',
  brilho: '#fff1b8',
} as const;

/** Gradiente de apoio para as barras de categoria sem cor própria. */
export const ACENTOS = [
  cores.primaria,
  cores.entrada,
  '#38bdf8',
  '#4ade80',
  '#60a5fa',
  '#2dd4bf',
] as const;

export const espaco = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const raio = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 22,
  pilula: 999,
} as const;

export const fonte = {
  gigante: 34,
  titulo: 24,
  subtitulo: 19,
  corpo: 17,
  apoio: 15,
  mini: 13,
} as const;

/**
 * No escuro a sombra some — o que separa os planos é a borda sutil e a
 * diferença de luminosidade entre fundo e superfície. A elevation fica
 * para o Android, onde ainda ajuda a destacar os cartões.
 */
export const sombra = {
  borderWidth: 1,
  borderColor: cores.borda,
  elevation: 2,
} as const;

export const ALTURA_TOQUE = 48;

/**
 * Cor de texto legível sobre um preenchimento sólido qualquer.
 *
 * Branco sobre o azul funciona; sobre o verde ou o âmbar, não — a razão de
 * contraste cai para perto de 2:1 e o rótulo some. Em vez de decorar exceções
 * por cor, calculamos a luminância e deixamos a matemática decidir.
 */
export function textoSobre(fundo: string): string {
  const hex = fundo.replace('#', '');
  if (hex.length !== 6) return '#ffffff';

  const canal = (inicio: number) => {
    const v = parseInt(hex.slice(inicio, inicio + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };

  // Luminância relativa, fórmula da WCAG.
  const luminancia = 0.2126 * canal(0) + 0.7152 * canal(2) + 0.0722 * canal(4);
  return luminancia > 0.35 ? '#06120a' : '#ffffff';
}
