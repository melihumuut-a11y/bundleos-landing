'use client';

import { useState } from 'react';

export default function Home() {
  const [prompt, setPrompt] = useState('Build a 3-piece dog cleaning system under $12 landed');
  const [loading, setLoading] = useState(false);
  const [bundleData, setBundleData] = useState<any>(null);
  const [processingImages, setProcessingImages] = useState(false);
  const [studioResult, setStudioResult] = useState<any>(null);
  const [pushingShopify, setPushingShopify] = useState(false);

  // AI Sourcing Engine
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

  // AI Visual Studio
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

  // Push to Shopify
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
    <div style={{ background: '#0B0F19', color: '#F3F4F6', minHeight: '100vh', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* 1. TOP NAVBAR */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 8%', borderBottom: '1px solid #1F2937', background: 'rgba(11, 15, 25, 0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>B</div>
          <span style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>BundleOS</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="#demo" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '14px' }}>Live Demo</a>
          <a href="#features" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '14px' }}>Features</a>
          <a href="#pricing" style={{ color: '#9CA3AF', textDecoration: 'none', fontSize: '14px' }}>Pricing</a>
          <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            ● System Active
          </span>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section style={{ textAlign: 'center', padding: '80px 8% 40px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(99, 102, 241, 0.1)', color: '#818CF8', padding: '8px 16px', borderRadius: '30px', fontSize: '13px', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '24px' }}>
          ⚡ Next-Gen E-Commerce Automation Engine
        </div>
        <h1 style={{ fontSize: '56px', fontWeight: '800', lineHeight: '1.15', letterSpacing: '-1.5px', marginBottom: '20px' }}>
          Turn Single Products into <br />
          <span style={{ background: 'linear-gradient(135deg, #818CF8, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            High-Margin AI Bundle Systems
          </span>
        </h1>
        <p style={{ fontSize: '18px', color: '#9CA3AF', maxWidth: '680px', margin: '0 auto 40px', lineHeight: '1.6' }}>
          Source multi-component bundles, clean supplier images with Studio AI, and push virtual SKUs straight to your Shopify store in seconds.
        </p>

        {/* 3. INTERACTIVE LIVE APP (HERO INTERACTION) */}
        <div id="demo" style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '20px', padding: '32px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', textAlign: 'left', marginTop: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#F3F4F6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🤖 Try Live Bundle Engine
            </h3>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>Powered by Gemini AI & Remove.bg</span>
          </div>

          <form onSubmit={handleSource} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              style={{ flex: 1, padding: '16px 20px', borderRadius: '12px', border: '1px solid #374151', background: '#1F2937', color: 'white', fontSize: '15px', outline: 'none' }}
              placeholder="e.g. Build a 3-piece car detailing system..."
            />
            <button type="submit" style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', padding: '16px 32px', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
              {loading ? 'Analyzing Suppliers...' : 'Generate Bundle System ✨'}
            </button>
          </form>

          {/* DYNAMIC RESULTS CARD */}
          {bundleData && (
            <div style={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '16px', padding: '24px', marginTop: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#818CF8' }}>{bundleData.bundleTitle}</h4>
                <button
                  onClick={handlePushShopify}
                  type="button"
                  style={{ background: '#10B981', color: '#064E3B', padding: '10px 18px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  {pushingShopify ? 'Pushing...' : '🛍️ Push Bundle to Shopify →'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                {bundleData.components.map((c: any) => (
                  <div key={c.id} style={{ background: '#111827', padding: '12px', borderRadius: '12px', border: '1px solid #374151' }}>
                    <img src={c.rawImage} alt={c.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px' }} />
                    <h5 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>{c.name}</h5>
                    <p style={{ fontSize: '11px', color: '#9CA3AF' }}>Cost: <b style={{ color: 'white' }}>${c.rawCost}</b></p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '20px', flexWrap: 'wrap', gap: '10px', fontSize: '14px' }}>
                <div>Total Landed: <b>${bundleData.financials.totalLandedCost}</b></div>
                <div>Suggested Retail: <b>${bundleData.financials.suggestedRetail}</b></div>
                <div style={{ color: '#10B981' }}>Gross Margin: <b>${bundleData.financials.grossProfit} ({bundleData.financials.grossMarginPercentage}%)</b></div>
              </div>

              <div style={{ borderTop: '1px solid #374151', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ fontSize: '13px', color: '#9CA3AF' }}>Transform raw images into 3D studio hero banners.</span>
                <button
                  onClick={handleProcessStudio}
                  type="button"
                  style={{ background: '#8B5CF6', color: 'white', padding: '10px 18px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  {processingImages ? 'Enhancing...' : '✨ Enhance Images with AI Studio'}
                </button>
              </div>

              {studioResult && (
                <div style={{ marginTop: '20px', background: '#111827', padding: '16px', borderRadius: '10px', border: '1px solid #8B5CF6' }}>
                  <p style={{ color: '#C084FC', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px' }}>✅ Shopify-Ready Studio Assets Generated</p>
                  <img src={studioResult.heroStudioImage} alt="Hero Banner" style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '8px' }} />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 4. FEATURES GRID SECTION */}
      <section id="features" style={{ padding: '80px 8%', maxWidth: '1100px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', textAlign: 'center', marginBottom: '48px' }}>
          Designed for Modern E-Commerce Teams
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          <div style={{ background: '#111827', padding: '32px', borderRadius: '16px', border: '1px solid #1F2937' }}>
            <div style={{ fontSize: '28px', marginBottom: '16px' }}>🎯</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Smart Sourcing Engine</h3>
            <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.6' }}>Analyzes supplier catalog data to automatically assemble complementary products with high target margins.</p>
          </div>
          <div style={{ background: '#111827', padding: '32px', borderRadius: '16px', border: '1px solid #1F2937' }}>
            <div style={{ fontSize: '28px', marginBottom: '16px' }}>✨</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Visual Studio AI</h3>
            <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.6' }}>Removes messy factory backgrounds and generates high-converting lifestyle studio renders instantly.</p>
          </div>
          <div style={{ background: '#111827', padding: '32px', borderRadius: '16px', border: '1px solid #1F2937' }}>
            <div style={{ fontSize: '28px', marginBottom: '16px' }}>🛍️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>Direct Shopify Sync</h3>
            <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.6' }}>Publishes virtual SKUs straight into your Shopify store catalog with optimized titles and pricing structure.</p>
          </div>
        </div>
      </section>

      {/* 5. PRICING SECTION */}
      <section id="pricing" style={{ padding: '60px 8% 100px', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px' }}>Simple, Transparent Pricing</h2>
        <p style={{ color: '#9CA3AF', marginBottom: '48px' }}>Start scaling your average order value (AOV) today.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' }}>
          <div style={{ background: '#111827', border: '1px solid #1F2937', borderRadius: '20px', padding: '32px', textAlign: 'left' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Starter</h3>
            <div style={{ fontSize: '36px', fontWeight: '800', margin: '16px 0' }}>$29 <span style={{ fontSize: '14px', color: '#6B7280' }}>/ mo</span></div>
            <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '24px' }}>Perfect for new dropshippers and single stores.</p>
            <button style={{ width: '100%', background: '#1F2937', color: 'white', padding: '12px', border: '1px solid #374151', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Start Free Trial</button>
          </div>

          <div style={{ background: '#111827', border: '2px solid #6366F1', borderRadius: '20px', padding: '32px', textAlign: 'left', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '-12px', right: '20px', background: '#6366F1', color: 'white', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>POPULAR</span>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold' }}>Pro Growth</h3>
            <div style={{ fontSize: '36px', fontWeight: '800', margin: '16px 0' }}>$79 <span style={{ fontSize: '14px', color: '#6B7280' }}>/ mo</span></div>
            <p style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '24px' }}>Unlimited AI bundles & automated Shopify push.</p>
            <button style={{ width: '100%', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white', padding: '12px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Get Started Pro</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid #1F2937', padding: '32px 8%', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
        © 2026 BundleOS Inc. All rights reserved. Built for Next-Gen E-Commerce.
      </footer>
    </div>
  );
}