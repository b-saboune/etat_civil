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
            Indexation et localisation des actes d'etat civil
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
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="civilis-btn" style={{ width: '100%' }} disabled={chargement}>
            {chargement && <span className="civilis-spinner" />}
            {chargement ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
      <div className="civilis-pied-institutionnel" style={{ position: 'absolute', bottom: 18, left: 0, right: 0, zIndex: 1, color: 'rgba(255,255,255,0.5)' }}>
        Ministere de l'Administration territoriale, de la Decentralisation et des Collectivites locales
      </div>
    </div>
  )
}
