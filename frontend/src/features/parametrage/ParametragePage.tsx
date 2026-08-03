import { useEffect, useState } from 'react'
import { apiClient } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { Settings, DatabaseBackup, RotateCcw, ShieldCheck, ShieldAlert, Clock, HardDrive, AlertTriangle } from 'lucide-react'
import Modal from '@/components/ui/Modal'

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
  // Modale de restauration (RG-PAR-001) : remplace l'ancien window.prompt() natif,
  // non stylable et incoherent avec l'identite visuelle de l'application. La
  // verification de la phrase exacte reste faite cote serveur (le controle cote
  // client ci-dessous ne fait que desactiver le bouton tant que la saisie ne
  // correspond pas, par confort — ce n'est jamais la seule barriere de securite).
  const [sauvegardeAConfirmer, setSauvegardeAConfirmer] = useState<Sauvegarde | null>(null)
  const [saisieConfirmation, setSaisieConfirmation] = useState('')

  const estSuperAdmin = utilisateur?.typeCompte === 'SUPER_ADMIN'

  const charger = () => {
    Promise.all([apiClient.get<Parametre[]>('/parametres'), apiClient.get<Sauvegarde[]>('/sauvegardes')])
      .then(([p, s]) => { setParametres(p.data); setSauvegardes(s.data) })
      .catch(() => {})
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

  const demanderRestauration = (sauvegarde: Sauvegarde) => {
    setSaisieConfirmation('')
    setSauvegardeAConfirmer(sauvegarde)
  }

  const confirmerRestauration = async () => {
    if (!sauvegardeAConfirmer) return
    const sauvegarde = sauvegardeAConfirmer
    setRestaurationEnCours(sauvegarde.id)
    setMessage(null)
    try {
      // RG-PAR-001 : la phrase saisie est envoyee telle quelle — la verification
      // faisant foi reste cote serveur, jamais une simple confirmation cosmetique
      // cote client (le bouton n'est qu'une aide, desactive tant que la saisie ne
      // correspond pas exactement, cf. disabled ci-dessous).
      await apiClient.post(`/sauvegardes/${sauvegarde.id}/restaurer`, { confirmation: saisieConfirmation })
      setMessage({ type: 'succes', texte: 'Restauration executee avec succes.' })
      setSauvegardeAConfirmer(null)
    } catch (err: any) {
      setMessage({ type: 'erreur', texte: err?.response?.data?.message ?? 'Restauration impossible.' })
    } finally {
      setRestaurationEnCours(null)
    }
  }

  const sauvegardesTriees = [...sauvegardes].sort((a, b) => (a.dateExecution < b.dateExecution ? 1 : -1))
  const derniereSauvegarde = sauvegardesTriees[0]
  const derniereReussie = sauvegardesTriees.find((s) => s.statut === 'REUSSIE')
  const nombreEchecs = sauvegardes.filter((s) => s.statut !== 'REUSSIE').length
  const systemeSain = !derniereSauvegarde || derniereSauvegarde.statut === 'REUSSIE'

  const groupesParametres = parametres.reduce<Record<string, Parametre[]>>((acc, p) => {
    const cle = p.categorie ?? 'General'
    acc[cle] = acc[cle] ?? []
    acc[cle].push(p)
    return acc
  }, {})

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><Settings size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Parametrage & sauvegarde</h1>
        <p>Parametres systeme et sauvegardes (RG-PAR-001, RG-PAR-002 — sauvegarde planifiee quotidienne 02h00, restauration reelle via pg_dump/pg_restore).</p>
      </div>

      {message && <div className={`civilis-alerte-${message.type === 'succes' ? 'succes' : 'erreur'}`}>{message.texte}</div>}

      {!chargement && (
        <div className={`civilis-carte civilis-etat-systeme ${systemeSain ? 'sain' : 'alerte'}`}>
          <div className="civilis-etat-systeme-icone">
            {systemeSain ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
          </div>
          <div className="civilis-etat-systeme-grille">
            <div>
              <div className="civilis-etat-systeme-libelle"><Clock size={12} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />Derniere sauvegarde reussie</div>
              <div className="civilis-etat-systeme-valeur">
                {derniereReussie ? new Date(derniereReussie.dateExecution).toLocaleString('fr-FR') : 'Aucune'}
              </div>
            </div>
            <div>
              <div className="civilis-etat-systeme-libelle"><HardDrive size={12} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />Taille</div>
              <div className="civilis-etat-systeme-valeur">{formaterTaille(derniereReussie?.tailleOctets)}</div>
            </div>
            <div>
              <div className="civilis-etat-systeme-libelle">Sauvegardes au total</div>
              <div className="civilis-etat-systeme-valeur">{sauvegardes.length}</div>
            </div>
            <div>
              <div className="civilis-etat-systeme-libelle">Echecs</div>
              <div className="civilis-etat-systeme-valeur">
                {nombreEchecs > 0 ? (
                  <span style={{ color: 'var(--rouge-600, #b42318)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <AlertTriangle size={13} />{nombreEchecs}
                  </span>
                ) : '0'}
              </div>
            </div>
          </div>
        </div>
      )}

      {chargement ? (
        <div className="civilis-skeleton" style={{ height: 300 }} />
      ) : (
        <div className="civilis-grille-tableaux">
          <div className="civilis-carte">
            <h2>Parametres</h2>
            {Object.entries(groupesParametres).map(([categorie, items]) => (
              <div key={categorie} className="civilis-parametres-groupe">
                <div className="civilis-parametres-groupe-titre">{categorie}</div>
                <table className="civilis-tableau">
                  <thead><tr><th>Cle</th><th>Valeur</th>{estSuperAdmin && <th>Actions</th>}</tr></thead>
                  <tbody>
                    {items.map((p) => (
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
                  </tbody>
                </table>
              </div>
            ))}
            {parametres.length === 0 && <div className="civilis-vide">Aucun parametre.</div>}
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
                {sauvegardesTriees.map((s) => (
                    <tr key={s.id}>
                      <td>{new Date(s.dateExecution).toLocaleString('fr-FR')}</td>
                      <td>{s.type}</td>
                      <td>{formaterTaille(s.tailleOctets)}</td>
                      <td><span className={`civilis-badge ${s.statut === 'REUSSIE' ? 'succes' : 'alerte'}`}>{s.statut}</span></td>
                      {estSuperAdmin && (
                        <td className="civilis-actions-cellule">
                          {s.statut === 'REUSSIE' && (
                            <button
                              className="civilis-btn civilis-btn-danger civilis-btn-icone"
                              disabled={restaurationEnCours === s.id}
                              onClick={() => demanderRestauration(s)}
                              title="Restaurer cette sauvegarde (action irreversible)"
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

      <Modal
        ouvert={sauvegardeAConfirmer !== null}
        onFermer={() => setSauvegardeAConfirmer(null)}
        titre="Restaurer une sauvegarde"
        bloquant={restaurationEnCours !== null}
        pied={
          <>
            <button className="civilis-btn secondaire" onClick={() => setSauvegardeAConfirmer(null)} disabled={restaurationEnCours !== null}>
              Annuler
            </button>
            <button
              className="civilis-btn civilis-btn-danger"
              onClick={confirmerRestauration}
              disabled={saisieConfirmation !== PHRASE_CONFIRMATION || restaurationEnCours !== null}
            >
              {restaurationEnCours !== null ? 'Restauration...' : 'Restaurer definitivement'}
            </button>
          </>
        }
      >
        {sauvegardeAConfirmer && (
          <>
            <div className="civilis-avertissement" style={{ marginBottom: 16 }}>
              <AlertTriangle size={16} />
              <span>
                Cette action ecrase irreversiblement la base de donnees actuelle avec la sauvegarde du{' '}
                <strong>{new Date(sauvegardeAConfirmer.dateExecution).toLocaleString('fr-FR')}</strong>. Elle ne peut pas etre annulee.
              </span>
            </div>
            <label className="civilis-field" style={{ marginBottom: 0 }}>
              Pour confirmer, tapez exactement : <strong>{PHRASE_CONFIRMATION}</strong>
              <input
                autoFocus
                value={saisieConfirmation}
                onChange={(e) => setSaisieConfirmation(e.target.value)}
                placeholder={PHRASE_CONFIRMATION}
                disabled={restaurationEnCours !== null}
              />
            </label>
          </>
        )}
      </Modal>
    </div>
  )
}
