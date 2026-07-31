import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { apiClient, definirTokens, decoderChargeUtile, definirCallbackExpirationSession } from '@/api/client'
import type { LoginResponse } from '@/types'

interface Utilisateur {
  identifiant: string
  typeCompte: 'SUPER_ADMIN' | 'ADMINISTRATEUR' | 'AGENT'
  permissions: string[]
}

interface AuthState {
  utilisateur: Utilisateur | null
  chargement: boolean
  erreur: string | null
  connecter: (identifiant: string, motDePasse: string) => Promise<void>
  deconnecter: () => void
  aPermission: (code: string) => boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const deconnecter = useCallback(() => {
    definirTokens(null, null)
    setUtilisateur(null)
  }, [])

  useEffect(() => {
    definirCallbackExpirationSession(deconnecter)
    return () => definirCallbackExpirationSession(null)
  }, [deconnecter])

  const connecter = useCallback(async (identifiant: string, motDePasse: string) => {
    setChargement(true)
    setErreur(null)
    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', { identifiant, motDePasse })
      definirTokens(data.accessToken, data.refreshToken)
      const charge = decoderChargeUtile(data.accessToken)
      const permissions = Array.isArray(charge.perms) ? (charge.perms as string[]) : []
      setUtilisateur({ identifiant: data.identifiant, typeCompte: data.typeCompte as Utilisateur['typeCompte'], permissions })
    } catch (e: any) {
      const message = e?.response?.data?.message ?? 'Connexion impossible. Verifiez vos identifiants.'
      setErreur(message)
      throw e
    } finally {
      setChargement(false)
    }
  }, [])

  const aPermission = useCallback(
    (code: string) => {
      if (!utilisateur) return false
      if (utilisateur.typeCompte === 'SUPER_ADMIN') return true
      return utilisateur.permissions.includes(code)
    },
    [utilisateur]
  )

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, erreur, connecter, deconnecter, aPermission }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit etre utilise a l\'interieur de AuthProvider')
  return ctx
}
