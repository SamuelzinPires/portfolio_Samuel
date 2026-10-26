// Monta o calendário do backfill (peça "calendario"): em que coluna/linha de cada dia, o que mostra cada dia
// e o que está estranho nos dados. Fica fora do componente para o aviso de lacunas do build usar a mesma conta.
//
// Regras:
//  - o intervalo `inicio`–`fim` do .md diz quais dias podem ter execução;
//  - com `arquivo`, o dia é "ok" se tem valores no arquivo (execução que gravou dado) e aparece com eles;
//    dia do intervalo sem valores e fora de `falhas` é desenhado vazio (nenhum dado gravado nesse dia);
//  - sem `arquivo`, vale o intervalo inteiro (e os `valores` digitados à mão no .md, se houver);
//  - `falhas` são os dias que rodaram e falharam (âmbar).
import { diaMesAno, isoDia, nomeDoMes } from './datas';
import { carregarGeracao } from './geracao';
import type { Dados } from './pecas-tipos';

export const PASSO = 18; // largura/altura de cada casa do SVG
export const LADO = 14; // lado do quadrado dentro da casa
const DIA_MS = 86_400_000;

export interface Celula {
  iso: string;
  data: Date;
  estado: 'ok' | 'falha' | 'vazio';
  motivo: string;
  coluna: number;
  x: number;
  y: number;
  /** Valores do dia, na ordem de `nomes` (+ total no fim), se houver. */
  valores?: number[];
}

export interface Calendario {
  celulas: Celula[];
  colunas: number;
  /** Um item por coluna (semana): o nome do mês onde ele começa, vazio nas outras. */
  meses: string[];
  nomes: string[];
  nomeTotal?: string;
  selecionada: Celula;
  /** Frases para o terminal do build: o que não bate entre o .md e o arquivo de dados. */
  avisos: string[];
}

export function montarCalendario(dados: Dados<'calendario'>): Calendario {
  const avisos: string[] = [];
  const deslocamento = dados.inicio.getUTCDay(); // 0 = domingo: a 1ª coluna começa neste dia da semana

  // valores por dia (arquivo, ou os digitados à mão)
  const porDia = new Map<string, number[]>();
  let nomes: string[] = [];
  let nomeTotal: string | undefined;
  if (dados.arquivo) {
    const g = carregarGeracao(dados.arquivo);
    nomes = g.nomes;
    nomeTotal = g.total;
    for (const [iso, valores] of Object.entries(g.dias)) porDia.set(iso, valores);
    if (dados.valores.length) avisos.push('`valores` digitados no .md são ignorados quando há `arquivo`');
  } else if (dados.valores.length) {
    nomes = dados.valores[0].subsistemas.map((s) => s.nome);
    nomeTotal = dados.valores[0].total?.nome;
    for (const v of dados.valores) {
      const lista = [...v.subsistemas.map((s) => s.valor), ...(v.total ? [v.total.valor] : [])];
      porDia.set(isoDia(v.dia), lista);
    }
  }

  const posicao = (d: Date) => {
    const n = Math.round((d.getTime() - dados.inicio.getTime()) / DIA_MS) + deslocamento;
    return { coluna: Math.floor(n / 7), linha: n % 7 };
  };
  const nova = (data: Date, estado: Celula['estado'], motivo: string): Celula => {
    const { coluna, linha } = posicao(data);
    const iso = isoDia(data);
    return { iso, data, estado, motivo, coluna, x: coluna * PASSO, y: linha * PASSO, valores: porDia.get(iso) };
  };

  const falhas = new Map(dados.falhas.map((f) => [isoDia(f.dia), f.motivo]));
  const celulas: Celula[] = [];
  const semValor: string[] = [];
  for (let t = dados.inicio.getTime(); t <= dados.fim.getTime(); t += DIA_MS) {
    const data = new Date(t);
    const iso = isoDia(data);
    if (falhas.has(iso)) continue; // entra abaixo, em âmbar
    if (dados.arquivo && !porDia.has(iso)) {
      semValor.push(diaMesAno(data));
      celulas.push(nova(data, 'vazio', ''));
      continue;
    }
    celulas.push(nova(data, 'ok', ''));
  }
  for (const f of dados.falhas) celulas.push(nova(f.dia, 'falha', f.motivo));
  celulas.sort((a, b) => a.data.getTime() - b.data.getTime());

  if (semValor.length) {
    avisos.push(
      `${semValor.length} dia(s) do intervalo sem valores no arquivo (desenhados vazios) → ${semValor.slice(0, 6).join(', ')}${semValor.length > 6 ? '…' : ''}`,
    );
  }
  const foraDoIntervalo = [...porDia.keys()].filter((iso) => iso < isoDia(dados.inicio) || iso > isoDia(dados.fim)).sort();
  if (foraDoIntervalo.length) {
    avisos.push(
      `${foraDoIntervalo.length} dia(s) com valores fora de inicio–fim (${foraDoIntervalo[0]} … ${foraDoIntervalo.at(-1)}): ajuste o intervalo, o comentário, a legenda e o número`,
    );
  }
  if (!dados.arquivo) {
    const comValor = celulas.filter((c) => c.valores).length;
    if (comValor < celulas.length) avisos.push(`valores por subsistema só em ${comValor} de ${celulas.length} dias (falta o arquivo de dados)`);
  }

  const colunas = Math.max(...celulas.map((c) => c.coluna)) + 1;
  const meses: string[] = Array.from({ length: colunas }, () => '');
  meses[0] = nomeDoMes(dados.inicio);
  for (const c of celulas) if (c.data.getUTCDate() === 1) meses[c.coluna] = nomeDoMes(c.data);

  const isoSelecionado = isoDia(dados.selecionado);
  const selecionada = celulas.find((c) => c.iso === isoSelecionado);
  if (!selecionada) avisos.push(`o dia aberto por padrão (${isoSelecionado}) não tem quadrado no calendário`);

  return { celulas, colunas, meses, nomes, nomeTotal, selecionada: selecionada ?? celulas[0], avisos };
}
