import axios from 'axios'

// RG-AUTH-002 : le token n'est jamais persiste (pas de localStorage/sessionStorage),
// uniquement garde en memoire applicative via le module ci-dessous.
let accessTokenEnMemoire: string | null = null

export function definirAccessToken(token: string | null) {
  accessTokenEnMemoire = token
}

export function obtenirAccessToken() {
  return accessTokenEnMemoire
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
