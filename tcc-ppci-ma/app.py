import pandas as pd
import streamlit as st

from classificador import (
    AREA_MAX_SIMPLIFICADA,
    ALTURA_MAX_SIMPLIFICADA,
    carregar_ocupacoes,
    classificar,
)

st.set_page_config(page_title="Classificador PPCI - MA", layout="centered")

st.title("Classificador de edificações - PPCI/MA")
st.caption(
    "Protótipo do TCC. Os dados das tabelas ainda precisam ser conferidos "
    "com a Lei 11.390/2020 e as Normas Técnicas do CBMMA."
)

ocupacoes = carregar_ocupacoes()
opcoes = {f"{d} - {o['descricao']}": d for d, o in ocupacoes.items()}

with st.form("dados"):
    escolha = st.selectbox("Ocupação / uso", list(opcoes.keys()))
    col1, col2, col3 = st.columns(3)
    area = col1.number_input("Área construída (m²)", min_value=1.0, value=500.0, step=10.0)
    altura = col2.number_input("Altura (m)", min_value=0.0, value=9.0, step=0.5,
                               help="Do piso do pavimento de descarga até o piso do último pavimento.")
    pavimentos = col3.number_input("Nº de pavimentos", min_value=1, value=4, step=1)

    usar_carga = st.checkbox("Informar a carga de incêndio manualmente")
    carga = None
    if usar_carga:
        carga = st.number_input("Carga de incêndio (MJ/m²)", min_value=0.0, value=300.0, step=50.0)

    enviar = st.form_submit_button("Classificar")

if enviar:
    divisao = opcoes[escolha]
    res = classificar(divisao, area, altura, int(pavimentos), carga, ocupacoes=ocupacoes)

    st.subheader("Classificação")
    c1, c2, c3 = st.columns(3)
    c1.metric("Divisão", res.divisao)
    c2.metric("Tipo (altura)", res.tipo)
    c2.caption(res.nome_tipo)
    c3.metric("Risco", res.risco)
    c3.caption(f"Carga de incêndio: {res.carga_incendio:.0f} MJ/m²")

    if res.simplificada:
        st.info(
            f"Área até {AREA_MAX_SIMPLIFICADA:.0f} m² e altura até "
            f"{ALTURA_MAX_SIMPLIFICADA:.0f} m: medidas da edificação simplificada."
        )

    st.subheader("Medidas exigidas")
    if res.medidas:
        st.table(pd.DataFrame({"Medida de segurança": res.medidas}, index=range(1, len(res.medidas) + 1)))
    for aviso in res.avisos:
        st.warning(aviso)
