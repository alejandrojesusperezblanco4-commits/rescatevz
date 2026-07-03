'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

// ─── tipos ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  success: (msg: string) => void
  error: (msg: string) => void
  warning: (msg: string) => void
  info: (msg: string) => void
}

// ─── context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}

// ─── estilos por tipo ─────────────────────────────────────────────────────────

const STYLES: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.35)',  text: '#86EFAC', icon: 'check_circle' },
  error:   { bg: 'rgba(220,38,38,0.12)',  border: 'rgba(220,38,38,0.35)',  text: '#FCA5A5', icon: 'error' },
  warning: { bg: 'rgba(212,160,23,0.12)', border: 'rgba(212,160,23,0.35)', text: '#FCD34D', icon: 'warning' },
  info:    { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', text: '#93C5FD', icon: 'info' },
}

// ─── provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev.slice(-3), { id, type, message }])
    timerRef.current[id] = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      delete timerRef.current[id]
    }, 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    clearTimeout(timerRef.current[id])
    delete timerRef.current[id]
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const value: ToastContextValue = {
    success: (msg) => addToast('success', msg),
    error:   (msg) => addToast('error',   msg),
    warning: (msg) => addToast('warning', msg),
    info:    (msg) => addToast('info',    msg),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* container */}
      <div
        aria-live="polite"
        className="fixed z-[9999] flex flex-col gap-2 pointer-events-none"
        style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom))', right: '1rem', maxWidth: '360px', width: 'calc(100vw - 2rem)' }}
      >
        {toasts.map(t => {
          const s = STYLES[t.type]
          return (
            <div
              key={t.id}
              className="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg pointer-events-auto"
              style={{
                background: '#162040',
                border: `1px solid ${s.border}`,
                animation: 'toast-slide-in 0.25s ease-out',
              }}
            >
              <span
                className="material-symbols-outlined shrink-0 mt-0.5"
                style={{ fontSize: '18px', color: s.text, fontVariationSettings: "'FILL' 1" }}
              >
                {s.icon}
              </span>
              <p className="flex-1 text-sm leading-snug" style={{ color: '#F0F4FF' }}>
                {t.message}
              </p>
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 transition-opacity hover:opacity-60"
                style={{ color: '#475569', fontSize: '16px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateX(1.5rem); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
