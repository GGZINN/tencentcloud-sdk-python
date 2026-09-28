import { describe, expect, it } from "vitest";
import { agruparMedidas, classificar, lerCsv, riscoPorCarga, tipoPorAltura } from "./classificador";

// mesmos casos de ../test_classificador.py
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

it("residencial pequeno é simplificado", () => {
  const r = classificar("A-2", 600, 9, 4);
  expect(r.simplificada).toBe(true);
  expect(r.medidas).toContain("Extintores");
  expect(r.medidas).not.toContain("Hidrantes e mangotinhos");
});

it("residencial alto", () => {
  const r = classificar("A-2", 4800, 28, 10);
  expect(r.tipo).toBe("V");
  expect(r.medidas).toContain("Alarme de incêndio");
  expect(r.medidas).toContain("Compartimentação vertical");
});

it("residencial médio sem alarme", () => {
  const r = classificar("A-2", 2000, 15, 6);
  expect(r.tipo).toBe("IV");
  expect(r.medidas).not.toContain("Alarme de incêndio");
});

it("grupo sem regras gera aviso", () => {
  const r = classificar("D-1", 2000, 20);
  expect(r.medidas).toEqual([]);
  expect(r.avisos.length).toBeGreaterThan(0);
});

it("carga informada muda o risco", () => {
  expect(classificar("C-2", 500, 4, 2, 1300).risco).toBe("Alto");
});

it("lê campo com vírgula entre aspas", () => {
  expect(lerCsv('a,b\n"x, y",2')[0]).toEqual({ a: "x, y", b: "2" });
});

it("agrupa medidas por categoria", () => {
  const g = Object.fromEntries(agruparMedidas(["Extintores", "Saídas de emergência"]));
  expect(g["Detecção e combate"]).toEqual(["Extintores"]);
  expect(g["Abandono"]).toEqual(["Saídas de emergência"]);
});
