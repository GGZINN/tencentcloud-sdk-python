import { describe, expect, it } from "vitest";
import casos from "../../dados/casos_teste.json";
import { agruparMedidas, classificar, lerCsv, riscoPorCarga, tipoPorAltura } from "./classificador";

describe("tipoPorAltura", () => {
  it.each([
    [0, 1, "I"], [3, 1, "I"], [6, 3, "II"], [6.01, 3, "III"],
    [12, 5, "III"], [23, 9, "IV"], [30, 11, "V"], [45, 16, "VI"],
  ] as const)("%s m, %s pav. -> %s", (h, p, t) => {
    expect(tipoPorAltura(h, p)).toBe(t);
  });

  it("recusa altura negativa", () => {
    expect(() => tipoPorAltura(-1)).toThrow();
  });
});

it.each([[300, "Baixo"], [301, "Médio"], [1200, "Médio"], [1500, "Alto"]] as const)(
  "risco com %s MJ/m² = %s",
  (c, r) => expect(riscoPorCarga(c)).toBe(r),
);

// casos compartilhados com a versão em Python (../test_classificador.py)
describe("casos compartilhados", () => {
  it.each(casos.map((c) => [c.nome, c] as const))("%s", (_, c) => {
    const r = classificar(c.divisao, c.area, c.altura, c.pavimentos, c.carga);
    expect(r.tipo).toBe(c.tipo);
    expect(r.risco).toBe(c.risco);
    expect(r.simplificada).toBe(c.simplificada);
    for (const m of c.contem) expect(r.medidas).toContain(m);
    for (const m of c.nao_contem) expect(r.medidas).not.toContain(m);
    if (c.sem_medidas) {
      expect(r.medidas).toEqual([]);
      expect(r.avisos.length).toBeGreaterThan(0);
    }
  });
});

it("lê campo com vírgula entre aspas", () => {
  expect(lerCsv('a,b\n"x, y",2')[0]).toEqual({ a: "x, y", b: "2" });
});

it("agrupa medidas por categoria", () => {
  const g = Object.fromEntries(agruparMedidas(["Extintores", "Saídas de emergência"]));
  expect(g["Detecção e combate"]).toEqual(["Extintores"]);
  expect(g["Abandono"]).toEqual(["Saídas de emergência"]);
});
