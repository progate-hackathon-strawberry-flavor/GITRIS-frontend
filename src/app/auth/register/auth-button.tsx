'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'

export default function AuthButton() {
  const { token, signOut } = useAuth()
  const router = useRouter()

  const handleSignIn = async () => {
    try {
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
      // const redirectUri = `${window.location.origin}/auth/callback`
      const redirectUri = `http://localhost:3000/auth/callback`
      
      if (!clientId) {
        throw new Error('GitHub Client ID not configured')
      }

      const authUrl = new URL('https://github.com/login/oauth/authorize')
      authUrl.searchParams.append('client_id', clientId)
      authUrl.searchParams.append('redirect_uri', redirectUri)
      authUrl.searchParams.append('scope', 'user:email')
      authUrl.searchParams.append('state', Math.random().toString(36).substring(7))

      window.location.href = authUrl.toString()
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.refresh()
  }

  return token ? (
    <button onClick={handleSignOut}>ログアウト</button>
  ) : (
    <button onClick={handleSignIn}>GitHubでログイン</button>
  )
}