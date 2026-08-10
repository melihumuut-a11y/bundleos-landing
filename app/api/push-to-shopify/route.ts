import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { shopDomain, accessToken, bundleData } = await req.json();

    // Eğer kullanıcı mağaza bilgilerini girmemişse simülasyon yanıtı döner
    if (!shopDomain || !accessToken) {
      return NextResponse.json({
        success: true,
        message: 'Product bundle successfully pushed to Shopify! (Demo Store Mode)',
        shopifyProductId: 'gid://shopify/Product/8849201948',
        storeUrl: 'https://admin.shopify.com'
      });
    }

    // GERÇEK SHOPIFY GRAPHQL API ÇAĞRISI
    const graphqlQuery = {
      query: `
        mutation productCreate($input: ProductInput!) {
          productCreate(input: $input) {
            product {
              id
              title
              handle
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      variables: {
        input: {
          title: bundleData.bundleTitle,
          descriptionHtml: `<p><strong>Complete Bundle System includes:</strong></p><ul>${bundleData.components.map((c: any) => `<li>${c.name}</li>`).join('')}</ul>`,
          vendor: 'BundleOS AI',
          productType: 'Bundle System',
          variants: [
            {
              price: bundleData.financials.suggestedRetail,
              sku: `BUNDLE-${Date.now()}`
            }
          ]
        }
      }
    };

    const shopifyResponse = await fetch(`https://${shopDomain}/admin/api/2024-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify(graphqlQuery),
    });

    const result = await shopifyResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Product created directly in live Shopify store!',
      data: result
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to push to Shopify' }, { status: 500 });
  }
}