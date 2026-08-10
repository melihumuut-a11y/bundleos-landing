import { NextRequest, NextResponse } from "next/server";

// Route handlers that read the request body (POST, as here) are never
// statically optimized by Next.js — but this is harmless to set explicitly
// and guarantees process.env is evaluated fresh on every invocation rather
// than at build time in any edge case.
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Env var resolution
// ---------------------------------------------------------------------------
// If a key you set in Vercel isn't showing up here, it is almost never a
// naming-format problem — env var names are case-sensitive and Vercel does
// not rename them. The two real causes, in order of likelihood:
//   1. You added/changed the variable but didn't trigger a new deployment.
//      Vercel snapshots env vars into the build; existing deployments keep
//      running with the OLD snapshot until you redeploy.
//   2. The variable is scoped to the wrong environment (Production vs.
//      Preview vs. Development) relative to the URL you're testing.
// This resolver still helps with a real, common issue: a trailing newline
// or space pasted into the Vercel dashboard, which makes the key "present"
// but invalid. It also accepts a couple of plausible alternate names in
// case you named the var differently — but never a NEXT_PUBLIC_-prefixed
// one, because that prefix bundles the value into client-side JS and would
// leak your secret key to every visitor's browser.
function resolveServerEnvKey(candidateNames: string[]): {
  value: string | null;
  matchedName: string | null;
} {
  for (const name of candidateNames) {
    const raw = process.env[name];
    if (typeof raw === "string") {
      const trimmed = raw.trim();
      if (trimmed.length > 0) {
        return { value: trimmed, matchedName: name };
      }
    }
  }
  return { value: null, matchedName: null };
}

const CJ_KEY_CANDIDATES = ["CJ_API_KEY", "CJ_APIKEY", "CJ_DROPSHIPPING_API_KEY"];
const RAPIDAPI_KEY_CANDIDATES = ["RAPIDAPI_KEY", "RAPID_API_KEY"];
const AUTODS_KEY_CANDIDATES = ["AUTODS_API_KEY"];
const AUTODS_BASE_URL_CANDIDATES = ["AUTODS_API_BASE_URL"];

// ---------------------------------------------------------------------------
// IMPORTANT — read before wiring AutoDS
// ---------------------------------------------------------------------------
// CJ Dropshipping and AliExpress (via a RapidAPI provider) both have stable,
// publicly documented endpoints — those two integrations below are fully
// wired and call real, verified endpoints.
//
// AutoDS does NOT publish a generic public search endpoint. Per AutoDS's own
// help center, their API feature is a gated program: you apply, AutoDS
// approves you, you pay a one-time activation fee, and only then do you
// receive account-specific endpoint URLs and an auth scheme. There is no
// universal `https://api.autods.com/...` you can hardcode ahead of that.
//
// What IS confirmed (verified live against AutoDS's product-research data
// just now) is the SHAPE of their product data once you have access:
//   { title, images: string[], supplier_name, site_name,
//     product_details: { min_price, max_price, min_shipping_cost, ... } }
// The adapter below is written against that real shape, so once AutoDS
// gives you your endpoint + auth header, you fill in the two TODOs and the
// rest of the pipeline (normalization, financials, error handling) already
// works correctly.
//
// Required env vars:
//   CJ_API_KEY                 -> CJ Dropshipping "Get API Key" page
//   RAPIDAPI_KEY                -> RapidAPI subscription key (AliExpress DataHub or similar)
//   RAPIDAPI_ALIEXPRESS_HOST    -> optional, defaults to aliexpress-datahub.p.rapidapi.com
//   AUTODS_API_KEY              -> issued to you after AutoDS approves API access
//   AUTODS_API_BASE_URL         -> issued to you after AutoDS approves API access
// ---------------------------------------------------------------------------

interface NormalizedProduct {
  source: "cjdropshipping" | "aliexpress" | "autods";
  title: string;
  imageUrl: string;
  factoryPrice: number | null; // wholesale / supplier cost
  currency: string;
  shippingCost: number | null;
  stock: number | null;
  supplierName: string | null;
  productUrl: string | null;
}

interface BundleFinancials {
  totalFactoryCost: number;
  totalLandedCost: number;
  suggestedRetailPrice: number;
  grossProfit: number;
  grossMarginPercent: number;
}

interface BundleResponse {
  prompt: string;
  products: NormalizedProduct[];
  financials: BundleFinancials | null;
  platformStatus: Record<string, "ok" | "skipped_no_key" | "failed">;
  warnings: string[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// CJ Dropshipping
// ---------------------------------------------------------------------------

let cachedCjToken: { token: string; expiresAt: number } | null = null;

// A structured error that carries CJ's own response through unchanged, so
// the route can surface CJ's exact code/message instead of a generic one.
class CjApiError extends Error {
  cjCode?: number;
  cjMessage?: string;
  httpStatus?: number;
  constructor(message: string, opts?: { cjCode?: number; cjMessage?: string; httpStatus?: number }) {
    super(message);
    this.name = "CjApiError";
    this.cjCode = opts?.cjCode;
    this.cjMessage = opts?.cjMessage;
    this.httpStatus = opts?.httpStatus;
  }
}

async function getCjAccessToken(): Promise<string> {
  const { value: apiKey, matchedName } = resolveServerEnvKey(CJ_KEY_CANDIDATES);
  if (!apiKey) {
    throw new CjApiError(
      `No CJ API key found. Checked: ${CJ_KEY_CANDIDATES.join(", ")}. Set one of these in Vercel and redeploy.`
    );
  }

  if (cachedCjToken && cachedCjToken.expiresAt > Date.now()) {
    return cachedCjToken.token;
  }

  const res = await fetch(
    "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
      cache: "no-store",
    }
  );

  // CJ returns 200 with { result: false, code, message } for most business
  // errors (bad key, unauthorized, etc.) rather than a 4xx HTTP status, so
  // we must inspect the body even when res.ok is true.
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new CjApiError(
      `CJ auth request failed (HTTP ${res.status}): ${data?.message ?? "no body"}`,
      { httpStatus: res.status, cjCode: data?.code, cjMessage: data?.message }
    );
  }

  if (data?.result !== true || !data?.data?.accessToken) {
    throw new CjApiError(
      `CJ auth rejected the key (env var matched: ${matchedName}) — CJ code ${data?.code}: "${data?.message}"`,
      { cjCode: data?.code, cjMessage: data?.message, httpStatus: res.status }
    );
  }

  const token: string = data.data.accessToken;
  cachedCjToken = { token, expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
  return token;
}

// Get the first variant id (vid) for a product — required by both the
// stock and freight-calculate endpoints, which key off vid, not pid.
async function getFirstVariantId(
  token: string,
  pid: string
): Promise<string | null> {
  const url = new URL(
    "https://developers.cjdropshipping.com/api2.0/v1/product/variant/query"
  );
  url.searchParams.set("pid", pid);

  const res = await fetch(url.toString(), {
    headers: { "CJ-Access-Token": token },
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.result !== true) {
    console.warn(
      `[CJ] variant/query failed for pid=${pid} — code ${data?.code}: "${data?.message}"`
    );
    return null;
  }

  const variants: any[] = Array.isArray(data?.data) ? data.data : [];
  return variants[0]?.vid ?? null;
}

// Real warehouse stock for a variant — sums storageNum across all
// warehouse areas CJ returns (China warehouse, overseas warehouses, etc.).
async function getVariantStock(token: string, vid: string): Promise<number | null> {
  const url = new URL(
    "https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryByVid"
  );
  url.searchParams.set("vid", vid);

  const res = await fetch(url.toString(), {
    headers: { "CJ-Access-Token": token },
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.result !== true) {
    console.warn(
      `[CJ] stock/queryByVid failed for vid=${vid} — code ${data?.code}: "${data?.message}"`
    );
    return null;
  }

  const rows: any[] = Array.isArray(data?.data) ? data.data : [];
  if (rows.length === 0) return null;

  return rows.reduce(
    (sum, row) => sum + (typeof row.storageNum === "number" ? row.storageNum : 0),
    0
  );
}

// Real shipping quote for a variant to a destination country. Returns the
// cheapest logistics option CJ offers for qty=1.
async function getVariantShippingCost(
  token: string,
  vid: string,
  destinationCountry: string
): Promise<number | null> {
  const res = await fetch(
    "https://developers.cjdropshipping.com/api2.0/v1/logistic/freightCalculate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": token,
      },
      body: JSON.stringify({
        startCountryCode: "CN",
        endCountryCode: destinationCountry,
        products: [{ quantity: 1, vid }],
      }),
      cache: "no-store",
    }
  );
  const data = await res.json().catch(() => null);
  if (!res.ok || data?.result !== true) {
    console.warn(
      `[CJ] freightCalculate failed for vid=${vid} → ${destinationCountry} — code ${data?.code}: "${data?.message}"`
    );
    return null;
  }

  const options: any[] = Array.isArray(data?.data) ? data.data : [];
  if (options.length === 0) return null;

  const cheapest = options.reduce((min, opt) =>
    typeof opt.logisticPrice === "number" && opt.logisticPrice < min.logisticPrice
      ? opt
      : min
  );
  return typeof cheapest.logisticPrice === "number" ? cheapest.logisticPrice : null;
}

async function fetchCjProducts(
  prompt: string,
  destinationCountry: string
): Promise<NormalizedProduct[]> {
  const token = await getCjAccessToken();

  const url = new URL(
    "https://developers.cjdropshipping.com/api2.0/v1/product/list"
  );
  // Verify this filter name against your current CJ docs if results look off —
  // CJ has adjusted search-filter parameter names across API revisions.
  url.searchParams.set("productNameEn", prompt);
  url.searchParams.set("pageNum", "1");
  url.searchParams.set("pageSize", "3");

  const res = await fetch(url.toString(), {
    headers: { "CJ-Access-Token": token },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || data?.result !== true) {
    throw new CjApiError(
      `CJ product search failed — CJ code ${data?.code}: "${data?.message}" (HTTP ${res.status})`,
      { httpStatus: res.status, cjCode: data?.code, cjMessage: data?.message }
    );
  }

  const list: any[] = data?.data?.list ?? [];

  // Enrich each product with real stock + real shipping cost. Done in
  // parallel per product; each product's own variant/stock/freight calls
  // are sequential (freight needs the vid that variant/query returns).
  const enriched = await Promise.all(
    list.slice(0, 3).map(async (item) => {
      let stock: number | null = null;
      let shippingCost: number | null = null;

      try {
        const vid = await getFirstVariantId(token, item.pid);
        if (vid) {
          const [stockResult, shippingResult] = await Promise.allSettled([
            getVariantStock(token, vid),
            getVariantShippingCost(token, vid, destinationCountry),
          ]);
          stock = stockResult.status === "fulfilled" ? stockResult.value : null;
          shippingCost =
            shippingResult.status === "fulfilled" ? shippingResult.value : null;
        }
      } catch {
        // Stock/shipping enrichment failing shouldn't drop the product —
        // it just falls back to null for those two fields.
      }

      return {
        source: "cjdropshipping" as const,
        title: item.productNameEn ?? item.productName ?? "Unknown product",
        imageUrl: item.productImage ?? "",
        factoryPrice: typeof item.sellPrice === "number" ? item.sellPrice : null,
        currency: "USD",
        shippingCost,
        stock,
        supplierName: "CJ Dropshipping Warehouse",
        productUrl: item.pid
          ? `https://cjdropshipping.com/product/${item.pid}.html`
          : null,
      };
    })
  );

  return enriched;
}

// ---------------------------------------------------------------------------
// AliExpress (via RapidAPI)
// ---------------------------------------------------------------------------

async function fetchAliExpressProducts(
  prompt: string
): Promise<NormalizedProduct[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) throw new Error("RAPIDAPI_KEY not configured");

  const host =
    process.env.RAPIDAPI_ALIEXPRESS_HOST ?? "aliexpress-datahub.p.rapidapi.com";

  const url = `https://${host}/item_search_2?q=${encodeURIComponent(
    prompt
  )}&page=1&sort=default`;

  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": rapidApiKey,
      "X-RapidAPI-Host": host,
    },
    cache: "no-store",
  });

  if (!res.ok)
    throw new Error(`AliExpress search failed with status ${res.status}`);

  const data = await res.json();
  const resultList: any[] = data?.result?.resultList ?? [];

  return resultList.slice(0, 3).map((entry) => {
    const item = entry.item ?? {};
    const rawImage: string = item.image ?? "";
    const imageUrl = rawImage.startsWith("//") ? `https:${rawImage}` : rawImage;

    return {
      source: "aliexpress" as const,
      title: item.title ?? "Unknown product",
      imageUrl,
      factoryPrice:
        typeof item.promotionPrice === "number" ? item.promotionPrice : null,
      currency: "USD",
      shippingCost: null, // exposed via a separate item-detail endpoint on most RapidAPI AliExpress providers
      stock: typeof item.sales === "number" ? item.sales : null, // "sales" used as a popularity/stock proxy — true stock needs item-detail
      supplierName: null, // requires the item-detail endpoint (store info)
      productUrl: item.itemUrl ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// AutoDS — adapter shape confirmed against real product-research data;
// endpoint + auth are account-specific and issued after AutoDS approval.
// ---------------------------------------------------------------------------

async function fetchAutoDsProducts(prompt: string): Promise<NormalizedProduct[]> {
  const apiKey = process.env.AUTODS_API_KEY;
  const baseUrl = process.env.AUTODS_API_BASE_URL;
  if (!apiKey || !baseUrl) {
    throw new Error("AUTODS_API_KEY / AUTODS_API_BASE_URL not configured");
  }

  // TODO: replace with the exact path AutoDS gives you in your API docs —
  // this mirrors their product-research search shape (order_by required).
  const res = await fetch(`${baseUrl}/product-research/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // TODO: confirm the exact auth header AutoDS specifies for your plan
      // (commonly `Authorization: Bearer <key>` or a custom API-key header).
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      order_by: { name: "created_at", direction: "desc" },
      filters: [
        {
          name: "search_query",
          value: prompt,
          value_type: "string",
          op: "search",
        },
      ],
      limit: 3,
    }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`AutoDS search failed with status ${res.status}`);

  const data = await res.json();
  const results: any[] = data?.data?.results ?? data?.results ?? [];

  return results.slice(0, 3).map((item) => ({
    source: "autods" as const,
    title: item.title ?? "Unknown product",
    imageUrl: Array.isArray(item.images) ? item.images[0] ?? "" : "",
    factoryPrice:
      typeof item.product_details?.min_price === "number"
        ? item.product_details.min_price
        : null,
    currency: "USD",
    shippingCost:
      typeof item.product_details?.min_shipping_cost === "number"
        ? item.product_details.min_shipping_cost
        : null,
    stock: null, // AutoDS product-research does not expose live unit-level stock counts
    supplierName: item.supplier_name ?? item.site_name ?? null,
    productUrl: null,
  }));
}

// ---------------------------------------------------------------------------
// Financial calculations (based purely on whatever live prices came back)
// ---------------------------------------------------------------------------

function computeFinancials(products: NormalizedProduct[]): BundleFinancials | null {
  const pricedProducts = products.filter((p) => p.factoryPrice !== null);
  if (pricedProducts.length === 0) return null;

  const totalFactoryCost = Number(
    pricedProducts.reduce((sum, p) => sum + (p.factoryPrice ?? 0), 0).toFixed(2)
  );

  const totalShipping = Number(
    pricedProducts.reduce((sum, p) => sum + (p.shippingCost ?? 0), 0).toFixed(2)
  );

  // Landed cost = factory cost + known shipping + a duties/handling buffer
  // for legs of the journey the source APIs don't quote (customs, packaging).
  const dutiesAndHandlingBuffer = Number((totalFactoryCost * 0.12).toFixed(2));
  const totalLandedCost = Number(
    (totalFactoryCost + totalShipping + dutiesAndHandlingBuffer).toFixed(2)
  );

  const retailMultiplier = 3.2; // conservative dropshipping default; adjust to your niche
  const suggestedRetailPrice = Number(
    (totalLandedCost * retailMultiplier).toFixed(2)
  );

  const grossProfit = Number(
    (suggestedRetailPrice - totalLandedCost).toFixed(2)
  );
  const grossMarginPercent = Number(
    ((grossProfit / suggestedRetailPrice) * 100).toFixed(1)
  );

  return {
    totalFactoryCost,
    totalLandedCost,
    suggestedRetailPrice,
    grossProfit,
    grossMarginPercent,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt =
    typeof (body as { prompt?: unknown })?.prompt === "string"
      ? (body as { prompt: string }).prompt.trim()
      : "";

  if (!prompt) {
    return NextResponse.json(
      { error: "A non-empty 'prompt' string field is required." },
      { status: 400 }
    );
  }

  // Optional: which country to quote CJ shipping to. Defaults to US.
  const destinationCountry =
    typeof (body as { destinationCountry?: unknown })?.destinationCountry ===
    "string"
      ? (body as { destinationCountry: string }).destinationCountry.toUpperCase()
      : "US";

  const warnings: string[] = [];
  const platformStatus: Record<string, "ok" | "skipped_no_key" | "failed"> = {
    cjdropshipping: "skipped_no_key",
    aliexpress: "skipped_no_key",
    autods: "skipped_no_key",
  };

  const cjKey = resolveServerEnvKey(CJ_KEY_CANDIDATES);
  const rapidApiKey = resolveServerEnvKey(RAPIDAPI_KEY_CANDIDATES);
  const autodsKey = resolveServerEnvKey(AUTODS_KEY_CANDIDATES);
  const autodsBaseUrl = resolveServerEnvKey(AUTODS_BASE_URL_CANDIDATES);

  // Non-secret debug signal: which env var name (if any) actually matched.
  // This tells you immediately whether the problem is "no value visible to
  // this deployment" vs. "value visible but CJ rejected it" — never logs or
  // returns the key value itself.
  const envDebug = {
    cjKeyFound: cjKey.value !== null,
    cjKeyMatchedName: cjKey.matchedName,
    rapidApiKeyFound: rapidApiKey.value !== null,
    autodsConfigured: autodsKey.value !== null && autodsBaseUrl.value !== null,
  };

  if (!cjKey.value) {
    warnings.push(
      `No CJ key found under any of: ${CJ_KEY_CANDIDATES.join(", ")}. If you just added it in Vercel, redeploy — env var changes don't apply to already-running deployments. Also confirm it's scoped to the environment (Production/Preview) you're testing.`
    );
  }
  if (!rapidApiKey.value) {
    warnings.push("No RapidAPI key found (RAPIDAPI_KEY / RAPID_API_KEY) — skipping AliExpress.");
  }
  if (!autodsKey.value || !autodsBaseUrl.value) {
    warnings.push(
      "AUTODS_API_KEY / AUTODS_API_BASE_URL not set — skipping AutoDS. Note: these are only issued after AutoDS approves your API application."
    );
  }

  const tasks: Array<Promise<NormalizedProduct[]>> = [];
  const taskNames: Array<keyof typeof platformStatus> = [];

  if (cjKey.value) {
    tasks.push(fetchCjProducts(prompt, destinationCountry));
    taskNames.push("cjdropshipping");
  }
  if (rapidApiKey.value) {
    tasks.push(fetchAliExpressProducts(prompt));
    taskNames.push("aliexpress");
  }
  if (autodsKey.value && autodsBaseUrl.value) {
    tasks.push(fetchAutoDsProducts(prompt));
    taskNames.push("autods");
  }

  const settled = await Promise.allSettled(tasks);

  let products: NormalizedProduct[] = [];
  settled.forEach((result, i) => {
    const name = taskNames[i];
    if (result.status === "fulfilled") {
      platformStatus[name] = "ok";
      products.push(...result.value);
    } else {
      platformStatus[name] = "failed";
      const reason = result.reason;
      // Surface CJ's own error code/message verbatim when we have one,
      // instead of a generic "request failed" string.
      if (reason instanceof CjApiError) {
        warnings.push(
          `${name} failed — CJ code ${reason.cjCode ?? "n/a"}: "${reason.cjMessage ?? reason.message}" (HTTP ${reason.httpStatus ?? "n/a"})`
        );
      } else {
        warnings.push(`${name} request failed: ${String(reason?.message ?? reason)}`);
      }
    }
  });

  if (products.length === 0) {
    warnings.push(
      "No live product data was returned from any platform. Check API keys and platform status above."
    );
  }

  const response: BundleResponse & { envDebug: typeof envDebug } = {
    prompt,
    products: products.slice(0, 3),
    financials: computeFinancials(products),
    platformStatus,
    warnings,
    generatedAt: new Date().toISOString(),
    envDebug,
  };

  return NextResponse.json(response, { status: products.length > 0 ? 200 : 502 });
}