import { useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { PersonneDTO } from '@/types'
import { Users, UserPlus, Search as SearchIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PersonnesPage() {
  const [nom, setNom] = useState('')
  const [prenoms, setPrenoms] = useState('')
  const [sexe, setSexe] = useState('')
  const [dateNaissance, setDateNaissance] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  const soumettre = async (e: FormEvent) => {
    e.preventDefault()
    setEnCours(true)
    setMessage(null)
    try {
      const { data } = await apiClient.post<PersonneDTO>('/personnes', {
        nom, prenoms, sexe: sexe || undefined, dateNaissance: dateNaissance || undefined, dateApproximative: false,
      })
      setMessage({ type: 'succes', texte: `Personne creee : ${data.nom} ${data.prenoms} (id ${data.id}).` })
      setNom(''); setPrenoms(''); setSexe(''); setDateNaissance('')
    } catch (err: any) {
      setMessage({ type: 'erreur', texte: err?.response?.data?.message ?? 'Creation impossible (RG-PER-001 : doublon potentiel).' })
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><Users size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Personnes</h1>
        <p>Referentiel des personnes physiques recensees dans les actes (RG-PER-001 detection de doublons, RG-PER-002 fusion).</p>
      </div>

      <div className="civilis-grille-deux">
        <div className="civilis-carte">
          <h2><UserPlus size={17} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Nouvelle personne</h2>
          <form onSubmit={soumettre} className="civilis-formulaire">
            <label>Nom
              <input value={nom} onChange={(e) => setNom(e.target.value)} required />
            </label>
            <label>Prenoms
              <input value={prenoms} onChange={(e) => setPrenoms(e.target.value)} required />
            </label>
            <label>Sexe
              <select value={sexe} onChange={(e) => setSexe(e.target.value)}>
                <option value="">—</option>
                <option value="M">Masculin</option>
                <option value="F">Feminin</option>
              </select>
            </label>
            <label>Date de naissance
              <input type="date" value={dateNaissance} onChange={(e) => setDateNaissance(e.target.value)} />
            </label>
            <button className="civilis-btn primaire" type="submit" disabled={enCours}>
              {enCours ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            {message && <div className={`civilis-alerte-${message.type === 'succes' ? 'succes' : 'erreur'}`}>{message.texte}</div>}
          </form>
        </div>

        <div className="civilis-carte civilis-carte-info">
          <h2><SearchIcon size={17} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Rechercher / fusionner</h2>
          <p>La recherche approchee (pg_trgm) et la fusion de doublons se font depuis le module de recherche, qui affiche la chaine de localisation complete de chaque acte associe.</p>
          <Link to="/recherche" className="civilis-btn secondaire">Ouvrir la recherche</Link>
        </div>
      </div>
    </div>
  )
}
