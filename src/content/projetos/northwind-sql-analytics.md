---
titulo: Northwind SQL Analytics
resumo: 'Receita, crescimento, ranking e segmentação de clientes: 7 views de negócio em PostgreSQL, com CTEs e window functions.'
tipo: sql
inicio: 2026-06-10
fim: 2026-06-10
stack: [PostgreSQL, Docker, PgAdmin, SQL]
stackDetalhe: [PostgreSQL 15+, Docker Compose, PgAdmin 4, 'SQL: CTEs, window functions']
chamada: 7 views de negócio
numeros:
  - { valor: 7, rotulo: 'views analíticas, uma por pergunta' }
  - { valor: 5, rotulo: tabelas de origem do Northwind }
repo: https://github.com/SamuelzinPires/northwind-sql-analytics
peca:
  tipo: grafo
  dados:
    comentario: 5 tabelas → 7 views · cada view responde a uma pergunta de negócio
    tabelas: [customers, orders, order_details, employees, products]
    selecionada: vw_crescimento_mensal
    legenda: { aberta: view aberta (toque ou passe o cursor), ligacao: tabelas que ela consulta }
    views:
      - nome: vw_receita_ytd
        conceito: SUM() OVER
        tabelas: [orders, order_details]
        pergunta: Qual a receita mês a mês e o acumulado do ano?
        codigo: |
          SUM(receita_do_mes)
            OVER (PARTITION BY ano ORDER BY mes)
            AS receita_ytd
      - nome: vw_crescimento_mensal
        conceito: LAG()
        tabelas: [orders, order_details]
        pergunta: A receita está crescendo ou caindo mês a mês? Qual o percentual de variação?
        codigo: |
          LAG(faturamento_atual)
            OVER (ORDER BY ano, mes)
            AS faturamento_anterior
          …
          CASE
            WHEN faturamento_anterior IS NULL
              OR faturamento_anterior = 0 THEN 0
            ELSE ROUND(((faturamento_atual
              - faturamento_anterior)
              / faturamento_anterior * 100)::NUMERIC, 2)
          END AS percentual_growth
      - nome: vw_top_10_produtos
        conceito: GROUP BY + LIMIT
        tabelas: [order_details, products]
        pergunta: Quais são os 10 produtos que mais faturam?
        codigo: |
          GROUP BY p.product_id, od.product_id, p.product_name
          ORDER BY SUM(od.unit_price * od.quantity) DESC
          LIMIT 10
      - nome: vw_top_funcionarios_1997
        conceito: JOIN 3 tabelas
        tabelas: [employees, orders, order_details]
        pergunta: Quais funcionários geraram mais receita em 1997?
        codigo: |
          FROM employees e
          JOIN orders o ON e.employee_id = o.employee_id
          JOIN order_details od ON o.order_id = od.order_id
          WHERE EXTRACT(YEAR FROM o.order_date) = 1997
      - nome: vw_segmentacao_clientes
        conceito: NTILE(5)
        tabelas: [customers, orders, order_details]
        pergunta: Como segmentar a base por comportamento de compra?
        codigo: |
          NTILE(5) OVER (ORDER BY total_gasto DESC) AS quintil
          …
          WHEN NTILE(5) OVER (ORDER BY total_gasto DESC) <= 2
            THEN 'Premium (Top 40%)'
      - nome: vw_clientes_uk_premium
        conceito: WHERE + HAVING
        tabelas: [customers, orders, order_details]
        pergunta: Quais clientes UK têm mais de $1.000 em compras?
        codigo: |
          WHERE c.country = 'UK'
          GROUP BY c.customer_id, c.company_name, c.country
          HAVING SUM(od.unit_price * od.quantity) > 1000
      - nome: vw_clientes_vip
        conceito: CTE + NTILE
        tabelas: [customers, orders, order_details]
        pergunta: Quem são os clientes VIP (Top 40%)?
        codigo: |
          NTILE(5) OVER (ORDER BY faturamento_total DESC)
            AS tier_clientes
          …
          WHERE tier_clientes <= 2
comoFunciona:
  nota: PostgreSQL 15+ · Docker Compose
  etapas:
    - { etapa: subir, texto: 'docker compose com PostgreSQL e PgAdmin' }
    - { etapa: popular, texto: 'carrega a base Northwind: pedidos, clientes, produtos' }
    - { etapa: criar views, texto: 'sql/views.sql: 7 CREATE OR REPLACE VIEW' }
    - { etapa: consultar, texto: 'SELECT * FROM vw_…, pronto para um dashboard' }
decisoes:
  - decisao: Uma view por pergunta
    motivo: Cada pergunta de negócio vira uma view documentada no banco, reutilizável por qualquer dashboard.
  - decisao: CTEs encadeadas, não subquery
    motivo: Cada etapa lê a anterior, como uma linha de montagem. Usado em vw_crescimento_mensal e vw_clientes_vip.
  - decisao: Divisão por zero tratada
    motivo: Se o mês anterior for nulo ou zero, o crescimento vira 0 em vez de derrubar a consulta.
  - decisao: NTILE em vez de cortes manuais
    motivo: 'O banco divide os clientes em 5 faixas sozinho: 1–2 Premium, 3–4 Regular, 5 Low Value.'
aprendizados:
  - GROUP BY esmaga as linhas; window function calcula por grupo e mantém cada linha na tela.
  - WHERE filtra as linhas antes do GROUP BY; HAVING filtra os grupos depois.
  - 'O PostgreSQL não arredonda FLOAT com ROUND: precisa converter para ::NUMERIC antes.'
---

Escrever SQL que roda é o começo. Aqui o objetivo era traduzir perguntas de negócio (quanto fatura, se está crescendo, quem compra mais, o que mais vende) em consultas que outra pessoa consiga reaproveitar.

Por isso cada pergunta virou uma view documentada no banco, pronta para alimentar um dashboard sem ninguém reescrever a consulta.
