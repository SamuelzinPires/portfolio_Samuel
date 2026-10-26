// Converte o CSV exportado da tabela geracao_diaria (Postgres do pipeline do Airflow) no arquivo de dados
// da peça "calendario": src/data/airflow-geracao.json. Dados públicos do ONS, já agregados: pode ir pro repo.
//
// 1) Export (na pasta do Airflow, com os contêineres de pé; usa o usuário e o banco do .env.example):
//      docker compose exec -T postgres-pipeline psql -U pipeline -d pipeline -c \
//        "\copy (SELECT data_execucao, nom_subsistema, round(pct_renovavel::numeric, 2) AS pct_renovavel
//                FROM geracao_diaria ORDER BY 1, 2) TO STDOUT WITH CSV HEADER" > geracao_diaria.csv
// 2) Conversão (aqui, na pasta do site):
//      node scripts/importar-geracao.mjs caminho/do/geracao_diaria.csv
//    Opcional: um 2º argumento muda o arquivo de saída.
// 3) O relatório mostra o intervalo, quantos dias entraram e quais dias do intervalo ficaram sem linha.
//    Dia que não tem as 5 linhas completas (4 subsistemas + total) NÃO entra no arquivo.
//
// Sem dependência: o CSV tem 3 colunas simples. Nomes: o ONS usa caixa alta; o site usa os nomes curtos abaixo.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [entrada, saidaArg] = process.argv.slice(2);
if (!entrada) {
  console.error('Uso: node scripts/importar-geracao.mjs <geracao_diaria.csv> [saida.json]');
  process.exit(1);
}
const saida = saidaArg ?? fileURLToPath(new URL('../src/data/airflow-geracao.json', import.meta.url));

// ordem dos nomes no arquivo = ordem das barras na página (o total vai por último)
const NOMES = ['Nordeste', 'Sul', 'Sudeste/C-Oeste', 'Norte'];
const TOTAL = 'Brasil (SIN)';
const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const chave = (s) => semAcento(s).toUpperCase().replace(/[^A-Z]/g, '');
const apelidos = new Map([
  [chave('Nordeste'), 'Nordeste'],
  [chave('Sul'), 'Sul'],
  [chave('Sudeste/Centro-Oeste'), 'Sudeste/C-Oeste'],
  [chave('Sudeste/C-Oeste'), 'Sudeste/C-Oeste'],
  [chave('Norte'), 'Norte'],
  [chave('Sistema Interligado Nacional'), TOTAL],
  [chave('SIN'), TOTAL],
]);

const linhas = readFileSync(entrada, 'utf8').trim().split(/\r?\n/);
const cabecalho = linhas[0].split(',').map((c) => c.trim());
const col = Object.fromEntries(['data_execucao', 'nom_subsistema', 'pct_renovavel'].map((n) => [n, cabecalho.indexOf(n)]));
if (Object.values(col).some((i) => i < 0)) {
  console.error(`Cabeçalho inesperado: ${linhas[0]}\nEsperado: data_execucao,nom_subsistema,pct_renovavel`);
  process.exit(1);
}

const porDia = new Map();
const desconhecidos = new Set();
let malformadas = 0;
for (const linha of linhas.slice(1)) {
  const c = linha.split(',').map((x) => x.trim().replace(/^"|"$/g, ''));
  const dia = c[col.data_execucao];
  const nome = apelidos.get(chave(c[col.nom_subsistema] ?? ''));
  const valor = Number(c[col.pct_renovavel]);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || Number.isNaN(valor) || valor < 0 || valor > 100) {
    malformadas++;
    continue;
  }
  if (!nome) {
    desconhecidos.add(c[col.nom_subsistema]);
    continue;
  }
  if (!porDia.has(dia)) porDia.set(dia, new Map());
  porDia.get(dia).set(nome, valor);
}
if (desconhecidos.size) {
  console.error(`Nome de subsistema desconhecido: ${[...desconhecidos].join(' | ')}\nAcrescente em "apelidos" no script e rode de novo.`);
  process.exit(1);
}

const todosNomes = [...NOMES, TOTAL];
const dias = {};
const incompletos = [];
for (const dia of [...porDia.keys()].sort()) {
  const valores = porDia.get(dia);
  if (todosNomes.some((n) => !valores.has(n))) {
    incompletos.push(dia);
    continue;
  }
  dias[dia] = todosNomes.map((n) => Math.round(valores.get(n) * 100) / 100);
}

const datas = Object.keys(dias);
if (!datas.length) {
  console.error('Nenhum dia completo no CSV.');
  process.exit(1);
}

// um dia por linha: o diff do Git mostra só os dias que mudaram
const corpo = datas.map((d) => `    "${d}": [${dias[d].join(', ')}]`).join(',\n');
const json = `{
  "fonte": "Tabela geracao_diaria do Postgres do pipeline do Airflow, com dados públicos do ONS (balanço de energia nos subsistemas)",
  "nomes": ${JSON.stringify(NOMES)},
  "total": ${JSON.stringify(TOTAL)},
  "dias": {
${corpo}
  }
}
`;
writeFileSync(saida, json);

// relatório
const MS = 86_400_000;
const faltando = [];
for (let t = Date.parse(datas[0]); t <= Date.parse(datas.at(-1)); t += MS) {
  const iso = new Date(t).toISOString().slice(0, 10);
  if (!dias[iso]) faltando.push(iso);
}
console.log(`✓ ${saida}`);
console.log(`  ${datas.length} dias completos · ${datas[0]} → ${datas.at(-1)} · ${(json.length / 1024).toFixed(1)} KB`);
console.log(`  linhas malformadas: ${malformadas} · dias incompletos (fora do arquivo): ${incompletos.length ? incompletos.join(', ') : 'nenhum'}`);
console.log(`  dias do intervalo sem linha (${faltando.length}): ${faltando.join(', ') || 'nenhum'}`);
