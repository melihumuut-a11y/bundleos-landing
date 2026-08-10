"use client";

import { useState, useCallback, useMemo } from "react";
import { Fraunces, Inter } from "next/font/google";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
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

const SOURCE_META: Record<Source, { label: string; short: string }> = {
  cjdropshipping: { label: "CJ Dropshipping", short: "CJ" },
  aliexpress: { label: "AliExpress", short: "AE" },
  autods: { label: "AutoDS", short: "AD" },
};

const PLATFORM_ORDER: Source[] = ["cjdropshipping", "aliexpress", "autods"];
const LOT_LABELS = ["I", "II", "III"];

const palette = {
  stage: "#121110",
  paper: "#1B1916",
  paperRaised: "#211E1A",
  ivory: "#F3EEE4",
  muted: "#A79C89",
  faint: "#6E6656",
  brass: "#C9A44C",
  brassDim: "#9C7F3C",
  hairline: "#332F28",
  success: "#8AA98F",
  alert: "#B07A63",
};

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

  const [reserved, setReserved] = useState(false);

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
    setReserved(false);

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

  const lowestStock = useMemo(() => {
    if (!bundle) return null;
    const stocks = bundle.products.map((p) => p.stock).filter((s): s is number => s !== null);
    if (stocks.length === 0) return null;
    return Math.min(...stocks);
  }, [bundle]);

  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen`}
      style={{ background: palette.stage, fontFamily: "var(--font-body)" }}
    >
      <div className="mx-auto max-w-5xl px-6 py-16 sm:px-10 sm:py-24">
        <Header />

        <SearchStage
          prompt={prompt}
          setPrompt={setPrompt}
          country={country}
          setCountry={setCountry}
          onSubmit={runSearch}
          loading={loading}
        />

        {bundle && <StatusLine status={bundle.platformStatus} />}

        {bundle && bundle.warnings.length > 0 && <WarningsNote warnings={bundle.warnings} />}

        {error && <ErrorNote message={error} />}

        {loading && <LoadingState />}

        {!loading && bundle && bundle.products.length > 0 && (
          <>
            <section className="mt-24">
              <SectionEyebrow roman="I" title="The Edit" />
              <div className="mt-10 grid grid-cols-1 gap-px sm:grid-cols-3" style={{ background: palette.hairline }}>
                {bundle.products.map((product, i) => (
                  <ProductLot key={i} lot={LOT_LABELS[i] ?? String(i + 1)} product={product} />
                ))}
              </div>
            </section>

            {bundle.financials && (
              <section className="mt-24">
                <SectionEyebrow roman="II" title="Bundle Economics" />
                <FinancialLedger financials={bundle.financials} />
              </section>
            )}

            <section className="mt-24">
              <SectionEyebrow roman="III" title="Visual Concept" />
              <BundleVisual loading={assetLoading} url={assetUrl} error={assetError} />
            </section>

            <ReserveBar
              reserved={reserved}
              onReserve={() => setReserved(true)}
              lowestStock={lowestStock}
              suggestedRetail={bundle.financials?.suggestedRetailPrice ?? null}
            />
          </>
        )}

        {!loading && bundle && bundle.products.length === 0 && (
          <EmptyState prompt={bundle.prompt} />
        )}

        <Footer />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function Header() {
  return (
    <header className="text-center">
      <p
        className="text-[11px] uppercase"
        style={{ fontFamily: "var(--font-body)", letterSpacing: "0.35em", color: palette.brass }}
      >
        Private Sourcing Atelier
      </p>
      <h1
        className="mt-5 text-4xl sm:text-6xl"
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          color: palette.ivory,
          letterSpacing: "-0.01em",
        }}
      >
        Curated sourcing,
        <br />
        <em style={{ fontStyle: "italic", color: palette.muted }}>delivered quietly.</em>
      </h1>
      <p
        className="mx-auto mt-5 max-w-md text-sm leading-relaxed"
        style={{ color: palette.muted }}
      >
        One search, drawn live from CJ Dropshipping, AliExpress, and AutoDS —
        landed cost and margin resolved before you ever place an order.
      </p>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

function SearchStage({
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
  const [focused, setFocused] = useState(false);

  return (
    <div className="mx-auto mt-16 max-w-2xl">
      <div className="relative">
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          placeholder="Describe the bundle — “3-piece ceramic car detailing system”"
          className="w-full bg-transparent pb-4 pt-2 text-center text-lg outline-none sm:text-xl"
          style={{
            fontFamily: "var(--font-display)",
            color: palette.ivory,
            fontStyle: "italic",
          }}
        />
        <div
          className="h-px w-full transition-all duration-500"
          style={{
            background: focused ? palette.brass : palette.hairline,
            boxShadow: focused ? `0 0 12px ${palette.brass}55` : "none",
          }}
        />
      </div>

      <div className="mt-8 flex flex-col items-center justify-center gap-5 sm:flex-row">
        <label
          className="flex items-center gap-3 text-[11px] uppercase"
          style={{ letterSpacing: "0.25em", color: palette.faint }}
        >
          Ship to
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="border-b bg-transparent py-1 text-sm normal-case tracking-normal outline-none"
            style={{ borderColor: palette.hairline, color: palette.ivory }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code} style={{ background: palette.paper }}>
                {c.code}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={onSubmit}
          disabled={loading || !prompt.trim()}
          className="border px-8 py-3 text-[11px] uppercase transition-colors duration-300 disabled:opacity-30"
          style={{
            letterSpacing: "0.25em",
            borderColor: palette.brass,
            color: loading ? palette.brass : palette.ivory,
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.background = palette.brass;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          {loading ? "Sourcing…" : "Discover the bundle"}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status line — quiet, not a badge row
// ---------------------------------------------------------------------------

const STATUS_META: Record<PlatformState, { color: string; label: string }> = {
  ok: { color: palette.success, label: "live" },
  skipped_no_key: { color: palette.faint, label: "inactive" },
  failed: { color: palette.alert, label: "error" },
};

function StatusLine({ status }: { status: Record<Source, PlatformState> }) {
  return (
    <div className="mt-10 flex items-center justify-center gap-6 text-[11px]" style={{ color: palette.faint }}>
      {PLATFORM_ORDER.map((source) => {
        const state = status[source] ?? "skipped_no_key";
        const meta = STATUS_META[state];
        return (
          <span key={source} className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full" style={{ background: meta.color }} />
            <span style={{ letterSpacing: "0.1em" }}>
              {SOURCE_META[source].label} · {meta.label}
            </span>
          </span>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product lot ("auction catalogue" card)
// ---------------------------------------------------------------------------

function ProductLot({ lot, product }: { lot: string; product: Product }) {
  const meta = SOURCE_META[product.source];
  const lowStock = product.stock !== null && product.stock < 50;

  return (
    <div className="group flex flex-col" style={{ background: palette.paper }}>
      <div className="relative aspect-[4/5] overflow-hidden" style={{ background: palette.paperRaised }}>
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-xs"
            style={{ color: palette.faint }}
          >
            Image unavailable
          </div>
        )}

        <span
          className="absolute left-4 top-4 text-xs"
          style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: palette.ivory }}
        >
          Lot {lot}
        </span>

        <span
          className="absolute right-4 top-4 text-[10px] uppercase"
          style={{ letterSpacing: "0.2em", color: palette.muted }}
        >
          {meta.short}
        </span>

        {lowStock && (
          <span
            className="absolute bottom-4 left-4 text-[10px] uppercase"
            style={{ letterSpacing: "0.15em", color: palette.alert }}
          >
            Limited stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-6 py-6">
        <p
          className="text-base leading-snug"
          style={{ fontFamily: "var(--font-display)", color: palette.ivory }}
        >
          {product.title}
        </p>

        {product.supplierName && (
          <p className="mt-1.5 text-xs" style={{ color: palette.faint }}>
            {product.supplierName}
          </p>
        )}

        <div className="mt-5 space-y-2 border-t pt-5" style={{ borderColor: palette.hairline }}>
          <LedgerRow label="Factory cost" value={formatMoney(product.factoryPrice, product.currency)} />
          <LedgerRow label="Shipping" value={formatMoney(product.shippingCost, product.currency)} />
          <LedgerRow
            label="Warehouse stock"
            value={product.stock !== null ? product.stock.toLocaleString("en-US") : "—"}
          />
        </div>

        <div className="mt-6">
          {product.productUrl ? (
            
              href={product.productUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] uppercase transition-colors"
              style={{ letterSpacing: "0.2em", color: palette.brass }}
            >
              View source ↗
            </a>
          ) : (
            <span className="text-[11px] uppercase" style={{ letterSpacing: "0.2em", color: palette.faint }}>
              Source link unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-xs">
      <span style={{ color: palette.faint }}>{label}</span>
      <span
        style={{
          color: palette.ivory,
          fontVariantNumeric: "tabular-nums",
          fontWeight: 500,
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Financial ledger — fine-dining menu treatment
// ---------------------------------------------------------------------------

function FinancialLedger({ financials }: { financials: Financials }) {
  const rows: Array<[string, string, boolean?]> = [
    ["Total factory cost", formatMoney(financials.totalFactoryCost)],
    ["Total landed cost", formatMoney(financials.totalLandedCost)],
    ["Suggested retail", formatMoney(financials.suggestedRetailPrice)],
    ["Gross profit, per unit", formatMoney(financials.grossProfit), true],
    ["Gross margin", `${financials.grossMarginPercent.toFixed(1)}%`, true],
  ];

  return (
    <div className="mt-10 mx-auto max-w-xl">
      {rows.map(([label, value, highlight]) => (
        <div
          key={label}
          className="flex items-baseline justify-between border-b py-4"
          style={{ borderColor: palette.hairline }}
        >
          <span className="text-sm" style={{ color: palette.muted }}>
            {label}
          </span>
          <span
            className="text-lg"
            style={{
              fontFamily: "var(--font-display)",
              fontVariantNumeric: "tabular-nums",
              color: highlight ? palette.brass : palette.ivory,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bundle visual asset
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
      className="mx-auto mt-10 flex min-h-[240px] max-w-xl items-center justify-center border p-8"
      style={{ borderColor: palette.hairline }}
    >
      {loading && (
        <p className="text-xs uppercase" style={{ letterSpacing: "0.2em", color: palette.faint }}>
          Rendering concept…
        </p>
      )}

      {!loading && error && (
        <p className="max-w-sm text-center text-xs" style={{ color: palette.alert }}>
          {error}
        </p>
      )}

      {!loading && !error && url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Generated bundle concept" className="max-h-[380px] w-auto object-contain" />
      )}

      {!loading && !error && !url && (
        <p className="text-xs uppercase" style={{ letterSpacing: "0.2em", color: palette.faint }}>
          No concept rendered yet
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reserve bar — the single, unmissable conversion moment
// ---------------------------------------------------------------------------

function ReserveBar({
  reserved,
  onReserve,
  lowestStock,
  suggestedRetail,
}: {
  reserved: boolean;
  onReserve: () => void;
  lowestStock: number | null;
  suggestedRetail: number | null;
}) {
  return (
    <div
      className="sticky bottom-6 z-20 mx-auto mt-16 flex max-w-xl flex-col items-center gap-3 border px-8 py-6 text-center backdrop-blur sm:flex-row sm:justify-between sm:text-left"
      style={{ borderColor: palette.brass, background: `${palette.stage}E6` }}
    >
      <div>
        <p className="text-sm" style={{ fontFamily: "var(--font-display)", color: palette.ivory }}>
          {reserved ? "Bundle reserved for sourcing." : "This bundle is ready to source."}
        </p>
        {!reserved && lowestStock !== null && lowestStock < 50 && (
          <p className="mt-1 text-xs" style={{ color: palette.alert }}>
            Lowest warehouse stock: {lowestStock.toLocaleString("en-US")} units
          </p>
        )}
        {!reserved && suggestedRetail !== null && (
          <p className="mt-1 text-xs" style={{ color: palette.muted }}>
            Suggested retail {formatMoney(suggestedRetail)} per unit
          </p>
        )}
      </div>

      <button
        onClick={onReserve}
        disabled={reserved}
        className="whitespace-nowrap border px-6 py-2.5 text-[11px] uppercase transition-colors"
        style={{
          letterSpacing: "0.2em",
          borderColor: palette.brass,
          background: reserved ? "transparent" : palette.brass,
          color: reserved ? palette.brass : palette.stage,
        }}
      >
        {reserved ? "Reserved ✓" : "Reserve this bundle"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small shared pieces
// ---------------------------------------------------------------------------

function SectionEyebrow({ roman, title }: { roman: string; title: string }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span
        className="text-sm"
        style={{ fontFamily: "var(--font-display)", fontStyle: "italic", color: palette.brass }}
      >
        {roman}
      </span>
      <h2
        className="text-xl uppercase"
        style={{ fontFamily: "var(--font-body)", letterSpacing: "0.2em", color: palette.ivory }}
      >
        {title}
      </h2>
    </div>
  );
}

function WarningsNote({ warnings }: { warnings: string[] }) {
  return (
    <div className="mx-auto mt-6 max-w-xl text-center">
      {warnings.map((w, i) => (
        <p key={i} className="mt-1 text-xs" style={{ color: palette.faint }}>
          {w}
        </p>
      ))}
    </div>
  );
}

function ErrorNote({ message }: { message: string }) {
  return (
    <div className="mx-auto mt-6 max-w-xl text-center">
      <p className="text-sm" style={{ color: palette.alert }}>
        {message}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mt-24 grid grid-cols-1 gap-px sm:grid-cols-3" style={{ background: palette.hairline }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="aspect-[4/5] animate-pulse" style={{ background: palette.paper }} />
      ))}
    </div>
  );
}

function EmptyState({ prompt }: { prompt: string }) {
  return (
    <div className="mx-auto mt-24 max-w-md text-center">
      <p className="text-sm leading-relaxed" style={{ color: palette.muted }}>
        Nothing was sourced live for "{prompt}." Check the status line above,
        or refine the search.
      </p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-32 border-t pt-8 text-center" style={{ borderColor: palette.hairline }}>
      <p className="text-[10px] uppercase" style={{ letterSpacing: "0.3em", color: palette.faint }}>
        Sourced live · CJ Dropshipping · AliExpress · AutoDS
      </p>
    </footer>
  );
}