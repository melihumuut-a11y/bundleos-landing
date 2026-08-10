"use client";

import { useState, useCallback } from "react";
import { Space_Grotesk, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
});
const body = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

// ---------------------------------------------------------------------------
// Types — mirrors app/api/generate-bundle/route.ts's response schema exactly
// ---------------------------------------------------------------------------

type Source = "cjdropshipping" | "aliexpress" | "autods";
type PlatformState = "ok" | "skipped_no_key" | "failed";

interface Product {
  source: Source;
  title: string;
  imageUrl: string;
  factoryPrice: number | null;
  currency: string;
  shippingCost: number | null;
  stock: number | null;
  supplierName: string | null;
  productUrl: string | null;
}

interface Financials {
  totalFactoryCost: number;
  totalLandedCost: number;
  suggestedRetailPrice: number;
  grossProfit: number;
  grossMarginPercent: number;
}

interface BundleResponse {
  prompt: string;
  products: Product[];
  financials: Financials | null;
  platformStatus: Record<Source, PlatformState>;
  warnings: string[];
  generatedAt: string;
}

const COUNTRIES = [
  { code: "US", label: "United States" },
  { code: "TR", label: "Türkiye" },
  { code: "DE", label: "Germany" },
  { code: "GB", label: "United Kingdom" },
  { code: "FR", label: "France" },
  { code: "CA", label: "Canada" },
];

const SOURCE_META: Record<Source, { label: string; stamp: string }> = {
  cjdropshipping: { label: "CJ Dropshipping", stamp: "CJ" },
  aliexpress: { label: "AliExpress", stamp: "AE" },
  autods: { label: "AutoDS", stamp: "AD" },
};

const PLATFORM_ORDER: Source[] = ["cjdropshipping", "aliexpress", "autods"];

function formatMoney(value: number | null, currency: string = "USD") {
  if (value === null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Page() {
  const [prompt, setPrompt] = useState("");
  const [country, setCountry] = useState("US");
  const [loading, setLoading] = useState(false);
  const [bundle, setBundle] = useState<BundleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const [assetLoading, setAssetLoading] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);

  const requestBundleVisual = useCallback(
    async (products: Product[], searchPrompt: string) => {
      setAssetLoading(true);
      setAssetError(null);
      setAssetUrl(null);
      try {
        const res = await fetch("/api/process-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: searchPrompt, products }),
        });
        if (!res.ok) throw new Error(`Image asset request failed (${res.status})`);
        const data = await res.json();
        const url: string | undefined = data?.imageUrl ?? data?.url;
        if (!url) throw new Error("Response did not include an image URL");
        setAssetUrl(url);
      } catch (err) {
        setAssetError(
          err instanceof Error ? err.message : "Could not render the bundle visual."
        );
      } finally {
        setAssetLoading(false);
      }
    },
    []
  );

  const runSearch = useCallback(async () => {
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setBundle(null);
    setAssetUrl(null);
    setAssetError(null);

    try {
      const res = await fetch("/api/generate-bundle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmed, destinationCountry: country }),
      });

      const data: BundleResponse = await res.json();

      if (!res.ok) {
        throw new Error((data as any)?.error ?? `Search failed (${res.status})`);
      }

      setBundle(data);

      if (data.products.length > 0) {
        void requestBundleVisual(data.products, trimmed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [prompt, country, requestBundleVisual]);

  return (
    <div
      className={`${display.variable} ${body.variable} ${mono.variable} min-h-screen`}
      style={{ background: "#F2ECDD", fontFamily: "var(--font-body)" }}
    >
      <div className="mx-auto max-w-6xl px-6 py-10 sm:px-10">
        <Header />

        <SearchManifest
          prompt={prompt}
          setPrompt={setPrompt}
          country={country}
          setCountry={setCountry}
          onSubmit={runSearch}
          loading={loading}
        />

        {bundle && <EngineStatusRow status={bundle.platformStatus} />}

        {bundle && bundle.warnings.length > 0 && (
          <WarningsPanel warnings={bundle.warnings} />
        )}

        {error && <ErrorPanel message={error} />}

        {loading && <LoadingState />}

        {!loading && bundle && bundle.products.length > 0 && (
          <>
            <section className="mt-10">
              <SectionLabel index="01" title="Sourced components" />
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {bundle.products.map((product, i) => (
                  <ProductTag key={i} product={product} />
                ))}
              </div>
            </section>

            {bundle.financials && (
              <section className="mt-10">
                <SectionLabel index="02" title="Bundle economics" />
                <FinancialLedger financials={bundle.financials} />
              </section>
            )}

            <section className="mt-10">
              <SectionLabel index="03" title="Bundle visual asset" />
              <BundleVisual
                loading={assetLoading}
                url={assetUrl}
                error={assetError}
              />
            </section>
          </>
        )}

        {!loading && bundle && bundle.products.length === 0 && (
          <EmptyState prompt={bundle.prompt} />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header() {
  return (
    <header className="flex items-end justify-between border-b-2 pb-6" style={{ borderColor: "#10202A" }}>
      <div>
        <p
          className="text-xs tracking-[0.3em]"
          style={{ fontFamily: "var(--font-mono)", color: "#3E6079" }}
        >
          MANIFEST No. SRC-0114
        </p>
        <h1
          className="mt-1 text-3xl sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#10202A" }}
        >
          Sourcing Engine
        </h1>
      </div>
      <p
        className="hidden max-w-[220px] text-right text-xs leading-relaxed sm:block"
        style={{ fontFamily: "var(--font-mono)", color: "#3E6079" }}
      >
        LIVE FACTORY DATA
        <br />
        CJ · ALIEXPRESS · AUTODS
      </p>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Search bar ("manifest entry line")
// ---------------------------------------------------------------------------

function SearchManifest({
  prompt,
  setPrompt,
  country,
  setCountry,
  onSubmit,
  loading,
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  country: string;
  setCountry: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="mt-8 flex flex-col gap-3 border-2 p-3 sm:flex-row sm:items-center"
      style={{ borderColor: "#10202A", background: "#FFFDF7" }}
    >
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
        placeholder="e.g. 3-piece ceramic car washing and interior detailing system"
        className="flex-1 bg-transparent px-3 py-2 text-base outline-none placeholder:opacity-50"
        style={{ color: "#10202A" }}
        aria-label="Product bundle prompt"
      />

      <div className="flex items-center gap-2 border-t pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-3" style={{ borderColor: "#D8CFB8" }}>
        <label
          className="text-xs tracking-widest"
          style={{ fontFamily: "var(--font-mono)", color: "#3E6079" }}
        >
          SHIP TO
        </label>
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="bg-transparent px-2 py-2 text-sm outline-none"
          style={{ fontFamily: "var(--font-mono)", color: "#10202A" }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={onSubmit}
        disabled={loading || !prompt.trim()}
        className="whitespace-nowrap px-6 py-3 text-sm font-semibold tracking-wide transition-opacity disabled:opacity-40"
        style={{ background: "#E2A63B", color: "#10202A" }}
      >
        {loading ? "SEARCHING…" : "RUN SEARCH →"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Engine status row
// ---------------------------------------------------------------------------

const STATUS_META: Record<PlatformState, { label: string; color: string }> = {
  ok: { label: "LIVE", color: "#4B7A5B" },
  skipped_no_key: { label: "NO KEY", color: "#B08A3E" },
  failed: { label: "FAILED", color: "#B1503A" },
};

function EngineStatusRow({ status }: { status: Record<Source, PlatformState> }) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      {PLATFORM_ORDER.map((source) => {
        const state = status[source] ?? "skipped_no_key";
        const meta = STATUS_META[state];
        return (
          <div
            key={source}
            className="flex items-center gap-2 border px-3 py-1.5"
            style={{ borderColor: "#10202A", background: "#FFFDF7" }}
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: meta.color }}
            />
            <span
              className="text-xs font-semibold"
              style={{ fontFamily: "var(--font-mono)", color: "#10202A" }}
            >
              {SOURCE_META[source].label}
            </span>
            <span
              className="text-[10px] tracking-widest"
              style={{ fontFamily: "var(--font-mono)", color: meta.color }}
            >
              {meta.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product card ("cargo tag")
// ---------------------------------------------------------------------------

function ProductTag({ product }: { product: Product }) {
  const meta = SOURCE_META[product.source];
  return (
    <div
      className="relative flex flex-col border-2"
      style={{ borderColor: "#10202A", background: "#FFFDF7" }}
    >
      <div
        className="absolute right-3 top-3 z-10 flex h-11 w-11 rotate-6 items-center justify-center rounded-full border-2 text-[11px] font-bold"
        style={{ borderColor: "#B1503A", color: "#B1503A" }}
        aria-label={`Source: ${meta.label}`}
      >
        {meta.stamp}
      </div>

      <div className="aspect-square w-full overflow-hidden" style={{ background: "#EFE8D6" }}>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-xs"
            style={{ fontFamily: "var(--font-mono)", color: "#B0A88C" }}
          >
            NO IMAGE
          </div>
        )}
      </div>

      <div
        className="mx-4 my-0 border-t-2 border-dashed"
        style={{ borderColor: "#D8CFB8" }}
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <p
          className="text-sm leading-snug"
          style={{ fontFamily: "var(--font-body)", fontWeight: 600, color: "#10202A" }}
          title={product.title}
        >
          {product.title}
        </p>

        {product.supplierName && (
          <p
            className="text-[11px] tracking-wide"
            style={{ fontFamily: "var(--font-mono)", color: "#3E6079" }}
          >
            SUPPLIER · {product.supplierName.toUpperCase()}
          </p>
        )}

        <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          <DataPair label="FACTORY COST" value={formatMoney(product.factoryPrice, product.currency)} />
          <DataPair label="SHIPPING" value={formatMoney(product.shippingCost, product.currency)} />
          <DataPair
            label="STOCK"
            value={product.stock !== null ? product.stock.toLocaleString("en-US") : "—"}
          />
          <DataPair label="SOURCE" value={meta.label.toUpperCase()} />
        </dl>

        <div className="mt-auto pt-2">
          {product.productUrl ? (
            <a
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block border-2 px-3 py-1.5 text-xs font-semibold"
              style={{ borderColor: "#10202A", color: "#10202A" }}
            >
              VIEW ON {meta.label.toUpperCase()} ↗
            </a>
          ) : (
            <span
              className="inline-block text-xs"
              style={{ fontFamily: "var(--font-mono)", color: "#B0A88C" }}
            >
              NO DIRECT LINK AVAILABLE
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DataPair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt
        className="text-[10px] tracking-widest"
        style={{ fontFamily: "var(--font-mono)", color: "#3E6079" }}
      >
        {label}
      </dt>
      <dd
        className="text-sm"
        style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "#10202A" }}
      >
        {value}
      </dd>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Financial ledger
// ---------------------------------------------------------------------------

function FinancialLedger({ financials }: { financials: Financials }) {
  const rows: Array<[string, string, boolean?]> = [
    ["TOTAL FACTORY COST", formatMoney(financials.totalFactoryCost)],
    ["TOTAL LANDED COST", formatMoney(financials.totalLandedCost)],
    ["SUGGESTED RETAIL", formatMoney(financials.suggestedRetailPrice)],
    ["GROSS PROFIT / UNIT", formatMoney(financials.grossProfit), true],
    ["GROSS MARGIN", `${financials.grossMarginPercent.toFixed(1)}%`, true],
  ];

  return (
    <div className="mt-4 border-2" style={{ borderColor: "#10202A", background: "#FFFDF7" }}>
      <div className="flex flex-col divide-y-2 sm:flex-row sm:divide-x-2 sm:divide-y-0" style={{ borderColor: "#10202A" }}>
        {rows.map(([label, value, highlight]) => (
          <div key={label} className="flex-1 px-5 py-4" style={{ borderColor: "#10202A" }}>
            <p
              className="text-[10px] tracking-widest"
              style={{ fontFamily: "var(--font-mono)", color: "#3E6079" }}
            >
              {label}
            </p>
            <p
              className="mt-1 text-xl"
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                color: highlight ? "#4B7A5B" : "#10202A",
              }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bundle visual asset panel
// ---------------------------------------------------------------------------

function BundleVisual({
  loading,
  url,
  error,
}: {
  loading: boolean;
  url: string | null;
  error: string | null;
}) {
  return (
    <div
      className="mt-4 flex min-h-[220px] items-center justify-center border-2 p-6"
      style={{ borderColor: "#10202A", background: "#FFFDF7" }}
    >
      {loading && (
        <p
          className="text-xs tracking-widest"
          style={{ fontFamily: "var(--font-mono)", color: "#3E6079" }}
        >
          RENDERING BUNDLE VISUAL…
        </p>
      )}

      {!loading && error && (
        <p
          className="max-w-md text-center text-xs"
          style={{ fontFamily: "var(--font-mono)", color: "#B1503A" }}
        >
          {error}
        </p>
      )}

      {!loading && !error && url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt="Generated bundle visual asset"
          className="max-h-[420px] w-auto object-contain"
        />
      )}

      {!loading && !error && !url && (
        <p
          className="text-xs tracking-widest"
          style={{ fontFamily: "var(--font-mono)", color: "#B0A88C" }}
        >
          NO ASSET GENERATED YET
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span
        className="text-xs tracking-widest"
        style={{ fontFamily: "var(--font-mono)", color: "#B1503A" }}
      >
        {index}
      </span>
      <h2
        className="text-lg"
        style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "#10202A" }}
      >
        {title}
      </h2>
      <span className="h-px flex-1" style={{ background: "#D8CFB8" }} />
    </div>
  );
}

function WarningsPanel({ warnings }: { warnings: string[] }) {
  return (
    <div
      className="mt-5 border-l-4 p-4"
      style={{ borderColor: "#B08A3E", background: "#FBF3DD" }}
    >
      <p
        className="text-xs tracking-widest"
        style={{ fontFamily: "var(--font-mono)", color: "#8A6A2E" }}
      >
        WARNINGS
      </p>
      <ul className="mt-2 space-y-1">
        {warnings.map((w, i) => (
          <li
            key={i}
            className="text-xs"
            style={{ fontFamily: "var(--font-mono)", color: "#6B5426" }}
          >
            · {w}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div
      className="mt-5 border-l-4 p-4"
      style={{ borderColor: "#B1503A", background: "#F9E4DD" }}
    >
      <p
        className="text-xs tracking-widest"
        style={{ fontFamily: "var(--font-mono)", color: "#8C3B29" }}
      >
        SEARCH ERROR
      </p>
      <p className="mt-1 text-sm" style={{ color: "#8C3B29" }}>
        {message}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="aspect-[3/4] animate-pulse border-2"
          style={{ borderColor: "#D8CFB8", background: "#EFE8D6" }}
        />
      ))}
    </div>
  );
}

function EmptyState({ prompt }: { prompt: string }) {
  return (
    <div
      className="mt-10 border-2 border-dashed p-8 text-center"
      style={{ borderColor: "#D8CFB8" }}
    >
      <p
        className="text-sm"
        style={{ fontFamily: "var(--font-mono)", color: "#3E6079" }}
      >
        No live products came back for “{prompt}”. Check the engine status above,
        or try a more specific search.
      </p>
    </div>
  );
}
