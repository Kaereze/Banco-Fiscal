export const cores = {
  fundo: '#f7f1e3',
  superficie: '#ffffff',
  superficieSuave: '#efe7d4',

  texto: '#17352b',
  textoSuave: '#56685e',
  textoFraco: '#7d8a82',

  borda: '#e3d9c3',

  primaria: '#2f9a5f',
  primariaSuave: '#dcefe2',
  verdeEscuro: '#174a3a',
  verdeClaro: '#a9ddbd',

  entrada: '#2f9a5f',
  entradaSuave: '#dcefe2',

  saida: '#b84c4c',
  saidaSuave: '#f6e1dc',

  alerta: '#9a6a12',
  alertaSuave: '#f7e8c4',
} as const;

export const ouro = {
  escuro: '#a8740f',
  medio: '#d49a1e',
  base: '#f0bb34',
  claro: '#f9d66b',
  brilho: '#fff1b8',
} as const;

export const espaco = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  secao: 32,
} as const;

export const MARGEM = espaco.xl;
export const MARGEM_FORMULARIO = espaco.xxl;

export const raio = {
  sm: 10,
  campo: 14,
  botao: 16,
  md: 16,
  lg: 20,
  pilula: 999,
} as const;

export const fonte = {
  gigante: 32,
  titulo: 28,
  subtitulo: 20,
  secao: 18,
  corpo: 17,
  apoio: 15,
  mini: 13,
} as const;

export const sombra = {
  shadowColor: cores.texto,
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
  borderWidth: 1,
  borderColor: cores.superficieSuave,
} as const;

export const ALTURA_TOQUE = 48;
export const ALTURA_BOTAO = 56;
export const ALTURA_CAMPO = 54;

export function textoSobre(fundo: string): string {
  const hex = fundo.replace('#', '');
  if (hex.length !== 6) return '#ffffff';

  const canal = (inicio: number) => {
    const v = parseInt(hex.slice(inicio, inicio + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };

  const luminancia = 0.2126 * canal(0) + 0.7152 * canal(2) + 0.0722 * canal(4);
  return luminancia > 0.35 ? cores.texto : '#ffffff';
}
