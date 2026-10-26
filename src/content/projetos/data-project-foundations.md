---
titulo: Data Project Foundations
resumo: 'Um ETL pequeno com os alicerces de um projeto de dados: testes com pytest, dependências com Poetry e CI no GitHub Actions.'
tipo: fundação
inicio: 2026-04-16
fim: 2026-04-23
stack: [Poetry, pytest, GH Actions, Python, Pandas, pytest-cov]
stackDetalhe: [Python 3.12+, Pandas, Poetry, pytest + pytest-cov, GitHub Actions]
chamada: 'CI: 8 falhas → 5 verdes'
numeros:
  - { valor: 8, rotulo: falhas do CI até acertar a configuração, tom: falha }
  - { valor: 5, rotulo: execuções verdes seguidas desde então, tom: ok }
repo: https://github.com/SamuelzinPires/data-project-foundations
peca:
  tipo: fita-ci
  dados:
    comentario: as 13 execuções do CI no GitHub Actions, em ordem
    execucoes:
      - { dia: '22/04', hora: '14:29', ok: false }
      - { dia: '22/04', hora: '15:12', ok: false }
      - { dia: '22/04', hora: '15:38', ok: false }
      - { dia: '22/04', hora: '15:38', ok: false }
      - { dia: '22/04', hora: '15:48', ok: false }
      - { dia: '22/04', hora: '15:48', ok: false }
      - { dia: '22/04', hora: '22:14', ok: false }
      - { dia: '22/04', hora: '22:15', ok: false }
      - { dia: '22/04', hora: '22:45', ok: true }
      - { dia: '22/04', hora: '22:45', ok: true }
      - { dia: '23/04', hora: '00:05', ok: true }
      - { dia: '23/04', hora: '00:05', ok: true }
      - { dia: '23/04', hora: '00:06', ok: true }
    tituloCommits: commits feitos entre as tentativas (mensagens como estão no Git)
    commits:
      - { hora: '14:29', mensagem: 'fix: renomeando pasta workflow para workflows' }
      - { hora: '15:38', mensagem: 'fix:correção sintaxe e indentacao do yaml' }
      - { hora: '15:48', mensagem: 'fix: adicionando README provisorio para o poetry install' }
      - { hora: '22:14', mensagem: 'fix: removendo instrucao de package inexistente' }
      - { hora: '22:45', mensagem: primeira execução verde, ok: true }
    testes:
      titulo: pytest
      resumo: 4 testes · 5 casos
      arvore: |
        tests/test_pipeline.py
          test_extracao_dados
          test_transformacao_dados
          test_extracao_arquivo_inexistente  ×2
          test_load_dados

        tests/conftest.py
          fixture mock_df_bruto
      nota: O caso de arquivo inexistente roda 2 vezes com parametrize.
    legenda: { falhou: falhou, passou: passou, nota: 'push na main e pull requests, horário UTC' }
comoFunciona:
  nota: Python 3.12+ · Poetry · pytest
  etapas:
    - { etapa: extract, texto: 'pd.read_csv do arquivo de entrada' }
    - { etapa: transform, texto: 'colunas em minúsculo, linhas nulas removidas' }
    - { etapa: load, texto: 'grava o CSV limpo na saída' }
    - { etapa: CI, texto: 'a cada push e PR: poetry install + pytest --cov' }
---

Pipeline de dados costuma quebrar em silêncio quando não tem teste nem automação. Este projeto existe para treinar isso, num ETL pequeno o bastante para o foco ficar na engenharia em volta.

As 8 falhas do começo foram de configuração, não de código: nome da pasta do workflow, indentação do YAML e o Poetry pedindo um README e um pacote que não existia.
