import { useEffect, useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { RegistreDTO, TypeActeDTO } from '@/types'
import { useAuth } from '@/auth/AuthContext'
import { FileStack, Plus, Trash2 } from 'lucide-react'

interface LignePersonne { nom: string; prenoms: string; role: string }

export default function IndexationPage() {
  const { utilisateur } = useAuth()
  const [registres, setRegistres] = useState<RegistreDTO[]>([])
  const [typesActe, setTypesActe] = useState<TypeActeDTO[]>([])
  const [registreId, setRegistreId] = useState('')
  const [numeroActe, setNumeroActe] = useState('')
  const [page, setPage] = useState('')
  const [typeActeId, setTypeActeId] = useState('')
  const [dateEvenement, setDateEvenement] = useState('')
  const [personnes, setPersonnes] = useState<LignePersonne[]>([{ nom: '', prenoms: '', role: 'TITULAIRE' }])
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  useEffect(() => {
    apiClient.get<RegistreDTO[]>('/registres').then(({ data }) => setRegistres(data))
    apiClient.get<TypeActeDTO[]>('/referentiels/types-acte').then(({ data }) => setTypesActe(data))
  }, [])

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
        agentId: 1,
        personnesAssociees: personnes.filter((p) => p.nom.trim()),
      })
      setMessage({ type: 'succes', texte: 'Fiche d’indexation creee avec succes (RG-IDX-004, RG-IDX-012).' })
      setNumeroActe(''); setPage(''); setDateEvenement(''); setPersonnes([{ nom: '', prenoms: '', role: 'TITULAIRE' }])
    } catch (err: any) {
      setMessage({ type: 'erreur', texte: err?.response?.data?.message ?? 'Creation impossible (RG-IDX-008 : acte deja indexe pour ce registre).' })
    } finally {
      setEnCours(false)
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
              <input value={numeroActe} onChange={(e) => setNumeroActe(e.target.value)} required />
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
    </div>
  )
}
