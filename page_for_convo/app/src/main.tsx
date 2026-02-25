import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import AIInterview from './pages/AIInterview'
import MultiPersona from './pages/MultiPersona'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/interview" element={<AIInterview />} />
        <Route path="/panel" element={<MultiPersona />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>,
)
