/**
 * API リクエスト用ユーティリティ関数
 * JWT トークンを Authorization ヘッダーに自動的に付与します
 */

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean>
}

/**
 * JWT トークンを取得
 */
function getAuthToken(): string | null {
  if (typeof document === 'undefined') {
    return null
  }
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith('authToken='))
  return cookie ? decodeURIComponent(cookie.split('=')[1] ?? '') : null
}

/**
 * API エンドポイントにリクエストを送信
 * @param endpoint - APIエンドポイント（例: /api/contributions/123）
 * @param options - フェッチオプション
 * @returns Response オブジェクト
 */
export async function apiRequest(
  endpoint: string,
  options: FetchOptions = {}
): Promise<Response> {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'
  const url = new URL(endpoint, backendUrl)

  // クエリパラメータを追加
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value))
    })
  }

  // ヘッダーを初期化
  const headers = new Headers(options.headers || {})

  // Authorization ヘッダーを追加
  const token = getAuthToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  // Content-Type が未設定で body がある場合は JSON を指定
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json')
  }

  // リクエストを送信（credentials を常に include して Cookie を送信）
  return fetch(url.toString(), {
    ...options,
    credentials: 'include',
    headers,
  })
}

/**
 * JSON レスポンスをパースするヘルパー
 */
export async function parseJSON<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    )
  }
  return response.json()
}
