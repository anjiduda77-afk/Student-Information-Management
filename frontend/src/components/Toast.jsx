import { useToast } from '../hooks'

let _toast = null

export function ToastProvider({ children }) {
  const { toasts, toast, dismiss } = useToast()
  _toast = toast

  const icon = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }

  return (
    <>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            onClick={() => dismiss(t.id)}
            style={{ cursor: 'pointer' }}
          >
            <span style={{ fontWeight: 700, fontSize: 16 }}>{icon[t.type]}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </>
  )
}

export const toast = {
  success: (msg) => _toast?.success(msg),
  error:   (msg) => _toast?.error(msg),
  info:    (msg) => _toast?.info(msg),
  warning: (msg) => _toast?.warning(msg),
}
