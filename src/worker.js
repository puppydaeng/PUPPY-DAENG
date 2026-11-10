import config from "../config/site.json" with {type:"json"};
import breeds from "../data/breeds.json" with {type:"json"};
import regions from "../data/regions.json" with {type:"json"};
import guides from "../data/guides.json" with {type:"json"};
import {CSS} from "./styles.js";

export const BREEDS=breeds;
export const REGIONS=regions;
const BY_BREED=Object.fromEntries(breeds.map(b=>[b.slug,b]));
const BY_GUIDE=Object.fromEntries(guides.map(g=>[g.slug,g]));
const REGION_NAMES=Object.keys(regions);
const BREED_ICONS=["🐩","🐶","🐕","🐾","🐩","🐕","🦮","🐕","🐶","🐕","🐶","🐩"];
const EDITED=config.editorialModifiedAt;

function e(s){return String(s??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
function enc(s){return encodeURIComponent(s);}
function slugName(s){return (s.endsWith("시")||s.endsWith("군")||s.endsWith("구"))?s.slice(0,-1):s;}
function small(s){return String(s).length>155?String(s).slice(0,155):String(s);}
function pageLink(ctx,slug,path="/"){
 const p=path.startsWith("/")?path:"/"+path;
 if(ctx.domain)return "https://"+(slug?slug+".":"")+ctx.domain+p;
 return slug?"/__preview__/"+slug+p:p;
}
function canonical(ctx,slug,path){return ctx.domain?pageLink(ctx,slug,path):null;}
function dateVisible(){return "2026년 11월 10일";}

function context(req,env={}){
 const url=new URL(req.url), host=url.hostname.toLowerCase();
 const domain=String(env.BASE_DOMAIN||"").trim().toLowerCase().replace(/^https?:\/\//,"").replace(/\/$/,"");
 const indexing=String(env.PUBLIC_INDEXING||"false")==="true" && !!domain;
 let breed=null,parts=[],preview=false;
 if(domain&&(host===domain||host==="www."+domain)){breed=null;}
 else if(domain&&host.endsWith("."+domain)){
   const sub=host.slice(0,-(domain.length+1));
   if(BY_BREED[sub])breed=BY_BREED[sub];
   else return {invalid:true,url,domain,indexing:false};
 }else if(!domain||(host==="localhost"||host==="127.0.0.1"||host.endsWith(".workers.dev"))){
   // Staging URL: /__preview__/maltipoo/충청남도/천안시/
   const raw=url.pathname.split("/").filter(Boolean).map(s=>decodeURIComponent(s));
   if(raw[0]==="__preview__"&&BY_BREED[raw[1]]){
     breed=BY_BREED[raw[1]];parts=raw.slice(2);preview=true;
   } else parts=raw;
 } else return {invalid:true,url,domain,indexing:false};
 if(!parts.length&&!preview){try{parts=url.pathname.split("/").filter(Boolean).map(s=>decodeURIComponent(s));}catch{return{invalid:true,url,domain,indexing:false};}}
 if(parts.some(x=>x==="."||x===".."||x.includes("/")))return {invalid:true,url,domain,indexing:false};
 return {url,domain,indexing,breed,parts,preview};
}

function nav(ctx){
 const home=pageLink(ctx,null,"/");
 return '<div class="notice">견종·지역별 정보 안내 · 실제 개체의 건강·분양 조건은 상담 시 확인해요</div>'+
 '<header class="topbar"><div class="wrap nav">'+
 '<a class="brand" href="'+e(home)+'"><span class="brand-mark"><span>✿</span></span><span>'+e(config.brand)+'<small>'+e(config.brandEnglish)+'</small></span></a>'+
 '<nav class="navigation"><a href="'+e(home)+'">홈</a><a href="'+e(pageLink(ctx,null,"/견종/"))+'">견종 알아보기</a><a href="'+e(pageLink(ctx,null,"/지역/"))+'">지역별 분양</a><a href="'+e(pageLink(ctx,null,"/가이드/"))+'">분양 가이드</a><a href="'+e(pageLink(ctx,null,"/문의/"))+'">상담 안내</a></nav>'+
 '<a class="btn dark call" href="tel:'+config.business.phone.replace(/\D/g,"")+'">☎ 전화 상담</a></div></header>';
}
function footer(ctx){
 const b=config.business;
 return '<footer class="footer"><div class="wrap"><div class="footer-grid">'+
 '<div><a class="brand" href="'+e(pageLink(ctx,null,"/"))+'"><span class="brand-mark"><span>✿</span></span>'+e(config.brand)+'</a><p>'+e(config.tagline)+'<br>견종과 지역별 정보는 선택을 돕기 위한 참고 자료입니다.</p></div>'+
 '<div><strong>더 알아보기</strong><ul><li><a href="'+e(pageLink(ctx,null,"/견종/"))+'">견종별 분양 안내</a></li><li><a href="'+e(pageLink(ctx,null,"/지역/"))+'">지역별 이동분양 상담</a></li><li><a href="'+e(pageLink(ctx,null,"/가이드/"))+'">분양 전 체크리스트</a></li><li><a href="https://www.localdata.go.kr" rel="external noopener">공식 동물판매업 정보 확인</a></li></ul></div>'+
 '<div><strong>운영 사업자 안내</strong><p>홈페이지 브랜드: '+e(config.brand)+'<br>실제 운영 사업자: '+e(b.name)+'<br>대표자: '+e(b.representative)+'<br>사업자등록번호: '+e(b.businessRegistration)+'<br>동물판매업 등록번호: '+e(b.animalSalesPermit)+'<br>사업장: '+e(b.address)+'<br>전화: '+e(b.phone)+'</p></div></div>'+
 '<div class="foot-bottom"><span>© 2026 '+e(config.brandEnglish)+'. 견종별 지역 안내.</span><span>지역별 이동분양 상담은 실제 영업장 주소와 다를 수 있습니다.</span></div></div></footer>';
}
function thumb(b,i=0){
 if(!b.photo||i>2)return '<span class="fallback">🐶</span>';
 const src=b.photo.replace("-01.webp","-0"+(i+1)+".webp");
 return '<span class="fallback">🐶</span><img loading="lazy" src="'+e(src)+'" alt="'+e(b.name)+' 견종 참고 이미지" onerror="this.style.display=\'none\'">';
}
function breedCard(ctx,b,i){
 return '<a class="breed-card" href="'+e(pageLink(ctx,b.slug,"/"))+'"><div class="breed-card-visual"><span class="tag">'+e(b.size.split("·")[0].trim())+'</span>'+thumb(b,0)+'</div>'+
 '<div class="breed-info"><strong>'+e(b.name)+'</strong><span class="en">'+e(b.en)+'</span><p>'+e(small(b.intro))+'</p><span class="see">견종 정보 살펴보기 ↗</span></div></a>';
}
function sectionTitle(eyebrow,title,desc,link){
 return '<div class="section-head"><div><span class="eyebrow">'+e(eyebrow)+'</span><h2>'+e(title)+'</h2><p>'+e(desc||"")+'</p></div>'+(link?'<a class="secondary" href="'+e(link[1])+'">'+e(link[0])+' ↗</a>':"")+'</div>';
}
function breedGrid(ctx,items=breeds){return '<div class="breed-grid">'+items.map((b,i)=>breedCard(ctx,b,i)).join("")+'</div>';}
function areaGrid(items){return '<div class="area-grid">'+items.map(([name,url])=>'<a class="area" href="'+e(url)+'"><span>'+e(name)+'</span><span class="arrow">↗</span></a>').join("")+'</div>';}
function guideGrid(ctx,items=guides){
 return '<div class="guide-grid">'+items.map((g,i)=>'<a class="guide-card" href="'+e(pageLink(ctx,null,"/가이드/"+g.slug+"/"))+'"><small>GUIDE '+String(i+1).padStart(2,"0")+'</small><strong>'+e(g.title)+'</strong><p>'+e(g.intro)+'</p><span class="eyebrow">자세히 보기 ↗</span></a>').join("")+'</div>';
}
function cta(ctx){return '<div class="help-banner"><div><span class="eyebrow light">HAPPY COMPANION, HONEST INFORMATION</span><h2>우리 가족에게 맞는 아이를<br>차근차근 만나보세요.</h2><p>원하는 견종, 생활환경과 거주지역을 알려주시면 이동분양 상담 가능 여부와 개체별 건강·계약 조건을 함께 안내합니다.</p></div><div class="help-actions"><a class="btn cream" href="tel:'+config.business.phone.replace(/\D/g,"")+'">전화 상담하기 ↗</a><a class="btn white" href="'+e(config.kakao)+'" rel="noopener">카카오 상담하기 ↗</a></div></div>';}
function crumbs(ctx,list){
 const nodes=[["홈",pageLink(ctx,null,"/")],...list];
 return '<nav class="breadcrumbs" aria-label="페이지 위치">'+nodes.map(([name,url],i)=>'<span>'+(url?'<a href="'+e(url)+'">'+e(name)+'</a>':e(name))+'</span>'+(i<nodes.length-1?'<span>›</span>':"")).join("")+'</nav>';
}
function h2card(title,body){return '<section class="body-card"><h2>'+e(title)+'</h2>'+body+'</section>';}
function p(s){return '<p>'+e(s)+'</p>';}
function faqBlock(questions){
 return '<section class="body-card faq"><h2>자주 묻는 질문</h2>'+questions.map(x=>'<details><summary>'+e(x.q)+'</summary><p>'+e(x.a)+'</p></details>').join("")+'</section>';
}
function sidebar(ctx,b){
 return '<aside class="sidebar"><div class="side-card"><span class="eyebrow light">CONTACT NOBUBBLE PET</span><h3>궁금한 아이가 있나요?</h3><p>견종과 이동분양 희망지역을 알려주세요. 실제 개체의 건강·접종 기록과 조건은 상담 시 확인합니다.</p><a class="btn cream" href="tel:'+config.business.phone.replace(/\D/g,"")+'">전화 상담 '+e(config.business.phone)+'</a><a class="btn white" href="'+e(config.kakao)+'" rel="noopener">카카오로 문의하기</a></div>'+
 '<div class="side-card light"><h3>분양 전 확인</h3><p>분양가 포함 항목, 현재 상담 가능한 개체, 부모견 정보, 건강·접종 기록을 비교하세요.</p><a class="btn" href="'+e(pageLink(ctx,null,"/가이드/"))+'">16가지 가이드 보기 ↗</a></div></aside>';
}
function brandFaq(b,place){
 const n=b?b.name:"강아지", city=place||"";
 return [
 {q:city+n+"분양 가격은 어떻게 확인하나요?",a:"시작 가격이나 표시 금액만으로 확정하지 않고 실제 상담 가능한 개체의 총액, 포함 항목과 계약 조건을 확인합니다."},
 {q:city+n+"의 건강·접종 기록은 어떻게 확인하나요?",a:"개체의 생년월일과 진료·접종 기록을 확인하고, 궁금한 사항은 수의사에게 문의하세요. 견종 이름만으로 건강을 보장할 수 없습니다."},
 {q:city+"지역에서도 이동분양 상담이 가능한가요?",a:"이동분양 상담 가능 지역으로 안내하고 있습니다. 실제 이동 일정과 인계 장소, 해당 개체의 상담 가능 여부는 연락해 확인해 주세요."}
 ];
}
function breadcrumbJson(ctx,crumbs,url){
 return {"@type":"BreadcrumbList","@id":url+"#breadcrumb","itemListElement":[{"@type":"ListItem","position":1,"name":"홈","item":pageLink(ctx,null,"/")},...crumbs.map((x,i)=>({"@type":"ListItem","position":i+2,"name":x[0],"item":x[1]||url}))]};
}
function jsonLd(ctx,model,path,meta){
 if(!ctx.domain)return "";
 const url=canonical(ctx,ctx.breed?.slug,path),origin=pageLink(ctx,null,"/"),idOrg=origin+"#organization",idBiz=origin+"#business";
 const data=[
 {"@type":"Organization","@id":idOrg,"name":config.brand,"url":origin,"description":config.description,"inLanguage":"ko-KR"},
 {"@type":["LocalBusiness","PetStore"],"@id":idBiz,"name":config.business.name,"url":origin,"telephone":config.business.phone,"address":{"@type":"PostalAddress","streetAddress":config.business.address,"addressCountry":"KR"},"identifier":[{"@type":"PropertyValue","name":"사업자등록번호","value":config.business.businessRegistration},{"@type":"PropertyValue","name":"동물판매업 등록번호","value":config.business.animalSalesPermit}]},
 {"@type":"WebSite","@id":pageLink(ctx,ctx.breed?.slug,"/")+"#website","url":pageLink(ctx,ctx.breed?.slug,"/"),"name":config.brand+(ctx.breed?" "+ctx.breed.name:""),"publisher":{"@id":idOrg},"description":config.description,"inLanguage":"ko-KR","potentialAction":{"@type":"ViewAction","target":pageLink(ctx,null,"/가이드/")}},
 {"@type":"WebPage","@id":url+"#webpage","url":url,"name":meta.title,"description":meta.description,"inLanguage":"ko-KR","isPartOf":{"@id":pageLink(ctx,ctx.breed?.slug,"/")+"#website"},"publisher":{"@id":idOrg},"datePublished":config.publicationDate,"dateModified":EDITED}
 ];
 if(meta.crumbs?.length)data.push(breadcrumbJson(ctx,meta.crumbs,url));
 if(meta.faq?.length)data.push({"@type":"FAQPage","@id":url+"#faq","mainEntity":meta.faq.map(x=>({"@type":"Question","name":x.q,"acceptedAnswer":{"@type":"Answer","text":x.a}}))});
 if(meta.linkItems?.length)data.push({"@type":"ItemList","@id":url+"#list","itemListElement":meta.linkItems.map((x,i)=>({"@type":"ListItem","position":i+1,"item":{"@type":"WebPage","name":x[0],"url":x[1]}}))});
 if(meta.guide)data.push({"@type":"Article","@id":url+"#article","headline":meta.title,"description":meta.description,"mainEntityOfPage":{"@id":url+"#webpage"},"author":{"@id":idOrg},"publisher":{"@id":idOrg},"datePublished":config.publicationDate,"dateModified":EDITED,"inLanguage":"ko-KR"});
 return '<script type="application/ld+json">'+JSON.stringify({"@context":"https://schema.org","@graph":data}).replace(/</g,"\\u003c")+'</script>';
}
function frame(ctx,path,meta,body,status=200){
 const root=canonical(ctx,ctx.breed?.slug,path);
 const robots=ctx.indexing?"index,follow,max-image-preview:large":"noindex,nofollow";
 let breadcrumb=meta.crumbs||[];
 const title=meta.title+" | "+config.brand;
 const desc=meta.description||config.description;
 const head='<!doctype html><html lang="ko"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<title>'+e(title)+'</title><meta name="description" content="'+e(desc)+'"><meta name="robots" content="'+robots+'">'+
 '<meta property="og:type" content="website"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="'+e(config.brand)+'">'+
 '<meta property="og:title" content="'+e(title)+'"><meta property="og:description" content="'+e(desc)+'">'+
 (root?'<link rel="canonical" href="'+e(root)+'"><meta property="og:url" content="'+e(root)+'">':"")+
 '<meta name="theme-color" content="#183f36"><link rel="stylesheet" href="/_assets/style.css">'+
 jsonLd(ctx,null,path,{...meta,title,description:desc})+'</head><body>';
 const html=head+nav(ctx)+body+'<div class="wrap editorial">콘텐츠 기준일: '+dateVisible()+' · 실제 강아지의 현재 분양 상황과는 다를 수 있습니다.</div>'+footer(ctx)+'</body></html>';
 return response(html,"text/html; charset=utf-8",status,ctx,{"Vary":"Host"});
}
function response(body,type="text/plain; charset=utf-8",status=200,ctx=null,extra={}){
 const headers={"Content-Type":type,"Cache-Control":status===200?"public, max-age=300":"no-store","X-Content-Type-Options":"nosniff",...extra};
 if(ctx&&!ctx.indexing)headers["X-Robots-Tag"]="noindex, nofollow";
 return new Response(body,{status,headers});
}
function notfound(ctx){
 const body='<main class="wrap section"><div class="detail-hero"><span class="eyebrow">404 / PAGE NOT FOUND</span><h1>찾으시는 페이지가 없어요.</h1><p>견종이나 지역 주소를 다시 확인해 주세요. 서울·경기·인천 지역은 이 사이트의 안내 대상이 아닙니다.</p><a class="btn dark" href="'+e(pageLink(ctx,null,"/"))+'">메인으로 돌아가기</a></div></main>';
 return frame({...ctx,indexing:false},ctx.url.pathname,{title:"페이지를 찾을 수 없습니다",description:"노버블펫의 안내 대상이 아닌 주소입니다."},body,404);
}
function mainPage(ctx){
 const b=breeds[0],heroPhoto=b.photo?'<img class="hero-photo" alt="말티푸 견종 참고 이미지" src="'+e(b.photo)+'" onerror="this.style.display=\'none\'">':"";
 const hero='<section class="hero"><div class="wrap hero-grid"><div><span class="hero-label">✳ NO BUBBLE, JUST GOOD CARE</span><h1>좋은 가족의 시작,<br><em>정보부터 분명하게.</em></h1><p>'+e(config.description)+'</p><div class="hero-actions"><a class="btn dark" href="#breeds">견종 선택하기 ↗</a><a class="btn stroke" href="'+e(pageLink(ctx,null,"/지역/"))+'">지역별 분양 알아보기</a></div><div class="microproof"><span>견종별 성격·관리 안내</span><span>전국 이동분양 상담</span><span>공식 사업자 정보 표기</span></div></div>'+
 '<div class="hero-art"><span class="hero-dog">🐕</span>'+heroPhoto+'<span class="art-stamp">NOBUBBLE<br>PET<br>✿</span><div class="art-caption">조금 더 알아보고,<br>조금 더 신중하게 만나요.</div></div></div></section>';
 const reg=REGION_NAMES.map(p=>[p,pageLink(ctx,null,"/지역/"+enc(p)+"/")]);
 const body='<main>'+hero+'<section class="wrap"><div class="stats"><div><strong>'+breeds.length+'가지</strong><small>견종별 특성 안내</small></div><div><strong>'+REGION_NAMES.length+'개 광역지역</strong><small>서울·경기·인천 제외</small></div><div><strong>이동분양</strong><small>지역별 사전 상담</small></div></div></section>'+
 '<section class="section wrap" id="breeds">'+sectionTitle("FIND YOUR COMPANION","어떤 친구가 마음에 드나요?","성격·체구·활동량을 차근차근 살펴보세요.")+breedGrid(ctx)+'</section>'+
 '<section class="section alt-section"><div class="wrap">'+sectionTitle("EXPLORE BY REGION","우리 지역에서 알아보기","서울·경기·인천을 제외한 지역별 분양 준비와 상담 경로를 안내합니다.")+areaGrid(reg)+'</div></section>'+
 '<section class="section wrap">'+sectionTitle("STUDY FIRST","분양 전 꼭 알아둘 16가지","건강 기록, 계약, 털 관리, 이동 상담 등 필요한 정보만 모았습니다.",["전체 가이드",pageLink(ctx,null,"/가이드/")])+guideGrid(ctx,guides.slice(0,6))+'</section>'+
 '<section class="wrap section">'+cta(ctx)+'</section></main>';
 return frame(ctx,"/",{title:"강아지분양·견종별 지역 안내와 이동분양 상담",description:config.description,linkItems:breeds.map(b=>[b.name+"분양",pageLink(ctx,b.slug,"/")])},body);
}
function breedHome(ctx,b){
 const root="/";
 const crumbs=[[b.name+"분양",pageLink(ctx,b.slug,"/")]];
 const faq=brandFaq(b,"");
 const photo='<div class="hero-art"><span class="hero-dog">🐶</span>'+(b.photo?'<img class="hero-photo" src="'+e(b.photo)+'" alt="'+e(b.name)+' 견종 참고 이미지" onerror="this.style.display=\'none\'">':"")+'<span class="art-stamp">NOBUBBLE<br>'+e(b.en)+'<br>✿</span></div>';
 const prov=REGION_NAMES.map(p=>[p,pageLink(ctx,b.slug,"/"+enc(p)+"/")]);
 const desc=b.name+"분양과 "+b.name+"입양을 알아보세요. "+b.intro+" "+b.health+" 지역별 이동분양 상담을 안내합니다.";
 const body='<main class="wrap">'+crumbsHtml(ctx,crumbs)+'<section class="hero"><div class="hero-grid"><div><span class="eyebrow">'+e(b.en)+' / BREED GUIDE</span><h1>'+e(b.name)+'분양,<br><em>알고 만나면 더 좋아요.</em></h1><p>'+e(desc)+'</p><div class="hero-actions"><a class="btn dark" href="'+e(pageLink(ctx,b.slug,"/충청남도/"))+'">지역별 상담 찾아보기 ↗</a><a class="btn stroke" href="'+e(config.kakao)+'">카카오 상담하기</a></div><div class="microproof"><span>성견 크기 개체별 확인</span><span>건강·접종 기록 확인</span></div></div>'+photo+'</div></section>'+
 '<section class="section">'+sectionTitle("BREED FACTS",b.name+"에 대해 알아보기","견종의 일반적 경향과 실제 개체의 상태를 함께 확인하세요.")+
 '<div class="layout-two"><div>'+h2card("견종 정보",'<div class="info-list"><div><small>성견 크기</small><strong>'+e(b.size)+'</strong></div><div><small>활동량</small><strong>'+e(b.activity)+'</strong></div><div><small>털 특징</small><strong>'+e(b.coat)+'</strong></div><div><small>성견 체구 보장</small><strong>개체별 확인 필요</strong></div></div>'+p(b.intro)+p(b.care))+
 h2card("건강과 분양 전 확인 사항",p(b.health)+p("실제 상담 가능한 개체의 생년월일, 건강·접종 기록, 계약 조건과 분양금액을 확인하세요."))+
 gallery(b)+faqBlock(faq)+'</div>'+sidebar(ctx,b)+'</div></section>'+
 '<section class="section">'+sectionTitle("REGION SELECT",b.name+" 지역별 상담","서울·경기·인천은 안내 대상에서 제외됩니다.")+areaGrid(prov)+'</section>'+
 '<section class="section">'+sectionTitle("EXPLORE MORE",b.name+" 자세히 알아보기","건강·성격·키우기·가격 확인사항을 항목별로 확인하세요.")+
 areaGrid([["성격·사회화",pageLink(ctx,b.slug,"/성격/")],["관리·미용",pageLink(ctx,b.slug,"/키우기/")],["건강 기록",pageLink(ctx,b.slug,"/건강/")],["분양가격 확인",pageLink(ctx,b.slug,"/가격/")],["자주 묻는 질문",pageLink(ctx,b.slug,"/faq/")],["컬러 알아보기",pageLink(ctx,b.slug,"/컬러/")]])+
 '</section><section class="section">'+cta(ctx)+'</section></main>';
 return frame(ctx,root,{title:b.name+"분양·"+b.name+"입양·성견크기·분양가격",description:desc,crumbs,faq,linkItems:prov},body);
}
function gallery(b){
 return h2card(b.name+" 견종 사진 참고",'<div class="thumb-gallery">'+[0,1,2].map(i=>'<div class="frame">'+thumb(b,i)+'</div>').join("")+'</div><p class="note">사진은 견종의 외형을 참고하기 위한 이미지로, 현재 분양 가능한 특정 개체의 사진이나 재고를 보장하지 않습니다.</p>');
}
function crumbsHtml(ctx,items){return crumbs(ctx,items);}
function breedProvince(ctx,b,prov){
 const cities=regions[prov],href=pageLink(ctx,b.slug,"/"+enc(prov)+"/");
 const title=prov+" "+b.name+"분양·이동분양 상담";
 const desc=prov+" "+b.name+"분양을 알아본다면 "+b.intro+" "+b.health+" "+prov+"의 시·군·구를 골라 이동분양 상담 정보를 살펴보세요.";
 const links=cities.length?cities.map(city=>[city+" "+b.name+"분양",pageLink(ctx,b.slug,"/"+enc(prov)+"/"+enc(city)+"/")]):[[prov+" "+b.name+"분양",href]];
 const faq=brandFaq(b,prov+" ");
 const html='<main class="wrap">'+crumbsHtml(ctx,[[b.name+"분양",pageLink(ctx,b.slug,"/")],[prov,null]])+
 '<div class="detail-hero"><span class="eyebrow">REGIONAL BREED GUIDE</span><h1>'+e(prov)+" "+e(b.name)+'분양</h1>'+p(desc)+'<a class="btn dark" href="'+e(config.kakao)+'">지역 이동분양 상담 ↗</a></div>'+
 '<section class="section">'+sectionTitle("CHOOSE DISTRICT",prov+" 지역 선택","해당 지역을 선택하면 이동분양 준비사항과 견종 특징을 볼 수 있습니다.")+areaGrid(links)+'</section>'+
 '<div class="layout-two"><div>'+h2card(prov+"에서 "+b.name+"와 생활하기",p(b.intro)+p(b.care))+
 h2card("건강·계약 전 확인",p(b.health)+p("개체별 총 분양비용과 계약 조건, 상담 시 이동 가능 일정은 반드시 확인하세요."))+
 faqBlock(faq)+'</div>'+sidebar(ctx,b)+'</div></main>';
 return frame(ctx,"/"+enc(prov)+"/",{title,description:desc,crumbs:[[b.name+"분양",pageLink(ctx,b.slug,"/")],[prov,href]],faq,linkItems:links},html);
}
function breedCity(ctx,b,prov,city){
 const cityShort=slugName(city);
 const title=cityShort+b.name+"분양·"+city+b.name+"분양·이동분양 상담";
 const description=prov+" "+city+"에서 "+b.name+"분양과 "+cityShort+b.name+"입양을 알아보시나요? "+b.intro+" "+b.health+" 이동분양 상담 시 최종 분양가격과 인계 조건을 확인하세요.";
 const path="/"+enc(prov)+"/"+enc(city)+"/";
 const faq=brandFaq(b,city+" ");
 const related=breeds.filter(x=>x.slug!==b.slug).slice(0,6).map(x=>[cityShort+x.name+"분양",pageLink(ctx,x.slug,path)]);
 const galleryContent=gallery(b);
 const content='<main class="wrap">'+crumbsHtml(ctx,[[b.name+"분양",pageLink(ctx,b.slug,"/")],[prov,pageLink(ctx,b.slug,"/"+enc(prov)+"/")],[city,null]])+
 '<div class="detail-hero"><span class="eyebrow">LOCAL BREED / MOVING CONSULTATION</span><h1>'+e(cityShort+b.name)+'분양<br>'+e(city+b.name)+'분양 안내</h1>'+p(description)+
 '<a class="btn dark" href="'+e(config.kakao)+'">이 지역 상담하기 ↗</a></div>'+
 '<section class="section layout-two"><div>'+
 h2card(city+" "+b.name+"분양 전 알아둘 점",'<p><strong>'+e(city+" 지역에서 "+b.name)+"</strong>를 맞이한다면 실제 강아지의 현재 성장 상태, 생활환경과 건강·접종 기록을 확인하는 것이 중요합니다.</p>'+p(b.intro)+p(b.care))+
 h2card("성견 크기와 건강 기록",'<div class="info-list"><div><small>견종</small><strong>'+e(b.name)+'</strong></div><div><small>활동 수준</small><strong>'+e(b.activity)+'</strong></div><div><small>피모 관리</small><strong>'+e(b.coat)+'</strong></div><div><small>분양금액</small><strong>개체별 상담 확인</strong></div></div>'+p(b.health))+
 h2card(city+" 이동분양 상담 순서",'<ul><li>희망 견종과 '+e(city)+' 이동 상담 가능 여부를 확인합니다.</li><li>현재 상담 가능한 개체의 생년월일과 건강·접종 기록을 확인합니다.</li><li>총 분양비용과 계약·인계 장소, 이동 일정을 확인합니다.</li><li>인계 후 동물병원 방문 계획과 생활환경을 준비합니다.</li></ul>')+
 galleryContent+faqBlock(faq)+
 h2card("같은 지역의 다른 견종",'<div class="link-list">'+related.map(([n,l])=>'<a href="'+e(l)+'">'+e(n)+' ↗</a>').join("")+'</div>')+
 '</div>'+sidebar(ctx,b)+'</section><section class="section">'+cta(ctx)+'</section></main>';
 return frame(ctx,path,{title,description,crumbs:[[b.name+"분양",pageLink(ctx,b.slug,"/")],[prov,pageLink(ctx,b.slug,"/"+enc(prov)+"/")],[city,canonical(ctx,b.slug,path)]],faq,linkItems:related},content);
}
function breedInfo(ctx,b,type){
 const topics={
 "가격":["분양가격 확인","실제 개체별 분양금액은 상담 시점에 따라 달라질 수 있습니다. 표시된 가격이 모든 강아지에게 적용된다고 생각하지 마세요.",b.health,"건강검진·접종·이동 일정 등 포함·제외 항목과 계약·환불 조건을 확인하세요."],
 "성격":["성격과 사회화",b.intro,"견종의 일반적 성격은 참고사항입니다. 실제 강아지의 새로운 사람·소리·환경에 대한 반응을 직접 관찰하세요.","가족의 하루 일정과 놀이·산책 시간을 먼저 정하고 훈련 방식을 일관되게 유지하세요."],
 "키우기":["털 관리와 일상",b.care,"성장 단계에 따라 활동량과 휴식 시간이 달라집니다. 실내 바닥의 안전, 식사와 배변 일지를 함께 챙기세요.","미용 주기와 진료비 등 장기적으로 필요한 예산을 마련하세요."],
 "건강":["건강·접종 기록",b.health,"진료 기록과 접종표가 실제 개체 자료인지 확인하고 검사 날짜와 남은 예방 일정도 확인하세요.","특정 진단이 필요하면 수의사에게 문의하고, 판매자가 언급한 상태를 의학적 보장으로 받아들이지 마세요."]
 };
 const [title,a,btext,c]=topics[type];
 const faq=brandFaq(b,"");
 const path="/"+enc(type)+"/";
 const html='<main class="wrap">'+crumbsHtml(ctx,[[b.name+"분양",pageLink(ctx,b.slug,"/")],[title,null]])+
 '<div class="detail-hero"><span class="eyebrow">BREED CARE & ADOPTION GUIDE</span><h1>'+e(b.name+" "+title)+'</h1>'+p(a)+'</div><section class="section layout-two"><div>'+h2card("먼저 알아둘 점",p(a)+p(btext))+h2card("실제 상담 전 확인",p(c)+p("견종 특성뿐 아니라 생년월일과 건강·접종 기록, 상담 가능한 개체별 조건을 확인하세요."))+faqBlock(faq)+
 h2card("다른 항목 보기",'<div class="link-list">'+Object.keys(topics).filter(t=>t!==type).map(t=>'<a href="'+e(pageLink(ctx,ctx.breed.slug,"/"+enc(t)+"/"))+'">'+e(b.name+" "+topics[t][0])+' ↗</a>').join("")+'</div>')+'</div>'+sidebar(ctx,b)+'</section></main>';
 return frame(ctx,path,{title:b.name+title+"·분양 전 확인",description:b.name+"의 "+title+"에 관한 정보입니다. "+a+" "+c,crumbs:[[b.name+"분양",pageLink(ctx,b.slug,"/")],[title,pageLink(ctx,b.slug,path)]],faq},html);
}
function breedColors(ctx,b,color){
 if(color&&!b.colors.includes(color))return notfound(ctx);
 const title=color?color+b.name+"분양·털 색상별 확인":b.name+" 털 색상과 컬러 정보";
 const path=color?"/컬러/"+enc(color)+"/":"/컬러/";
 const links=b.colors.map(c=>[c+b.name+"분양",pageLink(ctx,b.slug,"/컬러/"+enc(c)+"/")]);
 const desc=color?b.name+"의 "+color+" 털 색상을 알아보고 있다면, 털 색상 외에도 성견 체구와 건강·접종 기록을 확인하세요.":"같은 "+b.name+"라도 털의 색상과 질감은 개체마다 다를 수 있습니다. "+b.coat+" "+b.health;
 const html='<main class="wrap">'+crumbsHtml(ctx,[[b.name+"분양",pageLink(ctx,b.slug,"/")],["컬러",color?pageLink(ctx,b.slug,"/컬러/"):null],...(color?[[color,null]]:[])])+
 '<div class="detail-hero"><span class="eyebrow">COAT COLORS</span><h1>'+e(title)+'</h1>'+p(desc)+'</div>'+
 '<section class="section layout-two"><div>'+h2card("털 색상을 볼 때 중요한 점",p(desc)+p(b.care)+p("색상은 분양 가능한 개체의 현재 보유 상황을 뜻하지 않으며 실제 상담 가능한 강아지의 자료를 확인해야 합니다."))+
 h2card(b.name+" 컬러 더 보기",areaGrid(links))+'</div>'+sidebar(ctx,b)+'</section></main>';
 return frame(ctx,path,{title,description:desc,crumbs:[[b.name+"분양",pageLink(ctx,b.slug,"/")],[title,pageLink(ctx,b.slug,path)]],linkItems:links},html);
}
function breedFAQ(ctx,b){
 const faq=brandFaq(b,""),path="/faq/";
 const html='<main class="wrap">'+crumbsHtml(ctx,[[b.name+"분양",pageLink(ctx,b.slug,"/")],["FAQ",null]])+
 '<div class="detail-hero"><span class="eyebrow">FREQUENTLY ASKED QUESTIONS</span><h1>'+e(b.name)+"분양 자주 묻는 질문</h1>"+p(b.health)+'</div><section class="section layout-two"><div>'+faqBlock(faq)+h2card("상담 전 꼭 확인할 사항",p(b.intro)+p(b.care))+'</div>'+sidebar(ctx,b)+'</section></main>';
 return frame(ctx,path,{title:b.name+"분양 자주 묻는 질문",description:b.name+"의 분양가격·건강·이동분양 상담에 관한 자주 묻는 질문입니다.",crumbs:[[b.name+"분양",pageLink(ctx,b.slug,"/")],["FAQ",pageLink(ctx,b.slug,path)]],faq},html);
}
function mainRegion(ctx,prov,city){
 const breadcrumb=[["지역별 분양",pageLink(ctx,null,"/지역/")]];
 if(prov)breadcrumb.push([prov,pageLink(ctx,null,"/지역/"+enc(prov)+"/")]);
 if(city)breadcrumb.push([city,null]);
 const path="/지역/"+(prov?enc(prov)+"/":"")+(city?enc(city)+"/":"");
 const title=city?slugName(city)+"강아지분양·"+city+"강아지입양":prov?prov+" 강아지분양·지역별 이동분양":"전국 지역별 강아지분양·이동분양";
 const desc=city?prov+" "+city+"의 강아지분양·이동분양 상담 안내입니다. 말티푸, 비숑프리제, 포메라니안, 골든두들 등 견종별 특징과 건강·접종 기록, 상담 가능 여부를 확인하세요.":prov?prov+" 강아지분양 정보를 찾아보세요. 시·군·구에서 견종별 생활환경과 이동분양 상담 방법을 확인할 수 있습니다.":"서울·경기·인천을 제외한 전국 14개 광역지역의 강아지분양 정보를 안내합니다. 견종별 성격·건강 기록과 이동분양 상담을 확인하세요.";
 const links=city?breeds.map(b=>[slugName(city)+b.name+"분양",pageLink(ctx,b.slug,"/"+enc(prov)+"/"+enc(city)+"/")]):prov?(regions[prov].length?regions[prov].map(c=>[c+" 강아지분양",pageLink(ctx,null,"/지역/"+enc(prov)+"/"+enc(c)+"/")]):breeds.map(b=>[prov+" "+b.name+"분양",pageLink(ctx,b.slug,"/"+enc(prov)+"/")])):REGION_NAMES.map(p=>[p+" 강아지분양",pageLink(ctx,null,"/지역/"+enc(p)+"/")]);
 const content='<main class="wrap">'+crumbsHtml(ctx,breadcrumb)+'<div class="detail-hero"><span class="eyebrow">LOCAL DOG ADOPTION & CARE</span><h1>'+e(title)+'</h1>'+p(desc)+'</div>'+
 '<section class="section">'+sectionTitle("SELECT REGION OR BREED",city?"이 지역에서 견종 선택":prov?"시·군·구 선택":"지역 선택","지역을 고른 뒤 견종별 정보와 상담 방법을 살펴보세요.")+areaGrid(links)+'</section>'+
 '<section class="section">'+sectionTitle("LEARN BEFORE CONSULTING","분양 전 확인할 사항","견종의 일반적 특징과 실제 개체별 건강·계약 조건을 구분해 살펴보세요.")+guideGrid(ctx,guides.slice(0,3))+'</section><section class="section">'+cta(ctx)+'</section></main>';
 return frame(ctx,path,{title,description:desc,crumbs:breadcrumb,linkItems:links},content);
}
function guideHub(ctx){
 const path="/가이드/";
 const body='<main class="wrap">'+crumbsHtml(ctx,[["분양 가이드",null]])+'<div class="detail-hero"><span class="eyebrow">RESPONSIBLE ADOPTION</span><h1>강아지분양 전 확인할<br>16가지 기준</h1>'+p("건강기록·성견 크기·분양계약·이동분양 등 강아지와 오래 지내기 전에 알아둘 내용을 주제별로 정리했습니다.")+'</div><section class="section">'+guideGrid(ctx)+'</section><section class="section">'+cta(ctx)+'</section></main>';
 return frame(ctx,path,{title:"강아지분양 전 체크리스트 16가지",description:"건강기록, 분양계약, 성견 크기, 미용과 이동분양을 주제별로 확인하세요.",crumbs:[["분양 가이드",pageLink(ctx,null,path)]],linkItems:guides.map(g=>[g.title,pageLink(ctx,null,"/가이드/"+g.slug+"/")])},body);
}
function guidePage(ctx,g){
 const path="/가이드/"+g.slug+"/",faqs=g.faq;
 const content='<main class="wrap">'+crumbsHtml(ctx,[["분양 가이드",pageLink(ctx,null,"/가이드/")],[g.title,null]])+
 '<div class="detail-hero"><span class="eyebrow">ADOPTION GUIDE / NOBUBBLE PET</span><h1>'+e(g.title)+'</h1>'+p(g.intro)+'</div><section class="section layout-two"><article><div class="body-card"><h2>핵심 확인 사항</h2>'+p(g.intro)+g.paragraphs.map((t,i)=>'<h3>'+e(["먼저 점검할 내용","상담 중 확인할 조건","인계 전 마지막 점검"][i]||"추가 확인")+'</h3>'+p(t)).join("")+'</div>'+
 faqBlock(faqs)+h2card("다른 분양 준비 가이드",'<div class="link-list">'+guides.filter(x=>x.slug!==g.slug).slice(0,6).map(x=>'<a href="'+e(pageLink(ctx,null,"/가이드/"+x.slug+"/"))+'">'+e(x.title)+' ↗</a>').join("")+'</div>')+
 '</article>'+sidebar(ctx,null)+'</section></main>';
 return frame(ctx,path,{title:g.title+"·분양 준비 가이드",description:g.intro,crumbs:[["분양 가이드",pageLink(ctx,null,"/가이드/")],[g.title,pageLink(ctx,null,path)]],faq:faqs,guide:true},content);
}
function contact(ctx){
 const body='<main class="wrap">'+crumbsHtml(ctx,[["상담 안내",null]])+'<div class="detail-hero"><span class="eyebrow">CONTACT US</span><h1>이동분양부터 건강기록까지<br>편하게 문의해 주세요.</h1>'+p("노버블펫은 견종별 정보를 안내하고, 실제 상담은 운영 사업자 퍼피댕 유성점을 통해 진행합니다.")+'</div><section class="section layout-two"><div>'+
 h2card("상담 방법",p("원하는 견종과 희망 지역, 이동분양 희망일을 알려주세요. 현재 상담 가능한 개체와 분양가격, 건강·접종 기록 및 계약·인계 조건을 순서대로 확인합니다.")+'<a class="btn dark" href="tel:'+config.business.phone.replace(/\D/g,"")+'">전화 '+e(config.business.phone)+'</a> <a class="btn stroke" href="'+e(config.kakao)+'">카카오 채널</a>')+
 h2card("실제 사업자 정보",p(config.business.name)+"<p>주소: "+e(config.business.address)+"</p><p>동물판매업 등록번호: "+e(config.business.animalSalesPermit)+"</p><p>사업자등록번호: "+e(config.business.businessRegistration)+"</p>")+
 '</div>'+sidebar(ctx,null)+'</section></main>';
 return frame(ctx,"/문의/",{title:"노버블펫 전화·카카오·이동분양 상담",description:"원하는 견종과 지역을 알려주시면 퍼피댕 유성점 운영 사업자를 통해 이동분양 상담과 계약 조건을 확인할 수 있습니다.",crumbs:[["상담 안내",pageLink(ctx,null,"/문의/")]]},body);
}
function mainRoute(ctx){
 const a=ctx.parts;
 if(a.length===0)return mainPage(ctx);
 if(a.length===1&&a[0]==="견종")return frame(ctx,"/견종/",{title:"견종별 강아지분양·성격·건강·성견크기",description:"말티푸, 포메라니안, 비숑, 골든두들 등 12가지 견종의 성격·건강·관리 방법을 비교하세요.",crumbs:[["견종 선택",pageLink(ctx,null,"/견종/")]],linkItems:breeds.map(b=>[b.name,pageLink(ctx,b.slug,"/")])},'<main class="wrap">'+crumbsHtml(ctx,[["견종 선택",null]])+'<div class="detail-hero"><span class="eyebrow">BREED DISCOVERY</span><h1>우리 가족과 잘 맞는 견종을 찾아보세요.</h1>'+p("12가지 견종의 성격과 털 관리, 건강 기록 확인 사항을 한눈에 비교하세요.")+'</div><section class="section">'+breedGrid(ctx)+'</section></main>');
 if(a[0]==="지역"&&a.length===1)return mainRegion(ctx,null,null);
 if(a[0]==="지역"&&a.length===2&&Object.hasOwn(regions,a[1]))return mainRegion(ctx,a[1],null);
 if(a[0]==="지역"&&a.length===3&&Object.hasOwn(regions,a[1])&&regions[a[1]].includes(a[2]))return mainRegion(ctx,a[1],a[2]);
 if(a[0]==="가이드"&&a.length===1)return guideHub(ctx);
 if(a[0]==="가이드"&&a.length===2&&BY_GUIDE[a[1]])return guidePage(ctx,BY_GUIDE[a[1]]);
 if(a.length===1&&a[0]==="문의")return contact(ctx);
 return notfound(ctx);
}
function breedRoute(ctx){
 const b=ctx.breed,a=ctx.parts;
 if(!a.length)return breedHome(ctx,b);
 if(a.length===1&&Object.hasOwn(regions,a[0]))return breedProvince(ctx,b,a[0]);
 if(a.length===2&&Object.hasOwn(regions,a[0])&&regions[a[0]].includes(a[1]))return breedCity(ctx,b,a[0],a[1]);
 if(a.length===1&&["가격","성격","키우기","건강"].includes(a[0]))return breedInfo(ctx,b,a[0]);
 if(a.length===1&&a[0]==="컬러")return breedColors(ctx,b,null);
 if(a.length===2&&a[0]==="컬러")return breedColors(ctx,b,a[1]);
 if(a.length===1&&a[0]==="faq")return breedFAQ(ctx,b);
 return notfound(ctx);
}
function routes(ctx){
 if(ctx.breed){
  const b=ctx.breed;
  return ["/",...REGION_NAMES.map(p=>"/"+enc(p)+"/"),
   ...REGION_NAMES.flatMap(p=>regions[p].map(c=>"/"+enc(p)+"/"+enc(c)+"/")),
   ...["가격","성격","키우기","건강","faq","컬러"].map(p=>"/"+enc(p)+"/"),
   ...b.colors.map(c=>"/컬러/"+enc(c)+"/")];
 }
 return ["/","/견종/","/지역/","/가이드/","/문의/",
  ...REGION_NAMES.map(p=>"/지역/"+enc(p)+"/"),
  ...REGION_NAMES.flatMap(p=>regions[p].map(c=>"/지역/"+enc(p)+"/"+enc(c)+"/")),
  ...guides.map(g=>"/가이드/"+g.slug+"/")];
}
function xmlEscape(t){return e(t).replace(/'/g,"&apos;");}
function sitemap(ctx,onlyMain=false){
 if(!ctx.domain)return response("Site domain not configured", "text/plain; charset=utf-8",503,ctx);
 if(!ctx.breed&&!onlyMain){
  const sitemaps=[pageLink(ctx,null,"/sitemap-pages.xml"),...breeds.map(b=>pageLink(ctx,b.slug,"/sitemap.xml"))];
  return response('<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+sitemaps.map(x=>'<sitemap><loc>'+xmlEscape(x)+'</loc></sitemap>').join("")+'</sitemapindex>',"application/xml; charset=utf-8",200,ctx);
 }
 const list=routes(ctx).map(path=>'<url><loc>'+xmlEscape(pageLink(ctx,ctx.breed?.slug,path))+'</loc><lastmod>'+EDITED.slice(0,10)+'</lastmod></url>').join("");
 return response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+list+'</urlset>',"application/xml; charset=utf-8",200,ctx);
}
function robots(ctx){
 if(!ctx.indexing)return response("User-agent: *\nDisallow: /\n","text/plain; charset=utf-8",200,ctx);
 return response("User-agent: *\nAllow: /\n\nUser-agent: Yeti\nAllow: /\n\nSitemap: "+pageLink(ctx,ctx.breed?.slug,"/sitemap.xml")+"\n","text/plain; charset=utf-8",200,ctx);
}
function llms(ctx){
 const list=ctx.breed?[
   ...REGION_NAMES.map(p=>"- ["+p+" "+ctx.breed.name+"분양]("+pageLink(ctx,ctx.breed.slug,"/"+enc(p)+"/")+")"),
   "- [건강기록 확인]("+pageLink(ctx,ctx.breed.slug,"/건강/")+")",
   "- [견종별 미용·관리]("+pageLink(ctx,ctx.breed.slug,"/키우기/")+")"
 ]:breeds.map(b=>"- ["+b.name+"분양]("+pageLink(ctx,b.slug,"/")+")").concat(guides.map(g=>"- ["+g.title+"]("+pageLink(ctx,null,"/가이드/"+g.slug+"/")+")"));
 const t="# "+config.brand+(ctx.breed?" - "+ctx.breed.name:"")+"\n\n> "+config.description+"\n\n## 실제 페이지 목록\n\n"+list.join("\n")+"\n\n## 운영 사업자\n"+config.business.name+"\n"+config.business.address+"\n\n안내 대상: 서울·경기·인천 제외. 지역별 실제 이동 일정은 상담 시 확인.\n";
 return response(t,"text/plain; charset=utf-8",200,ctx);
}
function rss(ctx){
 const list=ctx.breed?[["/"+enc(REGION_NAMES[0])+"/",ctx.breed.name+" 분양 지역 안내"],["/건강/",ctx.breed.name+" 건강기록"],["/키우기/",ctx.breed.name+" 털 관리"]]:guides.map(g=>["/가이드/"+g.slug+"/",g.title]);
 const items=list.map(([path,title])=>'<item><title>'+xmlEscape(title)+'</title><link>'+xmlEscape(pageLink(ctx,ctx.breed?.slug,path))+'</link><guid>'+xmlEscape(pageLink(ctx,ctx.breed?.slug,path))+'</guid><description>'+xmlEscape(config.description)+'</description><pubDate>'+new Date(EDITED).toUTCString()+'</pubDate></item>').join("");
 return response('<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>'+xmlEscape(config.brand)+'</title><link>'+xmlEscape(pageLink(ctx,ctx.breed?.slug,"/"))+'</link><description>'+xmlEscape(config.description)+'</description><lastBuildDate>'+new Date(EDITED).toUTCString()+'</lastBuildDate>'+items+'</channel></rss>',"application/rss+xml; charset=utf-8",200,ctx);
}
export function describeSite(){
 return {brand:config.brand,breeds:breeds.length,provinces:REGION_NAMES.length,cities:Object.values(regions).reduce((n,a)=>n+a.length,0),previewRoutes:routes({breed:null}).length,breedRoutes:breeds.reduce((n,b)=>n+routes({breed:b}).length,0)};
}
export default {
 async fetch(request,env={}){
  let ctx;
  try{ctx=context(request,env);}catch{return response("Invalid path","text/plain; charset=utf-8",400);}
  if(ctx.invalid)return response("Unknown hostname","text/plain; charset=utf-8",404);
  if(request.method!=="GET"&&request.method!=="HEAD")return response("Method not allowed","text/plain; charset=utf-8",405,ctx,{"Allow":"GET, HEAD"});
  const path=ctx.parts.join("/");
  if(ctx.url.pathname==="/_assets/style.css")return response(CSS,"text/css; charset=utf-8",200,ctx);
  if(path==="robots.txt")return robots(ctx);
  if(path==="llms.txt")return llms(ctx);
  if(path==="rss.xml"||path==="feed.xml")return rss(ctx);
  if(path==="sitemap.xml")return sitemap(ctx);
  if(path==="sitemap-pages.xml"&&!ctx.breed)return sitemap(ctx,true);
  return ctx.breed?breedRoute(ctx):mainRoute(ctx);
 }
};
