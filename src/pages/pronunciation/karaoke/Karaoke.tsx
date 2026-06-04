import { useEffect, useMemo, useRef, useState } from 'react'
import type { SyllableTiming } from './timings'
import { DEFAULT_TIMINGS, parseInput, totalDuration } from './timings'

// 게임과 동일한 색상 (PronunciationGuideScreen.tsx)
const TEXT_COLOR = '#b5a98f' // 미발음
const FILL_COLOR = '#3B82F6' // 발음 도달
const TICK_MS = 33 // 게임 KARAOKE_TICK_MS 와 동일 (~30fps, 백그라운드에서도 동작)

type PlayMode = 'idle' | 'karaoke' | 'audio'

/** 음절별 좌→우 sweep 채우기 (게임 KaraokeText.tsx 이식) */
function KaraokeText({ timings, currentTime }: { timings: SyllableTiming[]; currentTime: number }) {
  return (
    <div className="kara-row">
      {timings.map((item, idx) => {
        let progress: number
        if (currentTime < item.start) progress = 0
        else if (currentTime > item.end) progress = 100
        else {
          const span = item.end - item.start
          progress =
            span <= 0 ? (currentTime >= item.start ? 100 : 0) : ((currentTime - item.start) / span) * 100
        }
        const ch = item.syllable === ' ' ? ' ' : item.syllable
        // 현재 재생 위치(색이 바뀌는 지점)에 있는 음절이면 playhead 선을 그림
        const active = currentTime >= item.start && currentTime < item.end
        return (
          <span className="kara-syl" key={idx}>
            <span className="kara-bg" style={{ color: TEXT_COLOR }}>
              {ch}
            </span>
            <span className="kara-fill" style={{ width: `${progress}%` }} aria-hidden>
              <span className="kara-filltext" style={{ color: FILL_COLOR }}>
                {ch}
              </span>
            </span>
            {active && (
              <span className="kara-cursor" style={{ left: `${progress}%` }} aria-hidden />
            )}
          </span>
        )
      })}
    </div>
  )
}

export default function Karaoke({ audioUrl }: { audioUrl: string }) {
  const [timings, setTimings] = useState<SyllableTiming[]>(DEFAULT_TIMINGS)
  const [currentTime, setCurrentTime] = useState(0)
  const [mode, setMode] = useState<PlayMode>('idle')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  const audioRef = useRef<HTMLAudioElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const startRef = useRef(0)
  const total = useMemo(() => totalDuration(timings), [timings])

  const stop = () => {
    if (timerRef.current !== undefined) clearInterval(timerRef.current)
    timerRef.current = undefined
    audioRef.current?.pause()
    setMode('idle')
  }

  // 실시간 시계로 currentTime 진행 (가라오케 sweep)
  const startTimer = (from: number, m: PlayMode) => {
    startRef.current = performance.now() - from * 1000
    setCurrentTime(from)
    setMode(m)
    timerRef.current = setInterval(() => {
      const elapsed = (performance.now() - startRef.current) / 1000
      if (elapsed >= total) {
        setCurrentTime(total)
        stop()
        return
      }
      setCurrentTime(elapsed)
    }, TICK_MS)
  }

  const play = (m: 'karaoke' | 'audio') => {
    if (!timings.length) return
    stop()
    const from = currentTime >= total ? 0 : currentTime
    if (m === 'audio') {
      const audio = audioRef.current
      if (audio) {
        try {
          audio.currentTime = from
        } catch {
          /* 아직 메타데이터 로드 전일 수 있음 */
        }
        // 버튼 클릭(사용자 제스처)로 호출되므로 재생 허용됨. 실패해도 sweep은 진행.
        void audio.play().catch(() => {})
      }
    }
    startTimer(from, m)
  }

  const reset = () => {
    stop()
    if (audioRef.current) {
      try {
        audioRef.current.currentTime = 0
      } catch {
        /* noop */
      }
    }
    setCurrentTime(0)
  }

  // 타이밍/오디오 바뀌면 정지 + 리셋
  useEffect(() => {
    stop()
    setCurrentTime(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timings, audioUrl])

  // 언마운트 cleanup
  useEffect(
    () => () => {
      if (timerRef.current !== undefined) clearInterval(timerRef.current)
    },
    [],
  )

  const openEditor = () => {
    setDraft(JSON.stringify(timings, null, 2))
    setError('')
    setEditing(true)
  }

  const apply = () => {
    try {
      const parsed = parseInput(draft)
      if (!parsed.length) {
        setError('내용이 비어 있습니다.')
        return
      }
      setTimings(parsed)
      setEditing(false)
      setError('')
    } catch (e) {
      setError('파싱 오류: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const atEnd = total > 0 && currentTime >= total

  return (
    <div className="kara-panel">
      {/* 동시 재생용 오디오 (업로드 파일 / 기본 샘플) — 화면엔 안 보임 */}
      <audio ref={audioRef} src={audioUrl} preload="auto" />

      <div className="kara-head">
        <span className="kara-title">🎤 가라오케</span>
        <button
          className="kara-btn ghost"
          onClick={editing ? () => setEditing(false) : openEditor}
        >
          {editing ? '닫기' : '✎ 문장 / 타이밍'}
        </button>
      </div>

      {editing && (
        <div className="kara-editor">
          <textarea
            className="kara-textarea"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              'JSON 타이밍 배열을 붙여넣으세요.  예) [{"syllable":"관","start":0,"end":0.236}, ...]\n' +
              '문장만 입력하면 0.15초/글자로 자동 생성됩니다.'
            }
            spellCheck={false}
          />
          <div className="kara-editor-actions">
            <button className="kara-btn" onClick={apply}>
              적용
            </button>
            {error && <span className="kara-err">{error}</span>}
          </div>
        </div>
      )}

      <div className="kara-stage">
        <KaraokeText timings={timings} currentTime={currentTime} />
      </div>

      <div className="kara-controls">
        <button
          className="kara-btn"
          onClick={mode === 'karaoke' ? stop : () => play('karaoke')}
        >
          {mode === 'karaoke' ? '⏸ 일시정지' : atEnd ? '↻ 가라오케' : '▶ 가라오케'}
        </button>
        <button
          className="kara-btn"
          onClick={mode === 'audio' ? stop : () => play('audio')}
        >
          {mode === 'audio' ? '⏸ 일시정지' : '🔊 음성 + 가라오케'}
        </button>
        <button className="kara-btn ghost" onClick={reset}>
          ↺ 처음으로
        </button>
        <span className="kara-time">
          {currentTime.toFixed(1)} / {total.toFixed(2)}s
        </span>
      </div>
    </div>
  )
}
