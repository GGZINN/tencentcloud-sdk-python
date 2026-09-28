import { expect, it } from "vitest";
import { PADRAO, lerDaUrl, paraUrl } from "./estadoUrl";

const DIVISOES = ["A-2", "D-1"];

it("sem parâmetros usa o padrão", () => {
  expect(lerDaUrl("", DIVISOES)).toEqual(PADRAO);
});

it("ida e volta mantém os dados", () => {
  const e = { divisao: "D-1", area: "1250,5", altura: "18", pavimentos: "6", cargaManual: true, carga: "700" };
  expect(lerDaUrl(paraUrl(e), DIVISOES)).toEqual(e);
});

it("sem carga na URL, carga manual fica desligada", () => {
  const url = paraUrl({ ...PADRAO, cargaManual: false, carga: "999" });
  expect(url).not.toContain("carga");
  expect(lerDaUrl(url, DIVISOES).cargaManual).toBe(false);
});

it("ocupação desconhecida volta para o padrão", () => {
  expect(lerDaUrl("?ocupacao=Z-9", DIVISOES).divisao).toBe(PADRAO.divisao);
});
