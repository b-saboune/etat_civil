import { useEffect, useRef, useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { RegistreVueDTO, TypeActeDTO, FicheIndexationDTO } from '@/types'
import { useAuth } from '@/auth/AuthContext'
import { FileStack, Plus, Trash2, Pencil, X, Save, Layers } from 'lucide-react'

interface LignePersonne { nom: string; prenoms: string; role: string }

export default function IndexationPage() {
  const { utilisateur } = useAuth()
  const [registres, setRegistres] = useState<RegistreVueDTO[]>([])
  const [typesActe, setTypesActe] = useState<TypeActeDTO[]>([])
  const [registreId, setRegistreId] = useState('')
  const [numeroActe, setNumeroActe] = useState('')
  const [page, setPage] = useState('')
  const [typeActeId, setTypeActeId] = useState('')
  const [dateEvenement, setDateEvenement] = useState('')
  const [personnes, setPersonnes] = useState<LignePersonne[]>([{ nom: '', prenoms: '', role: 'TITULAIRE' }])
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  // RG-IDX-011 : mode recensement en serie — le registre (et le type d'acte)
  // choisi reste actif d'une fiche a l'autre, pour enchainer rapidement la
  // saisie d'un registre complet sans re-selectionner a chaque acte.
  const [modeSerie, setModeSerie] = useState(true)
  const [compteurSerie, setCompteurSerie] = useState(0)
  const numeroActeRef = useRef<HTMLInputElement>(null)

  const [fiches, setFiches] = useState<FicheIndexationDTO[]>([])
  const [ficheEnEdition, setFicheEnEdition] = useState<FicheIndexationDTO | null>(null)
  const [edition, setEdition] = useState({ numeroActe: '', page: '', typeActeId: '', dateEvenement: '' })

  useEffect(() => {
    apiClient.get<RegistreVueDTO[]>('/registres').then(({ data }) => setRegistres(data)).catch(() => {})
    apiClient.get<TypeActeDTO[]>('/referentiels/types-acte').then(({ data }) => setTypesActe(data)).catch(() => {})
  }, [])

  const chargerFiches = (idRegistre: string) => {
    if (!idRegistre) { setFiches([]); return }
    apiClient.get<FicheIndexationDTO[]>('/indexation/fiches', { params: { registreId: idRegistre } }).then(({ data }) => setFiches(data)).catch(() => {})
  }

  useEffect(() => { chargerFiches(registreId) }, [registreId])

  const majPersonne = (i: number, champ: keyof LignePersonne, valeur: string) => {
    setPersonnes((prev) => prev.map((p, idx) => (idx === i ? { ...p, [champ]: valeur } : p)))
  }

  const soumettre = async (e: FormEvent) => {
    e.preventDefault()
    setEnCours(true)
    setMessage(null)
    try {
      await apiClient.post('/indexation/fiches', {
        registreId: Number(registreId),
        numeroActe,
        page: Number(page),
        typeActeId: Number(typeActeId),
        dateEvenement,
        personnesAssociees: personnes.filter((p) => p.nom.trim()),
      })
      setMessage({ type: 'succes', texte: 'Fiche d’indexation creee avec succes (RG-IDX-004, RG-IDX-012).' })
      setCompteurSerie((n) => n + 1)
      setNumeroActe(''); setPage(''); setPersonnes([{ nom: '', prenoms: '', role: 'TITULAIRE' }])
      if (!modeSerie) {
        setRegistreId(''); setTypeActeId(''); setDateEvenement('')
      }
      chargerFiches(registreId)
      // Recensement en serie : le focus revient immediatement sur le numero
      // d'acte pour enchainer la saisie suivante sans repasser par la souris.
      numeroActeRef.current?.focus()
    } catch (err: any) {
      setMessage({ type: 'erreur', texte: err?.response?.data?.message ?? 'Creation impossible (RG-IDX-008 : acte deja indexe pour ce registre).' })
    } finally {
      setEnCours(false)
    }
  }

  const ouvrirEdition = (fiche: FicheIndexationDTO) => {
    setFicheEnEdition(fiche)
    setEdition({
      numeroActe: fiche.numeroActe,
      page: String(fiche.page),
      typeActeId: String(fiche.typeActe.id),
      dateEvenement: fiche.dateEvenement,
    })
  }

  const enregistrerEdition = async () => {
    if (!ficheEnEdition) return
    try {
      await apiClient.patch(`/indexation/fiches/${ficheEnEdition.id}`, {
        numeroActe: edition.numeroActe,
        page: Number(edition.page),
        typeActeId: Number(edition.typeActeId),
        dateEvenement: edition.dateEvenement,
      })
      setFicheEnEdition(null)
      chargerFiches(registreId)
    } catch (err: any) {
      setMessage({ type: 'erreur', texte: err?.response?.data?.message ?? 'Modification impossible.' })
    }
  }

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><FileStack size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Indexation</h1>
        <p>Creation d'une fiche d'indexation : rattachement au registre, au type d'acte et aux personnes concernees.</p>
        <p style={{ fontSize: 12.5, color: 'var(--gris-500)' }}>Agent connecte : {utilisateur?.identifiant ?? '—'}</p>
      </div>

      <div className="civilis-carte">
        <div className="civilis-bascule-serie">
          <label className="civilis-interrupteur">
            <input type="checkbox" checked={modeSerie} onChange={(e) => setModeSerie(e.target.checked)} />
            <span className="civilis-interrupteur-glissiere" />
          </label>
          <span><Layers size={14} style={{ verticalAlign: 'text-bottom', marginRight: 4 }} />Mode recensement en serie (RG-IDX-011) — conserve le registre et le type d'acte entre deux fiches</span>
          {compteurSerie > 0 && <span className="civilis-badge succes">{compteurSerie} fiche(s) saisie(s) cette session</span>}
        </div>

        <form onSubmit={soumettre} className="civilis-formulaire">
          <div className="civilis-formulaire-grille">
            <label>Registre
              <select value={registreId} onChange={(e) => setRegistreId(e.target.value)} required>
                <option value="">Selectionner...</option>
                {registres.map((r) => <option key={r.id} value={r.id}>{r.numeroRegistre} ({r.annee})</option>)}
              </select>
            </label>
            <label>Type d'acte
              <select value={typeActeId} onChange={(e) => setTypeActeId(e.target.value)} required>
                <option value="">Selectionner...</option>
                {typesActe.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
              </select>
            </label>
            <label>Numero d'acte
              <input ref={numeroActeRef} value={numeroActe} onChange={(e) => setNumeroActe(e.target.value)} required />
            </label>
            <label>Page
              <input type="number" min={1} value={page} onChange={(e) => setPage(e.target.value)} required />
            </label>
            <label>Date de l'evenement
              <input type="date" value={dateEvenement} onChange={(e) => setDateEvenement(e.target.value)} required />
            </label>
          </div>

          <h3 style={{ marginTop: 18, marginBottom: 8, fontSize: 14, color: 'var(--gris-700)' }}>Personnes associees</h3>
          {personnes.map((p, i) => (
            <div key={i} className="civilis-ligne-personne">
              <input placeholder="Nom" value={p.nom} onChange={(e) => majPersonne(i, 'nom', e.target.value)} />
              <input placeholder="Prenoms" value={p.prenoms} onChange={(e) => majPersonne(i, 'prenoms', e.target.value)} />
              <select value={p.role} onChange={(e) => majPersonne(i, 'role', e.target.value)}>
                <option value="TITULAIRE">Titulaire</option>
                <option value="PERE">Pere</option>
                <option value="MERE">Mere</option>
                <option value="TEMOIN">Temoin</option>
                <option value="EPOUX">Epoux</option>
                <option value="EPOUSE">Epouse</option>
              </select>
              {personnes.length > 1 && (
                <button type="button" className="civilis-btn-icone" onClick={() => setPersonnes((prev) => prev.filter((_, idx) => idx !== i))}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
          <button type="button" className="civilis-btn secondaire" style={{ width: 'fit-content' }} onClick={() => setPersonnes((prev) => [...prev, { nom: '', prenoms: '', role: 'TITULAIRE' }])}>
            <Plus size={14} style={{ marginRight: 6 }} />Ajouter une personne
          </button>

          <button className="civilis-btn primaire" type="submit" disabled={enCours} style={{ marginTop: 14 }}>
            {enCours ? 'Enregistrement...' : 'Creer la fiche d’indexation'}
          </button>
          {message && <div className={`civilis-alerte-${message.type === 'succes' ? 'succes' : 'erreur'}`}>{message.texte}</div>}
        </form>
      </div>

      {registreId && (
        <div className="civilis-carte" style={{ marginTop: 18 }}>
          <h2>Fiches deja indexees dans ce registre</h2>
          <table className="civilis-tableau">
            <thead><tr><th>N° acte</th><th>Page</th><th>Type</th><th>Date evenement</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {fiches.map((f) => (
                <tr key={f.id}>
                  {ficheEnEdition?.id === f.id ? (
                    <>
                      <td><input value={edition.numeroActe} onChange={(e) => setEdition((s) => ({ ...s, numeroActe: e.target.value }))} /></td>
                      <td><input type="number" min={1} value={edition.page} onChange={(e) => setEdition((s) => ({ ...s, page: e.target.value }))} /></td>
                      <td>
                        <select value={edition.typeActeId} onChange={(e) => setEdition((s) => ({ ...s, typeActeId: e.target.value }))}>
                          {typesActe.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
                        </select>
                      </td>
                      <td><input type="date" value={edition.dateEvenement} onChange={(e) => setEdition((s) => ({ ...s, dateEvenement: e.target.value }))} /></td>
                      <td><span className="civilis-badge neutre">{f.statut}</span></td>
                      <td className="civilis-actions-cellule">
                        <button className="civilis-btn secondaire civilis-btn-icone" onClick={enregistrerEdition} title="Enregistrer"><Save size={14} /></button>
                        <button className="civilis-btn secondaire civilis-btn-icone" onClick={() => setFicheEnEdition(null)} title="Annuler"><X size={14} /></button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{f.numeroActe}</td>
                      <td>{f.page}</td>
                      <td>{f.typeActe?.libelle}</td>
                      <td>{f.dateEvenement}</td>
                      <td><span className={`civilis-badge ${f.statut === 'VALIDE' ? 'succes' : 'alerte'}`}>{f.statut}</span></td>
                      <td className="civilis-actions-cellule">
                        <button className="civilis-btn secondaire civilis-btn-icone" onClick={() => ouvrirEdition(f)} title="Modifier"><Pencil size={14} /></button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {fiches.length === 0 && <tr><td colSpan={6} className="civilis-vide">Aucune fiche indexee pour ce registre.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
