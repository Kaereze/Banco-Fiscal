const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** R$ 1.234,56 — sempre em módulo, o sinal é decidido por quem exibe. */
export function moeda(valor: number): string {
  return Math.abs(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

/**
 * Datas do banco vêm como 'YYYY-MM-DD'. `new Date('2026-01-05')` é
 * interpretado como UTC e no Brasil volta um dia — por isso partimos a
 * string à mão em vez de deixar o Date adivinhar.
 */
export function dataDoBanco(iso: string): Date {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

/** 5 de janeiro */
export function dataLonga(iso: string): string {
  const d = dataDoBanco(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]}`;
}

/** 05/01 */
export function dataCurta(iso: string): string {
  const d = dataDoBanco(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Cabeçalhos da lista: Hoje, Ontem ou "5 de janeiro". */
export function diaRelativo(iso: string): string {
  const alvo = dataDoBanco(iso);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const diferenca = Math.round((hoje.getTime() - alvo.getTime()) / 86_400_000);
  if (diferenca === 0) return 'Hoje';
  if (diferenca === 1) return 'Ontem';
  return dataLonga(iso);
}

/** Chave de mês no formato do banco: 'YYYY-MM-01'. */
export function chaveMes(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-01`;
}

/** 'janeiro de 2026' */
export function mesPorExtenso(chave: string): string {
  const d = dataDoBanco(chave);
  return `${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function primeiraMaiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function mesCurto(chave: string): string {
  return MESES[dataDoBanco(chave).getMonth()].slice(0, 3);
}

/** Primeiro e último dia do mês, em 'YYYY-MM-DD'. */
export function limitesDoMes(chave: string): { inicio: string; fim: string } {
  const d = dataDoBanco(chave);
  const inicio = new Date(d.getFullYear(), d.getMonth(), 1);
  const fim = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { inicio: paraISO(inicio), fim: paraISO(fim) };
}

/** Date -> 'YYYY-MM-DD' no fuso local (sem o desvio do toISOString). */
export function paraISO(data: Date): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(
    data.getDate(),
  ).padStart(2, '0')}`;
}

/** Desloca uma chave de mês para frente ou para trás. */
export function deslocaMes(chave: string, passos: number): string {
  const d = dataDoBanco(chave);
  return chaveMes(new Date(d.getFullYear(), d.getMonth() + passos, 1));
}

/** 'há 5 minutos', 'há 2 horas', 'ontem'... para o carimbo de sincronização. */
export function tempoDesde(iso: string | null): string {
  if (!iso) return 'nunca';
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutos < 1) return 'agora mesmo';
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? 'ontem' : `há ${dias} dias`;
}

/**
 * Le um valor digitado pelo usuario e devolve um numero.
 * Aceita tanto "1.234,56" (padrao brasileiro) quanto "1234.56".
 */
export function numeroDoTexto(texto: string): number {
  const limpo = texto.replace(/[^\d,.-]/g, '');
  if (!limpo) return 0;

  const ultimaVirgula = limpo.lastIndexOf(',');
  const ultimoPonto = limpo.lastIndexOf('.');

  // O separador decimal e o que aparece por ultimo; o outro e de milhar.
  const normalizado =
    ultimaVirgula > ultimoPonto
      ? limpo.replace(/\./g, '').replace(',', '.')
      : limpo.replace(/,/g, '');

  const numero = Number.parseFloat(normalizado);
  return Number.isFinite(numero) ? numero : 0;
}
