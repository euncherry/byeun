import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, MouseEvent as ReactMouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import './outsound.css'
import WaveformGraph from './graphs/WaveformGraph'
import PitchGraph from './graphs/PitchGraph'
import SpectrogramGraph from './graphs/SpectrogramGraph'
import { DEFAULT_AUDIO_URL } from './graphs/audio'
import Karaoke from './karaoke/Karaoke'

/* ── 탭 정의 ── */
const TABS = [
  { id: 'overview', label: '개요' },
  { id: 'detail', label: '상세 분석' },
  { id: 'spectrogram', label: '스펙트로그램' },
  { id: 'pitch', label: '음정 곡선' },
  { id: 'waveform', label: '파형 비교' },
] as const
type TabId = (typeof TABS)[number]['id']

/* ── 오디오 플레이어 웨이브폼 막대 (sin/cos 기반, 결정적) ── */
const AUDIO_BARS = Array.from({ length: 32 }, (_, i) => {
  const v = (Math.sin(i * 0.7) * 0.3 + Math.cos(i * 1.3) * 0.25 + 0.55) * 100
  return Math.max(15, Math.min(95, Math.abs(v)))
})

/* ── mock 핸들러 (탭1·2 audio-player용; 실제 재생/공유 연결 예정) ── */
function playAudio() {
  console.log('play audio (mock)')
}
function shareAudio(e: ReactMouseEvent) {
  e.stopPropagation()
  console.log('share audio (wav) — TODO: 공유 기능 연결')
}

/* ── 탭 상단 라벨 ── */
function TabHeader({ label }: { label: string }) {
  return (
    <div className="tab-header">
      <div className="line" />
      <div className="diamond" />
      <span>{label}</span>
      <div className="diamond" />
      <div className="line" />
    </div>
  )
}

/* ── 오디오 플레이어 (탭1·탭2 공용, 디자인 mock) ── */
function AudioPlayer() {
  return (
    <div className="audio-player">
      <div className="audio-label">발음 다시 듣기</div>
      <div className="audio-controls">
        <div className="audio-waveform">
          {AUDIO_BARS.map((h, i) => (
            <div
              key={i}
              className={i < 8 ? 'bar active' : 'bar'}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="audio-time">0:00 / 0:07</div>
        <button className="audio-play" aria-label="재생" onClick={playAudio}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <polygon points="7 4 20 12 7 20" />
          </svg>
        </button>
        <button className="audio-share" aria-label="음성 공유하기" onClick={shareAudio}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </div>
    </div>
  )
}

/* ── 표준 발음 이미지 (없으면 플레이스홀더로 폴백) ── */
function VisImage({ src, fallback, alt }: { src: string; fallback: string; alt: string }) {
  const [error, setError] = useState(false)
  return (
    <div className="vis-image">
      {!error && (
        <img className="vis-img" src={src} alt={alt} onError={() => setError(true)} />
      )}
      <div className="vis-fallback" style={error ? { opacity: 0.7 } : undefined}>
        <div className="ph-diamond" />
        <span>{fallback}</span>
      </div>
    </div>
  )
}

const METRIC_BARS = [
  { label: '음절 정확도', tier: 'high', value: 82 },
  { label: '단어 구사력', tier: 'mid', value: 64 },
  { label: '문장 전달력', tier: 'low', value: 45 },
] as const

export default function PronunciationPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<TabId>('overview')
  const scrollRef = useRef<HTMLDivElement>(null)

  // 그래프가 분석할 오디오 (기본 샘플 → 업로드 시 교체)
  const [audioUrl, setAudioUrl] = useState<string>(DEFAULT_AUDIO_URL)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  // 전체 페이지 보기 토글 (게임 UI ↔ 그래프 세로 스택)
  const [fullView, setFullView] = useState(false)

  const selectTab = (id: TabId) => {
    setTab(id)
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }
  const paneClass = (id: TabId) => (tab === id ? 'tab-content active' : 'tab-content')

  const pickFile = () => fileInputRef.current?.click()
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setAudioUrl(url)
    e.target.value = '' // 같은 파일 재선택 허용
  }
  useEffect(
    () => () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    },
    [],
  )

  return (
    <div className="outsound">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFile}
        hidden
      />

      {!fullView && (
      <div className="game-container">
        {/* 헤더 */}
        <header className="header">
          <button className="btn-back" onClick={() => navigate('/')}>
            <span className="arrow">‹</span>
            <span>뒤로</span>
          </button>

          <div className="breadcrumb">
            <span className="crumb">요한</span>
            <span className="crumb-sep" />
            <span className="crumb dim">Ch.2</span>
            <span className="crumb-sep" />
            <span className="crumb accent">03</span>
          </div>

          <button className="btn-settings" aria-label="설정">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </header>

        <div className="body-wrap">
          <div className="main-grid">
            {/* 좌측: 결과 요약 */}
            <aside className="col-left">
              <div className="score-block is-mid">
                <div className="score-gauge">
                  <svg viewBox="0 0 120 70" preserveAspectRatio="xMidYMid meet">
                    <path className="ring-bg" d="M 10 60 A 50 50 0 0 1 110 60" />
                    <path className="ring-fg" d="M 10 60 A 50 50 0 0 1 110 60" />
                  </svg>
                  <div className="gauge-text">
                    <div className="score-num">64</div>
                  </div>
                </div>

                <div className="star-rating">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < 3 ? 'star filled' : 'star'}>
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="section-divider">
                <div className="line" />
                <div className="diamond" />
                <div className="line" />
              </div>

              <div className="sub-metrics">
                <div className="metric is-high">
                  <div className="metric-label">음절 정확도</div>
                  <div className="rune-badge">
                    <div className="shape" />
                    <span className="letter">상</span>
                  </div>
                </div>

                <div className="metric is-mid">
                  <div className="metric-label">단어 구사력</div>
                  <div className="rune-badge">
                    <div className="shape" />
                    <span className="letter">중</span>
                  </div>
                </div>

                <div className="metric is-low">
                  <div className="metric-label">문장 전달력</div>
                  <div className="rune-badge">
                    <div className="shape" />
                    <span className="letter">하</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* 중앙: 가변 영역 */}
            <main className="col-center">
              <div className="center-scroll" ref={scrollRef}>
                {/* 탭 1: 개요 */}
                <div className={paneClass('overview')}>
                  <TabHeader label="Overview" />

                  <div className="dialog-card npc">
                    <div className="card-label">김요한의 물음</div>
                    <div className="card-text">
                      "봤어요? 커피 한 잔 할래요? 원두 새로 들어왔는데."
                    </div>
                  </div>

                  <div className="dialog-card user">
                    <div className="card-label">나의 대답</div>
                    <div className="card-text">"네, 사장님이 타주시는 커피는 다 좋아요!"</div>
                  </div>

                  <div className="mid-divider" />

                  <AudioPlayer />
                </div>

                {/* 탭 2: 상세 분석 */}
                <div className={paneClass('detail')}>
                  <TabHeader label="Detail" />

                  <div className="metric-bars">
                    {METRIC_BARS.map((row) => (
                      <div className="bar-row" key={row.label}>
                        <div className="bar-label">{row.label}</div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            data-tier={row.tier}
                            style={{ '--target-width': `${row.value}%` } as CSSProperties}
                          />
                        </div>
                        <div className="bar-value" data-tier={row.tier}>
                          {row.value}%
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="comparison-card">
                    <div className="comp-row">
                      <div className="comp-label correct">정답 대본</div>
                      <div className="comp-text">"네, 사장님이 타주시는 커피는 다 좋아요!"</div>
                    </div>
                    <div className="comp-divider">
                      <div className="line" />
                      <div className="diamond" />
                      <div className="line" />
                    </div>
                    <div className="comp-row">
                      <div className="comp-label mine">나의 발음</div>
                      <div className="comp-text">
                        "네, 사장님이 타주시는 커피는 다 <span className="text-error">조</span>아요!"
                      </div>
                    </div>
                  </div>

                  <AudioPlayer />
                </div>

                {/* 탭 3: 스펙트로그램 */}
                <div className={paneClass('spectrogram')}>
                  <TabHeader label="Spectrogram" />

                  <div className="vis-card">
                    <div className="vis-header">
                      <div className="vis-label correct">표준 발음</div>
                    </div>
                    <VisImage
                      src="/images/graphs/standard_spectrogram.png"
                      fallback="Spectrogram"
                      alt="표준 스펙트로그램"
                    />
                  </div>

                  {tab === 'spectrogram' && (
                    <SpectrogramGraph audioUrl={audioUrl} onPickFile={pickFile} />
                  )}

                  <div className="info-card">
                    <div className="info-title">ⓘ 그래프 설명</div>
                    <div className="info-row">
                      <span className="label">가로축</span>
                      <span className="value">시간</span>
                    </div>
                    <div className="info-row">
                      <span className="label">세로축</span>
                      <span className="value">주파수</span>
                    </div>
                    <div className="info-row">
                      <span className="label">색상</span>
                      <span className="value">에너지 강도</span>
                    </div>
                  </div>
                </div>

                {/* 탭 4: 음정 곡선 */}
                <div className={paneClass('pitch')}>
                  <TabHeader label="Pitch Contour" />

                  <div className="vis-card">
                    <div className="vis-header">
                      <div className="vis-label correct">표준 발음</div>
                    </div>
                    <VisImage
                      src="/images/graphs/standard_pitch.png"
                      fallback="Pitch Contour"
                      alt="표준 음정 곡선"
                    />
                  </div>

                  {tab === 'pitch' && (
                    <PitchGraph audioUrl={audioUrl} onPickFile={pickFile} />
                  )}

                  <div className="info-card">
                    <div className="info-title">ⓘ 상세 데이터</div>
                    <div className="info-row">
                      <span className="label">기본 피치 (F0)</span>
                      <span className="value accent">120 Hz</span>
                    </div>
                    <div className="info-row">
                      <span className="label">평균 피치</span>
                      <span className="value">185 Hz</span>
                    </div>
                    <div className="info-row">
                      <span className="label">피치 범위</span>
                      <span className="value">95 ~ 280 Hz</span>
                    </div>
                  </div>
                </div>

                {/* 탭 5: 파형 비교 */}
                <div className={paneClass('waveform')}>
                  <TabHeader label="Waveform" />

                  <div className="vis-card">
                    <div className="vis-header">
                      <div className="vis-label correct">표준 발음</div>
                    </div>
                    <VisImage
                      src="/images/graphs/standard_waveform.png"
                      fallback="Waveform"
                      alt="표준 파형"
                    />
                  </div>

                  {tab === 'waveform' && (
                    <WaveformGraph audioUrl={audioUrl} onPickFile={pickFile} />
                  )}

                  <div className="info-card">
                    <div className="info-title">ⓘ 그래프 설명</div>
                    <div className="info-row">
                      <span className="label">세로축</span>
                      <span className="value">소리의 크기 (진폭)</span>
                    </div>
                    <div className="info-row">
                      <span className="label">강약 패턴</span>
                      <span className="value">끊어 읽기 · 리듬</span>
                    </div>
                  </div>
                </div>
              </div>
            </main>

            {/* 우측: LNB */}
            <nav className="col-right">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  className={tab === t.id ? 'lnb-tab active' : 'lnb-tab'}
                  onClick={() => selectTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 푸터: 위치 인디케이터 */}
          <footer className="footer-nav">
            <div className="nav-meta">
              <div className="diamond" />
              <span>03 / 07</span>
              <div className="diamond" />
            </div>
          </footer>
        </div>
      </div>
      )}

      {fullView && (
        <div className="full-page">
          <div className="full-page-inner">
            <div className="full-page-head">
              <span className="crumb accent">발음 분석</span>
              <span className="full-page-sub">파형 · 음정 · 스펙트로그램</span>
            </div>

            <Karaoke />

            <WaveformGraph audioUrl={audioUrl} onPickFile={pickFile} label="파형 곡선" />
            <PitchGraph audioUrl={audioUrl} onPickFile={pickFile} label="음정 곡선" />
            <SpectrogramGraph audioUrl={audioUrl} onPickFile={pickFile} label="스펙트로그램" />
          </div>
        </div>
      )}

      <button className="fullview-toggle" onClick={() => setFullView((v) => !v)}>
        <span className="icon">{fullView ? '✕' : '⤢'}</span>
        <span>{fullView ? '닫기' : '전체 페이지로 보기'}</span>
      </button>
    </div>
  )
}
