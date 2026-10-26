---
titulo: CRUD API Data Application
resumo: 'Uma API REST com FastAPI e PostgreSQL para gerenciar vagas, com interface em Streamlit e 4 testes. Substitui uma lista manual de 643 vagas.'
tipo: api
inicio: 2026-07-09
fim: 2026-08-01
stack: [FastAPI, Postgres, Streamlit, SQLAlchemy, Pydantic, Docker, pytest]
stackDetalhe: [FastAPI, PostgreSQL, SQLAlchemy, Pydantic, Streamlit, Docker Compose, pytest]
destaque: 4
chamada: 643 vagas · 5 endpoints
numeros:
  - { valor: 643, rotulo: vagas importadas do ETL Vagas Tech }
  - { valor: 4, rotulo: testes automatizados com pytest }
repo: https://github.com/SamuelzinPires/crud-api-data-app
relacionados: [etl-vagas-tech]
peca:
  tipo: endpoints
  dados:
    comentario: os 5 endpoints da API · 4 cobertos por teste
    selecionado: 0
    endpoints:
      - metodo: get
        rota: /vagas
        descricao: lista paginada, filtro por nível
        resposta: '200'
        teste: true
        exemplo:
          codigo: |
            > GET /vagas?skip=0&limit=10&nivel=Sênior

            < 200 OK · lista paginada
            [{ id, titulo, empresa, link,
               formato, nivel }, ...]
          nota: titulo, empresa e link são obrigatórios (Pydantic); formato e nivel, opcionais.
      - { metodo: get, rota: '/vagas/{id}', descricao: busca uma vaga pelo id, resposta: '200 · 404', teste: false }
      - { metodo: post, rota: /vagas, descricao: cria uma vaga, resposta: '201', teste: true }
      - { metodo: put, rota: '/vagas/{id}', descricao: atualiza uma vaga, resposta: '200 · 404', teste: true }
      - { metodo: delete, rota: '/vagas/{id}', descricao: remove uma vaga, resposta: '200 · 404', teste: true }
    legenda:
      - = rota coberta por um teste com TestClient (4 de 5)
      - documentação interativa em /docs (Swagger)
comoFunciona:
  nota: FastAPI · PostgreSQL · Streamlit
  etapas:
    - { etapa: importar, texto: 'seed_data.py lê o CSV e faz POST linha a linha' }
    - { etapa: validar, texto: 'Pydantic: título, empresa e link obrigatórios' }
    - { etapa: gravar, texto: 'SQLAlchemy + PostgreSQL em Docker' }
    - { etapa: usar, texto: 'Swagger em /docs e interface Streamlit' }
decisoes:
  - decisao: Só o banco em Docker
    motivo: 'A API roda local e só o PostgreSQL fica no container: mais simples de depurar no v1.'
  - decisao: Padrão do FastAPI, não do Node
    motivo: Pastas app/routers seguindo a documentação oficial (Bigger Applications), em vez de copiar a estrutura do Express.
  - decisao: Filtro no backend
    motivo: O filtro por nível saiu da interface e virou parâmetro da API (?nivel=).
  - decisao: Campos opcionais de propósito
    motivo: 'formato e nivel podem faltar: nem toda vaga raspada traz essa informação.'
proximosPassos:
  - 'Campo status de candidatura: quero aplicar, aplicado, entrevista.'
  - 'Streamlit em 2 abas: a vaga escolhida vira uma candidatura acompanhada.'
---

Primeiro CRUD de verdade que construí do zero, pensado para uso diário: troca uma lista manual de vagas por um app com API por trás.

A API não faz scraping: só consome o CSV que o ETL Vagas Tech gerou e cadastra cada vaga por POST.
