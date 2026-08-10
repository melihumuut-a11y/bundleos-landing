import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { components, prompt } = await req.json();

    // Prompt'a veya ilk bileşene göre dinamik görsel teması belirleme
    const searchTerm = prompt || (components && components[0]?.name) || 'ecommerce product bundle';
    const cleanSearch = encodeURIComponent(searchTerm.replace(/[^a-zA-Z0-9 ]/g, ''));

    // Pollinations AI veya Unsplash üzerinden anlık sıfırdan konuya özel görsel üretme
    const generatedHeroImage = `https://image.pollinations.ai/prompt/professional%20studio%20product%20photography%20of%20${cleanSearch}%20clean%20background%20high%20resolution?width=1200&height=400&nologo=true`;

    return NextResponse.json({
      success: true,
      heroStudioImage: generatedHeroImage
    });

  } catch (error) {
    return NextResponse.json({
      success: true,
      heroStudioImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=400&fit=crop"
    });
  }
}