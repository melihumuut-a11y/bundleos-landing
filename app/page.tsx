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

const LIVE_NOTIFICATIONS = [
  "🚨 [EXPLOIT FOUND] Single-product stores burning 82% of ad budget — Bundle System activated",
  "⚡ [HIGH MARGIN LOCKED] Direct Factory Pipeline active across China Warehouses",
  "💰 [LIVE SEARCH] Scanned 20+ complementary SKUs from CJ & AliExpress",
  "👑 [UNFAIR ADVANTAGE] Real-time supplier links and wholesale prices unlocked",
];

export default function Home() {
  const [prompt, setPrompt] = useState('Build a 3-piece dog cleaning system under $12 landed');
  const [destinationCountry, setDestinationCountry] = useState('US');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BundleResponse | null>(null);
  const [monthlyOrders, setMonthlyOrders] = useState(644);
  const [notifIndex, setNotifIndex] = useState(0);
  const [sortBy, setSortBy] = useState<'default' | 'price_low' | 'price_high'>('default');

  useEffect(() => {
    const interval = setInterval(() => {
      setNotifIndex((prev) => (prev + 1) % LIVE_NOTIFICATIONS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);

    try {
      const res = await fetch('/api/generate-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, destinationCountry }),
      });

      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error('Pipeline execution error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSortedProducts = () => {
    if (!data?.products) return [];
    const list = [...data.products];
    if (sortBy === 'price_low') {
      return list.sort((a, b) => (a.factoryPrice ?? 0) - (b.factoryPrice ?? 0));
    }
    if (sortBy === 'price_high') {
      return list.sort((a, b) => (b.factoryPrice ?? 0) - (a.factoryPrice ?? 0));
    }
    return list;
  };

  return (
    <div style={{ background: '#0B0F19', color: '#F3F4F6', minHeight: '100vh', fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", overflowX: 'hidden' }}>
      
      {/* YUKARI AKAN CANLI TICKER */}
      <div style={{ background: '#111827', borderBottom: '1px solid #1F2937', padding: '10px 20px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: 'linear-gradient(135deg, #EF4444, #F59E0B)', color: '#FFF', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>LIVE SEARCH ENGINE</span>
          <span style={{ color: '#D1D5DB', fontWeight: '500' }}>{LIVE_NOTIFICATIONS[notifIndex]}</span>
        </div>
        <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
          🔒 INSTITUTIONAL-GRADE SOURCING
        </div>
      </div>

      {/* NAVBAR */}
      <nav style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '26px', fontWeight: '900', background: 'linear-gradient(to right, #60A5FA, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
          BundleOS
        </div>
        <button style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#FFF', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Claim VIP Access ($29)
        </button>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px 100px', textAlign: 'center' }}>
        
        {/* HERO */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.35)', padding: '8px 20px', borderRadius: '30px', fontSize: '13px', color: '#C084FC', marginBottom: '28px', fontWeight: '600' }}>
          ⚡ UNLIMITED FACTORY SEARCH & DIRECT SUPPLIER LINKS
        </div>

        <h1 style={{ fontSize: '48px', fontWeight: '900', color: '#FFFFFF', lineHeight: '1.12', marginBottom: '24px', letterSpacing: '-1.5px' }}>
          Type a Niche. Scan <span style={{ background: 'linear-gradient(to right, #60A5FA, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Thousands of Live SKUs</span> Instantly.
        </h1>

        <p style={{ color: '#9CA3AF', fontSize: '17px', maxWidth: '680px', margin: '0 auto 40px', lineHeight: '1.6' }}>
          Search directly across AliExpress and CJ Dropshipping. Click any card to open the official factory product page, inspect margins, and build high-profit bundles.
        </p>

        {/* SEARCH FORM */}
        <form onSubmit={handleSearch} style={{ maxWidth: '720px', margin: '0 auto 40px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Build a 3-piece dog cleaning system under $12 landed"
            style={{ flex: '1 1 340px', background: '#111827', border: '1px solid #374151', color: '#FFF', padding: '18px 22px', borderRadius: '12px', fontSize: '15px', outline: 'none' }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#FFF', border: 'none', padding: '18px 32px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', flex: '1 1 200px', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.5)', textTransform: 'uppercase' }}
          >
            {loading ? 'SEARCHING ALL FACTORIES...' : 'SEARCH ALL PRODUCTS ↵'}
          </button>
        </form>

        {/* RESULTS SECTION */}
        {data?.products && data.products.length > 0 && (
          <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '18px', padding: '28px', textAlign: 'left', marginBottom: '60px', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #1F2937', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#FFF' }}>
                Found <span style={{ color: '#10B981' }}>{data.products.length} Products</span> across Factories
              </div>

              {/* FILTRELENDIRME */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>SORT BY:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  style={{ background: '#1F2937', color: '#FFF', border: '1px solid #374151', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="default">Default Relevance</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* TIKLANABİLİR GENİŞ ÜRÜN GRID'İ */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              {getSortedProducts().map((p, i) => (
                <a
                  key={i}
                  href={p.productUrl || '#'}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: 'none', background: '#1F2937', border: '1px solid #374151', padding: '16px', borderRadius: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'all 0.2s ease', cursor: p.productUrl ? 'pointer' : 'default' }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#8B5CF6')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#374151')}
                >
                  <div>
                    <div style={{ position: 'relative' }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.title} style={{ width: '100%', height: '160px', objectFit: 'cover', borderRadius: '10px', marginBottom: '12px' }} />
                      ) : (
                        <div style={{ width: '100%', height: '160px', background: '#111827', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280', fontSize: '12px' }}>NO IMAGE</div>
                      )}
                      <span style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.75)', color: '#A855F7', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {p.source}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#FFF', marginBottom: '8px', height: '38px', overflow: 'hidden', lineHeight: '1.3' }}>{p.title}</h3>
                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '12px' }}>Supplier: {p.supplierName || p.source}</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '800', color: '#10B981', marginBottom: '10px' }}>
                      Wholesale: ${p.factoryPrice ?? 'N/A'}
                    </div>

                    <div style={{ background: '#374151', color: '#F3F4F6', textAlign: 'center', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                      Inspect Supplier Listing ↗
                    </div>
                  </div>
                </a>
              ))}
            </div>

          </div>
        )}

      </main>

      {/* BOTTOM VIP BAR */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111827', borderTop: '1px solid #1F2937', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        <div style={{ fontSize: '13px', color: '#D1D5DB' }}>
          <b>⚡ Lock In Founding VIP License ($29/mo)</b> — Unlimited searches, live stock syncing & Shopify 1-click import.
        </div>
        <button style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#FFF', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', textTransform: 'uppercase' }}>
          Claim Beta License
        </button>
      </div>

    </div>
  );
}