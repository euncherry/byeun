// 각 그래프를 고해상도 PNG로 내보내기.
// 화면 캔버스는 보통 1~2배(DPR)라 저해상도일 수 있어, 내보낼 때만
// 오프스크린에서 큰 사이즈로 다시 렌더링한 뒤 추출한다. (무손실 PNG)
import WaveSurfer from "wavesurfer.js";
import Spectrogram from "wavesurfer.js/dist/plugins/spectrogram.esm.js";
import { ROSEUS_COLORMAP } from "./roseus";
import { detectPitch } from "./pitch";
import { DEFAULT_COLORS, withAlpha } from "./colors";
import type { GraphColors } from "./colors";

export type GraphKind = "waveform" | "pitch" | "spectrogram";

const EXPORT_WIDTH = 1920; // 기준 가로 해상도 (DPR 곱해져 실제론 더 큼)
const EXPORT_HEIGHT = 320;
// 표준 그래프 시간 구조 통일용 무음 패딩 (앞 LEAD + 뒤 TRAIL).
// 게임 앱 녹음 구조(카라오케 0.5s lead + 발화 + 자동종료 trail)와 맞춰 정렬.
const LEAD_SEC = 0.5;
const TRAIL_SEC = 1.0;
// 배경은 투명(PNG 알파)으로 둠. 다크 배경이 필요하면 아래에서 ctx 로 칠하면 됩니다.
// (스펙트로그램은 컬러맵이 전 픽셀을 채우는 불투명 이미지라 투명이 적용되지 않음)

function makeHost(): HTMLDivElement {
  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-100000px;top:0;pointer-events:none;opacity:0;width:" +
    EXPORT_WIDTH +
    "px;";
  document.body.appendChild(host);
  return host;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function onceReady(ws: WaveSurfer): Promise<void> {
  return new Promise((resolve, reject) => {
    ws.on("ready", () => resolve());
    ws.on("error", (e) =>
      reject(e instanceof Error ? e : new Error(String(e))),
    );
  });
}

function frame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

function downloadCanvas(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<void> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      resolve();
    }, "image/png");
  });
}

// 피치 곡선을 고해상도 캔버스에 그림 (drawPitchContour 의 스케일 버전)
function drawPitchHiRes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  frequencies: (number | null)[],
  baseFrequency: number,
  upColor = "#a8cce0",
  downColor = "#d4a574",
) {
  if (!baseFrequency || baseFrequency <= 0) return;
  const n = frequencies.length || 1;
  const sx = width / n;
  // 점 두께(세로) + 길이(가로). 길이를 점 간격(sx)만큼 빼서 점들이 끊기지 않고
  // 이어진 선처럼 보이게 한다. 더 길게 원하면 DOT_LEN_MULT를 키우면 됨.
  const DOT_LEN_MULT = 2; // 점 가로 길이 배수 (간격 대비)
  const dotThickness = Math.max(2, Math.round(width / 600));
  const dotLength = Math.max(dotThickness, Math.ceil(sx * DOT_LEN_MULT));
  let prevY = 0;
  frequencies.forEach((f, i) => {
    if (!f) return;
    const y = Math.round(height - (f / (baseFrequency * 2)) * height);
    ctx.fillStyle = y > prevY ? downColor : upColor;
    ctx.fillRect(Math.round(i * sx), y, dotLength, dotThickness);
    prevY = y;
  });
}

// Float32 모노 샘플 → 16-bit PCM WAV ArrayBuffer
function encodeWavMono(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const dv = new DataView(buf);
  const wr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(off + i, s.charCodeAt(i));
  };
  wr(0, "RIFF");
  dv.setUint32(4, 36 + n * 2, true);
  wr(8, "WAVE");
  wr(12, "fmt ");
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); // PCM
  dv.setUint16(22, 1, true); // mono
  dv.setUint32(24, sampleRate, true);
  dv.setUint32(28, sampleRate * 2, true); // byte rate
  dv.setUint16(32, 2, true); // block align
  dv.setUint16(34, 16, true); // bits per sample
  wr(36, "data");
  dv.setUint32(40, n * 2, true);
  let off = 44;
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    dv.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return buf;
}

// 오디오 URL을 디코드해 앞 leadSec·뒤 trailSec 무음을 붙인 WAV blob URL 반환 (모노 8kHz).
// 표준·녹음 그래프가 같은 시간 구조([lead][발화][trail])를 갖게 해 좌우 비교를 정렬한다.
async function padAudioUrl(
  url: string,
  leadSec: number,
  trailSec: number,
): Promise<string> {
  const arr = await (await fetch(url)).arrayBuffer();
  const ac = new AudioContext({ sampleRate: 8000 });
  let decoded: AudioBuffer;
  try {
    decoded = await ac.decodeAudioData(arr);
  } finally {
    void ac.close();
  }
  const sr = decoded.sampleRate;
  const lead = Math.round(leadSec * sr);
  const trail = Math.round(trailSec * sr);
  const src = decoded.getChannelData(0);
  const mono = new Float32Array(lead + src.length + trail);
  mono.set(src, lead);
  return URL.createObjectURL(
    new Blob([encodeWavMono(mono, sr)], { type: "audio/wav" }),
  );
}

export async function exportGraphPng(
  kind: GraphKind,
  audioUrl: string,
  colors: GraphColors = DEFAULT_COLORS,
): Promise<void> {
  const host = makeHost();
  let ws: WaveSurfer | undefined;
  let paddedUrl: string | undefined;
  try {
    const out = document.createElement("canvas");
    const ctx = out.getContext("2d");
    if (!ctx) return;

    // 앞뒤 무음 패딩된 WAV로 그린다 (3그래프 공통). 표준↔녹음 시간 구조 통일.
    paddedUrl = await padAudioUrl(audioUrl, LEAD_SEC, TRAIL_SEC);

    if (kind === "waveform") {
      ws = WaveSurfer.create({
        container: host,
        height: EXPORT_HEIGHT,
        sampleRate: 8000,
        waveColor: colors.waveformWave,
        progressColor: colors.waveformWave,
        cursorColor: "rgba(0, 0, 0, 0)",
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        interact: false,
        normalize: true,
        url: paddedUrl,
      });
      await onceReady(ws);
      const urls = (await ws.exportImage(
        "image/png",
        1,
        "dataURL",
      )) as string[];
      const img = await loadImage(urls[0]);
      out.width = img.naturalWidth;
      out.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
      await downloadCanvas(out, "waveform.png");
    } else if (kind === "pitch") {
      ws = WaveSurfer.create({
        container: host,
        height: EXPORT_HEIGHT,
        sampleRate: 8000,
        waveColor: withAlpha(colors.pitchBgWave, 0.3),
        progressColor: withAlpha(colors.pitchBgWave, 0.3),
        cursorColor: "rgba(0, 0, 0, 0)",
        interact: false,
        normalize: true,
        url: paddedUrl,
      });
      await onceReady(ws);
      const buffer = ws.getDecodedData();
      const urls = (await ws.exportImage(
        "image/png",
        1,
        "dataURL",
      )) as string[];
      const img = await loadImage(urls[0]);
      out.width = img.naturalWidth;
      out.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0); // 흐린 배경 파형
      if (buffer) {
        const { frequencies, baseFrequency } = detectPitch(buffer);
        drawPitchHiRes(
          ctx,
          out.width,
          out.height,
          frequencies,
          baseFrequency,
          colors.pitchUp,
          colors.pitchDown,
        );
      }
      await downloadCanvas(out, "pitch.png");
    } else {
      // spectrogram
      const specHost = document.createElement("div");
      host.appendChild(specHost);
      const spec = Spectrogram.create({
        container: specHost,
        fftSamples: 512,
        height: EXPORT_HEIGHT,
        windowFunc: "hann",
        scale: "mel",
        colorMap: ROSEUS_COLORMAP,
        gainDB: 25,
        rangeDB: 80,
        frequencyMin: 0,
        frequencyMax: 4000,
        labels: false,
      });
      ws = WaveSurfer.create({
        container: host,
        height: 1,
        sampleRate: 8000,
        waveColor: "rgba(0, 0, 0, 0)",
        progressColor: "rgba(0, 0, 0, 0)",
        cursorColor: "rgba(0, 0, 0, 0)",
        interact: false,
        url: paddedUrl,
        plugins: [spec],
      });
      await onceReady(ws);
      // 스펙트로그램 플러그인 렌더 완료 대기
      await new Promise<void>((resolve) => {
        let done = false;
        const finish = () => {
          if (!done) {
            done = true;
            resolve();
          }
        };
        spec.on("ready", finish);
        setTimeout(finish, 5000);
      });
      await frame();
      const canvases = (
        Array.from(specHost.querySelectorAll("canvas")) as HTMLCanvasElement[]
      ).filter((c) => c.width > 0 && c.height > 0);
      const w = canvases.length
        ? Math.max(...canvases.map((c) => c.width))
        : EXPORT_WIDTH;
      const h = canvases.length
        ? Math.max(...canvases.map((c) => c.height))
        : EXPORT_HEIGHT;
      out.width = w;
      out.height = h;
      for (const c of canvases) ctx.drawImage(c, 0, 0);
      await downloadCanvas(out, "spectrogram.png");
    }
  } finally {
    try {
      ws?.destroy();
    } catch {
      /* ignore */
    }
    if (paddedUrl) URL.revokeObjectURL(paddedUrl);
    host.remove();
  }
}
