import { useEffect, useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import { Landmark, UserPlus, ShieldAlert, Users, UserCheck, UserX } from 'lucide-react'

interface AdministrateurDTO { id: number; identifiant: string; typeCompte: string; statut: string }

function initialesDe(identifiant: string) {
  return identifiant.slice(0, 2).toUpperCase()
}

export default function AdministrationPage() {
  const [administrateurs, setAdministrateurs] = useState<AdministrateurDTO[]>([])
  const [chargement, setChargement] = useState(true)
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const charger = () => {
    apiClient.get<AdministrateurDTO[]>('/admins').then(({ data }) => setAdministrateurs(data)).catch(() => {}).finally(() => setChargement(false))
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

  const actifs = administrateurs.filter((a) => a.statut === 'ACTIF').length
  const inactifs = administrateurs.length - actifs

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><Landmark size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Super Administration</h1>
        <p>Reserve au Super Administrateur : gestion des comptes Administrateur (RG-ADM-001 — aucun compte Super Administrateur ne peut etre cree ici).</p>
      </div>

      {!chargement && (
        <div className="civilis-stats-synthese">
          <div className="civilis-stat-synthese-carte" style={{ animationDelay: '0ms' }}>
            <div className="civilis-stat-synthese-icone"><Users size={18} /></div>
            <div>
              <div className="civilis-stat-synthese-valeur">{administrateurs.length}</div>
              <div className="civilis-stat-synthese-libelle">Comptes Administrateur</div>
            </div>
          </div>
          <div className="civilis-stat-synthese-carte" style={{ animationDelay: '40ms' }}>
            <div className="civilis-stat-synthese-icone" style={{ background: 'var(--vert-100)', color: 'var(--vert-600)' }}><UserCheck size={18} /></div>
            <div>
              <div className="civilis-stat-synthese-valeur">{actifs}</div>
              <div className="civilis-stat-synthese-libelle">Actifs</div>
            </div>
          </div>
          <div className="civilis-stat-synthese-carte" style={{ animationDelay: '80ms' }}>
            <div className="civilis-stat-synthese-icone" style={{ background: 'var(--rouge-100)', color: 'var(--rouge-600)' }}><UserX size={18} /></div>
            <div>
              <div className="civilis-stat-synthese-valeur">{inactifs}</div>
              <div className="civilis-stat-synthese-libelle">Suspendus / revoques</div>
            </div>
          </div>
        </div>
      )}

      <div className="civilis-grille-deux">
        <div className="civilis-carte">
          <h2>Comptes Administrateur</h2>
          {chargement ? (
            <div className="civilis-skeleton" style={{ height: 160 }} />
          ) : (
            <table className="civilis-tableau">
              <thead><tr><th>Compte</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {administrateurs.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="civilis-admin-identite">
                        <span className="civilis-avatar-md">{initialesDe(a.identifiant)}</span>
                        {a.identifiant}
                      </div>
                    </td>
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
