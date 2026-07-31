import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { apiClient, definirAccessToken } from '@/api/client'
import type { LoginResponse } from '@/types'

interface AuthState {
  utilisateur: { identifiant: string; typeCompte: string } | null
  chargement: boolean
  erreur: string | null
  connecter: (identifiant: string, motDePasse: string) => Promise<void>
  deconnecter: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utilisateur, setUtilisateur] = useState<AuthState['utilisateur']>(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const connecter = useCallback(async (identifiant: string, motDePasse: string) => {
    setChargement(true)
    setErreur(null)
    try {
      const { data } = await apiClient.post<LoginResponse>('/auth/login', { identifiant, motDePasse })
      definirAccessToken(data.accessToken)
      setUtilisateur({ identifiant: data.identifiant, typeCompte: data.typeCompte })
    } catch (e: any) {
      const message = e?.response?.data?.message ?? 'Connexion impossible. Verifiez vos identifiants.'
      setErreur(message)
      throw e
    } finally {
      setChargement(false)
    }
  }, [])

  const deconnecter = useCallback(() => {
    definirAccessToken(null)
    setUtilisateur(null)
  }, [])

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, erreur, connecter, deconnecter }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit etre utilise a l\'interieur de AuthProvider')
  return ctx
}
