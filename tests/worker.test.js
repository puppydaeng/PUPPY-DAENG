import test from "node:test";
import assert from "node:assert/strict";
import worker,{BREEDS,REGIONS,describeSite} from "../src/worker.js";
const BASE="https://nobubblepet.example";
const LIVE={BASE_DOMAIN:"nobubblepet.example",PUBLIC_INDEXING:"true"};
const DEV={BASE_DOMAIN:"",PUBLIC_INDEXING:"false"};
function req(path,env=LIVE,host=null){return worker.fetch(new Request((host||BASE)+path),env);}
async function html(path,env=LIVE,host=null){const r=await req(path,env,host);return [r,await r.text()];}
test("12 breeds, 14 provinces, 162 cities, 2000+ route combinations",()=>{
 const d=describeSite();
 assert.equal(d.breeds,12);assert.equal(d.provinces,14);assert.equal(d.cities,162);
 assert.ok(d.breedRoutes>2000);assert.ok(d.previewRoutes>190);
 assert.ok(!Object.keys(REGIONS).some(x=>/서울|경기|인천/.test(x)));
});
test("main homepage, all breed home pages: unique SEO, correct canonical and index",async()=>{
 const [home,h]=await html("/");
 assert.equal(home.status,200);assert.match(h,/노버블펫/);assert.match(h,/index,follow/);
 for(const b of BREEDS){
  const [res,body]=await html("/",LIVE,"https://"+b.slug+".nobubblepet.example");
  assert.equal(res.status,200,b.slug);
  assert.ok(body.includes(b.name+"분양"),b.slug);
  assert.ok(body.includes('href="https://'+b.slug+'.nobubblepet.example/"'),b.slug);
  assert.match(body,/<script type="application\/ld\+json">/);
 }
});
test("each municipality has a working breed page and matching canonical",async()=>{
 for(const [province,cities] of Object.entries(REGIONS)){
  const [r,body]=await html("/지역/"+encodeURIComponent(province)+"/");
  assert.equal(r.status,200,province);assert.ok(body.includes(province));
  for(const city of cities){
   const path="/"+encodeURIComponent(province)+"/"+encodeURIComponent(city)+"/";
   const [res,doc]=await html(path,LIVE,"https://maltipoo.nobubblepet.example");
   assert.equal(res.status,200,province+city);
   assert.ok(doc.includes(city),city);
   assert.match(doc,/<meta name="robots" content="index,follow/);
   assert.ok(doc.includes('<link rel="canonical" href="https://maltipoo.nobubblepet.example'+path+'"'));
  }
 }
});
test("Seoul/Gyeonggi/Incheon are entirely excluded",async()=>{
 for(const p of ["서울특별시","경기도","인천광역시"]){
  for(const path of ["/"+encodeURIComponent(p)+"/","/지역/"+encodeURIComponent(p)+"/"]){
   const [r,doc]=await html(path,LIVE,"https://maltipoo.nobubblepet.example");
   assert.equal(r.status,404,path);assert.match(doc,/noindex,nofollow/);
  }
 }
 const x=await req("/충청남도/없는도시/",LIVE,"https://maltipoo.nobubblepet.example");
 assert.equal(x.status,404);
});
test("sitemap index links twelve host-specific sitemaps; no excluded region",async()=>{
 const [r,xml]=await html("/sitemap.xml",LIVE,"https://maltipoo.nobubblepet.example");
 assert.equal(r.status,200);assert.match(xml,/<urlset/);
 assert.ok(xml.includes(encodeURIComponent("천안시")));
 assert.ok(xml.includes(encodeURIComponent("충청남도")));
 assert.ok(!xml.includes(encodeURIComponent("서울특별시")));
 assert.ok(!xml.includes(encodeURIComponent("인천광역시")));
 assert.ok(!xml.includes(encodeURIComponent("경기도")));
 const [root,idx]=await html("/sitemap.xml");
 assert.equal(root.status,200);assert.match(idx,/<sitemapindex/);
 for(const b of BREEDS)assert.ok(idx.includes(b.slug+".nobubblepet.example"),b.slug);
 assert.equal((await req("/sitemap-pages.xml")).status,200);
});
test("staging blocks indexing until real domain + explicit production flag",async()=>{
 const [r,doc]=await html("/__preview__/maltipoo/",DEV,"http://localhost:8787");
 assert.equal(r.status,200);
 assert.match(doc,/noindex,nofollow/);
 assert.equal(r.headers.get("X-Robots-Tag"),"noindex, nofollow");
 let robot=await req("/robots.txt",DEV,"http://localhost:8787");
 assert.match(await robot.text(),/Disallow: \//);
 const stillPrivate=await req("/",{BASE_DOMAIN:"nobubblepet.example",PUBLIC_INDEXING:"false"});
 assert.match(await stillPrivate.text(),/noindex,nofollow/);
 const live=await req("/",LIVE);assert.match(await live.text(),/index,follow/);
 robot=await req("/robots.txt");const str=await robot.text();
 assert.match(str,/User-agent: Yeti\nAllow: \//);
 assert.match(str,/Sitemap: https:\/\/nobubblepet.example\/sitemap.xml/);
});
test("visible FAQs match linked schema and legal operator differs from brand",async()=>{
 const [r,doc]=await html("/충청남도/천안시/",LIVE,"https://maltipoo.nobubblepet.example");
 assert.equal(r.status,200);
 const script=doc.match(/<script type="application\/ld\+json">(.+?)<\/script>/s);
 assert.ok(script);
 const graph=JSON.parse(script[1])["@graph"];
 const org=graph.find(x=>x["@type"]==="Organization");
 const biz=graph.find(x=>Array.isArray(x["@type"])&&x["@type"].includes("PetStore"));
 const faq=graph.find(x=>x["@type"]==="FAQPage");
 assert.equal(org.name,"노버블펫");assert.equal(biz.name,"퍼피댕 유성점");
 assert.notEqual(org["@id"],biz["@id"]);
 assert.ok(faq.mainEntity.length>=3);
 for(const q of faq.mainEntity){assert.ok(doc.includes(q.name));assert.ok(doc.includes(q.acceptedAnswer.text));}
 const website=graph.find(x=>x["@type"]==="WebSite");
 assert.equal(website.potentialAction["@type"],"ViewAction");
});
test("sixteen independent guides and RSS have stable real dates",async()=>{
 let [r,hub]=await html("/가이드/");
 assert.equal(r.status,200);assert.match(hub,/16가지/);
 for(const slug of ["before-adoption","price-guide","health-records","adult-size","local-data"]){
  [r,hub]=await html("/가이드/"+slug+"/");
  assert.equal(r.status,200);assert.match(hub,/<h1>/);
  assert.match(hub,/dateModified/);
 }
 const [res,rss]=await html("/rss.xml");
 assert.equal(res.status,200);assert.match(rss,/<lastBuildDate>/);assert.match(rss,/<pubDate>/);
 assert.match(rss,/2026/);
 const style=await req("/_assets/style.css");
 assert.equal(style.status,200);assert.match(style.headers.get("content-type"),/text\/css/);
});
test("colors, price, care, health routes work; unknown hostname blocked",async()=>{
 for(const path of ["/가격/","/성격/","/키우기/","/건강/","/컬러/","/faq/","/컬러/화이트/"]){
  const r=await req(path,LIVE,"https://bichon.nobubblepet.example");
  assert.equal(r.status,200,path);
 }
 assert.equal((await req("/가격/",LIVE,"https://unknown.nobubblepet.example")).status,404);
 assert.equal((await req("/",LIVE,"https://otherdomain.example")).status,404);
});
