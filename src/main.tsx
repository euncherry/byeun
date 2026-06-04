import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      {/* Vercel 방문자 분석 + 실사용자 성능(Core Web Vitals). 배포 환경에서만 데이터 전송 */}
      <Analytics />
      <SpeedInsights />
    </BrowserRouter>
  </StrictMode>,
)
