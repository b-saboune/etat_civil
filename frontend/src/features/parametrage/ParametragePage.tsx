import { useEffect, useState } from 'react'
import { apiClient } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { Settings, DatabaseBackup, RotateCcw } from 'lucide-react'

interface Parametre { id: number; cle: string; valeur: string; categorie?: string }
interface Sauvegarde { id: number; dateExecution: string; type: string; statut: string; tailleOctets?: number }

const PHRASE_CONFIRMATION = 'RESTAURER LA BASE DE DONNEES'

function formaterTaille(octets?: number) {
  if (!octets) return '—'
  if (octets < 1024) return `${octets} o`
  if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`
}

export default function ParametragePage() {
  const { utilisateur } = useAuth()
  const [parametres, setParametres] = useState<Parametre[]>([])
  const [sauvegardes, setSauvegardes] = useState<Sauvegarde[]>([])
  const [chargement, setChargement] = useState(true)
  const [enCours, setEnCours] = useState(false)
  const [restaurationEnCours, setRestaurationEnCours] = useState<number | null>(null)
  const [editionCle, setEditionCle] = useState<number | null>(null)
  const [valeurEdition, setValeurEdition] = useState('')
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const estSuperAdmin = utilisateur?.typeCompte === 'SUPER_ADMIN'

  const charger = () => {
    Promise.all([apiClient.get<Parametre[]>('/parametres'), apiClient.get<Sauvegarde[]>('/sauvegardes')])
      .then(([p, s]) => { setParametres(p.data); setSauvegardes(s.data) })
      .finally(() => setChargement(false))
  }

  useEffect(charger, [])

  const executerSauvegarde = async () => {
    setEnCours(true)
    setMessage(null)
    try {
      await apiClient.post('/sauvegardes/executer')
      setMessage({ type: 'succes', texte: 'Sauvegarde lancee (pg_dump). Rafraichissez pour voir le statut final.' })
      charger()
    } catch {
      setMessage({ type: 'erreur', texte: 'Echec du declenchement de la sauvegarde.' })
    } finally {
      setEnCours(false)
    }
  }

  const enregistrerParametre = async (id: number) => {
    try {
      await apiClient.patch(`/parametres/${id}`, { valeur: valeurEdition })
      setEditionCle(null)
      charger()
    } catch {
      setMessage({ type: 'erreur', texte: 'Modification du parametre impossible.' })
    }
  }

  const demanderRestauration = async (sauvegarde: Sauvegarde) => {
    // RG-PAR-001 : confirmation renforcee — l'utilisateur doit saisir la
    // phrase exacte, verifiee a nouveau cote serveur (jamais une simple
    // confirmation cosmetique cote client).
    const saisie = window.prompt(
      `Cette action ecrase irreversiblement la base de donnees actuelle avec la sauvegarde du ${new Date(sauvegarde.dateExecution).toLocaleString('fr-FR')}.\n\nPour confirmer, tapez exactement :\n${PHRASE_CONFIRMATION}`
    )
    if (saisie === null) return
    setRestaurationEnCours(sauvegarde.id)
    setMessage(null)
    try {
      await apiClient.post(`/sauvegardes/${sauvegarde.id}/restaurer`, { confirmation: saisie })
      setMessage({ type: 'succes', texte: 'Restauration executee avec succes.' })
    } catch (err: any) {
      setMessage({ type: 'erreur', texte: err?.response?.data?.message ?? 'Restauration impossible.' })
    } finally {
      setRestaurationEnCours(null)
    }
  }

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><Settings size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Parametrage & sauvegarde</h1>
        <p>Parametres systeme et sauvegardes (RG-PAR-001, RG-PAR-002 — sauvegarde planifiee quotidienne 02h00, restauration reelle via pg_dump/pg_restore).</p>
      </div>

      {message && <div className={`civilis-alerte-${message.type === 'succes' ? 'succes' : 'erreur'}`}>{message.texte}</div>}

      {chargement ? (
        <div className="civilis-skeleton" style={{ height: 300 }} />
      ) : (
        <div className="civilis-grille-tableaux">
          <div className="civilis-carte">
            <h2>Parametres</h2>
            <table className="civilis-tableau">
              <thead><tr><th>Cle</th><th>Valeur</th>{estSuperAdmin && <th>Actions</th>}</tr></thead>
              <tbody>
                {parametres.map((p) => (
                  <tr key={p.id}>
                    <td>{p.cle}</td>
                    <td>
                      {editionCle === p.id ? (
                        <input value={valeurEdition} onChange={(e) => setValeurEdition(e.target.value)} />
                      ) : p.valeur}
                    </td>
                    {estSuperAdmin && (
                      <td className="civilis-actions-cellule">
                        {editionCle === p.id ? (
                          <>
                            <button className="civilis-btn secondaire" onClick={() => enregistrerParametre(p.id)}>Enregistrer</button>
                            <button className="civilis-btn secondaire" onClick={() => setEditionCle(null)}>Annuler</button>
                          </>
                        ) : (
                          <button className="civilis-btn secondaire" onClick={() => { setEditionCle(p.id); setValeurEdition(p.valeur) }}>Modifier</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
                {parametres.length === 0 && <tr><td colSpan={estSuperAdmin ? 3 : 2} className="civilis-vide">Aucun parametre.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="civilis-carte">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Sauvegardes</h2>
              <button className="civilis-btn primaire" onClick={executerSauvegarde} disabled={enCours}>
                <DatabaseBackup size={15} style={{ marginRight: 6 }} />
                {enCours ? 'Execution...' : 'Executer maintenant'}
              </button>
            </div>
            <table className="civilis-tableau">
              <thead><tr><th>Date</th><th>Type</th><th>Taille</th><th>Statut</th>{estSuperAdmin && <th>Actions</th>}</tr></thead>
              <tbody>
                {sauvegardes
                  .slice()
                  .sort((a, b) => (a.dateExecution < b.dateExecution ? 1 : -1))
                  .map((s) => (
                    <tr key={s.id}>
                      <td>{new Date(s.dateExecution).toLocaleString('fr-FR')}</td>
                      <td>{s.type}</td>
                      <td>{formaterTaille(s.tailleOctets)}</td>
                      <td><span className={`civilis-badge ${s.statut === 'REUSSIE' ? 'succes' : 'alerte'}`}>{s.statut}</span></td>
                      {estSuperAdmin && (
                        <td className="civilis-actions-cellule">
                          {s.statut === 'REUSSIE' && (
                            <button
                              className="civilis-btn secondaire civilis-btn-icone"
                              disabled={restaurationEnCours === s.id}
                              onClick={() => demanderRestauration(s)}
                              title="Restaurer cette sauvegarde"
                            >
                              <RotateCcw size={14} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                {sauvegardes.length === 0 && <tr><td colSpan={estSuperAdmin ? 5 : 4} className="civilis-vide">Aucune sauvegarde.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
