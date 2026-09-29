export const VIEWBOX_TRACO = '40 28 132 132';

export type Traco = { chave: string; caminho: string; comprimento: number };

type Ponto = { x: number; y: number };

const K_CIRCULO = 0.5523;

const arredondar = (n: number) => Math.round(n * 100) / 100;

function cubica(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function comprimentoDe(caminho: string): number {
  const partes = caminho.match(/[MLHVCZ][^MLHVCZ]*/g) ?? [];
  let atual: Ponto = { x: 0, y: 0 };
  let inicio: Ponto = { x: 0, y: 0 };
  let total = 0;

  for (const parte of partes) {
    const comando = parte[0];
    const n = parte.slice(1).trim().split(/[\s,]+/).filter(Boolean).map(Number);
    if (comando === 'M') {
      atual = { x: n[0], y: n[1] };
      inicio = atual;
    } else if (comando === 'L' || comando === 'H' || comando === 'V' || comando === 'Z') {
      const proximo =
        comando === 'L'
          ? { x: n[0], y: n[1] }
          : comando === 'H'
            ? { x: n[0], y: atual.y }
            : comando === 'V'
              ? { x: atual.x, y: n[0] }
              : inicio;
      total += Math.hypot(proximo.x - atual.x, proximo.y - atual.y);
      atual = proximo;
    } else if (comando === 'C') {
      let anterior = atual;
      for (let i = 1; i <= 24; i++) {
        const t = i / 24;
        const ponto = {
          x: cubica(atual.x, n[0], n[2], n[4], t),
          y: cubica(atual.y, n[1], n[3], n[5], t),
        };
        total += Math.hypot(ponto.x - anterior.x, ponto.y - anterior.y);
        anterior = ponto;
      }
      atual = { x: n[4], y: n[5] };
    }
  }
  return total;
}

function pilula(x1: number, x2: number, y1: number, y2: number): string {
  const r = (x2 - x1) / 2;
  const k = r * K_CIRCULO;
  const cx = x1 + r;
  return [
    `M${cx} ${y1}`,
    `C${arredondar(cx - k)} ${y1} ${x1} ${arredondar(y1 + r - k)} ${x1} ${y1 + r}`,
    `L${x1} ${y2 - r}`,
    `C${x1} ${arredondar(y2 - r + k)} ${arredondar(cx - k)} ${y2} ${cx} ${y2}`,
    `C${arredondar(cx + k)} ${y2} ${x2} ${arredondar(y2 - r + k)} ${x2} ${y2 - r}`,
    `L${x2} ${y1 + r}`,
    `C${x2} ${arredondar(y1 + r - k)} ${arredondar(cx + k)} ${y1} ${cx} ${y1} Z`,
  ].join(' ');
}

function bolinha({ x, y }: Ponto, r: number): string {
  const k = r * K_CIRCULO;
  const [a, b, c, d] = [x - r, x + r, y - r, y + r].map(arredondar);
  const [xa, xb, ya, yb] = [x - k, x + k, y - k, y + k].map(arredondar);
  const [cx, cy] = [arredondar(x), arredondar(y)];
  return `M${cx} ${c} C${xb} ${c} ${b} ${ya} ${b} ${cy} C${b} ${yb} ${xb} ${d} ${cx} ${d} C${xa} ${d} ${a} ${yb} ${a} ${cy} C${a} ${ya} ${xa} ${c} ${cx} ${c} Z`;
}

function contasDaMoeda(): string {
  const [x1, x2, y1, y2, passo] = [62.8, 87.8, 54, 148, 2.3];
  const r = (x2 - x1) / 2;
  const cx = x1 + r;
  const pontos: Ponto[] = [];
  for (let y = y1 + r; y <= y2 - r; y += passo) pontos.push({ x: x1, y });
  for (let a = Math.PI; a <= 2 * Math.PI + 0.001; a += passo / r) {
    pontos.push({ x: cx + r * Math.cos(a), y: y2 - r - r * Math.sin(a) });
  }
  for (let y = y2 - r; y >= y1 + r; y -= passo) if (y <= 80 || y >= 125) pontos.push({ x: x2, y });
  for (let a = 0; a <= Math.PI + 0.001; a += passo / r) {
    pontos.push({ x: cx + r * Math.cos(a), y: y1 + r - r * Math.sin(a) });
  }
  return pontos.map((p) => bolinha(p, 0.75)).join(' ');
}

const BORDA_CIMA = { x: [72, 58, 49, 49], y: [50, 50, 62, 80] } as const;
const BORDA_BAIXO = { x: [49, 49, 58, 71], y: [128, 143, 152, 152] } as const;

function bordaDaMoedaEm(y: number): number {
  if (y >= 80 && y <= 128) return 49;
  const curva = y < 80 ? BORDA_CIMA : BORDA_BAIXO;
  let melhor = 0;
  for (let t = 0; t <= 1; t += 0.002) {
    const distancia = Math.abs(cubica(curva.y[0], curva.y[1], curva.y[2], curva.y[3], t) - y);
    const melhorDistancia = Math.abs(cubica(curva.y[0], curva.y[1], curva.y[2], curva.y[3], melhor) - y);
    if (distancia < melhorDistancia) melhor = t;
  }
  return cubica(curva.x[0], curva.x[1], curva.x[2], curva.x[3], melhor);
}

function frisosDaMoeda(): string {
  const frisos: string[] = [];
  for (let y = 56; y <= 148; y += 2.2) {
    const inicio = bordaDaMoedaEm(y) + 0.9;
    if (inicio < 57.5) frisos.push(`M${arredondar(inicio)} ${arredondar(y)} H58.5`);
  }
  return frisos.join(' ');
}

type Modo = 'tracar' | 'surgir';

const CAMINHOS: [string, Modo, string][] = [
  ['borda', 'tracar', 'M72 50 C58 50 49 62 49 80 L49 128 C49 143 58 152 71 152'],
  ['face', 'tracar', 'M91 87 L91 65 C91 56 84 50 75 50 C66 50 59 57 59 66 L59 136 C59 146 66 152 75 152 C84 152 91 146 91 137 L91 119'],
  ['frisos', 'surgir', frisosDaMoeda()],
  ['contas', 'surgir', contasDaMoeda()],
  ['miolo', 'tracar', pilula(64.5, 84, 58.5, 144)],
  ['seta-miolo', 'tracar', 'M69 133 V73 M68 72.5 L72.5 66.5 L77 72.5 M72.5 67.5 V138 M71 138 H76 V73 M80 63 V141'],
  ['k-fora', 'tracar', 'M88 87 L122 51 L160 51 L117 99 L165 149 L125 149 L94 118 L80 118'],
  ['k-meio', 'tracar', 'M80 103 L124.5 56.5 L150 56.5 L107.5 99.5 L154 143.5 L128 143.5 L98 112.5 L80 112.5'],
  ['k-dentro', 'tracar', 'M80 108 L128 62 L138 62 L98.5 100 L141 138 L132.5 138 L101.5 107.5 Z'],
  ['seta-grande', 'tracar', 'M95 70 V47 H89 L99.5 35.5 L110 47 H103.5 V66 M99.5 40 V60'],
  ['seta-pequena', 'tracar', 'M109 60 V51.5 M105.2 55.5 L109 51.2 L112.8 55.5'],
];

const COMPRIMENTO_DO_SURGIR = 60;

function subcaminhos(caminho: string): string[] {
  return caminho.split(/(?=M)/).map((parte) => parte.trim()).filter(Boolean);
}

export type Etapa = Traco & { modo: Modo; inicio: number; fim: number };

type Parte = Traco & { modo: Modo };

const partes: Parte[] = CAMINHOS.flatMap(([chave, modo, caminho]): Parte[] =>
  modo === 'surgir'
    ? [{ chave, modo, caminho, comprimento: COMPRIMENTO_DO_SURGIR }]
    : subcaminhos(caminho).map((parte, i) => ({
        chave: `${chave}-${i}`,
        modo,
        caminho: parte,
        comprimento: comprimentoDe(parte),
      })),
);

const total = partes.reduce((soma, parte) => soma + parte.comprimento, 0);

export const ETAPAS_DO_DESENHO: Etapa[] = partes.reduce<Etapa[]>((etapas, parte) => {
  const inicio = etapas.length ? etapas[etapas.length - 1].fim : 0;
  return [...etapas, { ...parte, inicio, fim: inicio + parte.comprimento / total }];
}, []);
