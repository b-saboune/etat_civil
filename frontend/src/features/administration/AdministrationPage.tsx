import { useEffect, useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import { Landmark, UserPlus, ShieldAlert } from 'lucide-react'

interface AdministrateurDTO { id: number; identifiant: string; typeCompte: string; statut: string }

export default function AdministrationPage() {
  const [administrateurs, setAdministrateurs] = useState<AdministrateurDTO[]>([])
  const [chargement, setChargement] = useState(true)
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const charger = () => {
    apiClient.get<AdministrateurDTO[]>('/admins').then(({ data }) => setAdministrateurs(data)).finally(() => setChargement(false))
  }

  useEffect(charger, [])

  const creer = async (e: FormEvent) => {
    e.preventDefault()
    setEnCours(true)
    setMessage(null)
    try {
      await apiClient.post('/admins', { identifiant, motDePasseInitial: motDePasse })
      setMessage({ type: 'succes', texte: 'Compte Administrateur cree.' })
      setIdentifiant(''); setMotDePasse('')
      charger()
    } catch (err: any) {
      setMessage({ type: 'erreur', texte: err?.response?.data?.message ?? 'Creation impossible.' })
    } finally {
      setEnCours(false)
    }
  }

  const suspendre = async (id: number) => {
    if (!window.confirm('Confirmer la suspension de ce compte Administrateur ?')) return
    await apiClient.patch(`/admins/${id}/suspendre`)
    charger()
  }

  const revoquer = async (id: number) => {
    if (!window.confirm('Confirmer la revocation definitive de ce compte Administrateur ?')) return
    await apiClient.patch(`/admins/${id}/revoquer`)
    charger()
  }

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><Landmark size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Super Administration</h1>
        <p>Reserve au Super Administrateur : gestion des comptes Administrateur (RG-ADM-001 — aucun compte Super Administrateur ne peut etre cree ici).</p>
      </div>

      <div className="civilis-grille-deux">
        <div className="civilis-carte">
          <h2>Comptes Administrateur</h2>
          {chargement ? (
            <div className="civilis-skeleton" style={{ height: 160 }} />
          ) : (
            <table className="civilis-tableau">
              <thead><tr><th>Identifiant</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {administrateurs.map((a) => (
                  <tr key={a.id}>
                    <td>{a.identifiant}</td>
                    <td><span className={`civilis-badge ${a.statut === 'ACTIF' ? 'succes' : 'alerte'}`}>{a.statut}</span></td>
                    <td className="civilis-actions-cellule">
                      <button className="civilis-btn secondaire" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={() => suspendre(a.id)}>Suspendre</button>
                      <button className="civilis-btn secondaire" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={() => revoquer(a.id)}>Revoquer</button>
                    </td>
                  </tr>
                ))}
                {administrateurs.length === 0 && <tr><td colSpan={3} className="civilis-vide">Aucun administrateur.</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        <div className="civilis-carte">
          <h2><UserPlus size={17} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Nouveau compte Administrateur</h2>
          <form onSubmit={creer} className="civilis-formulaire">
            <label>Identifiant
              <input value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} required />
            </label>
            <label>Mot de passe initial
              <input type="password" minLength={8} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
            </label>
            <button className="civilis-btn primaire" type="submit" disabled={enCours}>
              {enCours ? 'Creation...' : 'Creer le compte'}
            </button>
            {message && <div className={`civilis-alerte-${message.type === 'succes' ? 'succes' : 'erreur'}`}>{message.texte}</div>}
          </form>
          <div className="civilis-avertissement">
            <ShieldAlert size={15} />
            <span>Ce module ne permet jamais la creation d'un Super Administrateur (RG-ADM-001).</span>
          </div>
        </div>
      </div>
    </div>
  )
}
