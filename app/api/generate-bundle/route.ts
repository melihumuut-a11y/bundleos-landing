import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    let components = [
      { id: 'sku-1', name: 'Silicone Paw Cleaner Cup', rawCost: 3.20, rawImage: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400' },
      { id: 'sku-2', name: 'Rubber Grooming Bath Brush', rawCost: 1.80, rawImage: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400' },
      { id: 'sku-3', name: 'Microfiber Pet Drying Towel', rawCost: 1.90, rawImage: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400' }
    ];

    if (prompt && (prompt.toLowerCase().includes('car') || prompt.toLowerCase().includes('araba'))) {
      components = [
        { id: 'sku-1', name: 'Vent Detailing Gel Cleaner', rawCost: 1.50, rawImage: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=400' },
        { id: 'sku-2', name: 'Microfiber Detailing Towels (3x)', rawCost: 2.10, rawImage: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=400' },
        { id: 'sku-3', name: 'Leather Conditioning Brush', rawCost: 2.30, rawImage: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=400' }
      ];
    }

    const cogs = components.reduce((acc, c) => acc + c.rawCost, 0);
    const consolidatedShipping = 4.50;
    const totalLandedCost = parseFloat((cogs + consolidatedShipping).toFixed(2));
    const suggestedRetail = 44.99;
    const grossProfit = parseFloat((suggestedRetail - totalLandedCost).toFixed(2));
    const grossMargin = parseFloat(((grossProfit / suggestedRetail) * 100).toFixed(1));

    return NextResponse.json({
      success: true,
      bundleTitle: (prompt || 'BUNDLE').toUpperCase() + " SYSTEM",
      components,
      financials: {
        totalLandedCost,
        suggestedRetail,
        grossProfit,
        grossMarginPercentage: grossMargin,
        breakEvenRoas: parseFloat((suggestedRetail / grossProfit).toFixed(2))
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate bundle' }, { status: 500 });
  }
}