import { useId, useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpRight,
  Buildings,
  DoorOpen,
  FireExtinguisher,
  Info,
  ListChecks,
  Warning,
} from "@phosphor-icons/react";
import {
  ALTURA_MAX_SIMPLIFICADA,
  AREA_MAX_SIMPLIFICADA,
  FAIXAS,
  agruparMedidas,
  classificar,
  ocupacoes,
} from "./classificador";

const ICONE_CATEGORIA = {
  Edificação: Buildings,
  Abandono: DoorOpen,
  "Detecção e combate": FireExtinguisher,
} as Record<string, typeof Buildings>;

const GRUPOS = [...new Set(ocupacoes.map((o) => o.grupo))];

function numero(v: string) {
  if (v.trim() === "") return NaN;
  return Number(v.replace(",", "."));
}

export default function App() {
  const [divisao, setDivisao] = useState("A-2");
  const [area, setArea] = useState("4800");
  const [altura, setAltura] = useState("28");
  const [pavimentos, setPavimentos] = useState("10");
  const [cargaManual, setCargaManual] = useState(false);
  const [carga, setCarga] = useState("300");

  const erros = useMemo(() => {
    const e: Record<string, string> = {};
    if (!(numero(area) > 0)) e.area = "Informe uma área maior que zero.";
    if (!(numero(altura) >= 0)) e.altura = "Informe a altura em metros (0 para térrea).";
    const p = numero(pavimentos);
    if (!(p >= 1) || !Number.isInteger(p)) e.pavimentos = "Número inteiro, a partir de 1.";
    if (cargaManual && !(numero(carga) >= 0)) e.carga = "Informe a carga em MJ/m².";
    return e;
  }, [area, altura, pavimentos, cargaManual, carga]);

  const valido = Object.keys(erros).length === 0;
  const res = valido
    ? classificar(
        divisao,
        numero(area),
        numero(altura),
        numero(pavimentos),
        cargaManual ? numero(carga) : undefined,
      )
    : null;

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="border-b border-linha">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between gap-4">
          <p className="font-semibold tracking-tight">
            PPCI-MA <span className="font-normal text-texto-2">Classificador de edificações</span>
          </p>
          <a
            href="https://cbm.ssp.ma.gov.br/unidades-bm/unidades-administrativas/dat/legislacao-tecnica-dat/"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-sm text-texto-2 hover:text-texto transition-colors"
          >
            Normas do CBMMA <ArrowUpRight size={14} />
          </a>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-10 lg:py-14 grid gap-12 lg:grid-cols-[360px_1fr] lg:gap-16 flex-1">
        <section aria-labelledby="titulo-form">
          <h1 id="titulo-form" className="text-3xl font-semibold tracking-tight leading-tight">
            Classifique a edificação
          </h1>
          <p className="mt-3 text-texto-2 leading-relaxed max-w-[42ch]">
            Informe o uso, a área e a altura. As medidas exigidas aparecem ao lado e mudam
            conforme você edita.
          </p>

          <form className="mt-8 grid gap-5" onSubmit={(e) => e.preventDefault()}>
            <Campo rotulo="Ocupação / uso" ajuda="Divisão conforme a tabela de classificação.">
              {(id) => (
                <select
                  id={id}
                  value={divisao}
                  onChange={(e) => setDivisao(e.target.value)}
                  className={estiloInput}
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

            <Campo rotulo="Área construída (m²)" erro={erros.area}>
              {(id, desc) => (
                <input id={id} aria-describedby={desc} inputMode="decimal" value={area}
                  onChange={(e) => setArea(e.target.value)} className={estiloInput} />
              )}
            </Campo>

            <div className="grid grid-cols-2 gap-4">
              <Campo rotulo="Altura (m)" erro={erros.altura}
                ajuda="Do piso de descarga ao piso do último pavimento.">
                {(id, desc) => (
                  <input id={id} aria-describedby={desc} inputMode="decimal" value={altura}
                    onChange={(e) => setAltura(e.target.value)} className={estiloInput} />
                )}
              </Campo>
              <Campo rotulo="Pavimentos" erro={erros.pavimentos}>
                {(id, desc) => (
                  <input id={id} aria-describedby={desc} inputMode="numeric" value={pavimentos}
                    onChange={(e) => setPavimentos(e.target.value)} className={estiloInput} />
                )}
              </Campo>
            </div>

            <label className="flex items-start gap-3 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cargaManual}
                onChange={(e) => setCargaManual(e.target.checked)}
                className="mt-0.5 size-4 accent-[var(--acento)]"
              />
              <span>
                Informar a carga de incêndio
                <span className="block text-texto-2">
                  Senão, uso o valor de referência da ocupação.
                </span>
              </span>
            </label>

            {cargaManual && (
              <Campo rotulo="Carga de incêndio (MJ/m²)" erro={erros.carga}>
                {(id, desc) => (
                  <input id={id} aria-describedby={desc} inputMode="decimal" value={carga}
                    onChange={(e) => setCarga(e.target.value)} className={estiloInput} />
                )}
              </Campo>
            )}
          </form>
        </section>

        <section aria-labelledby="titulo-res" aria-live="polite" className="min-w-0">
          <h2 id="titulo-res" className="sr-only">Resultado</h2>
          {!res ? (
            <div className="rounded-lg border border-dashed border-linha p-8 text-texto-2 flex gap-3">
              <Info size={20} className="shrink-0 mt-0.5" />
              <p>Corrija os campos marcados para ver a classificação.</p>
            </div>
          ) : (
            <Resultado res={res} />
          )}
        </section>
      </main>

      <footer className="border-t border-linha">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-texto-2 leading-relaxed">
          Protótipo de TCC em Engenharia Civil. As tabelas ainda estão sendo conferidas com a
          Lei Estadual 11.390/2020 e a NT 01/2024 do CBMMA. Não substitui o projeto do
          responsável técnico.
        </div>
      </footer>
    </div>
  );
}

const estiloInput =
  "w-full h-11 rounded-lg border border-linha bg-superficie px-3 text-texto " +
  "outline-none transition-colors hover:border-texto-2/50 " +
  "focus-visible:border-acento focus-visible:ring-3 focus-visible:ring-acento-suave";

function Campo({
  rotulo,
  ajuda,
  erro,
  children,
}: {
  rotulo: string;
  ajuda?: string;
  erro?: string;
  children: (id: string, descricao: string) => ReactNode;
}) {
  const id = useId();
  const desc = `${id}-desc`;
  return (
    <div className="grid gap-2 content-start">
      <label htmlFor={id} className="text-sm font-medium">
        {rotulo}
      </label>
      <div className={erro ? "*:border-erro" : ""}>{children(id, desc)}</div>
      {erro ? (
        <p id={desc} className="text-sm text-erro">{erro}</p>
      ) : ajuda ? (
        <p id={desc} className="text-sm text-texto-2">{ajuda}</p>
      ) : null}
    </div>
  );
}

function Resultado({ res }: { res: ReturnType<typeof classificar> }) {
  const grupos = agruparMedidas(res.medidas);
  const faixa = FAIXAS.find((f) => f.tipo === res.tipo)!;

  return (
    <div>
      <p className="font-mono text-sm text-acento">{res.divisao}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{res.descricao}</p>

      <dl className="mt-8 grid grid-cols-2 md:grid-cols-[1fr_1fr_1.4fr] gap-x-8 gap-y-6">
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

      <div className="mt-10 border-t border-linha pt-8">
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
                <div key={cat}>
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
              <span className={"font-mono text-sm " + (ativo ? "text-acento font-medium" : "")}>
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
