import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BundleComponent {
  id: string;
  name: string;
  supplier: string;
  supplierLocation: string;
  rawCost: number;
  moq: number;
  stock: string;
  leadTimeDays: number;
}

interface BundleResponse {
  success: boolean;
  prompt: string;
  detectedCategory: string;
  bundleTitle: string;
  components: BundleComponent[];
  financials: {
    totalUnitCost: number;
    totalLandedCost: number;
    suggestedRetail: number;
    grossProfit: number;
    grossMarginPercentage: number;
  };
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Static knowledge base (no external API calls, no keys, no rate limits)
// ---------------------------------------------------------------------------

const SUPPLIER_POOL = [
  { name: "Shenzhen Global Trading Co.", location: "Shenzhen, Guangdong" },
  { name: "Ningbo Precision Manufacturing", location: "Ningbo, Zhejiang" },
  { name: "Yiwu Supply Co.", location: "Yiwu, Zhejiang" },
  { name: "Guangzhou Sunrise Industries", location: "Guangzhou, Guangdong" },
  { name: "Dongguan Hardware Works", location: "Dongguan, Guangdong" },
  { name: "Foshan United Plastics", location: "Foshan, Guangdong" },
  { name: "Jiangsu Fortune Exports", location: "Suzhou, Jiangsu" },
  { name: "Xiamen Harbor Trading", location: "Xiamen, Fujian" },
  { name: "Hangzhou Bright Manufacturing", location: "Hangzhou, Zhejiang" },
  { name: "Qingdao Ocean Supply Co.", location: "Qingdao, Shandong" },
];

interface CategoryDefinition {
  keywords: string[];
  categoryLabel: string;
  componentTemplates: string[];
  unitCostRange: [number, number];
  retailMultiplierRange: [number, number];
}

const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  {
    keywords: ["car", "auto", "vehicle", "detailing", "wash", "ceramic"],
    categoryLabel: "Automotive Detailing System",
    componentTemplates: [
      "Ceramic Coating Spray Bottle (500ml)",
      "Microfiber Drying Towel Set (3-Pack)",
      "Foam Cannon Pressure Washer Attachment",
      "Interior Dashboard UV Protectant Wipes",
      "Wheel & Rim Detailing Brush Kit",
      "Glass & Windshield Polishing Cloth",
    ],
    unitCostRange: [1.8, 6.5],
    retailMultiplierRange: [3.2, 4.5],
  },
  {
    keywords: ["dog", "cat", "pet", "puppy", "kitten", "animal"],
    categoryLabel: "Pet Care & Accessories System",
    componentTemplates: [
      "Adjustable No-Pull Pet Harness",
      "Stainless Steel Slow-Feed Bowl",
      "Retractable Pet Leash (5m)",
      "Grooming De-Shedding Brush",
      "Orthopedic Memory Foam Pet Bed",
      "Interactive Treat-Dispensing Toy",
    ],
    unitCostRange: [2.2, 8.0],
    retailMultiplierRange: [3.0, 4.2],
  },
  {
    keywords: ["camp", "camping", "outdoor", "hiking", "tent", "backpacking"],
    categoryLabel: "Outdoor & Camping Gear System",
    componentTemplates: [
      "Compact Folding Camp Stove",
      "Waterproof Dry Bag (20L)",
      "LED Rechargeable Camping Lantern",
      "Multi-Tool Carabiner Set",
      "Insulated Double-Wall Camping Mug",
      "Portable Camp Hammock with Straps",
    ],
    unitCostRange: [3.0, 9.5],
    retailMultiplierRange: [2.8, 4.0],
  },
  {
    keywords: ["coffee", "espresso", "barista", "brew", "latte"],
    categoryLabel: "Coffee & Barista Tools System",
    componentTemplates: [
      "Stainless Steel Milk Frothing Pitcher",
      "Precision Coffee Dosing Cup",
      "Reusable Pour-Over Filter Cone",
      "Digital Espresso Scale with Timer",
      "Coffee Bean Storage Canister (Airtight)",
      "Tamper & Distribution Tool Set",
    ],
    unitCostRange: [2.5, 7.8],
    retailMultiplierRange: [3.0, 4.3],
  },
  {
    keywords: ["kitchen", "cook", "cooking", "chef", "baking"],
    categoryLabel: "Kitchen & Cooking Accessories",
    componentTemplates: [
      "Silicone Kitchen Utensil Set",
      "Adjustable Mandoline Slicer",
      "Digital Kitchen Scale",
      "Non-Stick Baking Mat Set",
      "Stainless Steel Mixing Bowl Set",
      "Magnetic Knife Storage Strip",
    ],
    unitCostRange: [2.0, 7.0],
    retailMultiplierRange: [3.0, 4.2],
  },
  {
    keywords: ["fitness", "gym", "yoga", "workout", "exercise"],
    categoryLabel: "Fitness & Wellness System",
    componentTemplates: [
      "Resistance Band Training Set",
      "Non-Slip Yoga Mat (6mm)",
      "Adjustable Foam Roller",
      "Digital Jump Rope with Counter",
      "Compact Ab Wheel Roller",
      "Moisture-Wicking Grip Gloves",
    ],
    unitCostRange: [2.5, 8.5],
    retailMultiplierRange: [3.0, 4.4],
  },
];

const GENERIC_COMPONENT_SUFFIXES = [
  "Precision Kit",
  "Deluxe Accessory Set",
  "Multi-Use Tool",
  "Compact Storage Case",
  "Pro-Grade Attachment",
];

// ---------------------------------------------------------------------------
// Helpers
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

function randomInRange(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function shuffleUnique<T>(rng: () => number, arr: T[], count: number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  while (result.length < count && copy.length > 0) {
    const idx = Math.floor(rng() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function detectCategory(prompt: string): CategoryDefinition | null {
  const normalized = prompt.toLowerCase();
  let bestMatch: { def: CategoryDefinition; score: number } | null = null;

  for (const def of CATEGORY_DEFINITIONS) {
    const score = def.keywords.reduce(
      (acc, kw) => acc + (normalized.includes(kw) ? 1 : 0),
      0
    );
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { def, score };
    }
  }

  return bestMatch ? bestMatch.def : null;
}

function buildGenericComponents(prompt: string, rng: () => number): string[] {
  const words = prompt
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const baseWords = words.length > 0 ? words : ["Universal", "Modular", "Essential"];

  return Array.from({ length: 3 }, () => {
    const word = pick(rng, baseWords);
    const suffix = pick(rng, GENERIC_COMPONENT_SUFFIXES);
    const capitalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    return `${capitalized} ${suffix}`;
  });
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 }
    );
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

  const rng = mulberry32(hashString(prompt));

  const matchedCategory = detectCategory(prompt);
  const categoryLabel = matchedCategory
    ? matchedCategory.categoryLabel
    : "General Merchandise";

  const componentNames = matchedCategory
    ? shuffleUnique(rng, matchedCategory.componentTemplates, 3)
    : buildGenericComponents(prompt, rng);

  const [costMin, costMax] = matchedCategory
    ? matchedCategory.unitCostRange
    : [2.0, 7.0];
  const [retailMultMin, retailMultMax] = matchedCategory
    ? matchedCategory.retailMultiplierRange
    : [3.0, 4.0];

  const chosenSuppliers = shuffleUnique(rng, SUPPLIER_POOL, 3);

  const components: BundleComponent[] = componentNames.map((name, i) => {
    const supplier = chosenSuppliers[i % chosenSuppliers.length];
    const unitCost = Number(randomInRange(rng, costMin, costMax).toFixed(2));
    const stockNum = Math.round(randomInRange(rng, 1000, 25000));
    const moq = Math.round(randomInRange(rng, 50, 500));
    const leadTimeDays = Math.round(randomInRange(rng, 12, 35));

    return {
      id: `sku-${i + 1}`,
      name: name,
      supplier: supplier.name,
      supplierLocation: supplier.location,
      rawCost: unitCost,
      moq,
      stock: stockNum.toLocaleString() + " units",
      leadTimeDays,
    };
  });

  const totalUnitCost = Number(
    components.reduce((sum, c) => sum + c.rawCost, 0).toFixed(2)
  );

  const landedCostMultiplier = randomInRange(rng, 1.25, 1.45);
  const landedCostPerUnit = Number(
    (totalUnitCost * landedCostMultiplier).toFixed(2)
  );

  const retailMultiplier = randomInRange(rng, retailMultMin, retailMultMax);
  const suggestedRetailPrice = Number(
    (landedCostPerUnit * retailMultiplier).toFixed(2)
  );

  const grossProfitPerUnit = Number(
    (suggestedRetailPrice - landedCostPerUnit).toFixed(2)
  );
  const grossMarginPercent = Number(
    ((grossProfitPerUnit / suggestedRetailPrice) * 100).toFixed(1)
  );

  const bundleTitle = `${categoryLabel.toUpperCase()} (${components.length}-PIECE SYSTEM)`;

  const response: BundleResponse = {
    success: true,
    prompt,
    detectedCategory: categoryLabel,
    bundleTitle,
    components,
    financials: {
      totalUnitCost,
      totalLandedCost: landedCostPerUnit,
      suggestedRetail: suggestedRetailPrice,
      grossProfit: grossProfitPerUnit,
      grossMarginPercentage: grossMarginPercent,
    },
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(response, { status: 200 });
}