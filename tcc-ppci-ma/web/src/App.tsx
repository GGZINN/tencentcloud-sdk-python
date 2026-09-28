import { useEffect, useId, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Buildings,
  Check,
  DoorOpen,
  FireExtinguisher,
  Info,
  LinkSimple,
  ListChecks,
  Printer,
  Warning,
  WarningCircle,
} from "@phosphor-icons/react";
import {
  ALTURA_MAX_SIMPLIFICADA,
  AREA_MAX_SIMPLIFICADA,
  FAIXAS,
  agruparMedidas,
  classificar,
  ocupacoes,
  type Resultado,
} from "./classificador";
import { lerDaUrl, paraUrl, type Entrada } from "./estadoUrl";

const ICONE_CATEGORIA = {
  Edificação: Buildings,
  Abandono: DoorOpen,
  "Detecção e combate": FireExtinguisher,
} as Record<string, typeof Buildings>;

// versão publicada como Artifact: lá não há impressão nem URL com parâmetros
const EMBUTIDO = import.meta.env.VITE_ARTIFACT === "1";

const GRUPOS = [...new Set(ocupacoes.map((o) => o.grupo))];

function numero(v: string) {
  if (v.trim() === "") return NaN;
  return Number(v.replace(",", "."));
}

export default function App() {
  const [entrada, setEntrada] = useState<Entrada>(() =>
    lerDaUrl(window.location.search, ocupacoes.map((o) => o.divisao)),
  );
  const { divisao, area, altura, pavimentos, cargaManual, carga } = entrada;
  const mudar = <K extends keyof Entrada>(campo: K, valor: Entrada[K]) =>
    setEntrada((e) => ({ ...e, [campo]: valor }));

  // erro só aparece depois que a pessoa sai do campo (ou se veio de um link)
  const [tocados, setTocados] = useState<Set<string>>(() =>
    window.location.search ? new Set(["area", "altura", "pavimentos", "carga"]) : new Set(),
  );
  const tocar = (campo: string) => () => setTocados((t) => new Set(t).add(campo));

  const erros: Record<string, string> = {};
  if (!(numero(area) > 0)) erros.area = "Informe uma área maior que zero.";
  if (!(numero(altura) >= 0)) erros.altura = "Informe a altura em metros (0 para térrea).";
  const pav = numero(pavimentos);
  if (!(pav >= 1) || !Number.isInteger(pav)) erros.pavimentos = "Número inteiro, a partir de 1.";
  if (cargaManual && !(numero(carga) >= 0)) erros.carga = "Informe a carga em MJ/m².";
  const visiveis = Object.fromEntries(Object.entries(erros).filter(([k]) => tocados.has(k)));
  const mostrarErros = Object.keys(visiveis).length > 0;

  const res =
    Object.keys(erros).length === 0
      ? classificar(divisao, numero(area), numero(altura), pav,
          cargaManual ? numero(carga) : undefined)
      : null;

  // enquanto a pessoa digita, mantém o último resultado válido na tela
  const chave = JSON.stringify(entrada);
  const [ultimo, setUltimo] = useState<{ chave: string; res: Resultado; entrada: Entrada } | null>(null);
  if (res && ultimo?.chave !== chave) setUltimo({ chave, res, entrada });
  const exibido = res ? { res, entrada } : mostrarErros ? null : ultimo;
  const desatualizado = !res && exibido !== null;

  const resumo = res
    ? `Tipo ${res.tipo}, risco ${res.risco.toLowerCase()}, ${
        res.medidas.length === 1 ? "1 medida exigida" : `${res.medidas.length} medidas exigidas`
      }.`
    : mostrarErros
      ? "Há campos com erro."
      : null;
  const [anuncio, setAnuncio] = useState("");
  useEffect(() => {
    if (resumo === null) return;
    const t = setTimeout(() => setAnuncio(resumo), 700);
    return () => clearTimeout(t);
  }, [resumo]);

  useEffect(() => {
    if (EMBUTIDO) return;
    const url = paraUrl(entrada);
    if (url !== window.location.search) history.replaceState(null, "", url);
  }, [entrada]);

  const [copia, setCopia] = useState<"" | "ok" | "falhou">("");
  useEffect(() => {
    if (!copia) return;
    const t = setTimeout(() => setCopia(""), 2500);
    return () => clearTimeout(t);
  }, [copia]);
  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopia("ok");
    } catch {
      setCopia("falhou");
    }
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="border-b border-linha print:hidden">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <p className="font-semibold tracking-tight">
            PPCI-MA{" "}
            <span className="hidden sm:inline font-normal text-texto-2">
              Classificador de edificações
            </span>
          </p>
          <a
            href="https://cbm.ssp.ma.gov.br/unidades-bm/unidades-administrativas/dat/legislacao-tecnica-dat/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 py-3 text-sm text-texto-2 hover:text-texto transition-colors"
          >
            Normas do CBMMA <ArrowUpRight size={14} />
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 lg:py-14 grid gap-12 lg:grid-cols-[360px_1fr] lg:gap-16 flex-1 print:block print:p-0 print:pb-8">
        <section aria-labelledby="titulo-form" className="print:hidden">
          <h1 id="titulo-form" className="text-3xl font-semibold tracking-tight leading-tight">
            Classifique a edificação
          </h1>
          <p className="mt-3 text-texto-2 leading-relaxed max-w-[42ch]">
            Informe o uso, a área e a altura. As medidas exigidas aparecem ao lado e mudam
            conforme você edita.
          </p>
          <p className="mt-2 text-sm text-texto-2">Todos os campos são obrigatórios.</p>

          <form className="mt-8 grid gap-5" onSubmit={(e) => e.preventDefault()}>
            <Campo rotulo="Ocupação / uso" ajuda="Divisão conforme a tabela de classificação.">
              {(props) => (
                <select
                  {...props}
                  value={divisao}
                  onChange={(e) => mudar("divisao", e.target.value)}
                  className={estiloInput + " cursor-pointer"}
                >
                  {GRUPOS.map((g) => (
                    <optgroup key={g} label={`Grupo ${g}`}>
                      {ocupacoes
                        .filter((o) => o.grupo === g)
                        .map((o) => (
                          <option key={o.divisao} value={o.divisao}>
                            {o.divisao} {o.descricao}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              )}
            </Campo>

            <Campo rotulo="Área construída (m²)" erro={visiveis.area}>
              {(props) => (
                <input {...props} inputMode="decimal" value={area} onBlur={tocar("area")}
                  onChange={(e) => mudar("area", e.target.value)} className={estiloInput} />
              )}
            </Campo>

            <div className="grid grid-cols-2 gap-4">
              <Campo rotulo="Altura (m)" erro={visiveis.altura}
                ajuda="Do piso de descarga ao piso do último pavimento.">
                {(props) => (
                  <input {...props} inputMode="decimal" value={altura} onBlur={tocar("altura")}
                    onChange={(e) => mudar("altura", e.target.value)} className={estiloInput} />
                )}
              </Campo>
              <Campo rotulo="Pavimentos" erro={visiveis.pavimentos}>
                {(props) => (
                  <input {...props} inputMode="numeric" value={pavimentos} onBlur={tocar("pavimentos")}
                    onChange={(e) => mudar("pavimentos", e.target.value)} className={estiloInput} />
                )}
              </Campo>
            </div>

            <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cargaManual}
                onChange={(e) => mudar("cargaManual", e.target.checked)}
                className="mt-0.5 size-4 accent-[var(--acento)] cursor-pointer"
              />
              <span>
                Informar a carga de incêndio
                <span className="block text-texto-2">
                  Senão, uso o valor de referência da ocupação.
                </span>
              </span>
            </label>

            {cargaManual && (
              <Campo rotulo="Carga de incêndio (MJ/m²)" erro={visiveis.carga}>
                {(props) => (
                  <input {...props} inputMode="decimal" value={carga} onBlur={tocar("carga")}
                    onChange={(e) => mudar("carga", e.target.value)} className={estiloInput} />
                )}
              </Campo>
            )}
          </form>
        </section>

        <section aria-labelledby="titulo-res" className="min-w-0">
          <h2 id="titulo-res" className="sr-only">Resultado</h2>
          <p className="sr-only" aria-live="polite">{anuncio}</p>
          {!exibido ? (
            <div className="rounded-lg border border-dashed border-linha p-8 text-texto-2 flex gap-3">
              <Info size={20} className="shrink-0 mt-0.5" />
              <p>Corrija os campos marcados para ver a classificação.</p>
            </div>
          ) : (
            <div
              aria-busy={desatualizado}
              className={"transition-opacity " + (desatualizado ? "opacity-50" : "")}
            >
              <CabecalhoImpressao entrada={exibido.entrada} res={exibido.res} />
              <PainelResultado
                res={exibido.res}
                acoes={
                  !EMBUTIDO && <div className="flex gap-2 print:hidden">
                    <button type="button" onClick={copiarLink} className={estiloBotao}>
                      {copia === "ok" ? <Check size={16} /> : <LinkSimple size={16} />}
                      {copia === "ok"
                        ? "Link copiado"
                        : copia === "falhou"
                          ? "Copie da barra de endereço"
                          : "Copiar link"}
                    </button>
                    <button type="button" onClick={() => window.print()} className={estiloBotao}>
                      <Printer size={16} /> Imprimir
                    </button>
                  </div>
                }
              />
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-linha">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-texto-2 leading-relaxed print:px-0">
          Protótipo de TCC em Engenharia Civil. As tabelas ainda estão sendo conferidas com a
          Lei Estadual 11.390/2020 e a NT 01/2024 do CBMMA. Não substitui o projeto do
          responsável técnico.
        </div>
      </footer>
    </div>
  );
}

const estiloBotao =
  "inline-flex items-center gap-2 h-11 px-3.5 rounded-lg border border-linha text-sm " +
  "whitespace-nowrap cursor-pointer transition-colors hover:bg-acento-suave hover:border-acento " +
  "active:translate-y-px";

function CabecalhoImpressao({ entrada, res }: { entrada: Entrada; res: Resultado }) {
  const linhas: [string, string][] = [
    ["Ocupação", `${entrada.divisao} ${res.descricao}`],
    ["Área construída", `${entrada.area} m²`],
    ["Altura", `${entrada.altura} m`],
    ["Pavimentos", entrada.pavimentos],
    [
      "Carga de incêndio",
      `${res.cargaIncendio} MJ/m² (${entrada.cargaManual ? "informada" : "referência da ocupação"})`,
    ],
  ];
  return (
    <div className="hidden print:block mb-8">
      <p className="text-sm text-texto-2">
        PPCI-MA, classificador de edificações. Gerado em {new Date().toLocaleDateString("pt-BR")}.
      </p>
      <p className="mt-1 text-2xl font-semibold">Classificação da edificação</p>
      <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm">
        {linhas.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-texto-2">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs text-texto-2 break-all">{window.location.href}</p>
    </div>
  );
}

const estiloInput =
  "w-full h-11 rounded-lg border border-linha bg-superficie px-3 text-texto " +
  "transition-colors hover:border-texto-2/50 " +
  "focus-visible:border-acento aria-invalid:border-erro aria-invalid:focus-visible:border-erro";

type PropsCampo = {
  id: string;
  "aria-describedby": string;
  "aria-invalid": boolean;
};

function Campo({
  rotulo,
  ajuda,
  erro,
  children,
}: {
  rotulo: string;
  ajuda?: string;
  erro?: string;
  children: (props: PropsCampo) => ReactNode;
}) {
  const id = useId();
  const desc = `${id}-desc`;
  return (
    <div className="grid gap-2 content-start">
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
      </label>
      {children({ id, "aria-describedby": desc, "aria-invalid": !!erro })}
      {erro ? (
        <p id={desc} className="flex gap-1.5 text-sm text-erro">
          <WarningCircle size={16} weight="bold" className="shrink-0 mt-0.5" />
          {erro}
        </p>
      ) : ajuda ? (
        <p id={desc} className="text-sm text-texto-2">{ajuda}</p>
      ) : null}
    </div>
  );
}

function PainelResultado({ res, acoes }: { res: Resultado; acoes?: ReactNode }) {
  const grupos = agruparMedidas(res.medidas);
  const faixa = FAIXAS.find((f) => f.tipo === res.tipo)!;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <p className="font-mono text-sm text-acento-texto">{res.divisao}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{res.descricao}</p>
        </div>
        {acoes}
      </div>

      <dl className="mt-8 print:mt-0 grid grid-cols-2 md:grid-cols-[1fr_1fr_1.4fr] gap-x-8 gap-y-6">
        <div>
          <dt className="text-sm text-texto-2">Tipo pela altura</dt>
          <dd className="mt-1 text-xl font-semibold">
            {res.tipo}
            <span className="block text-sm font-normal text-texto-2">{faixa.nome}</span>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-texto-2">Risco</dt>
          <dd className="mt-1 text-xl font-semibold">
            {res.risco}
            <span className="block font-mono text-sm font-normal text-texto-2">
              {res.cargaIncendio} MJ/m²
            </span>
          </dd>
        </div>
        <div className="col-span-2 md:col-span-1">
          <dt className="text-sm text-texto-2">Enquadramento</dt>
          <dd className="mt-1 text-xl font-semibold">
            {res.simplificada ? "Simplificada" : "Tabela completa"}
            <span className="block text-sm font-normal text-texto-2">
              {res.simplificada
                ? `até ${AREA_MAX_SIMPLIFICADA} m² e ${ALTURA_MAX_SIMPLIFICADA} m`
                : `acima de ${AREA_MAX_SIMPLIFICADA} m² ou ${ALTURA_MAX_SIMPLIFICADA} m`}
            </span>
          </dd>
        </div>
      </dl>

      <EscalaAltura atual={res.tipo} />

      <div className="mt-10 border-t border-linha pt-8 print:mt-6 print:pt-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <ListChecks size={20} className="text-acento" />
          {res.medidas.length === 0
            ? "Medidas exigidas"
            : res.medidas.length === 1
              ? "1 medida exigida"
              : `${res.medidas.length} medidas exigidas`}
        </h3>

        {res.medidas.length > 0 ? (
          <div className="mt-6 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {grupos.map(([cat, itens]) => {
              const Icone = ICONE_CATEGORIA[cat] ?? ListChecks;
              return (
                <div key={cat} className="break-inside-avoid">
                  <p className="flex items-center gap-2 text-sm font-medium text-texto-2">
                    <Icone size={16} /> {cat}
                  </p>
                  <ul className="mt-3 grid gap-2">
                    {itens.map((m) => (
                      <li key={m} className="leading-snug">{m}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : res.avisos.length === 0 ? (
          <p className="mt-4 text-texto-2">Nenhuma medida listada para este caso.</p>
        ) : null}

        {res.avisos.map((a) => (
          <div key={a}
            className="mt-6 flex gap-3 rounded-lg bg-aviso-suave px-4 py-3 text-sm leading-relaxed">
            <Warning size={18} className="shrink-0 mt-0.5 text-aviso" />
            <p>{a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function EscalaAltura({ atual }: { atual: string }) {
  return (
    <div className="mt-8">
      <p className="text-sm text-texto-2">Faixas de altura</p>
      <ol className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-1.5">
        {FAIXAS.map((f) => {
          const ativo = f.tipo === atual;
          return (
            <li
              key={f.tipo}
              aria-current={ativo ? "true" : undefined}
              className={
                "rounded-lg border px-2.5 py-2 transition-colors " +
                (ativo
                  ? "border-acento bg-acento-suave"
                  : "border-linha text-texto-2")
              }
            >
              <span className={"font-mono text-sm " + (ativo ? "text-acento-texto font-medium" : "")}>
                {f.tipo}
              </span>
              <span className="block text-xs leading-tight mt-0.5">{f.faixa}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
