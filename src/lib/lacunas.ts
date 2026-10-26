// Aviso de lacunas no terminal do build (e do `npm run dev`). Nada disso aparece no site: a página
// simplesmente não mostra a seção sem dado. A lista é o checklist do que ainda falta escrever ou enviar.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { montarCalendario } from './calendario';
import type { Projeto } from './projetos';

let jaAvisou = false;

/** O que falta (ou não bate) em cada projeto, em frases completas. */
function lacunasDe(p: Projeto): string[] {
  const d = p.data;
  const avisos: string[] = [];

  if (!p.body?.trim()) avisos.push('falta "por que existe" (corpo do .md vazio)');
  if (!d.comoFunciona) avisos.push('falta "como funciona" (comoFunciona)');
  if (!d.decisoes?.length) avisos.push('falta "decisões" (decisoes)');
  if (!d.aprendizados?.length) avisos.push('falta "o que aprendi" (aprendizados)');
  if (!d.numeros?.length) avisos.push('faltam os números grandes do topo (numeros)');
  if (!d.peca) avisos.push('falta a peça-assinatura (peca)');
  if (!d.repo) avisos.push('falta o link do repositório (repo): o botão "código no GitHub" não aparece');
  if (!existsSync(join(process.cwd(), 'public', 'og', `${p.id}.png`))) {
    avisos.push('falta a imagem de compartilhamento (rode `npm run og` com o `npm run dev` ligado)');
  }

  // o que não bate entre a peça e os dados dela
  if (d.peca?.tipo === 'calendario') avisos.push(...montarCalendario(d.peca.dados).avisos);
  return avisos;
}

export function avisarLacunas(projetos: Projeto[]) {
  if (jaAvisou) return;
  jaAvisou = true;

  const linhas: string[] = [];
  for (const p of projetos) {
    const avisos = lacunasDe(p);
    if (avisos.length) linhas.push(`  ${p.numero} ${p.id}`, ...avisos.map((a) => `      · ${a}`));
  }
  const rascunhos = projetos.filter((p) => !p.data.textosAprovados).map((p) => p.numero);

  if (!linhas.length && !rascunhos.length) return;
  console.warn('\n[projetos] lacunas de conteúdo (só aqui: a página não mostra a seção sem dado)');
  if (linhas.length) console.warn(linhas.join('\n'));
  if (rascunhos.length) {
    console.warn(
      `  textos ainda em rascunho (${rascunhos.join(', ')}): depois de revisar, marque textosAprovados: true no .md`,
    );
  }
  console.warn('');
}
