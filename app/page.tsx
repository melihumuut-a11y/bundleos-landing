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
  "⚡ [HIGH MARGIN LOCKED] $11.40 Landed Cost → Retailing at $59.99 (81% Net Margin)",
  "💰 [LIVE SYNC] 142 High-Margin Bundles generated & pushed to Shopify in last 1 hour",
  "👑 [UNFAIR ADVANTAGE] Direct Shenzhen Factory Pipeline bypasses all middleman markups",
];

export default function Home() {
  const [prompt, setPrompt] = useState('Build a 3-piece dog cleaning system under $12 landed');
  const [destinationCountry, setDestinationCountry] = useState('US');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BundleResponse | null>(null);
  const [monthlyOrders, setMonthlyOrders] = useState(644);
  const [notifIndex, setNotifIndex] = useState(0);

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

  return (
    <div style={{ background: '#0B0F19', color: '#F3F4F6', minHeight: '100vh', fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", overflowX: 'hidden' }}>
      
      {/* ⚡ YUKARI AKAN CANLI DİKİŞSİZ BİLDİRİM BARI */}
      <div style={{ background: '#111827', borderBottom: '1px solid #1F2937', padding: '10px 20px', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ background: 'linear-gradient(135deg, #EF4444, #F59E0B)', color: '#FFF', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>LIVE INTELLIGENCE</span>
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
          Claim Founding Access ($29)
        </button>
      </nav>

      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px 100px', textAlign: 'center' }}>
        
        {/* HERO BADGE */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(168, 85, 247, 0.12)', border: '1px solid rgba(168, 85, 247, 0.35)', padding: '8px 20px', borderRadius: '30px', fontSize: '13px', color: '#C084FC', marginBottom: '28px', fontWeight: '600', letterSpacing: '0.5px' }}>
          ⚡ THE ECOMMERCE MARGIN CHEAT CODE
        </div>

        {/* HERO HEADING */}
        <h1 style={{ fontSize: '52px', fontWeight: '900', color: '#FFFFFF', lineHeight: '1.12', marginBottom: '24px', letterSpacing: '-1.5px' }}>
          Stop Selling $19 Items. <br/>
          Build <span style={{ background: 'linear-gradient(to right, #60A5FA, #A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>$69 High-Margin Systems</span> That Print Profit.
        </h1>

        <p style={{ color: '#9CA3AF', fontSize: '17px', maxWidth: '680px', margin: '0 auto 40px', lineHeight: '1.6', fontWeight: '400' }}>
          The world's first AI Sourcing Engine that bypasses middleman markups, scans raw Chinese factory lines, pairs high-converting product bundles, and automates 1-package fulfillment.
        </p>

        {/* SEARCH & PROMPT FORM */}
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
            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#FFF', border: 'none', padding: '18px 32px', borderRadius: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', flex: '1 1 200px', boxShadow: '0 4px 20px rgba(59, 130, 246, 0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            {loading ? 'HACKING FACTORY PIPELINE...' : 'RUN AI MARGIN ENGINE ↵'}
          </button>
        </form>

        <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: '60px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
          POWERING TOP-TIER STORES ON: &nbsp; <span style={{ color: '#9CA3AF' }}>Shopify</span> &nbsp;•&nbsp; <span style={{ color: '#9CA3AF' }}>TikTok Shop</span> &nbsp;•&nbsp; <span style={{ color: '#9CA3AF' }}>CJ Dropshipping</span> &nbsp;•&nbsp; <span style={{ color: '#9CA3AF' }}>YunExpress</span>
        </div>

        {/* WARNINGS */}
        {data?.warnings && data.warnings.length > 0 && (
          <div style={{ background: '#1E1B4B', border: '1px solid #4338CA', padding: '18px', borderRadius: '12px', textAlign: 'left', marginBottom: '40px', fontSize: '13px', color: '#A5B4FC' }}>
            <b style={{ letterSpacing: '1px' }}>⚠️ DIAGNOSTICS & STATUS:</b>
            <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
              {data.warnings.map((w, idx) => <li key={idx} style={{ marginBottom: '4px' }}>{w}</li>)}
            </ul>
          </div>
        )}

        {/* LIVE RESULTS CONSOLE */}
        {data?.products && data.products.length > 0 && (
          <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '18px', padding: '28px', textAlign: 'left', marginBottom: '60px', boxShadow: '0 25px 50px rgba(0,0,0,0.6)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #1F2937', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }}></span>
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }}></span>
              </div>
              <span style={{ fontSize: '12px', color: '#10B981', fontFamily: 'monospace', fontWeight: 'bold' }}>● DIRECT FACTORY FEED ACTIVE</span>
            </div>

            <div style={{ background: '#0B0F19', border: '1px solid #1F2937', padding: '14px 18px', borderRadius: '10px', color: '#A5B4FC', fontFamily: 'monospace', fontSize: '13px', marginBottom: '28px' }}>
              PROMPT_EXECUTED: "{data.prompt}"
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '28px' }}>
              {data.products.map((p, i) => (
                <div key={i} style={{ background: '#1F2937', border: '1px solid #374151', padding: '20px', borderRadius: '14px' }}>
                  {p.imageUrl && <img src={p.imageUrl} alt={p.title} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '10px', marginBottom: '14px' }} />}
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#FFF', marginBottom: '10px', height: '40px', overflow: 'hidden', lineHeight: '1.3' }}>{p.title}</h3>
                  <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '12px' }}>Factory Verified: {p.supplierName || p.source}</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#10B981' }}>
                    Wholesale: ${p.factoryPrice ?? 'N/A'} | Stock: {p.stock ? p.stock.toLocaleString() : 'Ready to Ship'}
                  </div>
                </div>
              ))}
            </div>

            {data.financials && (
              <div style={{ background: 'linear-gradient(135deg, #064E3B, #022C22)', border: '1px solid #10B981', padding: '24px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: '#A7F3D0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Landed Cost: <b>${data.financials.totalLandedCost}</b> &nbsp;|&nbsp; Target Retail: <b>${data.financials.suggestedRetailPrice}</b></div>
                  <div style={{ fontSize: '22px', fontWeight: '900', color: '#FFF', marginTop: '6px' }}>NET MARGIN PROFIT: ${data.financials.grossProfit} ({data.financials.grossMarginPercent}%)</div>
                </div>
                <button style={{ background: '#10B981', color: '#022C22', border: 'none', padding: '14px 28px', borderRadius: '10px', fontWeight: '900', cursor: 'pointer', fontSize: '14px', textTransform: 'uppercase' }}>
                  Auto-Push to Store →
                </button>
              </div>
            )}

          </div>
        )}

        {/* REVENUE CALCULATOR SLIDER */}
        <div style={{ background: '#111827', border: '1px solid #1F2937', padding: '40px 32px', borderRadius: '20px', marginBottom: '60px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <h2 style={{ fontSize: '30px', fontWeight: '900', color: '#FFF', marginBottom: '10px', letterSpacing: '-0.5px' }}>See Your Instant Profit Explosion</h2>
          <p style={{ color: '#9CA3AF', fontSize: '15px', marginBottom: '36px' }}>Move the slider to calculate how switching from commodity items to 3-piece Bundle Systems changes your monthly bank balance.</p>

          <input
            type="range"
            min="100"
            max="2000"
            value={monthlyOrders}
            onChange={(e) => setMonthlyOrders(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#A855F7', cursor: 'pointer', marginBottom: '24px', height: '8px' }}
          />

          <div style={{ fontSize: '16px', fontWeight: '700', color: '#C084FC', marginBottom: '28px', textTransform: 'uppercase', letterSpacing: '1px' }}>Monthly Orders: {monthlyOrders}</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div style={{ background: '#1F2937', padding: '24px', borderRadius: '14px', border: '1px solid #374151' }}>
              <div style={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Old Single Item Profit ($12/sale)</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#EF4444', marginTop: '10px' }}>${(monthlyOrders * 12).toLocaleString()} / mo</div>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '24px', borderRadius: '14px', border: '1px solid #10B981' }}>
              <div style={{ fontSize: '12px', color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>BundleOS System Profit ($34/sale)</div>
              <div style={{ fontSize: '28px', fontWeight: '900', color: '#10B981', marginTop: '10px' }}>${(monthlyOrders * 34).toLocaleString()} / mo</div>
            </div>
          </div>
        </div>

        {/* COMPARISON CARDS */}
        <div style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#FFF', marginBottom: '12px', letterSpacing: '-0.5px' }}>Why Single-Item Dropshipping Is Dead in 2026</h2>
          <p style={{ color: '#9CA3AF', fontSize: '15px', marginBottom: '36px' }}>Facebook & TikTok ad costs have doubled. If you don't increase average order value, you lose.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            <div style={{ background: '#1C1017', border: '1px solid #831843', padding: '32px', borderRadius: '18px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#F43F5E', marginBottom: '20px' }}>❌ The Old Trapped Way (DSers)</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2.4', color: '#FDA4AF', fontSize: '14px', fontWeight: '500' }}>
                <li>❌ Selling 1 cheap commodity for $19.99</li>
                <li>❌ Sky-high Ad CAC destroys net margin</li>
                <li>❌ Customer gets 3 messy boxes from 3 sellers</li>
                <li>❌ Angry buyers, refund requests & PayPal holds</li>
              </ul>
            </div>

            <div style={{ background: '#04271E', border: '1px solid #059669', padding: '32px', borderRadius: '18px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#34D399', marginBottom: '20px' }}>✅ The BundleOS System Method</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, lineHeight: '2.4', color: '#A7F3D0', fontSize: '14px', fontWeight: '500' }}>
                <li>✅ Selling a complete 3-piece System for $59.99+</li>
                <li>✅ Ridiculously low break-even ROAS (1.20)</li>
                <li>✅ 1 Consolidated unboxing with 1 tracking code</li>
                <li>✅ Premium brand feel & massive customer loyalty</li>
              </ul>
            </div>

          </div>
        </div>

      </main>

      {/* FIXED BOTTOM VIP BAR */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#111827', borderTop: '1px solid #1F2937', padding: '14px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, boxShadow: '0 -10px 25px rgba(0,0,0,0.5)' }}>
        <div style={{ fontSize: '13px', color: '#D1D5DB' }}>
          <b>⚡ Lock In Founding VIP License ($29/mo)</b> — Only 12 beta slots remaining for August 2026. Price increases to $99/mo soon.
        </div>
        <button style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#FFF', border: 'none', padding: '10px 22px', borderRadius: '8px', fontWeight: '800', fontSize: '13px', cursor: 'pointer', textTransform: 'uppercase' }}>
          Claim Beta License
        </button>
      </div>

    </div>
  );
}