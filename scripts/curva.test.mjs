// Testes da geometria da curva (src/lib/curva.ts). Rodam sem navegador e sem dependência: `npm test`.
// O Node 24 lê o .ts direto (remove os tipos). Datas reais dos 8 projetos, copiadas do frontmatter.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { calcularCurva, HORIZONTAL, VERTICAL } from '../src/lib/curva.ts';

const d = (s) => new Date(`${s}T00:00:00Z`);
const REAIS = [
  { id: 'finops', inicio: d('2026-02-21') },
  { id: 'etl-vagas', inicio: d('2026-02-25') },
  { id: 'agrotech', inicio: d('2026-03-11') },
  { id: 'foundations', inicio: d('2026-04-16') },
  { id: 'northwind', inicio: d('2026-06-10') },
  { id: 'crud', inicio: d('2026-07-09') },
  { id: 'data-quality', inicio: d('2026-08-02') },
  { id: 'airflow', inicio: d('2026-08-18') },
];

/** Pontos de um caminho "M x y C … C …" (só os pontos por onde a curva passa e os de controle). */
function numeros(caminho) {
  return [...caminho.matchAll(/-?\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));
}

/** Amostra a curva (Bézier cúbica por segmento) e devolve os pontos. */
function amostrar(caminho, passos = 40) {
  const n = numeros(caminho);
  const pts = [];
  let [x0, y0] = n;
  for (let i = 2; i < n.length; i += 6) {
    const [x1, y1, x2, y2, x3, y3] = n.slice(i, i + 6);
    for (let k = 0; k <= passos; k++) {
      const t = k / passos;
      const u = 1 - t;
      const f = (a, b, c, e) => u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * e;
      pts.push([f(x0, x1, x2, x3), f(y0, y1, y2, y3)]);
    }
    [x0, y0] = [x3, y3];
  }
  return pts;
}

test('horizontal: o mais antigo à esquerda e a distância segue 125 + 4 × √dias', () => {
  const { horizontal: h } = calcularCurva(REAIS);
  assert.deepEqual(h.pontos.map((p) => p.id), REAIS.map((p) => p.id));
  assert.equal(h.pontos[0].x, HORIZONTAL.margemEsquerda);
  const gaps = h.pontos.slice(1).map((p, i) => p.x - h.pontos[i].x);
  // 4 dias → 133, 55 dias → 154,7: os mesmos valores do desenho aprovado no Paper (133,2 · 155,4)
  assert.ok(Math.abs(gaps[0] - 133) < 0.1, `4 dias: ${gaps[0]}`);
  assert.ok(Math.abs(gaps[3] - 154.7) < 0.1, `55 dias: ${gaps[3]}`);
  assert.ok(Math.abs(h.largura - 1312) < 5, `largura de referência: ${h.largura}`); // 1308,8 com as datas reais
});

test('horizontal: alturas do padrão do Paper e lados alternados', () => {
  const { horizontal: h } = calcularCurva(REAIS);
  assert.deepEqual(h.pontos.map((p) => p.y), [150, 268, 118, 318, 172, 290, 125, 300]);
  assert.deepEqual(h.pontos.map((p) => p.lado), ['acima', 'abaixo', 'acima', 'abaixo', 'acima', 'abaixo', 'acima', 'abaixo']);
  assert.equal(h.pontos.filter((p) => p.recente).length, 1);
  assert.equal(h.pontos[7].recente, true);
});

test('horizontal: o padrão de alturas repete a partir do 9º', () => {
  const muitos = Array.from({ length: 12 }, (_, i) => ({ id: `p${String(i).padStart(2, '0')}`, inicio: d('2026-01-01').getTime() + i * 20 * 86_400_000 }));
  const { horizontal: h } = calcularCurva(muitos.map((p) => ({ id: p.id, inicio: new Date(p.inicio) })));
  assert.deepEqual(h.pontos.slice(8).map((p) => p.y), h.pontos.slice(0, 4).map((p) => p.y));
});

test('projeto novo entra à direita sem mexer nos anteriores', () => {
  const antes = calcularCurva(REAIS).horizontal.pontos;
  const depois = calcularCurva([...REAIS, { id: 'novo', inicio: d('2026-11-02') }]).horizontal.pontos;
  assert.equal(depois.length, antes.length + 1);
  antes.forEach((p, i) => {
    assert.equal(depois[i].id, p.id);
    assert.equal(depois[i].x, p.x, `${p.id}: x mudou`);
    assert.equal(depois[i].y, p.y, `${p.id}: y mudou`);
    assert.equal(depois[i].lado, p.lado);
  });
  assert.equal(depois[8].id, 'novo');
  assert.equal(depois[8].lado, 'acima'); // o 9º repete o padrão do 1º
});

test('a ordem de entrada não importa (data, depois id)', () => {
  const embaralhado = [...REAIS].reverse();
  assert.deepEqual(calcularCurva(embaralhado), calcularCurva(REAIS));
});

test('intervalo longo (mais de 45 dias) ganha um ponto no meio, a meia altura; os outros não', () => {
  const { horizontal: h } = calcularCurva(REAIS);
  // entrada (2 pontos) + 8 projetos + 1 intermediário: abr → jun tem 55 dias, o maior dos outros tem 36
  assert.equal((h.caminho.match(/C/g) ?? []).length, 2 + 8 + 1 - 1);
  const semLongo = calcularCurva(REAIS.slice(4)).horizontal; // 29, 24 e 16 dias: nenhum intervalo longo
  assert.equal((semLongo.caminho.match(/C/g) ?? []).length, 2 + 4 - 1);
  // o ponto no meio fica no x médio e na altura média entre Foundations (318) e Northwind (172)
  const pts = numeros(h.caminho);
  const passa = [];
  for (let i = 6; i < pts.length; i += 6) passa.push([pts[i], pts[i + 1]]);
  const foundations = h.pontos[3];
  const northwind = h.pontos[4];
  const meio = [(foundations.x + northwind.x) / 2, (foundations.y + northwind.y) / 2];
  assert.ok(passa.some(([x, y]) => Math.abs(x - meio[0]) < 0.1 && Math.abs(y - meio[1]) < 0.1), 'ponto intermediário');
});

test('horizontal: a entrada tem um vale pequeno e a marca do ano começa no 1º projeto', () => {
  const { horizontal: h } = calcularCurva(REAIS);
  const [x0, y0, , , , , vx, vy] = numeros(h.caminho).slice(0, 8);
  assert.equal(x0, 0);
  assert.equal(y0, HORIZONTAL.entradaY);
  assert.ok(vy > y0, 'o vale desce antes de subir');
  assert.ok(vx > 0 && vx < HORIZONTAL.margemEsquerda);
  assert.deepEqual(h.marcas.map((m) => m.texto), ['2026', 'hoje']);
});

test('horizontal: ano novo aparece quando a linha cruza a virada', () => {
  const comVirada = [...REAIS, { id: 'a', inicio: d('2026-11-20') }, { id: 'b', inicio: d('2027-02-10') }];
  const { horizontal: h } = calcularCurva(comVirada);
  const ano = h.marcas.filter((m) => m.tipo === 'ano');
  assert.deepEqual(ano.map((m) => m.texto), ['2027']);
  const [a, b] = [h.pontos[8], h.pontos[9]];
  const xAno = (ano[0].xPct / 100) * h.largura;
  assert.ok(xAno > a.x && xAno < b.x, 'a virada fica entre os dois projetos');
  // 20/11 → 01/01 são 42 dias de 82: um pouco mais da metade do caminho
  assert.ok(Math.abs((xAno - a.x) / (b.x - a.x) - 42 / 82) < 0.01);
});

test('horizontal: cauda sobe do último vale até "hoje"; do último topo, desce', () => {
  const { horizontal: h } = calcularCurva(REAIS); // o 8º é um vale
  const fim = numeros(h.cauda).slice(-2);
  assert.equal(fim[0], h.largura);
  assert.equal(fim[1], HORIZONTAL.fimY);
  assert.ok(fim[1] < h.pontos[7].y, 'sobe');
  const nove = calcularCurva([...REAIS, { id: 'novo', inicio: d('2026-11-02') }]).horizontal; // o 9º é uma crista
  assert.ok(HORIZONTAL.fimY > nove.pontos[8].y, 'desce');
});

test('largura mínima = largura de referência × escala mínima; cresce com o número de projetos', () => {
  const oito = calcularCurva(REAIS).horizontal;
  assert.equal(oito.larguraMinima, Math.round(oito.largura * HORIZONTAL.escalaMinima));
  const vinte = calcularCurva(Array.from({ length: 20 }, (_, i) => ({ id: `p${i}`, inicio: new Date(Date.UTC(2026, 0, 1 + i * 20)) }))).horizontal;
  assert.ok(vinte.larguraMinima > 2 * oito.larguraMinima, 'com 20 projetos a área é bem mais larga que a tela e rola');
});

test('vertical: mais recente em cima, padrão de distâncias e espaço entre 96 e 118', () => {
  const { vertical: v } = calcularCurva(REAIS);
  assert.deepEqual(v.pontos.map((p) => p.id), [...REAIS].reverse().map((p) => p.id));
  assert.deepEqual(v.pontos.map((p) => p.x), [22, 58, 30, 64, 18, 50, 26, 56]);
  assert.equal(v.pontos[0].y, VERTICAL.topo);
  assert.equal(v.pontos[0].recente, true);
  const passos = v.pontos.slice(1).map((p, i) => p.y - v.pontos[i].y);
  passos.forEach((s) => assert.ok(s >= 96 && s <= 118, `espaço ${s}`));
  // 4 dias → 96 (o mínimo) e 55 dias → 117,7 (como no Paper)
  assert.ok(Math.abs(passos[6] - 96) < 0.5, `4 dias: ${passos[6]}`);
  assert.ok(Math.abs(passos[3] - 117.7) < 0.5, `55 dias: ${passos[3]}`);
});

test('vertical: a curva nunca passa de x = 64 (nem a cauda), com 8, 20 e 50 projetos', () => {
  for (const total of [1, 2, 8, 20, 50]) {
    const entrada = Array.from({ length: total }, (_, i) => ({ id: `p${i}`, inicio: new Date(Date.UTC(2026, 0, 1 + i * (i % 3 === 0 ? 4 : 37))) }));
    const { vertical: v } = calcularCurva(entrada);
    const maior = Math.max(...amostrar(v.caminho).map(([x]) => x), ...amostrar(v.cauda).map(([x]) => x));
    const menor = Math.min(...amostrar(v.caminho).map(([x]) => x));
    assert.ok(maior <= VERTICAL.xMaximo + 1e-9, `${total} projetos: x máximo ${maior}`);
    assert.ok(menor >= VERTICAL.xMinimo - 1e-9, `${total} projetos: x mínimo ${menor}`);
  }
});

test('vertical: projeto novo em cima não mexe no x dos anteriores', () => {
  const antes = calcularCurva(REAIS).vertical.pontos;
  const depois = calcularCurva([...REAIS, { id: 'novo', inicio: d('2026-11-02') }]).vertical.pontos;
  assert.equal(depois[0].id, 'novo');
  antes.forEach((p) => assert.equal(depois.find((q) => q.id === p.id).x, p.x, `${p.id}: x mudou`));
});

test('vertical: as linhas da lista somam a altura da área (a curva e a lista andam juntas)', () => {
  const { vertical: v } = calcularCurva(REAIS);
  const soma = v.respiro + v.pontos.reduce((s, p) => s + p.espaco, 0);
  assert.ok(Math.abs(soma - v.altura) < 0.5, `${soma} × ${v.altura}`);
});

test('sem projetos e com um só: não quebra', () => {
  const vazio = calcularCurva([]);
  assert.equal(vazio.horizontal.pontos.length, 0);
  assert.equal(vazio.vertical.pontos.length, 0);
  const um = calcularCurva([REAIS[0]]);
  assert.equal(um.horizontal.pontos.length, 1);
  assert.equal(um.horizontal.pontos[0].recente, true);
  assert.ok(um.horizontal.caminho.startsWith('M '));
  assert.equal(um.vertical.pontos.length, 1);
});
