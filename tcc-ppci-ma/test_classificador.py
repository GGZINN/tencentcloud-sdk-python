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


def test_residencial_pequeno_eh_simplificado():
    res = classificar("A-2", area=600, altura=9, pavimentos=4)
    assert res.simplificada
    assert "Extintores" in res.medidas
    assert "Hidrantes e mangotinhos" not in res.medidas


def test_residencial_alto():
    res = classificar("A-2", area=4800, altura=28, pavimentos=10)
    assert not res.simplificada
    assert res.tipo == "V"
    assert "Alarme de incêndio" in res.medidas
    assert "Compartimentação vertical" in res.medidas


def test_residencial_medio_sem_alarme():
    res = classificar("A-2", area=2000, altura=15, pavimentos=6)
    assert res.tipo == "IV"
    assert "Alarme de incêndio" not in res.medidas
    assert "Hidrantes e mangotinhos" in res.medidas


def test_grupo_sem_regras_avisa():
    res = classificar("D-1", area=2000, altura=20)
    assert res.medidas == []
    assert res.avisos


def test_carga_informada_muda_risco():
    res = classificar("C-2", area=500, altura=4, pavimentos=2, carga_incendio=1300)
    assert res.risco == "Alto"
