# Classificador PPCI - MA

Protótipo do TCC (Engenharia Civil). Classifica a edificação pela ocupação,
altura e carga de incêndio e lista as medidas de segurança contra incêndio
exigidas, seguindo a legislação do Maranhão (Lei 11.390/2020 e NTs do CBMMA).

**Atenção:** as tabelas em `dados/` ainda são provisórias. Os limites de
altura, risco e edificação simplificada e as exigências do grupo A foram
lançados como ponto de partida e **precisam ser conferidos com a NT 01/2024 do
CBMMA** antes de qualquer uso. Os outros grupos ainda não têm regras.

## Como rodar

```
pip install -r requirements.txt
streamlit run app.py
```

Testes:

```
pytest
```

## Estrutura

- `classificador.py` - regras de classificação (tipo por altura, risco, simplificada) e busca das medidas
- `app.py` - interface em Streamlit
- `dados/ocupacoes.csv` - divisões de ocupação e carga de incêndio de referência
- `dados/exigencias.csv` - medidas exigidas por grupo e por tipo de edificação
- `test_classificador.py` - testes com casos resolvidos à mão

## Como cadastrar as exigências de um grupo

Cada linha de `exigencias.csv` é uma medida. Na coluna `tipos` vão os tipos de
edificação (I a VI) em que a medida é exigida, separados por `;`. É só copiar a
tabela da NT, linha por linha. A coluna `obs` serve para as notas da tabela
e aparece como aviso no app.

## Próximos passos

- [ ] Conferir limites e tabelas com a NT 01/2024
- [ ] Cadastrar os demais grupos (B, C, D, E, F, H, I, J...)
- [ ] Módulo de saídas de emergência (população, unidades de passagem)
- [ ] Módulo de extintores e de hidrantes
- [ ] Relatório em PDF
