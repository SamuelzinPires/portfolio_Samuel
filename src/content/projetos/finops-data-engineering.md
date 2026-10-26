---
titulo: FinOps Data Engineering
resumo: 'ETL de finanças pessoais: lê extratos do Nubank, categoriza por regras e carrega no PostgreSQL, com dashboard em Streamlit.'
tipo: etl · painel
inicio: 2026-02-21
fim: 2026-02-21
stack: [Postgres, Streamlit, Plotly, Python, Pandas, SQLAlchemy, Docker]
stackDetalhe: [Python, Pandas, SQLAlchemy, PostgreSQL, Streamlit · Plotly, Docker]
chamada: 17 categorias por regra
numeros:
  - { valor: 17, rotulo: categorias definidas por regra }
  - { valor: 137, rotulo: palavras-chave nas regras }
repo: https://github.com/SamuelzinPires/finops-data-engineering
peca:
  tipo: categorias
  dados:
    comentario: da descrição do extrato à categoria · a primeira regra que bate vence
    aviso: descrições de exemplo, escritas para esta página · sem dado real e sem valores
    exemplos:
      - { descricao: 'UBER *TRIP', categoria: Transporte, regra: '"uber"' }
      - { descricao: 'IFOOD *PEDIDO', categoria: Delivery, regra: '"ifood"' }
      - { descricao: 'XP INVESTIMENTOS', categoria: Investimento, regra: '"xp" · palavra exata' }
      - { descricao: 'SPOTIFY', categoria: Lazer, regra: '"spotify"' }
      - { descricao: 'PAGAMENTO DE FATURA', categoria: Pagamento de Fatura, regra: '"pagamento de fatura"' }
      - { descricao: 'TRANSFERENCIA PIX', regra: nenhuma regra bate }
    rotuloCategorias: palavras-chave por categoria
    categorias:
      - { nome: Investimento, palavras: 16 }
      - { nome: Lazer, palavras: 13 }
      - { nome: Roupa, palavras: 12 }
      - { nome: Assinaturas, palavras: 11 }
      - { nome: Transporte, palavras: 11 }
      - { nome: Supermercado, palavras: 11 }
      - { nome: Casa, palavras: 9 }
      - { nome: Saúde, palavras: 9 }
      - { nome: Educação, palavras: 9 }
      - { nome: Farmácia, palavras: 8 }
      - { nome: Delivery, palavras: 6 }
      - { nome: Beleza, palavras: 5 }
      - { nome: Taxas, palavras: 5 }
      - { nome: Presentes, palavras: 4 }
      - { nome: Pagamento de Fatura, palavras: 3 }
      - { nome: Empréstimo, palavras: 3 }
      - { nome: Transferência Interna, palavras: 2 }
    notas:
      - regras e contagens tiradas de category_transformer.py
      - palavra com até 3 letras precisa bater como palavra inteira
comoFunciona:
  nota: Python · PostgreSQL · Streamlit
  etapas:
    - { etapa: extrair, texto: 'parsers dos CSVs do Nubank: conta e cartão' }
    - { etapa: categorizar, texto: 'palavra-chave → categoria; até 3 letras, palavra exata' }
    - { etapa: carregar, texto: 'SQLAlchemy + padrão Repository no PostgreSQL' }
    - { etapa: painel, texto: 'Streamlit + Plotly: fluxo de caixa e despesas' }
---
