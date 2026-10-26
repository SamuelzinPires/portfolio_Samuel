---
titulo: ETL Vagas Tech
resumo: 'Extração de vagas da área de dados da Gupy pela API JSON, com paginação automática, limpeza e carga em SQLite: 643 vagas.'
tipo: etl
inicio: 2026-02-25
fim: 2026-03-07
stack: [Requests, Pandas, SQLite, Python]
stackDetalhe: [Python, Requests, Pandas, SQLite]
chamada: 643 vagas via API
numeros:
  - { valor: 643, rotulo: vagas extraídas da Gupy }
  - { valor: 10, rotulo: 'vagas por página, até a lista acabar' }
repo: https://github.com/SamuelzinPires/etl-vagas-tech
peca:
  tipo: paginas
  dados:
    comentario: 643 vagas, 10 por requisição · cada coluna é uma página da API
    total: 643
    porPagina: 10
    selecionada: 33
    destino: { slug: crud-api-data-app, rotulo: CRUD API }
    banco: SQLite (tabela vagas)
    codigo: |
      offset = 0
      limite = 10
      while continuar_a_procurar:
          response = requests.get(api_url, headers=headers)
          dados_json = response.json()
          lista_de_vagas = dados_json['data']
          if len(lista_de_vagas) == 0:
              break
          ...
          offset += limite
    notaCodigo: Trecho de src/extrator.py. A busca usa jobName=dados; a primeira página vazia encerra o laço.
    legenda: { vaga: uma vaga, vazia: 'requisição vazia: fim da extração' }
comoFunciona:
  nota: Requests · Pandas · SQLite
  etapas:
    - { etapa: extrator, texto: 'API JSON da Gupy: offset + limit até vir vazio' }
    - { etapa: transformador, texto: 'traduz o formato e deduz a senioridade pelo título' }
    - { etapa: carregador, texto: 'DataFrame → tabela vagas no SQLite' }
    - { etapa: análise, texto: 'vagas por nível e empresas com mais vagas' }
decisoes:
  - decisao: Da raspagem de HTML para a API
    motivo: O 1º commit raspava títulos com BeautifulSoup; dois dias depois, o extrator passou a consumir a API JSON da Gupy.
relacionados: [crud-api-data-app]
---
