import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthContext'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { utilisateur } = useAuth()
  if (!utilisateur) return <Navigate to="/connexion" replace />
  return <>{children}</>
}
