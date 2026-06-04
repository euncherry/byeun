import { lazy } from 'react'
import type { ComponentType } from 'react'

/**
 * 공유할 페이지들을 여기에 등록합니다.
 *
 * 새 페이지 추가하는 법:
 *   1. src/pages/MyPage.tsx 파일을 만든다 (Sample.tsx 복사 추천)
 *   2. 아래 배열에 항목을 하나 추가한다
 *   → 라우팅(/slug)과 홈 화면 카드가 자동으로 생성됩니다.
 */
export type SharedPage = {
  /** URL 경로. 예: "sample" → /sample */
  slug: string
  /** 홈 카드와 네비게이션에 표시될 제목 */
  title: string
  /** 홈 카드에 표시될 한 줄 설명 */
  description: string
  /** 페이지 컴포넌트 (지연 로딩) */
  Component: ComponentType
  /** true면 공통 레이아웃(상단 메뉴/푸터) 없이 전체화면으로 렌더링합니다. */
  fullscreen?: boolean
}

export const sharedPages: SharedPage[] = [
  {
    slug: 'sample',
    title: '샘플 페이지',
    description: '새 페이지를 만드는 예시입니다. 이 파일을 복사해서 시작하세요.',
    Component: lazy(() => import('./Sample')),
  },
  {
    slug: 'pronunciation',
    title: '발음 분석',
    description: '아웃싸운드 탈출기 — 발음 분석 결과 상세 화면 (전체화면).',
    Component: lazy(() => import('./pronunciation/PronunciationPage')),
    fullscreen: true,
  },
]
