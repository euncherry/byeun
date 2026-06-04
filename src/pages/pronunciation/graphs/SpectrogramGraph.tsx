import { useRef } from 'react'
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.esm.js'
import { GraphCard, useWaveSurfer } from './common'
import type { GraphProps } from './common'
import { ROSEUS_COLORMAP } from './roseus'

// 원본 drawSpectrogram(SpectrogramPlugin) 와 동일 설정:
// FFT 512 · Hann · Mel 스케일 · roseus 컬러맵 · gain 25 / range 80.
// 파형 자체는 숨기고(투명·height 0) 스펙트로그램 캔버스만 노출.
export default function SpectrogramGraph({ audioUrl, onPickFile, label }: GraphProps) {
  const specRef = useRef<HTMLDivElement>(null)

  const { containerRef, playing, status, togglePlay } = useWaveSurfer(audioUrl, () => ({
    height: 1,
    sampleRate: 8000, // 원본 디코드 레이트 → Nyquist 4000Hz
    waveColor: 'rgba(0, 0, 0, 0)',
    progressColor: 'rgba(0, 0, 0, 0)',
    cursorColor: 'rgba(0, 0, 0, 0)',
    interact: false,
    plugins: specRef.current
      ? [
          Spectrogram.create({
            container: specRef.current,
            fftSamples: 512,
            height: 100,
            windowFunc: 'hann',
            scale: 'mel',
            colorMap: ROSEUS_COLORMAP,
            gainDB: 25,
            rangeDB: 80,
            frequencyMin: 0,
            frequencyMax: 4000,
            labels: false,
          }),
        ]
      : [],
  }))

  return (
    <GraphCard
      playing={playing}
      status={status}
      onPlayPause={togglePlay}
      onPickFile={onPickFile}
      label={label}
    >
      <div ref={containerRef} className="ws-host hidden-ws" />
      <div ref={specRef} className="spec-host" />
    </GraphCard>
  )
}
