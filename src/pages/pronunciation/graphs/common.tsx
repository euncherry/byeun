import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import WaveSurfer from 'wavesurfer.js'

export type GraphStatus = 'loading' | 'ready' | 'error'

export type GraphProps = {
  audioUrl: string
  onPickFile: () => void
  /** 카드 제목 (기본 "나의 발음"). 전체 보기에서는 그래프 종류로 표시. */
  label?: string
}

// container 를 제외한 WaveSurfer 옵션 (라이브러리 타입에서 파생)
type WaveSurferOptions = Omit<Parameters<typeof WaveSurfer.create>[0], 'container'>

/**
 * WaveSurfer 인스턴스 생명주기를 관리하는 훅.
 * - audioUrl 이 바뀌면 재생성 + 재로드
 * - 언마운트/변경 시 destroy (StrictMode 이중 마운트 안전)
 * - onReady: 디코드 완료 후 추가 처리(피치/스펙트로그램)용
 */
export function useWaveSurfer(
  audioUrl: string,
  makeOptions: (container: HTMLElement) => WaveSurferOptions,
  onReady?: (ws: WaveSurfer) => void,
) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)
  const [playing, setPlaying] = useState(false)
  const [status, setStatus] = useState<GraphStatus>('loading')

  // 최신 콜백을 effect 재실행 없이 참조
  const makeOptionsRef = useRef(makeOptions)
  makeOptionsRef.current = makeOptions
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let disposed = false
    setStatus('loading')
    setPlaying(false)

    const ws = WaveSurfer.create({
      container,
      ...makeOptionsRef.current(container),
    })
    wsRef.current = ws

    ws.on('play', () => setPlaying(true))
    ws.on('pause', () => setPlaying(false))
    ws.on('finish', () => setPlaying(false))
    ws.on('error', () => {
      if (!disposed) setStatus('error')
    })
    ws.on('ready', () => {
      if (disposed) return
      setStatus('ready')
      try {
        onReadyRef.current?.(ws)
      } catch (err) {
        console.error('[graph] onReady failed', err)
      }
    })

    ws.load(audioUrl).catch(() => {
      if (!disposed) setStatus('error')
    })

    return () => {
      disposed = true
      try {
        ws.destroy()
      } catch {
        /* 로드 중 destroy 는 throw 가능 — 무시 */
      }
      wsRef.current = null
    }
  }, [audioUrl])

  const togglePlay = () => {
    try {
      wsRef.current?.playPause()
    } catch (err) {
      console.error('[graph] playPause failed', err)
    }
  }

  return { containerRef, playing, status, togglePlay }
}

/** "나의 발음" 카드 — 헤더(재생/파일 버튼) + 그래프 영역 + 상태 표시 */
export function GraphCard({
  playing,
  status,
  onPlayPause,
  onPickFile,
  children,
  label = '나의 발음',
}: {
  playing: boolean
  status: GraphStatus
  onPlayPause: () => void
  onPickFile: () => void
  children: ReactNode
  label?: string
}) {
  return (
    <div className="vis-card">
      <div className="vis-header">
        <div className="vis-label mine">{label}</div>
        <div className="vis-actions">
          <button
            className="vis-play"
            onClick={onPlayPause}
            disabled={status !== 'ready'}
          >
            <span className="icon">{playing ? '❚❚' : '▶'}</span>
            <span>{playing ? 'Pause' : 'Play'}</span>
          </button>
          <button className="vis-play" onClick={onPickFile} title="내 음성 파일 올리기">
            <span className="icon">⏏</span>
            <span>파일</span>
          </button>
        </div>
      </div>
      <div className="graph-body">
        {children}
        {status === 'loading' && <div className="graph-status">분석 중…</div>}
        {status === 'error' && (
          <div className="graph-status err">
            오디오를 불러올 수 없어요.
            <br />
            [파일]로 음성을 올리거나 public/audio/sample.wav 를 추가하세요.
          </div>
        )}
      </div>
    </div>
  )
}
