import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

export default function LoginPage() {
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [afficherMotDePasse, setAfficherMotDePasse] = useState(false)
  const { connecter, chargement, erreur } = useAuth()
  const navigate = useNavigate()

  const dateDuJour = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await connecter(identifiant, motDePasse)
      navigate('/')
    } catch {
      // erreur deja geree et affichee via le contexte d'authentification
    }
  }

  return (
    <div className="civilis-login-shell">
      <div className="civilis-login-card">
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div className="civilis-emblem">CV</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--bleu-800)', letterSpacing: 0.3 }}>CIVILIS</div>
          <div style={{ fontSize: 12.5, color: 'var(--gris-500)', marginTop: 5 }}>
            Plateforme de gestion et de localisation<br />des archives d'etat civil
          </div>
          <div className="civilis-login-devise">Republique Togolaise · Collectivites territoriales</div>
        </div>

        {erreur && <div className="civilis-erreur">{erreur}</div>}

        <form onSubmit={onSubmit}>
          <div className="civilis-field">
            <label htmlFor="identifiant">Identifiant</label>
            <input
              id="identifiant"
              type="text"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              placeholder="agent.lome1"
              autoFocus
              required
            />
          </div>
          <div className="civilis-field">
            <label htmlFor="motDePasse">Mot de passe</label>
            <input
              id="motDePasse"
              type={afficherMotDePasse ? 'text' : 'password'}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: 'var(--gris-500)', marginBottom: 18, cursor: 'pointer' }}>
            <input type="checkbox" checked={afficherMotDePasse} onChange={(e) => setAfficherMotDePasse(e.target.checked)} style={{ width: 14, height: 14 }} />
            Afficher le mot de passe
          </label>
          <button type="submit" className="civilis-btn" style={{ width: '100%' }} disabled={chargement}>
            {chargement && <span className="civilis-spinner" />}
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid var(--gris-100)', marginTop: 24, paddingTop: 14, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--gris-500)', fontWeight: 600 }}>Systeme securise · Version 1.x</div>
          <div style={{ fontSize: 10.5, color: 'var(--gris-500)', marginTop: 2, textTransform: 'capitalize' }}>{dateDuJour}</div>
        </div>
      </div>
      <div className="civilis-pied-institutionnel" style={{ position: 'absolute', bottom: 18, left: 0, right: 0, zIndex: 1, color: 'rgba(255,255,255,0.5)' }}>
        Ministere de l'Administration territoriale, de la Decentralisation et des Collectivites locales
      </div>
    </div>
  )
}
