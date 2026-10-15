# CLAUDE.md — portfolio-site

Site de portfólio pessoal do **Samuel Pires de Miranda**, engenheiro de dados júnior (Goiânia/GO). Site em **português**.

## Modo de trabalho deste projeto
- **Vibecoding:** aqui você (IA) **escreve o código**. A "Regra Zero" dos projetos de dados do Samuel (mentor não escreve código) **não vale neste repositório**: front-end não é o foco de carreira dele.
- **Uma parte por sessão.** As partes estão em `Gerenciamento_Projeto/Portfolio-Site.md`. Não pule partes e não adiante escopo de outra parte.
- **Mostre rodando** (`npm run dev`) e peça aprovação visual do Samuel antes de considerar a parte pronta.
- **No fim de cada parte:** explique em 3–5 linhas, em linguagem simples, o que foi feito e por quê, pra ele conseguir explicar o site numa entrevista.
- **No fim de toda sessão, atualize `Gerenciamento_Projeto/Portfolio-Site.md` sozinho:** estado da parte, entrada no log de sessões (o que foi feito, decisões, problemas e causa) e próximos passos.

## Stack (não trocar sem perguntar)
- **Astro** (site estático) + **TypeScript**
- **Three.js puro** (sem React / sem React Three Fiber) + **shaders GLSL** próprios
- **GSAP** + ScrollTrigger pra animação · **Lenis** pra rolagem suave, sincronizada com o loop do WebGL
- **CSS próprio com variáveis** (sem Bootstrap, sem biblioteca de componentes)
- Conteúdo dos projetos em **Markdown** (`src/content/projetos/*.md`, Astro content collections)
- Deploy: **Vercel** (plano Hobby) ligado ao GitHub
- Versões travadas no `package-lock.json`. Não adicionar dependência nova sem justificar

## Visual
- **Assunto do visual: engenharia de dados** (pipelines, fluxo de dados, DAGs, camadas bronze/silver/gold, terminal/log). Os 4 sites de referência são a **técnica**, não o tema. **A direção exata ainda não foi decidida**: na Parte 1, proponha opções e espere a escolha.
- Referências de técnica:
  - abysswalker.jp: **só** a interação de hover (malha que se deforma perto do cursor, com atraso elástico/lerp)
  - p5aholic.me/projects: abertura limpa, shaders e matemática em vez de modelo 3D pesado
  - lqve.jp: rolagem interativa, cursor, distorção de imagem no hover
  - jesperlandberg.com: rolagem lateral pra escolher entre os 3–4 projetos em destaque, cursor
- Paleta de partida (marca atual dele no GitHub e no currículo): fundo `#0D1117`, azul `#1F6FEB`. Pode evoluir na Parte 1
- Visuais 3D dos projetos: **abstratos e feitos em código**, sem modelos baixados nem Blender

## Requisitos que não podem faltar
- **Mobile:** no celular não existe cursor. Todo efeito de hover precisa de versão por toque ou estática. Recrutador abre o link pelo LinkedIn no celular
- **Desempenho:** Lighthouse ≥ 90. Reduzir ou desligar shaders pesados em telas pequenas e GPUs fracas. `devicePixelRatio` limitado
- **Acessibilidade:** respeitar `prefers-reduced-motion`. O site precisa funcionar e ser legível se o WebGL falhar ou estiver desligado. Contraste legível, navegação por teclado
- **Open Graph:** título, descrição e imagem de compartilhamento por página

## Conteúdo
- **Única fonte de conteúdo pessoal:** `Gerenciamento_Projeto/Conteudo-Portfolio.md`. **Não invente** dado, número, empresa, certificado ou depoimento. Item marcado como "⚠️ a decidir" lá: use um placeholder visível e avise o Samuel
- Contato público: e-mail, LinkedIn e GitHub. **Não publicar o telefone**

## Git
- O `git init` tem que ser feito **dentro desta pasta**: a pasta pai `Desktop/Projetos/` tem um `.git` próprio. Confira com `git rev-parse --show-toplevel`, que tem que apontar pra `portfolio-site`
- `Gerenciamento_Projeto/` fica **fora do Git** (no `.gitignore`)
- Commits pequenos, mensagem no padrão `feat:` / `fix:` / `chore:`
- A pasta está no OneDrive: `node_modules/` e `dist/` sempre no `.gitignore`

## Segurança (o Samuel está aprendendo: explique cada item em linguagem simples quando aplicar)

Site estático, sem login, sem banco e sem formulário: a superfície de ataque é pequena. Os riscos reais são **vazar segredo ou dado pessoal**, **dependência maliciosa** e **sequestro das contas** (GitHub, Vercel, domínio). Regras:

**Segredos e dados pessoais**
- Nenhum token, chave ou senha no código ou no histórico do Git. Se um dia precisar de variável secreta, ela vai nas *Environment Variables* da Vercel, nunca num arquivo commitado. `.env*` sempre no `.gitignore`
- Se um segredo for commitado por engano: **trocar o segredo na hora** (apagar o commit não basta, o histórico guarda)
- Não publicar telefone, endereço, CPF, histórico escolar nem documento. Antes de copiar um PDF pra `public/`, confirmar que ele só tem o necessário (nome + curso)
- Nunca pedir pro Samuel colar token ou senha no chat

**Dependências (cadeia de suprimentos)**
- Antes de instalar um pacote novo: conferir o nome exato (golpe de nome parecido, ex.: `lodahs` × `lodash`), se é mantido e se é popular. Preferir as libs já escolhidas na stack
- Rodar `npm audit` depois de instalar e na Parte 7. Corrigir o que for alto/crítico
- `package-lock.json` sempre commitado (trava as versões)

**Navegador e headers** *(via `vercel.json`, na Parte 7)*
- Headers: `Content-Security-Policy` (só carregar script/estilo/fonte do próprio site; liberar só o necessário pro WebGL), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` desligando câmera, microfone e geolocalização, `frame-ancestors 'none'` (impede o site de ser embutido em outro pra clickjacking). HTTPS fica por conta da Vercel
- Todo link externo com `target="_blank"` leva `rel="noopener noreferrer"`
- **Sem scripts de terceiros** (rastreadores, widgets, CDNs) sem perguntar. **Fontes hospedadas no próprio site** (não puxar do Google Fonts em tempo real): mais rápido e não envia o IP do visitante pra terceiros
- Sem cookies e sem analytics que rastreiem: assim não precisa de banner de LGPD. Se o Samuel quiser analytics, usar um sem cookies (ex.: Vercel Web Analytics) e avisar

**Comandos no terminal**
- Antes de rodar comando destrutivo (`rm -rf`, `git reset --hard`, `git push --force`) ou script baixado da internet (`curl ... | sh`), **explicar o que faz e pedir confirmação**

**Contas (o Samuel faz, a IA lembra)**
- 2FA ligado no **GitHub, Vercel, registrador do domínio e e-mail**. Quem invade uma dessas contas troca o site inteiro
- No GitHub: ligar *secret scanning* e *push protection* no repo, e o Dependabot pra avisar dependência vulnerável
- No registrador: ligar o *domain lock* (trava de transferência)
