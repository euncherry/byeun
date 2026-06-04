import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-7xl font-bold tracking-tight text-transparent">
        404
      </p>
      <h1 className="mt-5 text-xl font-semibold text-stone-900">
        페이지를 찾을 수 없어요
      </h1>
      <p className="mt-2 text-stone-500">
        주소가 잘못되었거나 삭제된 페이지입니다.
      </p>
      <Link
        to="/"
        className="mt-7 inline-flex items-center rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700"
      >
        홈으로 돌아가기
      </Link>
    </div>
  )
}
