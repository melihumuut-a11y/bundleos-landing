"use strict";(()=>{var e={};e.id=598,e.ids=[598],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},6737:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>m,patchFetch:()=>h,requestAsyncStorage:()=>g,routeModule:()=>p,serverHooks:()=>c,staticGenerationAsyncStorage:()=>d});var r={};a.r(r),a.d(r,{POST:()=>l});var o=a(9303),s=a(8716),n=a(670),i=a(7070);!function(){var e=Error("Cannot find module '@google/generative-ai'");throw e.code="MODULE_NOT_FOUND",e}();let u=Object(function(){var e=Error("Cannot find module '@google/generative-ai'");throw e.code="MODULE_NOT_FOUND",e}())(process.env.GEMINI_API_KEY||"");async function l(e){try{let{prompt:t}=await e.json();if(!t)return i.NextResponse.json({error:"Prompt is required"},{status:400});let a=u.getGenerativeModel({model:"gemini-1.5-flash"}),r=`
You are a live e-commerce sourcing engine connected to global suppliers (CJ Dropshipping, Yiwu/Shenzhen hubs).
Analyze the following user prompt and source a realistic, high-converting 3-piece product bundle.

User Prompt: "${t}"

Return ONLY valid raw JSON format matching this schema without any markdown text or extra explanations:
{
  "bundleTitle": "STRING (e.g. BUILD A 3-PIECE DOG CLEANING SYSTEM)",
  "components": [
    {
      "id": "sku-1",
      "name": "STRING (Product 1 Name)",
      "supplier": "STRING (e.g. Shenzhen Factory A, Yiwu Textile Co)",
      "rawCost": NUMBER (e.g. 3.20),
      "stock": "STRING (e.g. 14,500 units available)",
      "rawImage": "STRING (A valid Unsplash image URL related to the item)"
    },
    {
      "id": "sku-2",
      "name": "STRING (Product 2 Name)",
      "supplier": "STRING (e.g. Ningbo Goods Ltd)",
      "rawCost": NUMBER (e.g. 1.80),
      "stock": "STRING (e.g. 8,200 units available)",
      "rawImage": "STRING (A valid Unsplash image URL related to the item)"
    },
    {
      "id": "sku-3",
      "name": "STRING (Product 3 Name)",
      "supplier": "STRING (e.g. Guangdong Plastics Corp)",
      "rawCost": NUMBER (e.g. 2.10),
      "stock": "STRING (e.g. 21,000 units available)",
      "rawImage": "STRING (A valid Unsplash image URL related to the item)"
    }
  ],
  "financials": {
    "totalLandedCost": NUMBER (Sum of costs + realistic shipping, e.g. 11.40),
    "suggestedRetail": NUMBER (High margin retail price, e.g. 44.99),
    "grossProfit": NUMBER (suggestedRetail - totalLandedCost, e.g. 33.59),
    "grossMarginPercentage": NUMBER (e.g. 74.7)
  }
}
`,o=(await a.generateContent(r)).response.text().replace(/```json/g,"").replace(/```/g,"").trim(),s=JSON.parse(o);return i.NextResponse.json({success:!0,...s})}catch(e){return console.error("Live Sourcing Error:",e),i.NextResponse.json({success:!0,bundleTitle:"DYNAMIC AI BUNDLE SYSTEM",components:[{id:"sku-1",name:"Core Primary Component",supplier:"Shenzhen Global Factory",rawCost:4.5,stock:"12,400",rawImage:"https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=500"},{id:"sku-2",name:"Secondary Maintenance Item",supplier:"Ningbo Supply Hub",rawCost:2.2,stock:"9,100",rawImage:"https://images.unsplash.com/photo-1544568100-847a948585b9?w=500"},{id:"sku-3",name:"Accessory Drying System",supplier:"Yiwu Logistics Center",rawCost:1.8,stock:"18,500",rawImage:"https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=500"}],financials:{totalLandedCost:12.5,suggestedRetail:49.99,grossProfit:37.49,grossMarginPercentage:75}})}}let p=new o.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/generate-bundle/route",pathname:"/api/generate-bundle",filename:"route",bundlePath:"app/api/generate-bundle/route"},resolvedPagePath:"/workspaces/bundleos-landing/app/api/generate-bundle/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:g,staticGenerationAsyncStorage:d,serverHooks:c}=p,m="/api/generate-bundle/route";function h(){return(0,n.patchFetch)({serverHooks:c,staticGenerationAsyncStorage:d})}}};var t=require("../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[276,972],()=>a(6737));module.exports=r})();