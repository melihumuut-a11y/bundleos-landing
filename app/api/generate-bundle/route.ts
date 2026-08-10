import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface BundleComponent {
  id: string;
  name: string;
  supplier: string;
  rawCost: number;
  stock: string;
  rawImage: string;
  productUrl: string | null;
  source: "cjdropshipping" | "aliexpress" | "fallback";
}

interface BundleResponse {
  success: boolean;
  prompt: string;
  bundleTitle: string;
  dataSource: "live" | "fallback";
  components: BundleComponent[];
  financials: {
    totalLandedCost: number;
    suggestedRetail: number;
    grossProfit: number;
    grossMarginPercentage: number;
  };
  warnings: string[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// 1. CJ Dropshipping Integration
// ---------------------------------------------------------------------------

let cachedCjToken: { token: string; expiresAt: number } | null = null;

async function getCjAccessToken(): Promise<string | null> {
  const apiKey = process.env.CJ_API_KEY;
  if (!apiKey) return null;

  if (cachedCjToken && cachedCjToken.expiresAt > Date.now()) {
    return cachedCjToken.token;
  }

  try {
    const res = await fetch(
      "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
        cache: "no-store",
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const token: string | undefined = data?.data?.accessToken;
    if (!token) return null;

    cachedCjToken = { token, expiresAt: Date.now() + 12 * 60 * 60 * 1000 };
    return token;
  } catch {
    return null;
  }
}

async function fetchCjProducts(prompt: string): Promise<BundleComponent[]> {
  const token = await getCjAccessToken();
  if (!token) return [];

  try {
    const url = new URL("https://developers.cjdropshipping.com/api2.0/v1/product/list");
    url.searchParams.set("productNameEn", prompt);
    url.searchParams.set("pageNum", "1");
    url.searchParams.set("pageSize", "3");

    const res = await fetch(url.toString(), {
      headers: { "CJ-Access-Token": token },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    const list: any[] = data?.data?.list ?? [];

    return list.slice(0, 3).map((item, i) => ({
      id: `cj-${i + 1}`,
      name: item.productNameEn ?? item.productName ?? "CJ Sourced Item",
      supplier: "CJ Dropshipping Factory",
      rawCost: typeof item.sellPrice === "number" ? item.sellPrice : 4.5,
      stock: "12,000+ units",
      rawImage: item.productImage ?? "",
      productUrl: item.pid ? `https://cjdropshipping.com/product/${item.pid}.html` : null,
      source: "cjdropshipping" as const,
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// 2. AliExpress Integration (via RapidAPI)
// ---------------------------------------------------------------------------

async function fetchAliExpressProducts(prompt: string): Promise<BundleComponent[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) return [];

  const host = process.env.RAPIDAPI_ALIEXPRESS_HOST ?? "aliexpress-datahub.p.rapidapi.com";
  const url = `https://${host}/item_search_2?q=${encodeURIComponent(prompt)}&page=1&sort=default`;

  try {
    const res = await fetch(url, {
      headers: {
        "X-RapidAPI-Key": rapidApiKey,
        "X-RapidAPI-Host": host,
      },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    const resultList: any[] = data?.result?.resultList ?? [];

    return resultList.slice(0, 3).map((entry, i) => {
      const item = entry.item ?? {};
      const rawImage: string = item.image ?? "";
      const imageUrl = rawImage.startsWith("//") ? `https:${rawImage}` : rawImage;

      return {
        id: `ali-${i + 1}`,
        name: item.title ?? "AliExpress Item",
        supplier: "AliExpress Verified Merchant",
        rawCost: typeof item.promotionPrice === "number" ? item.promotionPrice : 3.8,
        stock: typeof item.sales === "number" ? `${item.sales} sold` : "5,000+ units",
        rawImage: imageUrl,
        productUrl: item.itemUrl ?? null,
        source: "aliexpress" as const,
      };
    });
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// 3. Fallback Engine
// ---------------------------------------------------------------------------

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildFallbackProducts(prompt: string): BundleComponent[] {
  const rng = mulberry32(hashString(prompt));
  const words = prompt.replace(/[^a-zA-Z\s]/g, "").split(/\s+/).filter(Boolean);
  const base = words.length > 0 ? words : ["Universal", "Modular", "Essential"];

  const FALLBACK_SUPPLIERS = [
    "Shenzhen Global Trading Co.",
    "Ningbo Precision Manufacturing",
    "Yiwu Supply Co.",
  ];

  return Array.from({ length: 3 }, (_, i) => {
    const word = base[Math.floor(rng() * base.length)];
    const capitalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    return {
      id: `sku-${i + 1}`,
      name: `${capitalized} System Component #${i + 1}`,
      supplier: FALLBACK_SUPPLIERS[i % FALLBACK_SUPPLIERS.length],
      rawCost: Number((2.5 + rng() * 6).toFixed(2)),
      stock: Math.round(1000 + rng() * 15000).toLocaleString() + " units",
      rawImage: "",
      productUrl: null,
      source: "fallback" as const,
    };
  });
}

// ---------------------------------------------------------------------------
// Route Handler
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
  let components: BundleComponent[] = [];

  const [cjResult, aliResult] = await Promise.allSettled([
    fetchCjProducts(prompt),
    fetchAliExpressProducts(prompt),
  ]);

  if (cjResult.status === "fulfilled") {
    components.push(...cjResult.value);
  }
  if (aliResult.status === "fulfilled") {
    components.push(...aliResult.value);
  }

  const dataSource: "live" | "fallback" = components.length > 0 ? "live" : "fallback";

  if (components.length === 0) {
    if (!process.env.CJ_API_KEY && !process.env.RAPIDAPI_KEY) {
      warnings.push("Running in Fallback Mode. Configure CJ_API_KEY or RAPIDAPI_KEY for Live Data.");
    }
    components = buildFallbackProducts(prompt);
  }

  const finalComponents = components.slice(0, 3);
  const totalRawCost = Number(finalComponents.reduce((sum, c) => sum + c.rawCost, 0).toFixed(2));
  const totalLandedCost = Number((totalRawCost * 1.35).toFixed(2));
  const suggestedRetail = Number((totalLandedCost * 3.5).toFixed(2));
  const grossProfit = Number((suggestedRetail - totalLandedCost).toFixed(2));
  const grossMarginPercentage = Number(((grossProfit / suggestedRetail) * 100).toFixed(1));

  const response: BundleResponse = {
    success: true,
    prompt,
    bundleTitle: `BUILD A 3-PIECE SYSTEM FOR: "${prompt.toUpperCase()}"`,
    dataSource,
    components: finalComponents,
    financials: {
      totalLandedCost,
      suggestedRetail,
      grossProfit,
      grossMarginPercentage,
    },
    warnings,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(response, { status: 200 });
}