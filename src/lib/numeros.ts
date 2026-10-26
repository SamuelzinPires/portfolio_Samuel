// Formatação de números das peças-assinatura. Tudo no build, em pt-BR: "135.080", "24,93".
const inteiro = new Intl.NumberFormat('pt-BR');

export const formatarNumero = (n: number) => inteiro.format(n);

export const formatarPercentual = (valor: number, casas = 2) =>
  new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(valor);

/** Largura de barra (0–100) com piso: uma violação rara continua visível, com cerca de 2 px. */
export const larguraDaBarra = (valor: number, piso = 0.6) =>
  valor <= 0 ? 0 : Math.round(Math.min(100, Math.max(valor, piso)) * 100) / 100;
