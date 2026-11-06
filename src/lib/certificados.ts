// Leitura da collection `certificados` no build. Um certificado novo é uma linha nova em
// src/data/certificados.json: ele entra no ano e no mês certos, sozinho (mais recente primeiro).
// Não existe campo de PDF (nem aqui nem no schema): o arquivo do certificado nunca é aberto nem hospedado.
import { getCollection, type CollectionEntry } from 'astro:content';
import { diaMes, diaMesAno, diaMesNomeAno, intervaloMeses, isoDia, nomeCompletoDoMes, nomeDoMes } from './datas';

export type DadosCertificado = CollectionEntry<'certificados'>['data'];

export interface Certificado extends DadosCertificado {
  /** "29 out 2026" */
  rotulo: string;
  /** "2026-10-29", para o atributo datetime */
  iso: string;
}

/** Um mês com mais certificados do que isto mostra os primeiros e um "ver os outros N" (só com JavaScript). */
export const LIMITE_MES = 9;

// Mais recente primeiro. Data igual: o campo `ordem` (menor primeiro) e, sem ele, o título
const comparar = (a: DadosCertificado, b: DadosCertificado) =>
  b.conclusao.getTime() - a.conclusao.getTime() ||
  (a.ordem ?? Number.MAX_SAFE_INTEGER) - (b.ordem ?? Number.MAX_SAFE_INTEGER) ||
  a.titulo.localeCompare(b.titulo, 'en');

/** Ordena do mais recente ao mais antigo e prepara a data de exibição. */
export function montarCertificados(dados: DadosCertificado[]): Certificado[] {
  return [...dados].sort(comparar).map((c) => ({ ...c, rotulo: diaMesNomeAno(c.conclusao), iso: isoDia(c.conclusao) }));
}

/** Todos os certificados da collection, do mais recente ao mais antigo. */
export async function carregarCertificados(): Promise<Certificado[]> {
  return montarCertificados((await getCollection('certificados')).map((c) => c.data));
}

export interface GrupoDoMes {
  /** "2026-10" */
  chave: string;
  /** "out" */
  nome: string;
  /** "outubro de 2026" (só para leitor de tela) */
  nomeCompleto: string;
  certificados: Certificado[];
}

export interface GrupoDoAno {
  ano: number;
  /** "ago–out": do primeiro ao último mês com certificado no ano */
  periodo: string;
  total: number;
  meses: GrupoDoMes[];
}

/** Por ano e, dentro do ano, por mês. Entra já ordenado (o mais recente primeiro) e sai na mesma ordem. */
export function agruparPorAno(certificados: Certificado[]): GrupoDoAno[] {
  const anos: GrupoDoAno[] = [];
  for (const c of certificados) {
    const ano = c.conclusao.getUTCFullYear();
    const chave = `${ano}-${String(c.conclusao.getUTCMonth() + 1).padStart(2, '0')}`;
    let grupo = anos.find((g) => g.ano === ano);
    if (!grupo) {
      grupo = { ano, periodo: '', total: 0, meses: [] };
      anos.push(grupo);
    }
    let mes = grupo.meses.find((m) => m.chave === chave);
    if (!mes) {
      mes = { chave, nome: nomeDoMes(c.conclusao), nomeCompleto: `${nomeCompletoDoMes(c.conclusao)} de ${ano}`, certificados: [] };
      grupo.meses.push(mes);
    }
    mes.certificados.push(c);
    grupo.total++;
  }
  for (const g of anos) {
    const [recente, antigo] = [g.meses[0], g.meses[g.meses.length - 1]];
    g.periodo = recente.chave === antigo.chave ? recente.nome : `${antigo.nome}–${recente.nome}`;
  }
  return anos;
}

const contar = (n: number, singular: string, plural: string) => `${n} ${n === 1 ? singular : plural}`;

/** "11 certificados" */
export const contarCertificados = (n: number) => contar(n, 'certificado', 'certificados');

/** Linha azul acima do título e frase de apoio, tudo calculado dos dados (nada digitado). */
export function resumir(certificados: Certificado[]) {
  const n = certificados.length;
  if (n === 0) return { linha: '', frase: '' };

  const recente = certificados[0].conclusao;
  const antigo = certificados[n - 1].conclusao;
  const mesmoAno = recente.getUTCFullYear() === antigo.getUTCFullYear();

  const emissores = [...new Set(certificados.map((c) => c.emissor))];
  const quem = emissores.length === 1 ? emissores[0] : `de ${emissores.slice(0, -1).join(', ')} e ${emissores.at(-1)}`;
  const quando =
    n === 1
      ? `em ${diaMesAno(recente)}`
      : `entre ${mesmoAno ? diaMes(antigo) : diaMesAno(antigo)} e ${diaMesAno(recente)}`;

  return {
    linha: `${contarCertificados(n)} · ${intervaloMeses(antigo, recente)}`,
    frase: `${contarCertificados(n)} ${quem}, ${n === 1 ? 'concluído' : 'concluídos'} ${quando}.`,
  };
}
