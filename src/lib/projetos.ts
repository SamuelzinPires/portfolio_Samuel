// Leitura da collection `projetos` no build. Projeto novo = um .md novo: ele entra na ordem certa e
// ganha o número seguinte sozinho. Nada é buscado em tempo de execução.
import { getCollection, type CollectionEntry } from 'astro:content';
import { intervaloMeses, mesAno, nomeCompletoDoMes, nomeDoMes, periodo } from './datas';

export type Projeto = CollectionEntry<'projetos'> & { numero: string };

/** Todos os projetos publicados, do mais antigo ao mais recente, com o número #001, #002… */
export async function carregarProjetos(): Promise<Projeto[]> {
  const publicados = (await getCollection('projetos')).filter((p) => !p.data.rascunho);
  publicados.sort((a, b) => a.data.inicio.getTime() - b.data.inicio.getTime() || a.id.localeCompare(b.id));
  return publicados.map((p, i) => ({ ...p, numero: String(i + 1).padStart(3, '0') }));
}

export interface MesDeProjetos {
  /** "2026-08" */
  chave: string;
  ano: number;
  /** "ago" */
  nome: string;
  /** "agosto de 2026" (só para leitor de tela) */
  nomeCompleto: string;
  projetos: Projeto[];
}

/** Agrupa pelo mês de `inicio`. Entra já ordenado (o mais recente primeiro) e sai na mesma ordem; mês sem projeto não existe. */
export function agruparPorMes(projetos: Projeto[]): MesDeProjetos[] {
  const meses = new Map<string, MesDeProjetos>();
  for (const p of projetos) {
    const inicio = p.data.inicio;
    const ano = inicio.getUTCFullYear();
    const chave = `${ano}-${String(inicio.getUTCMonth() + 1).padStart(2, '0')}`;
    let mes = meses.get(chave);
    if (!mes) {
      mes = { chave, ano, nome: nomeDoMes(inicio), nomeCompleto: `${nomeCompletoDoMes(inicio)} de ${ano}`, projetos: [] };
      meses.set(chave, mes);
    }
    mes.projetos.push(p);
  }
  return [...meses.values()];
}

/** "8 projetos" */
export const contarProjetos = (n: number) => `${n} ${n === 1 ? 'projeto' : 'projetos'}`;

/** Linha azul acima do título, calculada dos dados: "8 projetos · fev → out/2026" ou, com projeto em andamento, "… fev/2026 → hoje". */
export function resumirProjetos(projetos: Projeto[]): string {
  if (projetos.length === 0) return '';
  const antigo = projetos[projetos.length - 1].data.inicio;
  const fins = projetos.flatMap((p) => p.data.fim ?? []);
  const emAndamento = fins.length < projetos.length;
  const intervalo = emAndamento
    ? periodo(antigo)
    : intervaloMeses(antigo, new Date(Math.max(...fins.map((f) => f.getTime()))));
  return `${contarProjetos(projetos.length)} · ${intervalo}`;
}

/** "A · B · C +N": as 3 primeiras tecnologias e quantas ficaram de fora. */
export function resumirStack(stack: string[], visiveis = 3): string {
  const resto = stack.length - visiveis;
  const mostradas = stack.slice(0, visiveis).join(' · ');
  return resto > 0 ? `${mostradas} +${resto}` : mostradas;
}

/** Período para a linha do tempo: projeto em andamento mostra só o mês em que começou ("ago/2026"). */
export const periodoCurto = (p: Projeto) => (p.data.fim ? periodo(p.data.inicio, p.data.fim) : mesAno(p.data.inicio));

export interface Vizinhanca {
  /** Dois projetos antes deste (contexto), se existir. */
  antes?: Projeto;
  anterior?: Projeto;
  proximo?: Projeto;
  /** Dois depois deste: só para o primeiro projeto, que não tem anterior nem contexto antes. */
  depois?: Projeto;
  /** Último projeto: o "próximo" ainda não existe e a linha do tempo mostra "em progresso". */
  emProgresso: boolean;
}

/** Anterior e próximo em ordem cronológica, mais um projeto de contexto (a linha do tempo mostra até 4). */
export function vizinhancaDe(todos: Projeto[], atual: Projeto): Vizinhanca {
  const i = todos.findIndex((p) => p.id === atual.id);
  const anterior = todos[i - 1];
  return {
    antes: todos[i - 2],
    anterior,
    proximo: todos[i + 1],
    depois: anterior ? undefined : todos[i + 2],
    emProgresso: i === todos.length - 1,
  };
}
