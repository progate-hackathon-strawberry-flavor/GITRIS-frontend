'use client';


export default function LoginButton() {
  const handleGitHubLogin = async () => {
    try {
      // GitHub OAuth フロー開始
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      const redirectUri = `${window.location.origin}/auth/callback`;
      
      if (!clientId) {
        throw new Error('GitHub Client ID not configured');
      }

      const authUrl = new URL('https://github.com/login/oauth/authorize');
      authUrl.searchParams.append('client_id', clientId);
      authUrl.searchParams.append('redirect_uri', redirectUri);
      authUrl.searchParams.append('scope', 'user:email');
      authUrl.searchParams.append('state', Math.random().toString(36).substring(7));

      window.location.href = authUrl.toString();
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div>
      <button onClick={handleGitHubLogin}>GitHubでログイン</button>
    </div>
    );
  }
  