---
titulo: Airflow ETL Orchestration
resumo: 'Qual percentual da energia gerada no Brasil foi renovável, por dia e por subsistema? Uma DAG diária responde com os dados públicos do ONS.'
tipo: orquestração
inicio: 2026-08-18
fim: 2026-10-25
stack: [Airflow 3, Postgres, Pandera, Docker, Python, Pandas]
stackDetalhe: [Apache Airflow 3, Docker Compose, PostgreSQL, Python, Pandas, Pandera]
destaque: 1
chamada: 289 dias de dados · CI verde
numeros:
  - { valor: 289, rotulo: dias com dado gravado }
  - { valor: 9, rotulo: testes no CI, tom: ok }
links:
  - rotulo: dados
    texto: ONS · balanço de energia nos subsistemas
    url: https://dados.ons.org.br/dataset/balanco-energia-subsistema
repo: https://github.com/SamuelzinPires/airflow-etl-orchestration_ONS
peca:
  tipo: calendario
  dados:
    comentario: execuções da DAG · 01/01 → 24/10/2026 · uma por dia
    inicio: 2026-01-01
    fim: 2026-10-24
    falhas:
      - { dia: 2026-10-14, motivo: 'falhou de propósito: o ONS ainda não tinha publicado o dia' }
      - { dia: 2026-10-15, motivo: 'falhou de propósito: o ONS ainda não tinha publicado o dia' }
    legendaFalha: '14 e 15/10: falharam de propósito, o ONS ainda não tinha publicado o dia'
    rotuloValor: '% renovável da geração'
    selecionado: 2026-09-15
    arquivo: airflow-geracao
comoFunciona:
  nota: '@daily · UTC · retries: 3'
  tom: ok
  etapas:
    - { etapa: extrair, texto: 'baixa o CSV anual do ONS; o XCom leva só o caminho' }
    - { etapa: transformar, texto: 'filtra o dia, tira a média por subsistema, calcula o %' }
    - { etapa: validar, texto: 'Pandera barra dado ruim antes da carga' }
    - { etapa: carregar, texto: 'Postgres: apaga o dia e insere, numa transação' }
decisoes:
  - decisao: Dois Postgres
    motivo: O banco de metadados do Airflow não guarda dado do pipeline. Misturar os dois prende o dado à ferramenta.
  - decisao: Agenda em UTC
    motivo: O ONS publica às 12h e às 19h UTC. O fuso de Brasília só entra dentro da task, na hora de ler o horário do CSV, que vem sem fuso. Dali em diante é tudo UTC.
  - decisao: Média antes do percentual
    motivo: Primeiro tiro a média de cada fonte de energia no dia, depois calculo o %. Tirar média de percentual dá número errado.
  - decisao: Sem dado, a execução falha
    motivo: Se o ONS ainda não publicou o dia, a task falha de propósito em vez de gravar vazio. Por isso 14 e 15/10 estão em âmbar.
  - decisao: Testes e CI na própria imagem
    motivo: Nove testes (integridade, estrutura, dependências e a conta do percentual) rodam no GitHub Actions a cada push, dentro da imagem do projeto. É o mesmo ambiente em que desenvolvo, sem instalar o Airflow à parte no CI.
aprendizados:
  - "Baixar o start_date de uma DAG que já rodou não refaz o passado. O scheduler só anda pra frente. Pra preencher o histórico usei o comando de backfill do Airflow."
  - "Um teste de dependência achou um bug meu. A carga não esperava a tabela ser criada e só funcionava porque ela já existia. Num banco novo as duas tasks competiriam."
  - "Tutorial de Airflow 2 engana na versão 3. O parâmetro include_examples do DagBag não existe mais. Em vez de procurar outra receita, perguntei pra versão instalada o que ela aceita."
---

O ONS publica a geração de energia de cada hora num único arquivo por ano. Uma DAG que roda todo dia precisa pegar exatamente o dia da execução dentro desse arquivo e gravar de um jeito que reprocessar não duplique nada.

Escolhi essa fonte por isso: com uma data em cada linha, idempotência e backfill deixam de ser exercício. Uma API que só devolve "o agora" tornaria a data da execução decorativa.
