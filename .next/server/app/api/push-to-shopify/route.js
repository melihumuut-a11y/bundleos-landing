"use strict";(()=>{var e={};e.id=689,e.ids=[689],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},2519:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>h,patchFetch:()=>m,requestAsyncStorage:()=>d,routeModule:()=>u,serverHooks:()=>l,staticGenerationAsyncStorage:()=>c});var o={};s.r(o),s.d(o,{POST:()=>a});var r=s(9303),i=s(8716),n=s(670),p=s(7070);async function a(e){try{let{shopDomain:t,accessToken:s,bundleData:o}=await e.json();if(!t||!s)return p.NextResponse.json({success:!0,message:"Product bundle successfully pushed to Shopify! (Demo Store Mode)",shopifyProductId:"gid://shopify/Product/8849201948",storeUrl:"https://admin.shopify.com"});let r={query:`
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
      `,variables:{input:{title:o.bundleTitle,descriptionHtml:`<p><strong>Complete Bundle System includes:</strong></p><ul>${o.components.map(e=>`<li>${e.name}</li>`).join("")}</ul>`,vendor:"BundleOS AI",productType:"Bundle System",variants:[{price:o.financials.suggestedRetail,sku:`BUNDLE-${Date.now()}`}]}}},i=await fetch(`https://${t}/admin/api/2024-04/graphql.json`,{method:"POST",headers:{"Content-Type":"application/json","X-Shopify-Access-Token":s},body:JSON.stringify(r)}),n=await i.json();return p.NextResponse.json({success:!0,message:"Product created directly in live Shopify store!",data:n})}catch(e){return p.NextResponse.json({error:"Failed to push to Shopify"},{status:500})}}let u=new r.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/push-to-shopify/route",pathname:"/api/push-to-shopify",filename:"route",bundlePath:"app/api/push-to-shopify/route"},resolvedPagePath:"/workspaces/bundleos-landing/app/api/push-to-shopify/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:d,staticGenerationAsyncStorage:c,serverHooks:l}=u,h="/api/push-to-shopify/route";function m(){return(0,n.patchFetch)({serverHooks:l,staticGenerationAsyncStorage:c})}}};var t=require("../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),o=t.X(0,[276,972],()=>s(2519));module.exports=o})();