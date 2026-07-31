import type { ReactNode } from 'react'
import { useAuth } from '@/auth/AuthContext'

export default function AppLayout({ children }: { children: ReactNode }) {
  const { utilisateur, deconnecter } = useAuth()
  return (
    <div className="civilis-app">
      <div className="civilis-topbar">
        <div>
          <div className="marque">CIVILIS</div>
          <div className="sous-marque">Etat civil — Republique togolaise</div>
        </div>
        {utilisateur && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13 }}>
            <span>{utilisateur.identifiant} ({utilisateur.typeCompte})</span>
            <button className="civilis-btn" onClick={deconnecter}>Deconnexion</button>
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
