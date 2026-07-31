import type { ReactNode } from 'react'
import { useAuth } from '@/auth/AuthContext'

export default function AppLayout({ children }: { children: ReactNode }) {
  const { utilisateur, deconnecter } = useAuth()
  const initiales = utilisateur ? utilisateur.identifiant.slice(0, 2).toUpperCase() : ''
  return (
    <div className="civilis-app">
      <div className="civilis-topbar">
        <div className="civilis-marque-groupe">
          <div className="civilis-logo">CV</div>
          <div>
            <div className="marque">CIVILIS</div>
            <div className="sous-marque">Etat civil — Republique togolaise</div>
          </div>
        </div>
        {utilisateur && (
          <div className="civilis-utilisateur-chip">
            <div className="civilis-avatar">{initiales}</div>
            <span>{utilisateur.identifiant} · {utilisateur.typeCompte}</span>
            <button className="civilis-btn secondaire" style={{ padding: '6px 14px', fontSize: 12.5 }} onClick={deconnecter}>
              Deconnexion
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  )
}
