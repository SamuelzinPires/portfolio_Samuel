// Geometria da tela de projetos (P5 · linha curva). Função pura: entram os projetos (só `id` e `inicio` importam) e
// saem os pontos, o caminho da curva, o da cauda tracejada e as marcas de ano, nos dois layouts (horizontal e vertical).
// Roda no build (CurvaProjetos.astro) e nos testes (scripts/curva.test.mjs), sem Astro e sem DOM.
//
// Projeto novo = só um .md: ele vira um ponto a mais à direita (horizontal) ou embaixo (vertical), e nenhum dos
// anteriores se move, porque a altura de cada ponto vem da POSIÇÃO dele (um padrão fixo) e não dos dados.
// As coordenadas do protótipo em Gerenciamento_Projeto/previa-lista-projetos não são usadas: tudo aqui é calculado.

export interface EntradaCurva {
  id: string;
  inicio: Date;
}

type Ponto = readonly [number, number];

// ── Regras de cálculo (documentadas na /design, seção 12) ───────────────────────────────────────

/** Horizontal. Unidade de referência: 1 unidade = 1 px numa área de 1312 px (o conteúdo em 1440). */
export const HORIZONTAL = {
  altura: 420,
  /** x do 1º ponto: sobra à esquerda para o nome do mais antigo e a entrada da linha. */
  margemEsquerda: 150,
  /** Sobra à direita do último ponto: é por onde a cauda tracejada sobe até "hoje". */
  margemDireita: 150,
  /** Distância entre vizinhos = base + coeficiente × √dias entre os `inicio`. A raiz amortece: 4 dias → 133, 55 dias → 155. */
  base: 125,
  coeficiente: 4,
  /** Alturas por posição (0 = o mais antigo). Pares são cristas (nome em cima), ímpares são vales (nome embaixo). Do 9º em diante o padrão se repete. */
  cristas: [150, 118, 172, 125],
  vales: [268, 318, 290, 300],
  /** Entrada: a linha começa no meio e faz um vale pequeno antes do 1º ponto. */
  entradaY: 214,
  valeEntradaY: 236,
  valeEntradaX: 0.39, // fração da margem esquerda
  /** Cauda: sobe (ou desce) até "hoje" e termina nesta altura. */
  fimY: 212,
  /** Mais que isto sem projeto = intervalo longo: ganha um ponto no meio, a meia altura, para a dobra ficar mais lenta. */
  intervaloLongoDias: 45,
  /**
   * Escala mínima (largura real ÷ largura de referência). Com menos que isto os nomes do mesmo lado se tocam: a área para de
   * encolher e passa a rolar para o lado. Medido com os 8 projetos atuais (ver a tabela de larguras da /design).
   */
  escalaMinima: 0.91,
} as const;

/** Vertical (celular). Mais recente em cima; unidades = px. */
export const VERTICAL = {
  /** Largura da faixa da curva: os nomes começam depois dela. */
  largura: 84,
  /**
   * Distância da margem esquerda de cada ponto, contada do mais ANTIGO (como a altura no horizontal), para um projeto novo, que
   * entra em cima, não mexer nos anteriores; repete a partir do 9º. Com 8 projetos, lido de cima para baixo, dá o padrão do Paper:
   * 22, 58, 30, 64, 18, 50, 26, 56.
   */
  padraoX: [56, 26, 50, 18, 64, 30, 58, 22],
  /** x onde a cauda termina (em "hoje"), sempre dentro do limite. */
  caudaX: 52,
  /** A curva nunca passa deste x (os pontos têm no máximo 64; os pontos de controle são presos aqui). */
  xMaximo: 64,
  xMinimo: 4,
  /** Espaço entre linhas = clamp(88 + 4 × √dias, 96, 118). */
  espacoBase: 88,
  espacoCoeficiente: 4,
  espacoMinimo: 96,
  espacoMaximo: 118,
  /** Do topo da área ao ponto mais recente (cabe a cauda e o "hoje"). */
  topo: 76,
  /** Do ponto mais antigo ao pé da área. */
  pe: 84,
  /** Distância entre o topo de uma linha da lista e o ponto dela: o ponto fica na altura da linha do título (6 px de respiro + meia linha de 24). */
  ancora: 18,
} as const;

/**
 * Um título com mais caracteres que isto não cabe numa linha na tela de projetos. Medido nos 8 atuais com Inter Tight 700 a 20 px:
 * o maior tem 25 caracteres e 244 px (~9,8 px por caractere). No celular de 390 px o nome tem 266 px; 26 caracteres ficam com folga.
 */
export const LIMITE_TITULO = 26;

// ── Resultado ───────────────────────────────────────────────────────────────────────────────────

export interface PontoHorizontal {
  id: string;
  x: number;
  y: number;
  /** x em % da largura de referência: no SVG, a posição horizontal é sempre em %, para a área poder esticar. */
  xPct: number;
  lado: 'acima' | 'abaixo';
  recente: boolean;
  /** 0 (mais antigo) a 1 (mais recente): a borda do ponto vai do apagado ao azul. */
  idade: number;
}

export interface MarcaHorizontal {
  texto: string;
  /** "ano" é a virada de ano na linha (com um tique); "inicio" e "hoje" são as pontas. */
  tipo: 'inicio' | 'ano' | 'hoje';
  xPct: number;
  y: number;
  /** Deslocamento em px do texto em relação ao ponto da linha. */
  dx: number;
  dy: number;
  ancora: 'start' | 'end';
}

export interface CurvaHorizontal {
  largura: number;
  altura: number;
  /** Largura mínima em px: abaixo dela a área rola para o lado em vez de apertar os nomes. */
  larguraMinima: number;
  caminho: string;
  cauda: string;
  /** Do mais antigo (esquerda) ao mais recente (direita). */
  pontos: PontoHorizontal[];
  marcas: MarcaHorizontal[];
}

export interface PontoVertical {
  id: string;
  x: number;
  y: number;
  recente: boolean;
  idade: number;
  /** Altura da linha da lista (do topo dela ao topo da próxima): o espaço entre linhas. */
  espaco: number;
}

export interface CurvaVertical {
  largura: number;
  altura: number;
  /** Respiro antes da 1ª linha da lista (do topo da área ao topo da linha do mais recente). */
  respiro: number;
  caminho: string;
  cauda: string;
  /** Do mais recente (em cima) ao mais antigo (embaixo). */
  pontos: PontoVertical[];
  hoje: { x: number; y: number };
}

export interface Curva {
  horizontal: CurvaHorizontal;
  vertical: CurvaVertical;
}

// ── Geometria ───────────────────────────────────────────────────────────────────────────────────

const DIA_MS = 86_400_000;
const arredondar = (n: number) => Math.round(n * 100) / 100;
const diasEntre = (a: Date, b: Date) => Math.max(0, Math.round((b.getTime() - a.getTime()) / DIA_MS));
const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

interface Segmento {
  p1: Ponto;
  c1: Ponto;
  c2: Ponto;
  p2: Ponto;
}

interface OpcoesCatmull {
  /** Ponto antes do primeiro (para a tangente de saída). */
  antes?: Ponto;
  /** Ponto depois do último (para a tangente de chegada), o "fantasma". */
  depois?: Ponto;
  /** Prende o x dos pontos de controle: a curva de Bézier nunca sai do fecho dos pontos de controle. */
  limiteX?: readonly [number, number];
}

/** Curva suave que passa por todos os pontos (Catmull-Rom, convertida em Bézier cúbica). */
function catmull(pts: readonly Ponto[], { antes, depois, limiteX }: OpcoesCatmull = {}): Segmento[] {
  const prender = (p: Ponto): Ponto => (limiteX ? [limitar(p[0], limiteX[0], limiteX[1]), p[1]] : p);
  const segmentos: Segmento[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? antes ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? depois ?? p2;
    segmentos.push({
      p1,
      c1: prender([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]),
      c2: prender([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]),
      p2,
    });
  }
  return segmentos;
}

const par = (p: Ponto) => `${arredondar(p[0])} ${arredondar(p[1])}`;

function paraCaminho(segmentos: readonly Segmento[]): string {
  if (!segmentos.length) return '';
  return (
    `M ${par(segmentos[0].p1)}` + segmentos.map((s) => ` C ${par(s.c1)} ${par(s.c2)} ${par(s.p2)}`).join('')
  );
}

const bezier = (a: number, b: number, c: number, d: number, t: number) => {
  const u = 1 - t;
  return u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
};

/** Altura da curva num x dado (o x cresce ao longo do caminho horizontal). Procura o t por bisseção. */
function alturaEmX(segmentos: readonly Segmento[], x: number): number {
  const s = segmentos.find((seg) => x >= seg.p1[0] && x <= seg.p2[0]) ?? segmentos[segmentos.length - 1];
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 32; i++) {
    const t = (lo + hi) / 2;
    if (bezier(s.p1[0], s.c1[0], s.c2[0], s.p2[0], t) < x) lo = t;
    else hi = t;
  }
  const t = (lo + hi) / 2;
  return bezier(s.p1[1], s.c1[1], s.c2[1], s.p2[1], t);
}

const alturaDaPosicao = (i: number) =>
  i % 2 === 0
    ? HORIZONTAL.cristas[(i / 2) % HORIZONTAL.cristas.length]
    : HORIZONTAL.vales[((i - 1) / 2) % HORIZONTAL.vales.length];

function curvaHorizontal(ordenados: readonly EntradaCurva[]): CurvaHorizontal {
  const H = HORIZONTAL;
  const n = ordenados.length;
  if (!n) return { largura: 0, altura: H.altura, larguraMinima: 0, caminho: '', cauda: '', pontos: [], marcas: [] };

  const xs: number[] = [H.margemEsquerda];
  for (let i = 1; i < n; i++) {
    xs.push(xs[i - 1] + H.base + H.coeficiente * Math.sqrt(diasEntre(ordenados[i - 1].inicio, ordenados[i].inicio)));
  }
  const largura = arredondar(xs[n - 1] + H.margemDireita);
  const pct = (x: number) => arredondar((x / largura) * 100);
  const ys = ordenados.map((_, i) => alturaDaPosicao(i));

  const pontos: PontoHorizontal[] = ordenados.map((p, i) => ({
    id: p.id,
    x: arredondar(xs[i]),
    y: ys[i],
    xPct: pct(xs[i]),
    lado: i % 2 === 0 ? 'acima' : 'abaixo',
    recente: i === n - 1,
    idade: n > 1 ? arredondar(i / (n - 1)) : 1,
  }));

  // pontos por onde a linha passa: entrada, cada projeto e, nos intervalos longos, um ponto no meio a meia altura
  const passando: Ponto[] = [
    [0, H.entradaY],
    [H.margemEsquerda * H.valeEntradaX, H.valeEntradaY],
  ];
  for (let i = 0; i < n; i++) {
    if (i > 0 && diasEntre(ordenados[i - 1].inicio, ordenados[i].inicio) > H.intervaloLongoDias) {
      passando.push([(xs[i - 1] + xs[i]) / 2, (ys[i - 1] + ys[i]) / 2]);
    }
    passando.push([xs[i], ys[i]]);
  }

  // "ponto fantasma" depois do último: o próximo da sequência. Só serve para a linha chegar quase na horizontal no último
  // ponto e a cauda sair para o lado certo, sem passar em cima do nome dele.
  const ultimo = passando[passando.length - 1];
  const fantasma: Ponto = [xs[n - 1] + 138, alturaDaPosicao(n)];
  const segmentos = catmull(passando, { depois: fantasma });

  const anterior = passando[passando.length - 2];
  const c1: Ponto = [ultimo[0] + (fantasma[0] - anterior[0]) / 6, ultimo[1] + (fantasma[1] - anterior[1]) / 6];
  const sobe = ultimo[1] > H.fimY; // vale: a cauda sobe até "hoje"; crista: desce
  const c2: Ponto = [largura - 44, H.fimY + (sobe ? 18 : -18)];
  const cauda = `M ${par(ultimo)} C ${par(c1)} ${par(c2)} ${par([largura, H.fimY])}`;

  const marcas: MarcaHorizontal[] = [
    { texto: String(ordenados[0].inicio.getUTCFullYear()), tipo: 'inicio', xPct: 0, y: H.entradaY - 14, dx: 0, dy: 0, ancora: 'start' },
    // o rótulo fica do lado livre da ponta da cauda: em cima quando ela sobe, embaixo quando ela desce
    { texto: 'hoje', tipo: 'hoje', xPct: 100, y: H.fimY + (sobe ? -14 : 26), dx: 0, dy: 0, ancora: 'end' },
  ];

  // virada de ano: o x dela é a fração do tempo entre os dois projetos que ela separa
  for (let i = 1; i < n; i++) {
    const a = ordenados[i - 1].inicio;
    const b = ordenados[i].inicio;
    for (let ano = a.getUTCFullYear() + 1; ano <= b.getUTCFullYear(); ano++) {
      const fracao = (Date.UTC(ano, 0, 1) - a.getTime()) / (b.getTime() - a.getTime());
      const x = xs[i - 1] + fracao * (xs[i] - xs[i - 1]);
      const y = alturaEmX(segmentos, x);
      const inclinacao = (alturaEmX(segmentos, x + 1) - alturaEmX(segmentos, x - 1)) / 2;
      // o texto fica do lado livre da curva: com a linha descendo, em cima à direita; subindo, embaixo à direita
      const emCima = inclinacao >= 0;
      marcas.push({ texto: String(ano), tipo: 'ano', xPct: pct(x), y: arredondar(y), dx: 8, dy: emCima ? -10 : 20, ancora: 'start' });
    }
  }

  return {
    largura,
    altura: H.altura,
    larguraMinima: Math.round(largura * H.escalaMinima),
    caminho: paraCaminho(segmentos),
    cauda,
    pontos,
    marcas,
  };
}

function curvaVertical(ordenados: readonly EntradaCurva[]): CurvaVertical {
  const V = VERTICAL;
  const n = ordenados.length;
  if (!n) return { largura: V.largura, altura: 0, respiro: 0, caminho: '', cauda: '', pontos: [], hoje: { x: V.largura + 4, y: 18 } };

  const recentes = [...ordenados].reverse(); // k = 0 é o mais recente
  const ys: number[] = [V.topo];
  for (let k = 1; k < n; k++) {
    const dias = diasEntre(recentes[k].inicio, recentes[k - 1].inicio);
    ys.push(ys[k - 1] + limitar(V.espacoBase + V.espacoCoeficiente * Math.sqrt(dias), V.espacoMinimo, V.espacoMaximo));
  }
  const altura = arredondar(ys[n - 1] + V.pe);
  const xs = recentes.map((_, k) => V.padraoX[(n - 1 - k) % V.padraoX.length]);

  const pontos: PontoVertical[] = recentes.map((p, k) => ({
    id: p.id,
    x: xs[k],
    y: arredondar(ys[k]),
    recente: k === 0,
    idade: n > 1 ? arredondar(1 - k / (n - 1)) : 1,
    // cada linha vai até o topo da seguinte; a última, até o pé da área
    espaco: arredondar(k < n - 1 ? ys[k + 1] - ys[k] : altura - (ys[k] - V.ancora)),
  }));

  // o caminho vai de baixo (mais antigo) para cima (mais recente), no mesmo sentido do degradê
  const topo: Ponto = [xs[0], ys[0]];
  const cauda1: Ponto = [topo[0] + (V.caudaX - topo[0]) * 0.73, topo[1] - 42];
  const cauda2: Ponto = [V.caudaX, topo[1] - 68];
  const subindo: Ponto[] = [[40, altura], ...recentes.map((_, i) => [xs[n - 1 - i], ys[n - 1 - i]] as Ponto)];
  const limiteX = [V.xMinimo, V.xMaximo] as const;
  const segmentos = catmull(subindo, { depois: cauda1, limiteX });
  const caudaSeg = catmull([topo, cauda1, cauda2], { antes: subindo[subindo.length - 2], limiteX });

  return {
    largura: V.largura,
    altura,
    respiro: arredondar(ys[0] - V.ancora),
    caminho: paraCaminho(segmentos),
    cauda: paraCaminho(caudaSeg),
    pontos,
    hoje: { x: V.largura + 4, y: 18 },
  };
}

/** Geometria dos dois layouts. A entrada pode vir em qualquer ordem: o desempate é o mesmo da collection (data, depois id). */
export function calcularCurva(entrada: readonly EntradaCurva[]): Curva {
  const ordenados = [...entrada].sort((a, b) => a.inicio.getTime() - b.inicio.getTime() || a.id.localeCompare(b.id));
  return { horizontal: curvaHorizontal(ordenados), vertical: curvaVertical(ordenados) };
}
