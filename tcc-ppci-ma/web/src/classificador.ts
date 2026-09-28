// Mesmas regras de ../classificador.py. Se mudar uma, mude a outra.
import ocupacoesCsv from "../../dados/ocupacoes.csv?raw";
import exigenciasCsv from "../../dados/exigencias.csv?raw";

// TODO: conferir os valores na Lei 11.390/2020 e na NT 01/2024 do CBMMA
export const AREA_MAX_SIMPLIFICADA = 750;
export const ALTURA_MAX_SIMPLIFICADA = 12;

export const MEDIDAS_SIMPLIFICADA = [
  "Saídas de emergência",
  "Iluminação de emergência",
  "Sinalização de emergência",
  "Extintores",
];

export type Tipo = "I" | "II" | "III" | "IV" | "V" | "VI";

export const FAIXAS: { tipo: Tipo; nome: string; faixa: string }[] = [
  { tipo: "I", nome: "Térrea", faixa: "1 pavimento" },
  { tipo: "II", nome: "Baixa", faixa: "até 6 m" },
  { tipo: "III", nome: "Baixa-média", faixa: "6 a 12 m" },
  { tipo: "IV", nome: "Média", faixa: "12 a 23 m" },
  { tipo: "V", nome: "Medianamente alta", faixa: "23 a 30 m" },
  { tipo: "VI", nome: "Alta", faixa: "acima de 30 m" },
];

export type Ocupacao = {
  divisao: string;
  grupo: string;
  descricao: string;
  carga_incendio: number;
};

export type Exigencia = {
  grupo: string;
  medida: string;
  tipos: string[];
  obs: string;
};

export type Resultado = {
  divisao: string;
  descricao: string;
  tipo: Tipo;
  cargaIncendio: number;
  risco: "Baixo" | "Médio" | "Alto";
  simplificada: boolean;
  medidas: string[];
  avisos: string[];
};

// parser simples: aceita campos entre aspas com vírgula dentro
export function lerCsv(texto: string): Record<string, string>[] {
  const linhas = texto.trim().split(/\r?\n/);
  const partir = (linha: string) => {
    const campos: string[] = [];
    let atual = "";
    let aspas = false;
    for (const c of linha) {
      if (c === '"') aspas = !aspas;
      else if (c === "," && !aspas) {
        campos.push(atual);
        atual = "";
      } else atual += c;
    }
    campos.push(atual);
    return campos;
  };
  const cab = partir(linhas[0]);
  return linhas.slice(1).map((l) => {
    const v = partir(l);
    return Object.fromEntries(cab.map((c, i) => [c, v[i] ?? ""]));
  });
}

export const ocupacoes: Ocupacao[] = lerCsv(ocupacoesCsv).map((o) => ({
  divisao: o.divisao,
  grupo: o.grupo,
  descricao: o.descricao,
  carga_incendio: Number(o.carga_incendio),
}));

export const exigencias: Exigencia[] = lerCsv(exigenciasCsv).map((e) => ({
  grupo: e.grupo,
  medida: e.medida,
  tipos: e.tipos.split(";").map((t) => t.trim()).filter(Boolean),
  obs: e.obs,
}));

export function tipoPorAltura(altura: number, pavimentos?: number): Tipo {
  if (altura < 0) throw new Error("altura não pode ser negativa");
  if (pavimentos === 1 || altura === 0) return "I";
  if (altura <= 6) return "II";
  if (altura <= 12) return "III";
  if (altura <= 23) return "IV";
  if (altura <= 30) return "V";
  return "VI";
}

export function riscoPorCarga(carga: number): Resultado["risco"] {
  if (carga <= 300) return "Baixo";
  if (carga <= 1200) return "Médio";
  return "Alto";
}

export function ehSimplificada(area: number, altura: number) {
  return area <= AREA_MAX_SIMPLIFICADA && altura <= ALTURA_MAX_SIMPLIFICADA;
}

export function classificar(
  divisao: string,
  area: number,
  altura: number,
  pavimentos?: number,
  cargaIncendio?: number,
): Resultado {
  if (!(area > 0)) throw new Error("área tem que ser maior que zero");
  const ocup = ocupacoes.find((o) => o.divisao === divisao);
  if (!ocup) throw new Error(`divisão ${divisao} não cadastrada`);

  const carga = cargaIncendio ?? ocup.carga_incendio;
  const tipo = tipoPorAltura(altura, pavimentos);
  const res: Resultado = {
    divisao,
    descricao: ocup.descricao,
    tipo,
    cargaIncendio: carga,
    risco: riscoPorCarga(carga),
    simplificada: ehSimplificada(area, altura),
    medidas: [],
    avisos: [],
  };

  if (res.simplificada) {
    res.medidas = [...MEDIDAS_SIMPLIFICADA];
    return res;
  }

  const regras = exigencias.filter((e) => e.grupo === ocup.grupo);
  if (regras.length === 0) {
    res.avisos.push(
      `Ainda não tem regras cadastradas para o grupo ${ocup.grupo} em dados/exigencias.csv.`,
    );
    return res;
  }

  for (const r of regras) {
    if (r.tipos.includes(tipo)) {
      res.medidas.push(r.medida);
      if (r.obs) res.avisos.push(`${r.medida}: ${r.obs}`);
    }
  }
  return res;
}

// só para organizar a lista na tela
const CATEGORIAS: Record<string, string> = {
  "Acesso de viatura na edificação": "Edificação",
  "Segurança estrutural contra incêndio": "Edificação",
  "Compartimentação vertical": "Edificação",
  "Controle de materiais de acabamento": "Edificação",
  "Saídas de emergência": "Abandono",
  "Iluminação de emergência": "Abandono",
  "Sinalização de emergência": "Abandono",
  "Alarme de incêndio": "Detecção e combate",
  "Extintores": "Detecção e combate",
  "Hidrantes e mangotinhos": "Detecção e combate",
  "Brigada de incêndio": "Detecção e combate",
};

export function agruparMedidas(medidas: string[]) {
  const grupos = new Map<string, string[]>();
  for (const m of medidas) {
    const cat = CATEGORIAS[m] ?? "Outras";
    grupos.set(cat, [...(grupos.get(cat) ?? []), m]);
  }
  return [...grupos.entries()];
}
