/**
 * Точка входа React-приложения мониторинга.
 * Запуск: cd services/web-frontend && npm run dev (порт 3002)
 *
 * index.css содержит все стили, эмулирующие ExtJS Gray Theme.
 * Используется TailwindCSS 4 + кастомный CSS для ExtJS-виджетов.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
