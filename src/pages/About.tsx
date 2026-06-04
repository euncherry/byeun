const steps = [
  <>
    <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[0.85em] text-stone-700">
      src/pages/Sample.tsx
    </code>
    를 복사해 새 파일을 만듭니다.
  </>,
  <>
    <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[0.85em] text-stone-700">
      src/pages/registry.tsx
    </code>
    의 배열에 항목을 추가합니다.
  </>,
  <>홈 화면 카드와 상단 메뉴, 라우팅이 자동으로 생성됩니다.</>,
]

export default function About() {
  return (
    <article className="max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">소개</h1>
      <p className="mt-4 leading-relaxed text-stone-500">
        이 사이트는 React + Vite로 만든 공유용 페이지 모음입니다. 새로운 페이지를
        만들어 하나의 주소로 묶어 공유할 수 있습니다.
      </p>

      <h2 className="mt-10 text-lg font-semibold text-stone-900">
        새 페이지 추가하기
      </h2>
      <ol className="mt-4 space-y-3">
        {steps.map((text, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
              {i + 1}
            </span>
            <span className="leading-relaxed text-stone-600">{text}</span>
          </li>
        ))}
      </ol>
    </article>
  )
}
