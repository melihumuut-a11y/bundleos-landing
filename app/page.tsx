'use client';

import { useState } from 'react';

export default function Home() {
  const [orders, setOrders] = useState(644);
  const [prompt, setPrompt] = useState('Build a 3-piece dog cleaning system under $12 landed');
  const [loading, setLoading] = useState(false);
  const [bundleData, setBundleData] = useState<any>({
    bundleTitle: "BUILD A 3-PIECE DOG CLEANING SYSTEM UNDER $12 LANDED",
    components: [
      { id: "sku-1", name: "Silicone Paw Cleaner Cup", supplier: "Shenzhen Factory A", rawCost: 3.20, stock: "14,500", rawImage: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500" },
      { id: "sku-2", name: "Bath Massage Brush", supplier: "Ningbo Goods Ltd", rawCost: 1.80, stock: "8,200", rawImage: "https://images.unsplash.com/photo-1544568100-847a948585b9?w=500" },
      { id: "sku-3", name: "Microfiber Drying Towel", supplier: "Yiwu Textile Co", rawCost: 1.90, stock: "22,000", rawImage: "https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=500" }
    ],
    financials: {
      totalLandedCost: 10.90,
      suggestedRetail: 44.99,
      grossProfit: 34.09,
      grossMarginPercentage: 75.8
    }
  });

  const [processingImages, setProcessingImages] = useState(false);
  const [studioResult, setStudioResult] = useState<any>(null);
  const [pushingShopify, setPushingShopify] = useState(false);

  const singleProfit = Math.round(orders * 12);
  const bundleProfit = Math.round(orders * 34);

  // 1. AI Sourcing Engine
  const handleSource = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setStudioResult(null);

    try {
      const res = await fetch('/api/generate-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.success) {
        setBundleData(data);
      }
    } catch (err) {
      console.error("Sourcing Error:", err);
    }
    setLoading(false);
  };

  // 2. AI Visual Studio Engine (Prompt parametresi eklendi)
  const handleProcessStudio = async () => {
    if (!bundleData) return;
    setProcessingImages(true);

    try {
      const res = await fetch('/api/process-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: bundleData.components, prompt }),
      });
      const data = await res.json();
      if (data.success) {
        setStudioResult(data);
      }
    } catch (err) {
      console.error("Studio Processing Error:", err);
    }
    setProcessingImages(false);
  };

  // 3. Shopify Push Engine
  const handlePushShopify = async () => {
    if (!bundleData) return;
    setPushingShopify(true);

    try {
      const res = await fetch('/api/push-to-shopify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundleData }),
      });
      const data = await res.json();
      if (data.success) {
        alert('🚀 SUCCESS! ' + bundleData.bundleTitle + ' is now live on your Shopify store as a Virtual SKU!');
      }
    } catch (err) {
      console.error("Shopify Push Error:", err);
    }
    setPushingShopify(false);
  };

  return (
    <div style={{ background: '#090B10', color: '#F3F4F6', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', paddingBottom: '120px' }}>
      
      {/* NAVBAR */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 8%', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', color: '#38BDF8', letterSpacing: '-0.5px' }}>
          BundleOS
        </h1>
        <button style={{ background: '#3B82F6', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
          VIP Beta ($29)
        </button>
      </nav>

      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 20px' }}>
        
        {/* HERO SECTION */}
        <div style={{ textAlign: 'center', padding: '40px 0 60px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', padding: '8px 16px', borderRadius: '30px', fontSize: '13px', border: '1px solid rgba(56, 189, 248, 0.2)', marginBottom: '24px' }}>
            ⚡ Next-Gen E-Commerce Automation Engine
          </div>
          <h1 style={{ fontSize: '52px', fontWeight: '800', lineHeight: '1.15', letterSpacing: '-1.5px', marginBottom: '20px' }}>
            Turn Single Products into <br />
            <span style={{ background: 'linear-gradient(135deg, #38BDF8, #818CF8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              High-Margin AI Bundle Systems
            </span>
          </h1>
          <p style={{ fontSize: '18px', color: '#9CA3AF', maxWidth: '680px', margin: '0 auto 36px', lineHeight: '1.6' }}>
            Source multi-component systems, generate studio-grade AI visuals, and push virtual SKUs straight to your Shopify store in seconds.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#console" style={{ background: '#3B82F6', color: 'white', padding: '14px 28px', borderRadius: '10px', fontWeight: 'bold', textDecoration: 'none', fontSize: '15px' }}>
              🚀 Try Live Demo Below
            </a>
            <a href="#calculator" style={{ background: '#111520', color: '#9CA3AF', border: '1px solid #1E2638', padding: '14px 28px', borderRadius: '10px', fontWeight: 'bold', textDecoration: 'none', fontSize: '15px' }}>
              📊 Calculate Revenue Impact
            </a>
          </div>
        </div>

        {/* REVENUE CALCULATOR CARD */}
        <div id="calculator" style={{ background: '#111520', border: '1px solid #1E2638', borderRadius: '16px', padding: '40px 30px', textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Calculate Your Revenue Increase</h2>
          <p style={{ color: '#9CA3AF', fontSize: '14px', marginBottom: '32px' }}>
            See how switching from single items to 3-piece systems impacts your bottom line.
          </p>

          <input
            type="range"
            min="100"
            max="2000"
            value={orders}
            onChange={(e) => setOrders(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#38BDF8', cursor: 'pointer', marginBottom: '20px' }}
          />

          <div style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: '15px', marginBottom: '30px' }}>
            Monthly Orders: {orders}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px' }}>Single Product Profit ($12/sale)</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#EF4444' }}>${singleProfit.toLocaleString()} / mo</div>
            </div>
            <div style={{ background: 'rgba(34, 197, 94, 0.05)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
              <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '6px' }}>BundleOS System Profit ($34/sale)</div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#22C55E' }}>${bundleProfit.toLocaleString()} / mo</div>
            </div>
          </div>
        </div>

        {/* WHY SINGLE-ITEM DROPSHIPPING IS DEAD */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '32px' }}>
            Why Single-Item Dropshipping Is Dead
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', textAlign: 'left' }}>
            
            {/* OLD WAY */}
            <div style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', padding: '28px' }}>
              <h3 style={{ color: '#EF4444', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ❌ Old Way (DSers / Single Items)
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: '#D1D5DB' }}>
                <li>❌ Sells 1 commodity item for $19.99</li>
                <li>❌ High Ad CAC eats entire profit</li>
                <li>❌ Customer gets 3 packages from 3 sellers</li>
                <li>❌ High returns & bad customer retention</li>
              </ul>
            </div>

            {/* BUNDLEOS WAY */}
            <div style={{ background: 'rgba(34, 197, 94, 0.03)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '16px', padding: '28px' }}>
              <h3 style={{ color: '#22C55E', fontSize: '18px', fontWeight: 'bold', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✅ BundleOS System Method
              </h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '14px', color: '#D1D5DB' }}>
                <li>✅ Sells a 3-piece Routine System for $44.99+</li>
                <li>✅ Low Break-Even ROAS (1.28) allows easy scaling</li>
                <li>✅ 1 Consolidated Package with 1 Tracking Number</li>
                <li>✅ High perceived value & branded unboxing</li>
              </ul>
            </div>

          </div>
        </div>

        {/* CONSOLE TERMINAL (LIVE AI APP) */}
        <div id="console" style={{ background: '#0D111A', border: '1px solid #1E2638', borderRadius: '16px', padding: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.6)', textAlign: 'left' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #1A2130', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981' }}></div>
            </div>
            <span style={{ fontSize: '12px', color: '#6B7280', fontFamily: 'monospace' }}>
              Console v2.4 • Connected to Shenzhen Transit Hub
            </span>
          </div>

          <form onSubmit={handleSource} style={{ marginBottom: '20px' }}>
            <div style={{ background: '#161C2B', border: '1px solid #252F45', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ color: '#38BDF8', fontFamily: 'monospace', fontWeight: 'bold' }}>PROMPT:</span>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#F3F4F6', fontSize: '14px', outline: 'none', fontFamily: 'monospace' }}
              />
              <button type="submit" style={{ background: '#38BDF8', color: '#090B10', padding: '8px 16px', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>
                {loading ? 'Scanning...' : 'Run Engine'}
              </button>
            </div>
          </form>

          {bundleData && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {bundleData.components.map((c: any) => (
                  <div key={c.id} style={{ background: '#121724', border: '1px solid #212B3E', borderRadius: '10px', padding: '16px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '4px' }}>{c.name}</h4>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '12px' }}>Supplier: {c.supplier || 'China Factory'}</p>
                    <div style={{ fontSize: '12px', color: '#D1D5DB' }}>
                      Unit Cost: <b style={{ color: 'white' }}>${c.rawCost}</b> | Stock: <b>{c.stock || '10,000+'}</b>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'rgba(34, 197, 94, 0.06)', border: '1px solid rgba(34, 197, 94, 0.2)', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px', flexWrap: 'wrap' }}>
                  <div>Landed Cost: <b>${bundleData.financials.totalLandedCost}</b></div>
                  <div>Retail Target: <b>${bundleData.financials.suggestedRetail}</b></div>
                  <div style={{ color: '#22C55E' }}>Gross Profit: <b>${bundleData.financials.grossProfit} ({bundleData.financials.grossMarginPercentage}%)</b></div>
                </div>
                <button
                  onClick={handlePushShopify}
                  type="button"
                  style={{ background: '#22C55E', color: '#052E16', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  {pushingShopify ? 'Pushing...' : 'Push to Shopify →'}
                </button>
              </div>

              <div style={{ marginTop: '20px', borderTop: '1px solid #1E2638', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>AI Visual Studio Engine</span>
                <button
                  onClick={handleProcessStudio}
                  type="button"
                  style={{ background: '#8B5CF6', color: 'white', padding: '8px 16px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}
                >
                  {processingImages ? 'Generating Dynamic Studio Art...' : '✨ Enhance Studio Images'}
                </button>
              </div>

              {studioResult && (
                <div style={{ marginTop: '16px', background: '#161C2B', padding: '16px', borderRadius: '8px', border: '1px solid #8B5CF6' }}>
                  <img src={studioResult.heroStudioImage} alt="Dynamic Studio Asset" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '6px' }} />
                </div>
              )}
            </div>
          )}

        </div>

      </main>

      {/* STICKY BOTTOM BAR */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#0D111A', borderTop: '1px solid #1E2638', padding: '16px 8%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>Lock in Founding VIP Rate ($29/mo)</div>
          <div style={{ fontSize: '11px', color: '#9CA3AF' }}>Only 18 VIP beta licenses remaining for August 2026.</div>
        </div>
        <button style={{ background: '#3B82F6', color: 'white', padding: '10px 24px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
          Claim VIP License
        </button>
      </div>

    </div>
  );
}