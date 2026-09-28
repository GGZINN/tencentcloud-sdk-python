// Guarda os dados do formulário na URL, para dar para mandar o link com o caso preenchido.
// Ex.: ?ocupacao=A-2&area=4800&altura=28&pavimentos=10&carga=450

export type Entrada = {
  divisao: string;
  area: string;
  altura: string;
  pavimentos: string;
  cargaManual: boolean;
  carga: string;
};

export const PADRAO: Entrada = {
  divisao: "A-2",
  area: "4800",
  altura: "28",
  pavimentos: "10",
  cargaManual: false,
  carga: "300",
};

export function lerDaUrl(busca: string, divisoesValidas: string[]): Entrada {
  const q = new URLSearchParams(busca);
  const ocup = q.get("ocupacao");
  const carga = q.get("carga");
  return {
    divisao: ocup && divisoesValidas.includes(ocup) ? ocup : PADRAO.divisao,
    area: q.get("area") ?? PADRAO.area,
    altura: q.get("altura") ?? PADRAO.altura,
    pavimentos: q.get("pavimentos") ?? PADRAO.pavimentos,
    cargaManual: carga !== null,
    carga: carga ?? PADRAO.carga,
  };
}

export function paraUrl(e: Entrada): string {
  const q = new URLSearchParams({
    ocupacao: e.divisao,
    area: e.area,
    altura: e.altura,
    pavimentos: e.pavimentos,
  });
  if (e.cargaManual) q.set("carga", e.carga);
  return "?" + q.toString();
}
