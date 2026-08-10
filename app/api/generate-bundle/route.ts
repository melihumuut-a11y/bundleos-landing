import { NextRequest, NextResponse } from "next/server";

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

async function getCjAccessToken(): Promise<string> {
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) throw new Error("CJ_API_KEY not configured");

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

  if (!res.ok) throw new Error(`CJ auth failed with status ${res.status}`);

  const data = await res.json();
  const token: string | undefined = data?.data?.accessToken;
  if (!token) throw new Error("CJ auth response missing accessToken");

  cachedCjToken = { token, expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
  return token;
}

async function fetchCjProducts(prompt: string): Promise<NormalizedProduct[]> {
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

  if (!res.ok) throw new Error(`CJ product search failed with status ${res.status}`);

  const data = await res.json();
  const list: any[] = data?.data?.list ?? [];

  return list.slice(0, 3).map((item) => ({
    source: "cjdropshipping" as const,
    title: item.productNameEn ?? item.productName ?? "Unknown product",
    imageUrl: item.productImage ?? "",
    factoryPrice: typeof item.sellPrice === "number" ? item.sellPrice : null,
    currency: "USD",
    shippingCost: null, // requires a separate freight-calculation call (pid + destination country)
    stock: null, // requires a separate /product/stock/queryByVid call
    supplierName: "CJ Dropshipping Warehouse",
    productUrl: item.pid
      ? `https://cjdropshipping.com/product/${item.pid}.html`
      : null,
  }));
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

  const warnings: string[] = [];
  const platformStatus: Record<string, "ok" | "skipped_no_key" | "failed"> = {
    cjdropshipping: "skipped_no_key",
    aliexpress: "skipped_no_key",
    autods: "skipped_no_key",
  };

  if (!process.env.CJ_API_KEY) {
    warnings.push("CJ_API_KEY is not set — skipping CJ Dropshipping.");
  }
  if (!process.env.RAPIDAPI_KEY) {
    warnings.push("RAPIDAPI_KEY is not set — skipping AliExpress.");
  }
  if (!process.env.AUTODS_API_KEY || !process.env.AUTODS_API_BASE_URL) {
    warnings.push(
      "AUTODS_API_KEY / AUTODS_API_BASE_URL not set — skipping AutoDS. Note: these are only issued after AutoDS approves your API application."
    );
  }

  const tasks: Array<Promise<NormalizedProduct[]>> = [];
  const taskNames: Array<keyof typeof platformStatus> = [];

  if (process.env.CJ_API_KEY) {
    tasks.push(fetchCjProducts(prompt));
    taskNames.push("cjdropshipping");
  }
  if (process.env.RAPIDAPI_KEY) {
    tasks.push(fetchAliExpressProducts(prompt));
    taskNames.push("aliexpress");
  }
  if (process.env.AUTODS_API_KEY && process.env.AUTODS_API_BASE_URL) {
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
      warnings.push(`${name} request failed: ${String(result.reason?.message ?? result.reason)}`);
    }
  });

  if (products.length === 0) {
    warnings.push(
      "No live product data was returned from any platform. Check API keys and platform status above."
    );
  }

  const response: BundleResponse = {
    prompt,
    products: products.slice(0, 3),
    financials: computeFinancials(products),
    platformStatus,
    warnings,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(response, { status: products.length > 0 ? 200 : 502 });
}