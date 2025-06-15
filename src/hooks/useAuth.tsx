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