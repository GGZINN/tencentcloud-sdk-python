import json
from pathlib import Path

import pytest

from classificador import classificar, risco_por_carga, tipo_por_altura


@pytest.mark.parametrize("altura, pav, esperado", [
    (0, 1, "I"),
    (3, 1, "I"),
    (6, 3, "II"),
    (6.01, 3, "III"),
    (12, 5, "III"),
    (23, 9, "IV"),
    (30, 11, "V"),
    (45, 16, "VI"),
])
def test_tipo_por_altura(altura, pav, esperado):
    assert tipo_por_altura(altura, pav) == esperado


def test_altura_negativa():
    with pytest.raises(ValueError):
        tipo_por_altura(-1)


@pytest.mark.parametrize("carga, esperado", [
    (300, "Baixo"), (301, "Médio"), (1200, "Médio"), (1500, "Alto"),
])
def test_risco(carga, esperado):
    assert risco_por_carga(carga) == esperado


# casos compartilhados com a versão web (web/src/classificador.test.ts)
CASOS = json.loads((Path(__file__).parent / "dados" / "casos_teste.json").read_text(encoding="utf-8"))


@pytest.mark.parametrize("caso", CASOS, ids=[c["nome"] for c in CASOS])
def test_casos_compartilhados(caso):
    res = classificar(caso["divisao"], caso["area"], caso["altura"],
                      caso.get("pavimentos"), caso.get("carga"))
    assert res.tipo == caso["tipo"]
    assert res.risco == caso["risco"]
    assert res.simplificada == caso["simplificada"]
    for m in caso["contem"]:
        assert m in res.medidas
    for m in caso["nao_contem"]:
        assert m not in res.medidas
    if caso.get("sem_medidas"):
        assert res.medidas == [] and res.avisos
