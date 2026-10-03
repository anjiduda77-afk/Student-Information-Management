import { useEffect, useCallback } from 'react'

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  const sizeMap = { sm: 480, md: 560, lg: 700, xl: 880, full: '95vw' }

  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose?.()
  }, [onClose])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKey])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" style={{ maxWidth: sizeMap[size] || sizeMap.md }}>
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 22, lineHeight: 1, padding: 4, borderRadius: 8 }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}

export function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false, loading = false }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || 'Confirm Action'} size="sm">
      <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
        <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
        <button
          className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Processing…' : confirmText}
        </button>
      </div>
    </Modal>
  )
}
