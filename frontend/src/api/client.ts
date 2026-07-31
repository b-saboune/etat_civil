import axios from 'axios'

// RG-AUTH-002 : le token n'est jamais persiste (pas de localStorage/sessionStorage),
// uniquement garde en memoire applicative via le module ci-dessous.
let accessTokenEnMemoire: string | null = null
let refreshTokenEnMemoire: string | null = null
let onExpirationSession: (() => void) | null = null

export function definirTokens(accessToken: string | null, refreshToken: string | null) {
  accessTokenEnMemoire = accessToken
  refreshTokenEnMemoire = refreshToken
}

export function definirAccessToken(token: string | null) {
  accessTokenEnMemoire = token
}

export function obtenirAccessToken() {
  return accessTokenEnMemoire
}

/** Decode la charge utile d'un JWT (base64url) sans verifier la signature -
 *  usage strictement cosmetique cote client (masquer/afficher des ecrans),
 *  jamais une source de verite pour l'autorisation reelle (verifiee cote API). */
export function decoderChargeUtile(token: string): Record<string, unknown> {
  try {
    const partie = token.split('.')[1]
    const normalisee = partie.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(normalisee))
  } catch {
    return {}
  }
}

export function definirCallbackExpirationSession(callback: (() => void) | null) {
  onExpirationSession = callback
}

export const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  if (accessTokenEnMemoire) {
    config.headers.Authorization = `Bearer ${accessTokenEnMemoire}`
  }
  return config
})

let rafraichissementEnCours: Promise<string | null> | null = null

async function rafraichirAccessToken(): Promise<string | null> {
  if (!refreshTokenEnMemoire) return null
  if (!rafraichissementEnCours) {
    rafraichissementEnCours = axios
      .post('/api/auth/refresh', { refreshToken: refreshTokenEnMemoire })
      .then(({ data }) => {
        accessTokenEnMemoire = data.accessToken
        refreshTokenEnMemoire = data.refreshToken
        return data.accessToken as string
      })
      .catch(() => null)
      .finally(() => {
        rafraichissementEnCours = null
      })
  }
  return rafraichissementEnCours
}

apiClient.interceptors.response.use(
  (reponse) => reponse,
  async (erreur) => {
    const requeteOriginale = erreur.config
    if (erreur?.response?.status === 401 && !requeteOriginale?._dejaRetentee && refreshTokenEnMemoire) {
      requeteOriginale._dejaRetentee = true
      const nouveauToken = await rafraichirAccessToken()
      if (nouveauToken) {
        requeteOriginale.headers.Authorization = `Bearer ${nouveauToken}`
        return apiClient(requeteOriginale)
      }
      definirTokens(null, null)
      onExpirationSession?.()
    }
    return Promise.reject(erreur)
  }
)
