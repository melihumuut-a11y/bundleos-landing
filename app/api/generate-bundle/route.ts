import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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

interface NormalizedProduct {
  source: "cjdropshipping" | "aliexpress" | "autods";
  title: string;
  imageUrl: string;
  factoryPrice: number | null;
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

let cachedCjToken: { token: string; expiresAt: number } | null = null;

async function getCjAccessToken(): Promise<string> {
  const { value: apiKey, matchedName } = resolveServerEnvKey(CJ_KEY_CANDIDATES);
  if (!apiKey) {
    throw new CjApiError(`No CJ API key found.`);
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

  const data = await res.json().catch(() => null);

  if (!res.ok || data?.result !== true || !data?.data?.accessToken) {
    throw new CjApiError(
      `CJ Auth failed — CJ code ${data?.code}: "${data?.message}"`,
      { cjCode: data?.code, cjMessage: data?.message, httpStatus: res.status }
    );
  }

  const token: string = data.data.accessToken;
  cachedCjToken = { token, expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
  return token;
}

async function fetchCjProducts(
  prompt: string,
  destinationCountry: string
): Promise<NormalizedProduct[]> {
  const token = await getCjAccessToken();

  const url = new URL("https://developers.cjdropshipping.com/api2.0/v1/product/list");
  url.searchParams.set("productNameEn", prompt);
  url.searchParams.set("pageNum", "1");
  url.searchParams.set("pageSize", "12"); // 3 Ürün Limiti 12'ye Yükseltildi!

  const res = await fetch(url.toString(), {
    headers: { "CJ-Access-Token": token },
    cache: "no-store",
  });

  const data = await res.json().catch(() => null);

  if (!res.ok || data?.result !== true) {
    throw new CjApiError(
      `CJ product search failed — CJ code ${data?.code}: "${data?.message}"`,
      { httpStatus: res.status, cjCode: data?.code, cjMessage: data?.message }
    );
  }

  const list: any[] = data?.data?.list ?? [];

  return list.map((item) => ({
    source: "cjdropshipping" as const,
    title: item.productNameEn ?? item.productName ?? "Unknown Product",
    imageUrl: item.productImage ?? "",
    factoryPrice: typeof item.sellPrice === "number" ? item.sellPrice : null,
    currency: "USD",
    shippingCost: 4.5, // Varsayılan kargo tahmini (Hızlı arama yanıtı için)
    stock: 5000,
    supplierName: "CJ Warehouse Hub",
    productUrl: item.pid ? `https://cjdropshipping.com/product/${item.pid}.html` : null,
  }));
}

async function fetchAliExpressProducts(prompt: string): Promise<NormalizedProduct[]> {
  const rapidApiKey = resolveServerEnvKey(RAPIDAPI_KEY_CANDIDATES).value;
  if (!rapidApiKey) throw new Error("RAPIDAPI_KEY not configured");

  const host = process.env.RAPIDAPI_ALIEXPRESS_HOST ?? "aliexpress-datahub.p.rapidapi.com";
  const url = `https://${host}/item_search_2?q=${encodeURIComponent(prompt)}&page=1&sort=default`;

  const res = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": rapidApiKey,
      "X-RapidAPI-Host": host,
    },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`AliExpress search failed with status ${res.status}`);

  const data = await res.json();
  const resultList: any[] = data?.result?.resultList ?? [];

  return resultList.map((entry) => {
    const item = entry.item ?? {};
    const rawImage: string = item.image ?? "";
    const imageUrl = rawImage.startsWith("//") ? `https:${rawImage}` : rawImage;

    return {
      source: "aliexpress" as const,
      title: item.title ?? "Unknown Product",
      imageUrl,
      factoryPrice: typeof item.promotionPrice === "number" ? item.promotionPrice : (typeof item.price === "number" ? item.price : null),
      currency: "USD",
      shippingCost: 2.99,
      stock: item.sales ? item.sales * 10 : 1200,
      supplierName: "AliExpress Verified Supplier",
      productUrl: item.itemUrl ? (item.itemUrl.startsWith("//") ? `https:${item.itemUrl}` : item.itemUrl) : null,
    };
  });
}

function computeFinancials(products: NormalizedProduct[]): BundleFinancials | null {
  const pricedProducts = products.filter((p) => p.factoryPrice !== null);
  if (pricedProducts.length === 0) return null;

  const totalFactoryCost = Number(pricedProducts.reduce((sum, p) => sum + (p.factoryPrice ?? 0), 0).toFixed(2));
  const totalShipping = Number(pricedProducts.reduce((sum, p) => sum + (p.shippingCost ?? 0), 0).toFixed(2));
  const totalLandedCost = Number((totalFactoryCost + totalShipping).toFixed(2));
  const suggestedRetailPrice = Number((totalLandedCost * 2.8).toFixed(2));
  const grossProfit = Number((suggestedRetailPrice - totalLandedCost).toFixed(2));
  const grossMarginPercent = Number(((grossProfit / suggestedRetailPrice) * 100).toFixed(1));

  return { totalFactoryCost, totalLandedCost, suggestedRetailPrice, grossProfit, grossMarginPercent };
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = typeof (body as { prompt?: unknown })?.prompt === "string" ? (body as { prompt: string }).prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ error: "A non-empty 'prompt' is required." }, { status: 400 });
  }

  const destinationCountry = typeof (body as { destinationCountry?: unknown })?.destinationCountry === "string"
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

  const response: BundleResponse = {
    prompt,
    products, // Artık 3 ürün sınırı yok, tüm sonuçlar dönüyor!
    financials: computeFinancials(products),
    platformStatus,
    warnings,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(response, { status: 200 });
}