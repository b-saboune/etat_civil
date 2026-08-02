import axios from 'axios'
import { afficherToast } from '@/lib/toast'

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

// Correctif systemique (voir lib/toast.ts) : de nombreux appels a travers
// l'application n'avaient aucun `.catch()` local, rendant toute erreur
// serveur totalement invisible pour l'agent (ecran silencieusement vide au
// lieu d'un message clair). Centraliser l'affichage ici garantit qu'aucun
// echec ne passe plus inapercu, sans devoir modifier chaque page une a une.
function chemin(config: any): string {
  return typeof config?.url === 'string' ? config.url : ''
}

function estRouteAuthentification(config: any): boolean {
  const url = chemin(config)
  return url.includes('/auth/login') || url.includes('/auth/refresh')
}

// Les notifications sont interrogees en arriere-plan (cloche) : un echec ne
// doit pas interrompre l'agent avec un toast a chaque chargement de page.
function estRouteSilencieuse(config: any): boolean {
  return chemin(config).includes('/notifications')
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

    if (!estRouteAuthentification(requeteOriginale) && !estRouteSilencieuse(requeteOriginale)) {
      const message = erreur?.response?.data?.message
      const statut = erreur?.response?.status
      if (statut && statut !== 401) {
        afficherToast(
          typeof message === 'string' && message.length > 0
            ? message
            : "Une erreur est survenue lors de la communication avec le serveur.",
          'erreur'
        )
      } else if (!erreur?.response) {
        afficherToast('Impossible de joindre le serveur. Verifiez votre connexion.', 'erreur')
      }
    }

    return Promise.reject(erreur)
  }
)
