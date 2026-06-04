import { NavLink, Outlet } from 'react-router-dom'
import { sharedPages } from '../pages/registry'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-stone-900/[0.05] text-stone-900'
      : 'text-stone-500 hover:bg-stone-900/[0.04] hover:text-stone-900',
  ].join(' ')

export default function Layout() {
  return (
    <div className="flex min-h-full flex-col bg-stone-50 text-stone-700">
      <header className="sticky top-0 z-10 border-b border-stone-200/70 bg-stone-50/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-5 py-3.5">
          <NavLink
            to="/"
            className="mr-2 bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-base font-bold tracking-tight text-transparent"
          >
            byeun
          </NavLink>
          <nav className="flex flex-wrap items-center gap-0.5">
            <NavLink to="/" end className={navLinkClass}>
              홈
            </NavLink>
            {sharedPages.map(({ slug, title }) => (
              <NavLink key={slug} to={`/${slug}`} className={navLinkClass}>
                {title}
              </NavLink>
            ))}
            <NavLink to="/about" className={navLinkClass}>
              소개
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-stone-200/70 px-5 py-8 text-center text-xs text-stone-400">
        byeun · 공유 허브
      </footer>
    </div>
  )
}
