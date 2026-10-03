import { useState, useEffect, useCallback, useRef } from 'react'

// Generic fetch hook
export function useFetch(fn, deps = [], auto = true) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(auto)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fn()
      setData(res.data)
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => { if (auto) fetchData() }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}

// Pagination hook
export function usePagination(items = [], perPage = 10) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const paginated = items.slice((page - 1) * perPage, page * perPage)

  useEffect(() => { setPage(1) }, [items.length])

  return { page, setPage, paginated, totalPages }
}

// Debounce hook
export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// Toast / notification hook
export function useToast() {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(t => [...t, { id, message, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000)
  }, [])

  const dismiss = useCallback((id) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  return { toasts, toast: { success: m => push(m, 'success'), error: m => push(m, 'error'), info: m => push(m, 'info'), warning: m => push(m, 'warning') }, dismiss }
}

// Click-outside hook
export function useClickOutside(handler) {
  const ref = useRef()
  useEffect(() => {
    const listener = (e) => { if (ref.current && !ref.current.contains(e.target)) handler() }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [handler])
  return ref
}
