'use client'

import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

type AuthContextType = {
  token: string | null
  user: { userId: string; login: string } | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ userId: string; login: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const readCookie = (name: string) => {
    if (typeof document === 'undefined') return null
    const cookie = document.cookie
      .split('; ')
      .find((item) => item.startsWith(`${name}=`))
    return cookie ? decodeURIComponent(cookie.split('=')[1] ?? '') : null
  }

  const clearCookie = (name: string) => {
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`
  }

  // ページ読み込み時にトークンをcookieから復元
  useEffect(() => {
    const storedToken = readCookie('authToken')
    const storedUser = readCookie('authUser')
    
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    
    setIsLoading(false)
  }, [])

  const signOut = async () => {
    clearCookie('authToken')
    clearCookie('authUser')
    setToken(null)
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ token, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}