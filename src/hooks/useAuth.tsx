'use client'

import { createClient } from '@/lib/supabase/client'
import type { Session, User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'

type AuthContextType = {
  session: Session | null
  user: User | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const supabase = createClient()
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)

  const signOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [router, supabase.auth])

  return (
    <AuthContext.Provider value={{ session, user, signOut }}>
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

// ユーザー名（表示名）を取得するカスタムフック
export function useUserDisplayName(userID: string | null) {
  const [displayName, setDisplayName] = useState<string>('ゲスト')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!userID) {
      setDisplayName('ゲスト')
      return
    }

    const fetchDisplayName = async () => {
      setLoading(true)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'
        const response = await fetch(`${apiUrl}/api/user/${userID}/display-name`)
        
        if (response.ok) {
          const data = await response.json()
          setDisplayName(data.displayName || 'ゲスト')
        } else {
          setDisplayName('ゲスト')
        }
      } catch (error) {
        console.error('ユーザー名の取得に失敗しました:', error)
        setDisplayName('ゲスト')
      } finally {
        setLoading(false)
      }
    }

    fetchDisplayName()
  }, [userID])

  return { displayName, loading }
}