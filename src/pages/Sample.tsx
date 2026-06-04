import { useState } from 'react'

/**
 * 공유 페이지 예시입니다.
 * 이 파일을 복사해서 새 페이지를 만들고, registry.tsx에 등록하세요.
 */
export default function Sample() {
  const [count, setCount] = useState(0)

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-stone-900">
        샘플 페이지
      </h1>
      <p className="mt-4 leading-relaxed text-stone-500">
        이 페이지는 새 페이지를 만드는 출발점입니다. 자유롭게 내용을 바꿔서
        공유하고 싶은 것을 담아보세요.
      </p>

      <div className="mt-8 rounded-2xl border border-stone-200/80 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-stone-400">상호작용 예시</p>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="mt-4 inline-flex items-center rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700"
        >
          클릭한 횟수
          <span className="ml-2 tabular-nums text-brand-300">{count}</span>
        </button>
      </div>
    </div>
  )
}
