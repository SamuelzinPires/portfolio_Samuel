---
titulo: Data Quality Engineering
resumo: 'Pipeline que detecta e reporta problemas de qualidade em 541.909 transações do Online Retail, com 6 regras de validação em Pandera.'
tipo: qualidade
inicio: 2026-08-02
fim: 2026-08-06
stack: [DuckDB, Pandera, Pandas, Python]
stackDetalhe: [Python 3.14, DuckDB, Pandas, Pandera]
destaque: 2
chamada: 6 regras · 541 mil linhas
numeros:
  - { valor: '541.909', rotulo: transações verificadas }
  - { valor: 6, rotulo: regras de qualidade em Pandera }
repo: https://github.com/SamuelzinPires/data-quality-engineering
peca:
  tipo: barras
  dados:
    comentario: violações por regra · o trilho inteiro são as 541.909 linhas
    total: 541909
    regras:
      - regra: CustomerID não nulo
        violacoes: 135080
        detalhe: completude · cliente não identificado na transação
      - regra: Quantity ≥ 0
        violacoes: 10624
        detalhe: menor quantidade na base · −80.995
      - regra: InvoiceNo só dígitos
        violacoes: 9291
        detalhe: notas de cancelamento começam com a letra C
      - regra: linha duplicada
        violacoes: 5268
        detalhe: cópias exatas medidas no profiling com DuckDB
      - regra: StockCode no padrão
        violacoes: 5265
        detalhe: 5 dígitos e letra maiúscula opcional · 1.124 códigos distintos fora do padrão
      - regra: UnitPrice > 0
        violacoes: 2517
        detalhe: menor preço na base · −11.062,06
    codigo: |
      schema = pa.DataFrameSchema({
          "CustomerID": pa.Column(
              pa.Float64, nullable=False),
          ...
      }, unique=[...])  # as 8 colunas

      schema.validate(df, lazy=True)
    legenda:
      - linhas que violam a regra
      - duplicatas = cópias exatas medidas no profiling (DuckDB)
comoFunciona:
  nota: Python 3.14 · DuckDB · Pandera
  etapas:
    - { etapa: carregar, texto: 'Online Retail (.xlsx) para um DuckDB local' }
    - { etapa: medir, texto: 'profiling com SUMMARIZE: nulos, faixas, duplicatas' }
    - { etapa: validar, texto: 'Pandera: 6 regras, lazy=True' }
    - { etapa: reportar, texto: 'CSV detalhado + resumo por regra' }
decisoes:
  - decisao: Detectar, não corrigir
    motivo: O pipeline garante que nada passe despercebido; tratar cada caso fica com quem usa o dado.
  - decisao: Quantity = 0 é válido
    motivo: 'A regra é ≥ 0, calibrada pelo profiling: exigir > 1 marcaria muita venda legítima como erro.'
  - decisao: lazy=True
    motivo: Sem ele o Pandera para no primeiro erro; com ele, todas as violações entram num relatório só.
  - decisao: Resumo versionado, detalhe local
    motivo: O relatório linha a linha (~13 MB) fica fora do Git; o resumo por regra é versionado como prova do que o pipeline entrega.
aprendizados:
  - 'Profiling vem antes da regra: sem medir os dados, a regra vira achismo.'
  - Pandera valida a tabela inteira; Pydantic valida um registro por vez. São ferramentas para escalas diferentes.
  - 'Duplicata é propriedade da linha, não de uma coluna: por isso a regra fica no nível do schema.'
---

Dado com problema passa despercebido quando ninguém mede. Aqui, regras explícitas rodam sobre um dataset real e cada violação vira uma linha num relatório auditável.

O pipeline detecta e reporta, mas não corrige: quem consome o relatório decide se imputa, remove ou investiga.
