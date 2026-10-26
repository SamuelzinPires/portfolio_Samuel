---
titulo: Pipeline ELT AgroTech AWS
resumo: 'Um pipeline serverless na AWS: dados de soja e milho de Goiás viram Parquet no S3 e tabelas no Athena, nas camadas bronze, prata e ouro.'
tipo: cloud · elt
inicio: 2026-03-11
fim: 2026-03-31
stack: [S3, Lambda, Athena, Python, Pandas, boto3, pyarrow, IAM, Looker Studio]
stackDetalhe: [Python 3.12, Pandas · boto3 · pyarrow, Amazon S3, AWS Lambda, Amazon Athena, AWS IAM, Looker Studio]
destaque: 3
chamada: bronze → prata → ouro
numeros:
  - { valor: 3, rotulo: 'camadas: bronze, prata e ouro' }
  - { valor: 2, rotulo: 'culturas desde 2010: soja e milho' }
repo: https://github.com/SamuelzinPires/Projeto-agro-elt-pipeline-aws
peca:
  tipo: camadas
  dados:
    comentario: a forma da tabela em cada camada · de larga para longa
    camadas:
      - nome: bronze
        tom: bronze
        formato: CSV · S3
        colunas: [Grain, Year, mun., mun., mun., …]
        linhas: 2
        legenda: uma coluna por município, de vários estados
      - nome: lambda
        tom: lambda
        formato: Pandas
        passos:
          - Year ≥ 2010
          - só Soybeans e Maize
          - 'melt: municípios → linhas'
          - Valor > 0, sem nulos
          - só municípios (GO)
          - traduz para pt-BR
      - nome: prata
        tom: prata
        formato: Parquet · S3
        colunas: [Estado, Ano, Cultura, Municipio, Toneladas]
        linhas: 5
        legenda: uma linha por município de Goiás, cultura e ano
      - nome: ouro
        tom: ouro
        formato: Athena
        itens:
          - tabela externa → prata
          - CTAS agrega as toneladas
          - Looker Studio lê o ouro
    codigo: |
      df_long = pd.melt(
          df,
          id_vars=['Grain', 'Year'],
          var_name='Municipio',
          value_name='Valor'
      )
    notaCodigo: 'O passo que muda a forma da tabela: cada coluna de município vira uma linha. Trecho de lambda_function.py.'
comoFunciona:
  nota: S3 · Lambda · Athena
  etapas:
    - { etapa: bronze, texto: 'CSV bruto no S3, um município por coluna' }
    - { etapa: lambda, texto: 'Pandas: filtra, faz o melt e fica só com Goiás' }
    - { etapa: prata, texto: 'Parquet no S3, formato longo' }
    - { etapa: ouro, texto: 'Athena: tabela externa + CTAS → Looker Studio' }
decisoes:
  - decisao: Parquet na prata
    motivo: Formato colunar e compactado, feito para consulta analítica.
  - decisao: Athena em vez de banco
    motivo: 'Tabelas externas direto no S3: SQL sem servidor para administrar.'
  - decisao: Pandas no Lambda via layer
    motivo: O Lambda não traz o Pandas; uma Custom Layer resolve sem empacotar tudo junto.
proximosPassos:
  - EventBridge para disparar o Lambda quando um arquivo novo cair no bronze.
  - Looker Studio ligado direto no Athena, em vez de extração estática.
  - Testes locais com moto, simulando os serviços da AWS.
---
