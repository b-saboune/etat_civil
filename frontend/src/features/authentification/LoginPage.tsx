import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

export default function LoginPage() {
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const { connecter, chargement, erreur } = useAuth()
  const navigate = useNavigate()

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await connecter(identifiant, motDePasse)
      navigate('/recherche')
    } catch {
      // erreur deja geree et affichee via le contexte d'authentification
    }
  }

  return (
    <div className="civilis-login-shell">
      <div className="civilis-login-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--civilis-bleu)' }}>CIVILIS</div>
          <div style={{ fontSize: 12, color: '#777', marginTop: 4 }}>
            Indexation et localisation des actes d'etat civil — Togo
          </div>
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
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="civilis-btn" style={{ width: '100%' }} disabled={chargement}>
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
