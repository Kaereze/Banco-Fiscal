export const VIEWBOX = '21.5 21.5 150 150';
export const ORIGEM = 21.5;
export const LADO = 150;
export const MOEDA = { cx: 106, cy: 97.5, r: 29.5 } as const;

export type Tinta = 'k' | 'apoio' | 'espessura';

type Ponto = readonly [number, number];

export type Forma = {
  chave: string;
  tinta: Tinta;
  caminho: string;
  comprimento: number;
};

function poligono(chave: string, tinta: Tinta, pontos: Ponto[]): Forma {
  const fechado = [...pontos, pontos[0]];
  const comprimento = fechado
    .slice(1)
    .reduce((soma, [x, y], i) => soma + Math.hypot(x - fechado[i][0], y - fechado[i][1]), 0);
  const caminho = `M${pontos.map(([x, y]) => `${x} ${y}`).join(' L')} Z`;
  return { chave, tinta, caminho, comprimento };
}

function circulo(chave: string, tinta: Tinta, cx: number, cy: number, r: number): Forma {
  return {
    chave,
    tinta,
    caminho: `M${cx} ${cy - r} A${r} ${r} 0 1 1 ${cx} ${cy + r} A${r} ${r} 0 1 1 ${cx} ${cy - r} Z`,
    comprimento: 2 * Math.PI * r,
  };
}

export const FORMAS: Forma[] = [
  circulo('espessura', 'espessura', MOEDA.cx + 1.8, MOEDA.cy - 1.6, MOEDA.r),
  poligono('esquerda', 'apoio', [
    [30.5, 65.8],
    [47.7, 65.8],
    [47.7, 127],
    [30.5, 127],
  ]),
  poligono('haste', 'k', [
    [60.5, 45.5],
    [82.5, 45.5],
    [82.5, 147.5],
    [60.5, 147.5],
  ]),
  poligono('braco-cima', 'k', [
    [82.5, 79],
    [128.5, 45.5],
    [154, 45.5],
    [82.5, 97.5],
  ]),
  poligono('triangulo-cima', 'apoio', [
    [95.5, 45.5],
    [110, 45.5],
    [95.5, 59],
  ]),
  poligono('direita', 'apoio', [
    [155.5, 66],
    [163, 66],
    [163, 127],
    [155.5, 127],
    [132, 96.5],
  ]),
  poligono('triangulo-baixo', 'apoio', [
    [95.5, 133],
    [110, 147.5],
    [95.5, 147.5],
  ]),
  poligono('braco-baixo', 'k', [
    [82.5, 114],
    [128, 147.5],
    [156.5, 147.5],
    [82.5, 95.5],
  ]),
];
