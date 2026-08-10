'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('Build a 3-piece dog cleaning system under $12 landed');
  const [loading, setLoading] = useState(false);
  const [bundleData, setBundleData] = useState<any>(null);
  const [processingImages, setProcessingImages] = useState(false);
  const [studioResult, setStudioResult] = useState<any>(null);
  const [pushingShopify, setPushingShopify] = useState(false);

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
      console.error(err);
    }
    setLoading(false);
  };

  // 2. AI Visual Studio Engine
  const handleProcessStudio = async () => {
    if (!bundleData) return;
    setProcessingImages(true);

    try {
      const res = await fetch('/api/process-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: bundleData.components }),
      });
      const data = await res.json();
      if (data.success) {
        setStudioResult(data);
      }
    } catch (err) {
      console.error(err);
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
      console.error(err);
    }
    setPushingShopify(false);
  };

  return (
    <div style={{ background: '#07080C', color: '#F9FAFB', minHeight: '100vh', fontFamily: 'sans-serif', paddingBottom: '80px' }}>
      {/* Upper Navigation Bar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 8%', borderBottom: '1px solid #1E2330' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          BundleOS
        </h1>
        <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          ● Live Engine Connected
        </span>
      </nav>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '60px 8% 40px' }}>
        <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#A78BFA', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          ✨ Next-Gen E-Commerce AI Engine
        </span>
        <h2 style={{ fontSize: '42px', fontWeight: '800', marginTop: '20px', marginBottom: '16px', lineHeight: '1.2' }}>
          Automate High-Margin <br />
          <span style={{ background: 'linear-gradient(135deg, #60A5FA, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Product Bundles with AI
          </span>
        </h2>
        <p style={{ fontSize: '16px', color: '#9CA3AF', maxWidth: '600px', margin: '0 auto 30px' }}>
          Enter a prompt below to source product bundles, clean studio visuals, and push virtual SKUs straight to Shopify.
        </p>
      </section>

      {/* Interactive App Container */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 5%' }}>
        <form onSubmit={handleSource} style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={{ flex: 1, padding: '16px', borderRadius: '8px', border: '1px solid #1E2330', background: '#10131E', color: 'white', fontSize: '16px', outline: 'none' }}
            placeholder="Type your system prompt..."
          />
          <button type="submit" style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: 'white', padding: '16px 28px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? 'AI Scanning...' : 'Run Sourcing Engine'}
          </button>
        </form>

        {bundleData && (
          <div style={{ background: '#10131E', border: '1px solid #1E2330', borderRadius: '16px', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontSize: '20px', color: '#60A5FA' }}>{bundleData.bundleTitle}</h2>
              <button
                onClick={handlePushShopify}
                type="button"
                style={{ background: '#10B981', color: 'black', padding: '12px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
              >
                {pushingShopify ? 'Pushing...' : '🛍️ Push Bundle to Shopify →'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              {bundleData.components.map((c: any) => (
                <div key={c.id} style={{ background: '#151926', padding: '15px', borderRadius: '10px', border: '1px solid #232A3B' }}>
                  <img src={c.rawImage} alt={c.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }} />
                  <h4 style={{ fontSize: '14px', marginBottom: '5px' }}>{c.name}</h4>
                  <p style={{ fontSize: '12px', color: '#9CA3AF' }}>Factory Cost: <b style={{ color: 'white' }}>${c.rawCost}</b></p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.08)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.25)', marginBottom: '30px', flexWrap: 'wrap', gap: '10px' }}>
              <div>Total Landed: <b>${bundleData.financials.totalLandedCost}</b></div>
              <div>Suggested Retail: <b>${bundleData.financials.suggestedRetail}</b></div>
              <div style={{ color: '#10B981' }}>Gross Profit: <b>${bundleData.financials.grossProfit} ({bundleData.financials.grossMarginPercentage}%)</b></div>
            </div>

            <div style={{ borderTop: '1px solid #1E2330', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
              <div>
                <h3 style={{ fontSize: '16px' }}>AI Visual Studio Engine</h3>
                <p style={{ fontSize: '13px', color: '#9CA3AF' }}>Remove factory backgrounds and generate a 3D studio hero shot.</p>
              </div>
              <button
                onClick={handleProcessStudio}
                type="button"
                style={{ background: '#8B5CF6', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                {processingImages ? 'Cleaning Images with AI...' : '✨ Enhance Images with AI Studio'}
              </button>
            </div>

            {studioResult && (
              <div style={{ marginTop: '30px', background: '#151926', padding: '20px', borderRadius: '12px', border: '1px solid #8B5CF6' }}>
                <h3 style={{ color: '#C084FC', marginBottom: '15px' }}>✅ Shopify-Ready Studio Assets Generated</h3>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <img src={studioResult.heroStudioImage} alt="Hero Banner" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}