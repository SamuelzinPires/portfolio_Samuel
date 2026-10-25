// Leitura da collection `projetos` no build. Projeto novo = um .md novo: ele entra na ordem certa e
// ganha o número seguinte sozinho. Nada é buscado em tempo de execução.
import { getCollection, type CollectionEntry } from 'astro:content';

export type Projeto = CollectionEntry<'projetos'> & { numero: string };

/** Todos os projetos publicados, do mais antigo ao mais recente, com o número #001, #002… */
export async function carregarProjetos(): Promise<Projeto[]> {
  const publicados = (await getCollection('projetos')).filter((p) => !p.data.rascunho);
  publicados.sort((a, b) => a.data.inicio.getTime() - b.data.inicio.getTime() || a.id.localeCompare(b.id));
  return publicados.map((p, i) => ({ ...p, numero: String(i + 1).padStart(3, '0') }));
}

/** "A · B · C +N": as 3 primeiras tecnologias e quantas ficaram de fora. */
export function resumirStack(stack: string[], visiveis = 3): string {
  const resto = stack.length - visiveis;
  const mostradas = stack.slice(0, visiveis).join(' · ');
  return resto > 0 ? `${mostradas} +${resto}` : mostradas;
}
