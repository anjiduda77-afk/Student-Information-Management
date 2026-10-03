import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const stored = localStorage.getItem('user')
    if (token && stored) {
      try {
        const parsed = JSON.parse(stored)
        setUser(parsed)
        // Background verify token validity
        authService.me().then(res => {
          if (res?.data) {
            const updated = { ...parsed, ...res.data, token }
            localStorage.setItem('user', JSON.stringify(updated))
            setUser(updated)
          }
        }).catch(() => {
          localStorage.removeItem('user')
          localStorage.removeItem('token')
          setUser(null)
        })
      } catch {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        setUser(null)
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (identifier, password) => {
    const res = await authService.login(identifier, password)
    const userData = res.data
    if (userData.role) {
      userData.role = userData.role.toUpperCase()
    }
    localStorage.setItem('token', userData.token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
