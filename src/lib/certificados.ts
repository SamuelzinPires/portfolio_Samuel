// Leitura da collection `certificados` no build. Um certificado novo é uma linha nova em
// src/data/certificados.json: ele entra na ordem certa, na raia da trilha dele, sozinho.
// Não existe campo de PDF (nem aqui nem no schema): o arquivo do certificado nunca é aberto nem hospedado.
import { getCollection, type CollectionEntry } from 'astro:content';
import { diaMes, diaMesAno, diaMesNome } from './datas';

export type Trilha = 'linguagem' | 'dados' | 'conceitos';
export type DadosCertificado = CollectionEntry<'certificados'>['data'];

/** `coluna` = posição na ordem de conclusão (0, 1, 2…): é a coluna do eixo ordinal. */
export interface Certificado extends DadosCertificado {
  coluna: number;
  /** "07 ago" */
  rotulo: string;
}

/** Ordem das raias de cima para baixo. O assunto é a legenda de cada raia. */
export const trilhas: Record<Trilha, { nome: string; assunto: string }> = {
  linguagem: { nome: 'LINGUAGEM', assunto: 'Python e SQL' },
  dados: { nome: 'DADOS', assunto: 'importação, APIs e limpeza' },
  conceitos: { nome: 'CONCEITOS', assunto: 'cloud, engenharia e data warehouse' },
};
const ordemTrilhas = Object.keys(trilhas) as Trilha[];

/** Quantos certificados cada raia mostra antes de recolher o resto atrás de "ver todos". */
export const LIMITE_RAIA = 5;
/** A partir de quantos certificados aparece o filtro por trilha/emissor (com poucos, só atrapalha). */
export const FILTRO_A_PARTIR_DE = 12;

// Desempate de datas iguais: o campo `ordem` (menor primeiro) e, sem ele, o título
const comparar = (a: DadosCertificado, b: DadosCertificado) =>
  a.conclusao.getTime() - b.conclusao.getTime() ||
  (a.ordem ?? Number.MAX_SAFE_INTEGER) - (b.ordem ?? Number.MAX_SAFE_INTEGER) ||
  a.titulo.localeCompare(b.titulo, 'en');

/** Ordena do mais antigo ao mais recente e numera as colunas do eixo. */
export function montarCertificados(dados: DadosCertificado[]): Certificado[] {
  return [...dados].sort(comparar).map((c, coluna) => ({ ...c, coluna, rotulo: diaMesNome(c.conclusao) }));
}

/** Todos os certificados da collection, do mais antigo ao mais recente. */
export async function carregarCertificados(): Promise<Certificado[]> {
  return montarCertificados((await getCollection('certificados')).map((c) => c.data));
}

export interface Raia {
  id: Trilha;
  /** "01" */
  numero: string;
  nome: string;
  assunto: string;
  certificados: Certificado[];
}

/** Só as trilhas que têm certificado: raia vazia não aparece. */
export function agruparPorTrilha(certificados: Certificado[]): Raia[] {
  return ordemTrilhas
    .map((id) => ({ id, ...trilhas[id], certificados: certificados.filter((c) => c.trilha === id) }))
    .filter((r) => r.certificados.length > 0)
    .map((r, i) => ({ ...r, numero: String(i + 1).padStart(2, '0') }));
}

export interface GrupoDoAno {
  ano: number;
  raias: Raia[];
}

/** Lista do celular: por ano e, dentro do ano, por trilha (o número da raia é o mesmo do desktop). */
export function agruparPorAno(certificados: Certificado[]): GrupoDoAno[] {
  const numeros = new Map(agruparPorTrilha(certificados).map((r) => [r.id, r.numero]));
  const anos = [...new Set(certificados.map((c) => c.conclusao.getUTCFullYear()))].sort();
  return anos.map((ano) => ({
    ano,
    raias: agruparPorTrilha(certificados.filter((c) => c.conclusao.getUTCFullYear() === ano)).map((r) => ({
      ...r,
      numero: numeros.get(r.id) ?? r.numero,
    })),
  }));
}

/** "2026-08": junta os certificados do mesmo mês no eixo. */
export const chaveDoMes = (c: Certificado) => `${c.conclusao.getUTCFullYear()}-${String(c.conclusao.getUTCMonth() + 1).padStart(2, '0')}`;

const palavra = (n: number) => ['nenhuma', 'uma', 'duas', 'três'][n] ?? String(n);

/** Números do topo e frase de apoio, tudo calculado dos dados (nada digitado). */
export function resumir(certificados: Certificado[]) {
  const raias = agruparPorTrilha(certificados);
  const emissores = [...new Set(certificados.map((c) => c.emissor))];
  const primeiro = certificados[0];
  const ultimo = certificados[certificados.length - 1];
  const n = certificados.length;

  const quem = emissores.length === 1 ? emissores[0] : `de ${emissores.slice(0, -1).join(', ')} e ${emissores.at(-1)}`;
  const quando =
    n === 1 ? `em ${diaMesAno(primeiro.conclusao)}` : `entre ${diaMes(primeiro.conclusao)} e ${diaMesAno(ultimo.conclusao)}`;
  const frase =
    `${n} ${n === 1 ? 'certificado' : 'certificados'} ${quem} ${n === 1 ? 'concluído' : 'concluídos'} ${quando}` +
    (raias.length > 1 ? `, em ${palavra(raias.length)} trilhas.` : '.');

  const meses = [...new Set(certificados.map(chaveDoMes))];
  const anos = [...new Set(certificados.map((c) => c.conclusao.getUTCFullYear()))];

  return {
    frase,
    emissores,
    raias,
    /** "03 · conceitos": o número e o rótulo de cada trilha, para o topo da página. */
    numeros: raias.map((r) => ({ valor: r.certificados.length, rotulo: r.nome.toLowerCase() })),
    /** Mais de um mês: o eixo mostra o cabeçalho de cada mês. */
    variosMeses: meses.length > 1,
    /** Mais de um ano: a lista do celular ganha um título por ano. */
    variosAnos: anos.length > 1,
    comFiltro: n >= FILTRO_A_PARTIR_DE || emissores.length > 1,
  };
}
