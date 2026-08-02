import { useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { LienParenteDTO, PersonneDTO } from '@/types'
import { Users, UserPlus, Search as SearchIcon, Link2 } from 'lucide-react'
import { Link } from 'react-router-dom'

const TYPES_LIEN = ['PERE', 'MERE', 'ENFANT', 'CONJOINT']

export default function PersonnesPage() {
  const [nom, setNom] = useState('')
  const [prenoms, setPrenoms] = useState('')
  const [sexe, setSexe] = useState('')
  const [dateNaissance, setDateNaissance] = useState('')
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

  // Affiliation / filiation (section 11.7 du prompt maitre) : recherche d'une
  // personne pour consulter et completer ses liens de parente (PERE, MERE,
  // ENFANT, CONJOINT), deduits automatiquement a l'indexation ou ajoutes ici
  // manuellement. Fonctionnalite prevue des l'origine mais jusque-la absente
  // de tout ecran (retour utilisateur).
  const [rechercheAffiliation, setRechercheAffiliation] = useState('')
  const [candidats, setCandidats] = useState<PersonneDTO[]>([])
  const [personneSelectionnee, setPersonneSelectionnee] = useState<PersonneDTO | null>(null)
  const [liens, setLiens] = useState<LienParenteDTO[]>([])
  const [chargementLiens, setChargementLiens] = useState(false)
  const [nomApparente, setNomApparente] = useState('')
  const [candidatsApparente, setCandidatsApparente] = useState<PersonneDTO[]>([])
  const [apparenteSelectionne, setApparenteSelectionne] = useState<PersonneDTO | null>(null)
  const [typeLienForm, setTypeLienForm] = useState('PERE')
  const [enCoursLien, setEnCoursLien] = useState(false)
  const [messageLien, setMessageLien] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

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

  const chargerLiens = async (personne: PersonneDTO) => {
    setPersonneSelectionnee(personne)
    setChargementLiens(true)
    try {
      const { data } = await apiClient.get<LienParenteDTO[]>(`/personnes/${personne.id}/liens`)
      setLiens(data)
    } catch {
      setLiens([])
    } finally {
      setChargementLiens(false)
    }
  }

  const rechercherCandidats = async (valeur: string, cible: 'principal' | 'apparente') => {
    if (valeur.trim().length < 2) {
      if (cible === 'principal') setCandidats([]); else setCandidatsApparente([])
      return
    }
    try {
      const { data } = await apiClient.get<PersonneDTO[]>('/personnes/recherche', { params: { nom: valeur, prenoms: valeur } })
      if (cible === 'principal') setCandidats(data); else setCandidatsApparente(data)
    } catch {
      if (cible === 'principal') setCandidats([]); else setCandidatsApparente([])
    }
  }

  const ajouterLien = async (e: FormEvent) => {
    e.preventDefault()
    if (!personneSelectionnee || !apparenteSelectionne) return
    setEnCoursLien(true)
    setMessageLien(null)
    try {
      await apiClient.post('/personnes/liens', {
        personneId: personneSelectionnee.id,
        personneApparenteeId: apparenteSelectionne.id,
        typeLien: typeLienForm,
      })
      setMessageLien({ type: 'succes', texte: 'Lien de parente enregistre.' })
      setNomApparente(''); setCandidatsApparente([]); setApparenteSelectionne(null)
      chargerLiens(personneSelectionnee)
    } catch (err: any) {
      setMessageLien({ type: 'erreur', texte: err?.response?.data?.message ?? "Impossible d'enregistrer ce lien." })
    } finally {
      setEnCoursLien(false)
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

      <div className="civilis-carte">
        <h2><Link2 size={17} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Affiliations (filiation)</h2>
        <p style={{ fontSize: 13, color: 'var(--gris-500)', marginTop: -8, marginBottom: 16 }}>
          Liens de parente (pere, mere, enfant, conjoint) d'une personne — deduits automatiquement lors de l'indexation
          d'un acte de naissance (titulaire + pere/mere), ou ajoutes manuellement ci-dessous.
        </p>

        <label style={{ display: 'block', marginBottom: 14 }}>
          Rechercher une personne
          <input
            value={rechercheAffiliation}
            onChange={(e) => { setRechercheAffiliation(e.target.value); rechercherCandidats(e.target.value, 'principal') }}
            placeholder="Nom ou prenoms..."
          />
        </label>

        {candidats.length > 0 && !personneSelectionnee && (
          <div className="civilis-liste-candidats">
            {candidats.map((c) => (
              <button key={c.id} type="button" className="civilis-btn secondaire" style={{ marginRight: 8, marginBottom: 8 }}
                onClick={() => { chargerLiens(c); setRechercheAffiliation(`${c.nom} ${c.prenoms}`); setCandidats([]) }}>
                {c.nom} {c.prenoms}
              </button>
            ))}
          </div>
        )}

        {personneSelectionnee && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 10 }}>
              {personneSelectionnee.nom} {personneSelectionnee.prenoms}
              <button type="button" className="civilis-btn secondaire" style={{ marginLeft: 12, fontSize: 12, padding: '4px 10px' }}
                onClick={() => { setPersonneSelectionnee(null); setLiens([]); setRechercheAffiliation('') }}>
                Changer de personne
              </button>
            </div>

            {chargementLiens ? (
              <div className="civilis-skeleton" style={{ height: 60 }} />
            ) : liens.length === 0 ? (
              <div className="civilis-vide" style={{ padding: 20 }}>
                <span className="civilis-vide-detail">Aucun lien de parente enregistre pour cette personne.</span>
              </div>
            ) : (
              <div className="civilis-personnes" style={{ marginBottom: 18 }}>
                {liens.map((l) => (
                  <span key={l.id} className="personne">
                    {l.nomApparente} {l.prenomsApparente}
                    <span className="role">{l.typeLien}{l.modeCreation === 'DEDUIT' ? ' · deduit' : ''}</span>
                  </span>
                ))}
              </div>
            )}

            <form onSubmit={ajouterLien} className="civilis-formulaire-grille" style={{ alignItems: 'flex-end' }}>
              <label>Personne apparentee
                <input
                  value={nomApparente}
                  onChange={(e) => { setNomApparente(e.target.value); setApparenteSelectionne(null); rechercherCandidats(e.target.value, 'apparente') }}
                  placeholder="Nom ou prenoms..."
                />
                {candidatsApparente.length > 0 && !apparenteSelectionne && (
                  <div className="civilis-liste-candidats" style={{ marginTop: 6 }}>
                    {candidatsApparente.map((c) => (
                      <button key={c.id} type="button" className="civilis-btn secondaire" style={{ marginRight: 6, marginBottom: 6, fontSize: 12, padding: '4px 10px' }}
                        onClick={() => { setApparenteSelectionne(c); setNomApparente(`${c.nom} ${c.prenoms}`); setCandidatsApparente([]) }}>
                        {c.nom} {c.prenoms}
                      </button>
                    ))}
                  </div>
                )}
              </label>
              <label>Type de lien
                <select value={typeLienForm} onChange={(e) => setTypeLienForm(e.target.value)}>
                  {TYPES_LIEN.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <button className="civilis-btn primaire" type="submit" disabled={enCoursLien || !apparenteSelectionne}>
                {enCoursLien ? 'Enregistrement...' : 'Ajouter le lien'}
              </button>
            </form>
            {messageLien && <div className={`civilis-alerte-${messageLien.type === 'succes' ? 'succes' : 'erreur'}`} style={{ marginTop: 12 }}>{messageLien.texte}</div>}
          </div>
        )}
      </div>
    </div>
  )
}
