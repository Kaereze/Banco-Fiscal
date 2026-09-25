/**
 * Paleta e medidas do app.
 *
 * O app vai rodar no celular dos meus pais, entao a tipografia e os alvos
 * de toque sao propositalmente maiores que o padrao: corpo em 17px e
 * nenhum botao com menos de 48px de altura.
 */

export const cores = {
  fundo: '#f4f6fa',
  superficie: '#ffffff',
  superficieSuave: '#eef2f8',

  texto: '#0f172a',
  textoSuave: '#475569',
  textoFraco: '#94a3b8',

  borda: '#e2e8f0',

  primaria: '#2563eb',
  primariaSuave: '#dbeafe',

  saida: '#dc2626',
  saidaSuave: '#fee2e2',
  entrada: '#15803d',
  entradaSuave: '#dcfce7',

  alerta: '#b45309',
  alertaSuave: '#fef3c7',
} as const;

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

/** Sombra discreta, com o equivalente em elevation para o Android. */
export const sombra = {
  shadowColor: '#0f172a',
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
} as const;

export const ALTURA_TOQUE = 48;
