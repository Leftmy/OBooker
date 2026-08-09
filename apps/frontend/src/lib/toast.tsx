import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ToastKind = 'success' | 'error'
interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastApi {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, kind, message }])
      setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )

  const value = useMemo<ToastApi>(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-slate-900/5 backdrop-blur transition ${
              t.kind === 'success'
                ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900'
                : 'border-rose-200 bg-rose-50/95 text-rose-900'
            }`}
            style={{ animation: 'obk-toast-in 220ms ease-out' }}
          >
            <span
              aria-hidden
              className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white ${
                t.kind === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            >
              {t.kind === 'success' ? (
                <svg viewBox="0 0 20 20" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M4 10l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 20 20" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                </svg>
              )}
            </span>
            <p className="text-sm/5 font-medium">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-auto -mr-1 text-current/50 transition hover:text-current"
              aria-label="Dismiss"
            >
              <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <style>{`@keyframes obk-toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
