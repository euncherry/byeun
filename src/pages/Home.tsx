import { Link } from 'react-router-dom'
import { sharedPages } from './registry'

export default function Home() {
  return (
    <div>
      <section className="py-10 sm:py-14">
        <span className="inline-flex items-center rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-500 shadow-sm">
          ✦ 공유 허브
        </span>
        <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-stone-900 sm:text-5xl">
          한곳에서 모아 보는
          <br />
          <span className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent">
            나의 페이지들
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-stone-500">
          여러 페이지를 만들어 하나의 주소로 공유하세요. 아래에서 원하는
          페이지를 선택해 들어갈 수 있습니다.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sharedPages.map(({ slug, title, description }) => (
          <Link
            key={slug}
            to={`/${slug}`}
            className="group rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-lg hover:shadow-stone-900/[0.06]"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-400 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                →
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">
              {description}
            </p>
            <p className="mt-6 font-mono text-xs text-stone-400">/{slug}</p>
          </Link>
        ))}
      </section>

      {sharedPages.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-400">
          아직 등록된 페이지가 없어요.{' '}
          <code className="font-mono text-stone-600">
            src/pages/registry.tsx
          </code>
          에서 추가하세요.
        </p>
      )}
    </div>
  )
}
