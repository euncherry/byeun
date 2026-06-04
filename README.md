# byeun · 공유 허브

여러 페이지를 한곳에 모아 공유하기 위한 React + Vite 프로젝트입니다.

## 기술 스택

- **React 19** + **TypeScript**
- **Vite** (개발 서버 / 빌드)
- **React Router** (여러 페이지 라우팅)
- **Tailwind CSS v4** (스타일링)

## 시작하기

```bash
npm install      # 의존성 설치 (최초 1회)
npm run dev      # 개발 서버 실행 → http://localhost:5173
npm run build    # 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과 미리보기
```

## 새 페이지 추가하기

페이지 하나를 추가하면 **라우팅 · 홈 카드 · 상단 메뉴**가 자동으로 만들어집니다.

1. `src/pages/Sample.tsx`를 복사해 새 파일을 만든다 (예: `src/pages/Notice.tsx`)
2. `src/pages/registry.tsx`의 배열에 항목을 추가한다:

   ```ts
   {
     slug: 'notice',                  // 주소가 /notice 가 됩니다
     title: '공지사항',
     description: '한 줄 설명',
     Component: lazy(() => import('./Notice')),
   }
   ```

끝입니다. `/notice`로 접속하면 새 페이지가 보입니다.

## 폴더 구조

```
src/
├─ main.tsx              # 앱 진입점 (Router 설정)
├─ App.tsx               # 라우트 정의 (registry 기반 자동 생성)
├─ index.css            # Tailwind import + 전역 스타일
├─ components/
│  └─ Layout.tsx        # 공통 헤더/네비/푸터
└─ pages/
   ├─ registry.tsx      # ⭐ 공유 페이지 등록 (여기만 수정하면 됨)
   ├─ Home.tsx          # 페이지 목록 화면
   ├─ About.tsx         # 소개
   ├─ Sample.tsx        # 새 페이지용 템플릿
   └─ NotFound.tsx      # 404
```

## Vercel 배포

1. 이 프로젝트를 GitHub 저장소에 올린다.
2. [vercel.com](https://vercel.com) → **Add New → Project** → 저장소 선택.
3. Framework는 **Vite**로 자동 감지됩니다. 그대로 **Deploy**.
   - Build Command: `npm run build`
   - Output Directory: `dist`

`vercel.json`에 SPA 새로고침 대응(rewrite)이 들어 있어 `/sample` 같은
주소를 새로고침해도 정상 동작합니다.

> CLI로 배포하려면: `npm i -g vercel` 후 프로젝트 폴더에서 `vercel` 실행.
