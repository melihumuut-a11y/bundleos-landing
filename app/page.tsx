'use client';

import { useState, useEffect } from 'react';

interface NormalizedProduct {
  source: 'cjdropshipping' | 'aliexpress' | 'autods';
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
  platformStatus: Record<string, 'ok' | 'skipped_no_key' | 'failed'>;
  warnings: string[];
  generatedAt: string;
}

const LIVE_TRANSACTIONS = [
  "⚡ [CJ-CN WAREHOUSE] 48x 'Ceramic Car Kit' dispatched to Miami, FL — Landed Margin: +68%",
  "🔥 [ALIEXPRESS HUB] Bundle Sourced: Pet Grooming Suite — Wholesale: $12.40 | Retail: $49.99",
  "💎 [AUTODS PIPELINE] High-Margin Niche Locked: Smart Pet Feeder — Gross Profit: $38.20/unit",
  "🚀 [LOGISTICS] Freight Calculated to Berlin, DE — Cheapest Route Optimized via CJ Express",
  "💰 [CHECKOUT SYNC] Shopify Store #8814 auto-fulfilled 12 units in last 14 minutes",
];

export default function Home() {
  const [prompt, setPrompt] = useState('3-piece ceramic car washing kit');
  const [destinationCountry, setDestinationCountry] = useState('US');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BundleResponse | null>(null);
  const [studioResult, setStudioResult] = useState<any>(null);
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % LIVE_TRANSACTIONS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setStudioResult(null);

    try {
      const res = await fetch('/api/generate-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, destinationCountry }),
      });

      const result = await res.json();
      setData(result);

      if (result.products && result.products.length > 0) {
        fetchStudioImage(result.products, prompt);
      }
    } catch (err) {
      console.error('Pipeline execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudioImage = async (products: NormalizedProduct[], currentPrompt: string) => {
    try {
      const res = await fetch('/api/process-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: products, prompt: currentPrompt }),
      });
      const imgData = await res.json();
      if (imgData.success || imgData.heroStudioImage) {
        setStudioResult(imgData);
      }
    } catch (err) {
      console.error('Studio render error:', err);
    }
  };

  return (
    <div style={{ background: '#080F14', color: '#F2ECDD', minHeight: '100vh', fontFamily: 'monospace', overflowX: 'hidden' }}>
      
      {/* CANLI DÖNEN YUKARI TİCKER AKIŞI */}
      <div style={{ background: '#E2A63B', color: '#080F14', padding: '8px 16px', fontSize: '12px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', letterSpacing: '0.5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#080F14', color: '#E2A63B', padding: '2px 6px', fontSize: '10px', borderRadius: '2px' }}>LIVE FEED</span>
          <span>{LIVE_TRANSACTIONS[tickerIndex]}</span>
        </div>
        <div style={{ display: 'flex', gap: '15px', textTransform: 'uppercase', fontSize: '10px' }}>
          <span>GLOBAL STATUS: SECURE</span>
          <span>LATENCY: 42MS</span>
        </div>
      </div>

      {/* HEADER */}
      <header style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px', borderBottom: '1px dashed #203542', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <span style={{ color: '#E2A63B', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '2px' }}>PRIVATE SOURCING ATELIER</span>
          <h1 style={{ fontSize: '26px', fontWeight: '900', margin: '4px 0 0', letterSpacing: '-0.5px', color: '#FFFFFF' }}>
            BUNDLEOS // INTELLIGENCE PIPELINE
          </h1>
        </div>

        {/* API ENGINE STATUS LAMPS */}
        <div style={{ display: 'flex', gap: '15px', background: '#0F1C24', padding: '10px 16px', border: '1px solid #203542', borderRadius: '4px' }}>
          {['cjdropshipping', 'aliexpress', 'autods'].map((platform) => {
            const status = data?.platformStatus?.[platform] || 'skipped_no_key';
            const color = status === 'ok' ? '#22C55E' : status === 'failed' ? '#EF4444' : '#E2A63B';
            return (
              <div key={platform} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 8px ${color}` }}></span>
                <span style={{ textTransform: 'uppercase', color: '#A0B0BC' }}>{platform.slice(0, 2)}</span>
              </div>
            );
          })}
        </div>
      </header>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 100px' }}>
        
        {/* HERO */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '38px', fontWeight: '800', color: '#FFFFFF', marginBottom: '12px', letterSpacing: '-1px' }}>
            Curated sourcing, <i style={{ color: '#E2A63B', fontFamily: 'serif' }}>delivered quietly.</i>
          </h2>
          <p style={{ color: '#A0B0BC', fontSize: '14px', maxWidth: '650px', margin: '0 auto', lineHeight: '1.6' }}>
            One search, drawn live from CJ Dropshipping, AliExpress, and AutoDS — landed cost and profit margins resolved before you ever commit capital.
          </p>
        </div>

        {/* SEARCH FORM */}
        <form onSubmit={handleSearch} style={{ background: '#0F1C24', border: '2px solid #203542', padding: '16px', borderRadius: '6px', marginBottom: '40px', display: 'flex', gap: '12px', flexWrap: 'wrap', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          
          <div style={{ flex: 1, minWidth: '280px', display: 'flex', alignItems: 'center', background: '#080F14', border: '1px solid #203542', padding: '0 14px', borderRadius: '4px' }}>
            <span style={{ color: '#E2A63B', marginRight: '10px', fontWeight: 'bold', fontSize: '13px' }}>PROMPT&gt;</span>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 3-piece ceramic car washing kit"
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#F2ECDD', padding: '14px 0', outline: 'none', fontFamily: 'monospace', fontSize: '14px', width: '100%' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: '#080F14', border: '1px solid #203542', padding: '0 14px', borderRadius: '4px', minWidth: '130px' }}>
            <span style={{ color: '#A0B0BC', fontSize: '11px', marginRight: '8px' }}>SHIP TO:</span>
            <select
              value={destinationCountry}
              onChange={(e) => setDestinationCountry(e.target.value)}
              style={{ background: 'transparent', color: '#E2A63B', border: 'none', outline: 'none', fontWeight: 'bold', fontFamily: 'monospace', cursor: 'pointer', width: '100%' }}
            >
              <option value="US" style={{ background: '#080F14' }}>🇺🇸 US</option>
              <option value="TR" style={{ background: '#080F14' }}>🇹🇷 TR</option>
              <option value="DE" style={{ background: '#080F14' }}>🇩🇪 DE</option>
              <option value="GB" style={{ background: '#080F14' }}>🇬🇧 GB</option>
              <option value="FR" style={{ background: '#080F14' }}>🇫🇷 FR</option>
              <option value="CA" style={{ background: '#080F14' }}>🇨🇦 CA</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ background: '#E2A63B', color: '#080F14', border: 'none', padding: '14px 28px', fontWeight: '900', cursor: 'pointer', fontFamily: 'monospace', fontSize: '14px', borderRadius: '4px', transition: 'all 0.2s', width: '100%' }}
          >
            {loading ? 'EXECUTING PIPELINE...' : 'DISCOVER BUNDLE ↵'}
          </button>
        </form>

        {/* WARNINGS */}
        {data?.warnings && data.warnings.length > 0 && (
          <div style={{ background: 'rgba(226, 166, 59, 0.08)', border: '1px solid #E2A63B', padding: '14px 18px', borderRadius: '4px', marginBottom: '30px', fontSize: '12px', color: '#E2A63B' }}>
            <b>⚠️ PIPELINE STATUS & DIAGNOSTICS:</b>
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              {data.warnings.map((w, idx) => <li key={idx} style={{ marginBottom: '4px' }}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* PRODUCTS GRID */}
        {data?.products && data.products.length > 0 && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #203542', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '13px', textTransform: 'uppercase', color: '#A0B0BC', letterSpacing: '1.5px', margin: 0 }}>
                // SOURCED COMPONENTS ({data.products.length})
              </h3>
              <span style={{ fontSize: '11px', color: '#22C55E' }}>● LIVE API SYNC ACTIVE</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '35px' }}>
              {data.products.map((item, idx) => (
                <div key={idx} style={{ background: '#F2ECDD', color: '#080F14', borderRadius: '4px', border: '2px solid #080F14', padding: '18px', position: 'relative', boxShadow: '6px 6px 0px #080F14' }}>
                  
                  <div style={{ position: 'absolute', top: '12px', right: '12px', background: '#080F14', color: '#E2A63B', padding: '3px 8px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    {item.source}
                  </div>

                  <div style={{ width: '100%', height: '190px', background: '#DCD4C0', marginBottom: '14px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #080F14' }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '12px', color: '#666' }}>NO PREVIEW IMAGE</span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '12px', height: '42px', overflow: 'hidden', lineHeight: '1.3' }}>
                    {item.title}
                  </h4>

                  <div style={{ borderTop: '2px dashed #080F14', paddingTop: '12px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontWeight: '600' }}>
                    <div>WHOLESALE FACTORY COST: <span style={{ float: 'right', color: '#1B4D3E' }}>${item.factoryPrice ?? 'N/A'}</span></div>
                    <div>LIVE FREIGHT ({destinationCountry}): <span style={{ float: 'right' }}>${item.shippingCost ?? 'N/A'}</span></div>
                    <div>WAREHOUSE STOCK: <span style={{ float: 'right' }}>{item.stock ? item.stock.toLocaleString() + ' units' : 'N/A'}</span></div>
                  </div>

                  {item.productUrl ? (
                    <a href={item.productUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '16px', background: '#080F14', color: '#F2ECDD', textAlign: 'center', padding: '10px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none', letterSpacing: '1px' }}>
                      INSPECT ON SUPPLIER PORTAL ↗
                    </a>
                  ) : (
                    <div style={{ marginTop: '16px', background: '#CCC', color: '#555', textAlign: 'center', padding: '10px', fontSize: '10px' }}>
                      DIRECT LINK RESTRICTED
                    </div>
                  )}

                </div>
              ))}
            </div>

            {/* FINANCIAL LEDGER */}
            {data.financials && (
              <div style={{ background: '#0F1C24', border: '2px solid #E2A63B', padding: '24px', borderRadius: '4px', marginBottom: '35px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                <h4 style={{ color: '#E2A63B', margin: '0 0 16px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                  // FINANCIAL LEDGER & MARGIN RESOLUTION
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', fontSize: '13px' }}>
                  <div>TOTAL FACTORY: <br/><b style={{ color: '#FFF', fontSize: '16px' }}>${data.financials.totalFactoryCost}</b></div>
                  <div>TOTAL LANDED COST: <br/><b style={{ color: '#FFF', fontSize: '16px' }}>${data.financials.totalLandedCost}</b></div>
                  <div>SUGGESTED RETAIL: <br/><b style={{ color: '#FFF', fontSize: '16px' }}>${data.financials.suggestedRetailPrice}</b></div>
                  <div style={{ color: '#22C55E' }}>NET GROSS PROFIT: <br/><b style={{ fontSize: '16px' }}>${data.financials.grossProfit} ({data.financials.grossMarginPercent}%)</b></div>
                </div>
              </div>
            )}

            {/* STUDIO VISUAL ASSET */}
            {studioResult && (
              <div style={{ background: '#0F1C24', border: '1px solid #203542', padding: '20px', borderRadius: '4px' }}>
                <h4 style={{ color: '#A0B0BC', margin: '0 0 12px 0', fontSize: '12px', letterSpacing: '1px' }}>// AI STUDIO CAMPAIGN ASSET RENDER</h4>
                <img src={studioResult.heroStudioImage || studioResult.imageUrl} alt="Studio Render" style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '2px', border: '1px solid #203542' }} />
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}