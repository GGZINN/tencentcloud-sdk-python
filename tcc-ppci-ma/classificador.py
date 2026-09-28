import csv
from dataclasses import dataclass, field
from pathlib import Path

PASTA_DADOS = Path(__file__).parent / "dados"

# área e altura limites da edificação "simplificada"
# TODO: conferir os valores na Lei 11.390/2020 e na NT 01/2024 do CBMMA
AREA_MAX_SIMPLIFICADA = 750.0
ALTURA_MAX_SIMPLIFICADA = 12.0

MEDIDAS_SIMPLIFICADA = [
    "Saídas de emergência",
    "Iluminação de emergência",
    "Sinalização de emergência",
    "Extintores",
]

NOMES_TIPO = {
    "I": "Edificação térrea",
    "II": "Edificação baixa",
    "III": "Edificação de baixa-média altura",
    "IV": "Edificação de média altura",
    "V": "Edificação medianamente alta",
    "VI": "Edificação alta",
}


@dataclass
class Resultado:
    divisao: str
    descricao: str
    tipo: str
    carga_incendio: float
    risco: str
    simplificada: bool
    medidas: list = field(default_factory=list)
    avisos: list = field(default_factory=list)

    @property
    def nome_tipo(self):
        return NOMES_TIPO[self.tipo]


def carregar_ocupacoes(arquivo=PASTA_DADOS / "ocupacoes.csv"):
    with open(arquivo, encoding="utf-8") as f:
        return {linha["divisao"]: linha for linha in csv.DictReader(f)}


def carregar_exigencias(arquivo=PASTA_DADOS / "exigencias.csv"):
    with open(arquivo, encoding="utf-8") as f:
        linhas = list(csv.DictReader(f))
    for l in linhas:
        l["tipos"] = [t.strip() for t in l["tipos"].split(";") if t.strip()]
    return linhas


def tipo_por_altura(altura, pavimentos=None):
    """Altura em metros, do piso de descarga até o piso do último pavimento."""
    if altura < 0:
        raise ValueError("altura não pode ser negativa")
    if pavimentos == 1 or altura == 0:
        return "I"
    if altura <= 6:
        return "II"
    if altura <= 12:
        return "III"
    if altura <= 23:
        return "IV"
    if altura <= 30:
        return "V"
    return "VI"


def risco_por_carga(carga):
    """Carga de incêndio em MJ/m²."""
    if carga <= 300:
        return "Baixo"
    if carga <= 1200:
        return "Médio"
    return "Alto"


def eh_simplificada(area, altura):
    return area <= AREA_MAX_SIMPLIFICADA and altura <= ALTURA_MAX_SIMPLIFICADA


def classificar(divisao, area, altura, pavimentos=None, carga_incendio=None,
                ocupacoes=None, exigencias=None):
    if area <= 0:
        raise ValueError("área tem que ser maior que zero")

    ocupacoes = ocupacoes or carregar_ocupacoes()
    exigencias = exigencias if exigencias is not None else carregar_exigencias()

    if divisao not in ocupacoes:
        raise KeyError(f"divisão {divisao} não cadastrada")
    ocup = ocupacoes[divisao]

    if carga_incendio is None:
        carga_incendio = float(ocup["carga_incendio"])

    tipo = tipo_por_altura(altura, pavimentos)
    res = Resultado(
        divisao=divisao,
        descricao=ocup["descricao"],
        tipo=tipo,
        carga_incendio=carga_incendio,
        risco=risco_por_carga(carga_incendio),
        simplificada=eh_simplificada(area, altura),
    )

    if res.simplificada:
        res.medidas = list(MEDIDAS_SIMPLIFICADA)
        return res

    regras = [e for e in exigencias if e["grupo"] == ocup["grupo"]]
    if not regras:
        res.avisos.append(
            f"Ainda não tem regras cadastradas para o grupo {ocup['grupo']} "
            "em dados/exigencias.csv."
        )
        return res

    for r in regras:
        if tipo in r["tipos"]:
            res.medidas.append(r["medida"])
            if r.get("obs"):
                res.avisos.append(f"{r['medida']}: {r['obs']}")
    return res
