'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ background: '#07080C', color: '#F9FAFB', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 8%', borderBottom: '1px solid #1E2330' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 'bold', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          BundleOS
        </h1>
        <Link href="/dashboard">
          <button style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Open App →
          </button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '100px 8% 60px' }}>
        <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#A78BFA', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          ✨ Next-Gen E-Commerce AI Engine
        </span>
        <h2 style={{ fontSize: '48px', fontWeight: '800', marginTop: '24px', marginBottom: '16px', lineHeight: '1.2' }}>
          Automate Your High-Margin <br />
          <span style={{ background: 'linear-gradient(135deg, #60A5FA, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Product Bundles with AI
          </span>
        </h2>
        <p style={{ fontSize: '18px', color: '#9CA3AF', maxWidth: '600px', margin: '0 auto 32px' }}>
          Source multi-piece product systems, generate studio-grade AI visual assets, and push directly to your Shopify store in seconds.
        </p>
        <Link href="/dashboard">
          <button style={{ background: '#10B981', color: 'black', padding: '16px 36px', border: 'none', borderRadius: '10px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
            🚀 Launch BundleOS App
          </button>
        </Link>
      </section>

      {/* Features Grid */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', padding: '40px 8% 100px' }}>
        <div style={{ background: '#10131E', padding: '30px', borderRadius: '16px', border: '1px solid #1E2330' }}>
          <h3 style={{ fontSize: '20px', color: '#60A5FA', marginBottom: '12px' }}>🎯 AI Sourcing Engine</h3>
          <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.6' }}>
            Turns simple text prompts into optimized 3-piece product bundles with full margin & landed cost breakdown.
          </p>
        </div>
        <div style={{ background: '#10131E', padding: '30px', borderRadius: '16px', border: '1px solid #1E2330' }}>
          <h3 style={{ fontSize: '20px', color: '#C084FC', marginBottom: '12px' }}>✨ Visual Studio AI</h3>
          <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.6' }}>
            Cleans factory image backgrounds instantly and converts them into high-converting e-commerce assets.
          </p>
        </div>
        <div style={{ background: '#10131E', padding: '30px', borderRadius: '16px', border: '1px solid #1E2330' }}>
          <h3 style={{ fontSize: '20px', color: '#34D399', marginBottom: '12px' }}>🛍️ 1-Click Shopify Sync</h3>
          <p style={{ color: '#9CA3AF', fontSize: '14px', lineHeight: '1.6' }}>
            Push your virtual SKUs directly into your Shopify inventory with GraphQL API precision.
          </p>
        </div>
      </section>
    </div>
  );
}