import { Suspense } from 'react'
import type { ComponentType } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import About from './pages/About'
import NotFound from './pages/NotFound'
import { sharedPages } from './pages/registry'

function withSuspense(Component: ComponentType) {
  return (
    <Suspense fallback={<div className="p-10 text-stone-400">불러오는 중…</div>}>
      <Component />
    </Suspense>
  )
}

export default function App() {
  return (
    <Routes>
      {/* 전체화면 페이지: 공통 레이아웃(헤더/푸터) 밖에서 단독 렌더링 */}
      {sharedPages
        .filter((p) => p.fullscreen)
        .map(({ slug, Component }) => (
          <Route key={slug} path={slug} element={withSuspense(Component)} />
        ))}

      {/* 공통 레이아웃을 쓰는 페이지들 */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />

        {sharedPages
          .filter((p) => !p.fullscreen)
          .map(({ slug, Component }) => (
            <Route key={slug} path={slug} element={withSuspense(Component)} />
          ))}

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
