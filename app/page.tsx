'use client';

import { useState } from 'react';

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

export default function Home() {
  const [prompt, setPrompt] = useState('3-piece ceramic car washing kit');
  const [destinationCountry, setDestinationCountry] = useState('US');
  const [loading, setLoading] = useState(false);
  const [processingImages, setProcessingImages] = useState(false);
  const [data, setData] = useState<BundleResponse | null>(null);
  const [studioResult, setStudioResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setStudioResult(null);

    try {
      const res = await fetch('/api/generate-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, destinationCountry }),
      });

      const result = await res.json();

      if (!res.ok && (!result.products || result.products.length === 0)) {
        setErrorMsg(result.warnings?.join(' | ') || 'No live data returned. Check API Keys.');
        setData(result);
      } else {
        setData(result);
        if (result.products && result.products.length > 0) {
          fetchStudioImage(result.products, prompt);
        }
      }
    } catch (err: any) {
      setErrorMsg('Failed to fetch from live search engine pipeline.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudioImage = async (products: NormalizedProduct[], currentPrompt: string) => {
    setProcessingImages(true);
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
    } finally {
      setProcessingImages(false);
    }
  };

  return (
    <div style={{ background: '#10202A', color: '#F2ECDD', minHeight: '100vh', fontFamily: 'monospace', padding: '30px 20px 100px' }}>
      
      {/* HEADER / MANIFESTO TITLE */}
      <header style={{ maxWidth: '1100px', margin: '0 auto 30px', borderBottom: '2px dashed #E2A63B', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <span style={{ background: '#E2A63B', color: '#10202A', padding: '2px 8px', fontWeight: 'bold', fontSize: '12px' }}>
            GLOBAL SOURCING MANIFESTO v3.0
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: '900', letterSpacing: '-1px', margin: '8px 0 0', color: '#FFF' }}>
            BUNDLEOS // META-SEARCH ENGINE
          </h1>
        </div>

        {/* API ENGINE STATUS BADGES */}
        <div style={{ display: 'flex', gap: '12px', background: '#0A141A', padding: '10px 14px', border: '1px solid #203542', borderRadius: '4px' }}>
          {['cjdropshipping', 'aliexpress', 'autods'].map((platform) => {
            const status = data?.platformStatus?.[platform] || 'skipped_no_key';
            const color = status === 'ok' ? '#22C55E' : status === 'failed' ? '#EF4444' : '#E2A63B';
            return (
              <div key={platform} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block' }}></span>
                <span style={{ textTransform: 'uppercase', color: '#A0B0BC' }}>{platform.slice(0, 2)}</span>
              </div>
            );
          })}
        </div>
      </header>

      <main style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* SEARCH BAR & SHIP TO COUNTRY */}
        <form onSubmit={handleSearch} style={{ background: '#182C38', border: '2px solid #203542', padding: '16px', borderRadius: '6px', marginBottom: '30px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px', display: 'flex', alignItems: 'center', background: '#0A141A', border: '1px solid #203542', padding: '0 12px' }}>
            <span style={{ color: '#E2A63B', marginRight: '10px', fontWeight: 'bold' }}>PROMPT&gt;</span>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. 3-piece ceramic car washing kit"
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#F2ECDD', padding: '12px 0', outline: 'none', fontFamily: 'monospace', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', background: '#0A141A', border: '1px solid #203542', padding: '0 12px' }}>
            <span style={{ color: '#A0B0BC', fontSize: '12px', marginRight: '8px' }}>SHIP TO:</span>
            <select
              value={destinationCountry}
              onChange={(e) => setDestinationCountry(e.target.value)}
              style={{ background: 'transparent', color: '#E2A63B', border: 'none', outline: 'none', fontWeight: 'bold', fontFamily: 'monospace', cursor: 'pointer' }}
            >
              <option value="US" style={{ background: '#10202A' }}>🇺🇸 US</option>
              <option value="TR" style={{ background: '#10202A' }}>🇹🇷 TR</option>
              <option value="DE" style={{ background: '#10202A' }}>🇩🇪 DE</option>
              <option value="GB" style={{ background: '#10202A' }}>🇬🇧 GB</option>
              <option value="FR" style={{ background: '#10202A' }}>🇫🇷 FR</option>
              <option value="CA" style={{ background: '#10202A' }}>🇨🇦 CA</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ background: '#E2A63B', color: '#10202A', border: 'none', padding: '0 24px', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'monospace', fontSize: '14px' }}
          >
            {loading ? 'EXECUTING PIPELINE...' : 'RUN MANIFESTO ENGINE ↵'}
          </button>
        </form>

        {/* WARNINGS / ERROR PANEL */}
        {data?.warnings && data.warnings.length > 0 && (
          <div style={{ background: 'rgba(226, 166, 59, 0.1)', border: '1px solid #E2A63B', padding: '12px 16px', borderRadius: '4px', marginBottom: '24px', fontSize: '12px', color: '#E2A63B' }}>
            <b>⚠️ PIPELINE STATUS & WARNINGS:</b>
            <ul style={{ margin: '6px 0 0 18px', padding: 0 }}>
              {data.warnings.map((w, idx) => <li key={idx}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* PRODUCTS CARDS GRID */}
        {data?.products && data.products.length > 0 && (
          <div>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#A0B0BC', marginBottom: '16px', letterSpacing: '1px' }}>
              // MANIFESTO SOURCED COMPONENTS ({data.products.length})
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              {data.products.map((item, idx) => (
                <div key={idx} style={{ background: '#F2ECDD', color: '#10202A', borderRadius: '4px', border: '2px solid #0A141A', padding: '16px', position: 'relative', boxShadow: '4px 4px 0px #0A141A' }}>
                  
                  {/* SOURCE STAMP */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#10202A', color: '#E2A63B', padding: '2px 8px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    STAMP: {item.source}
                  </div>

                  {/* PRODUCT IMAGE */}
                  <div style={{ width: '100%', height: '180px', background: '#DCD4C0', marginBottom: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '12px', color: '#666' }}>NO LIVE IMAGE</span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px', height: '40px', overflow: 'hidden', lineHeight: '1.3' }}>
                    {item.title}
                  </h4>

                  <div style={{ borderTop: '2px dashed #0A141A', paddingTop: '10px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>FACTORY COST: <b>${item.factoryPrice ?? 'N/A'}</b></div>
                    <div>LIVE FREIGHT ({destinationCountry}): <b>${item.shippingCost ?? 'N/A'}</b></div>
                    <div>STOCK LEVEL: <b>{item.stock ? item.stock.toLocaleString() + ' units' : 'N/A'}</b></div>
                  </div>

                  {item.productUrl ? (
                    <a href={item.productUrl} target="_blank" rel="noreferrer" style={{ display: 'block', marginTop: '12px', background: '#10202A', color: '#F2ECDD', textAlign: 'center', padding: '8px', fontSize: '11px', fontWeight: 'bold', textDecoration: 'none' }}>
                      VIEW SUPPLIER LINK ↗
                    </a>
                  ) : (
                    <div style={{ marginTop: '12px', background: '#CCC', color: '#555', textAlign: 'center', padding: '8px', fontSize: '10px' }}>
                      DIRECT LINK RESTRICTED
                    </div>
                  )}

                </div>
              ))}
            </div>

            {/* FINANCIAL LEDGER */}
            {data.financials && (
              <div style={{ background: '#182C38', border: '2px solid #E2A63B', padding: '20px', borderRadius: '4px', marginBottom: '30px' }}>
                <h4 style={{ color: '#E2A63B', margin: '0 0 14px 0', fontSize: '14px', textTransform: 'uppercase' }}>
                  // FINANCIAL LEDGER SUMMARY
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', fontSize: '13px' }}>
                  <div>TOTAL FACTORY COST: <b style={{ color: '#FFF' }}>${data.financials.totalFactoryCost}</b></div>
                  <div>TOTAL LANDED COST: <b style={{ color: '#FFF' }}>${data.financials.totalLandedCost}</b></div>
                  <div>SUGGESTED RETAIL: <b style={{ color: '#FFF' }}>${data.financials.suggestedRetailPrice}</b></div>
                  <div style={{ color: '#22C55E' }}>GROSS PROFIT: <b>${data.financials.grossProfit} ({data.financials.grossMarginPercent}%)</b></div>
                </div>
              </div>
            )}

            {/* STUDIO VISUAL ASSET */}
            {studioResult && (
              <div style={{ background: '#0A141A', border: '1px solid #203542', padding: '16px', borderRadius: '4px' }}>
                <h4 style={{ color: '#A0B0BC', margin: '0 0 10px 0', fontSize: '12px' }}>// AI STUDIO VISUAL ASSET RENDER</h4>
                <img src={studioResult.heroStudioImage || studioResult.imageUrl} alt="Studio Render" style={{ width: '100%', maxHeight: '350px', objectFit: 'cover', borderRadius: '2px' }} />
              </div>
            )}

          </div>
        )}

      </main>
    </div>
  );
}