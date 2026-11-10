# 노버블펫 · NOBUBBLE PET 🐶

견종별 서브도메인과 서울·경기·인천을 제외한 지역별 강아지분양·이동분양 상담 정보 사이트입니다.
경쟁사의 구조를 참고하되, 경쟁사 사진·로고·문구를 복제하지 않고 별도의 브랜드로 새로 개발했습니다.

## 구현된 페이지

- 메인: 브랜드, 12개 견종, 14개 광역지역, 16개 분양 준비 가이드
- 견종 서브도메인: maltipoo / maltese / bichon / pomeranian / toy-poodle / goldendoodle / golden-retriever / shiba / welsh-corgi / yorkshire / shih-tzu / coton
- 각 견종: 홈 → 광역지역 → 시·군·구. 추가로 가격·성격·키우기·건강·컬러·FAQ 세부 페이지
- 메인 /지역/에서 지역·견종 페이지 연결
- 서울·경기·인천은 지역 데이터, 경로, 사이트맵에서 제외
- 지역·견종 검색어 맞춤형 title / meta description / H1 / Open Graph
- 사용자에게 보이는 FAQ와 일치하는 FAQPage, Article, WebPage, WebSite, BreadcrumbList, ItemList
- Organization(노버블펫)과 LocalBusiness·PetStore(실제 운영 사업자 퍼피댕 유성점) 분리
- 16개 독립 안내 가이드, 루트 및 견종별 sitemap, RSS, robots.txt, llms.txt
- 날짜 표기는 실제 최초 콘텐츠 제작일을 기준으로 고정. 단순 재빌드로 날짜를 갱신하지 않음

## 로컬 미리보기

Node.js 22 이상, 별도 의존성 설치 없이 실행됩니다.

    npm test
    npm run preview

메인: http://localhost:8787/
말티푸: http://localhost:8787/__preview__/maltipoo/
천안시 말티푸: http://localhost:8787/__preview__/maltipoo/충청남도/천안시/
골든두들: http://localhost:8787/__preview__/goldendoodle/

## Cloudflare 배포 연결

현재 새 도메인을 아직 정하지 않았으므로 테스트 모드로 시작합니다. 기본적으로 **noindex, nofollow**와 robots.txt의 Disallow: /가 적용됩니다.
실제 소유한 도메인을 정한 뒤 wrangler.jsonc vars.BASE_DOMAIN에 도메인을 설정하세요.
Cloudflare 계정에 해당 메인 도메인과 견종 서브도메인이 Worker로 들어오도록 연결해야 합니다. 와일드카드 라우팅 지원을 확인하거나 12개 호스트를 개별 연결하세요.
그런 다음 Cloudflare에서 npx wrangler deploy로 배포하고, 공개 콘텐츠·도메인·사업자 정보를 확인한 후에만 vars.PUBLIC_INDEXING을 true로 설정하세요.
도메인이 없으면 실제 서브도메인을 사용할 수 없으며, 현재 이 GitHub 저장소의 성공적인 테스트가 Cloudflare 운영 배포를 뜻하지는 않습니다.

## 사진과 상담 안내

견종 사진은 사용자가 운영하는 ddaydj.xyz의 이미지 URL을 참고로 사용합니다. 외부 사이트 사진은 사용하지 않습니다.
사진은 현재 상담 가능한 개체의 재고 표시가 아니라 견종 참고 이미지로 안내합니다. 이미지 원본을 새 CDN으로 옮기기 전에는 링크 접근성을 확인해야 합니다.
골든두들은 검증된 고유 사진이 준비되지 않아 대체 아이콘을 사용합니다.
홈페이지 표시는 노버블펫, 실제 동물판매업 정보는 퍼피댕 유성점을 표시하며, 실제 이동분양 가능 여부와 개체별 계약 조건은 상담에서 확인합니다.

## 프로젝트 구성

- src/worker.js: 모든 페이지의 서버 사이드 HTML 렌더링과 호스트 라우팅
- src/styles.js: 사이트 전용 반응형 디자인
- config/site.json: 브랜드, 실제 사업자, 카카오·전화, 최초 발행·수정일
- data/breeds.json: 견종 12가지 특성·사진
- data/regions.json: 지역별 14개 광역·162개 시군구
- data/guides.json: 가이드 16가지
- scripts/preview.mjs: 로컬 미리보기
- tests/worker.test.js: 페이지 경로·색인·서브도메인·SEO 회귀 검증
- .github/workflows/verify.yml: GitHub Actions 검사
