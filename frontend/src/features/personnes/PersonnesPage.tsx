import { useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { LienParenteDTO, PersonneDTO } from '@/types'
import { Users, UserPlus, Search as SearchIcon, Link2, GitMerge, ArrowRight, Heart, Baby, ArrowUpCircle } from 'lucide-react'

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

  // RG-PER-002 / section 11.7 : ecran FusionDoublons — vue cote-a-cote avant
  // confirmation. La source est desactivee (jamais supprimee) apres report
  // de toutes ses associations personne<->acte vers la cible.
  const [rechercheSource, setRechercheSource] = useState('')
  const [candidatsSource, setCandidatsSource] = useState<PersonneDTO[]>([])
  const [source, setSource] = useState<PersonneDTO | null>(null)
  const [rechercheCible, setRechercheCible] = useState('')
  const [candidatsCible, setCandidatsCible] = useState<PersonneDTO[]>([])
  const [cible, setCible] = useState<PersonneDTO | null>(null)
  const [confirmationFusion, setConfirmationFusion] = useState(false)
  const [enCoursFusion, setEnCoursFusion] = useState(false)
  const [messageFusion, setMessageFusion] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

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

  const rechercherCandidats = async (valeur: string, pour: 'principal' | 'apparente' | 'source' | 'cible') => {
    const viderListe = () => {
      if (pour === 'principal') setCandidats([])
      else if (pour === 'apparente') setCandidatsApparente([])
      else if (pour === 'source') setCandidatsSource([])
      else setCandidatsCible([])
    }
    if (valeur.trim().length < 2) {
      viderListe()
      return
    }
    try {
      const { data } = await apiClient.get<PersonneDTO[]>('/personnes/recherche', { params: { nom: valeur, prenoms: valeur } })
      if (pour === 'principal') setCandidats(data)
      else if (pour === 'apparente') setCandidatsApparente(data)
      else if (pour === 'source') setCandidatsSource(data)
      else setCandidatsCible(data)
    } catch {
      viderListe()
    }
  }

  const fusionner = async (e: FormEvent) => {
    e.preventDefault()
    if (!source || !cible || !confirmationFusion) return
    setEnCoursFusion(true)
    setMessageFusion(null)
    try {
      await apiClient.post('/personnes/fusionner', { personneSourceId: source.id, personneCibleId: cible.id })
      setMessageFusion({ type: 'succes', texte: `Fusion effectuee : les actes de ${source.nom} ${source.prenoms} sont desormais rattaches a ${cible.nom} ${cible.prenoms}. La fiche source est desactivee (non supprimee).` })
      setSource(null); setCible(null); setRechercheSource(''); setRechercheCible(''); setConfirmationFusion(false)
    } catch (err: any) {
      setMessageFusion({ type: 'erreur', texte: err?.response?.data?.message ?? 'Fusion impossible.' })
    } finally {
      setEnCoursFusion(false)
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
          <h2><SearchIcon size={17} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Recherche approchee</h2>
          <p>La recherche de personnes tolere les variantes orthographiques et diacritiques togolaises (pg_trgm, RG-PER-003) et precede toujours toute creation (RG-PER-001).</p>
          <p style={{ marginTop: 8 }}>La chaine de localisation complete de chaque acte associe est toujours affichee depuis le module <strong>Recherche</strong>.</p>
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
              <div className="civilis-liens-groupes">
                {['PERE', 'MERE', 'CONJOINT', 'ENFANT'].filter((t) => liens.some((l) => l.typeLien === t)).map((type) => (
                  <div key={type} className="civilis-liens-groupe">
                    <div className="civilis-liens-groupe-titre">
                      {type === 'CONJOINT' ? <Heart size={13} /> : type === 'ENFANT' ? <Baby size={13} /> : <ArrowUpCircle size={13} />}
                      {type === 'PERE' ? 'Pere' : type === 'MERE' ? 'Mere' : type === 'CONJOINT' ? 'Conjoint(e)' : 'Enfant(s)'}
                    </div>
                    <div className="civilis-personnes">
                      {liens.filter((l) => l.typeLien === type).map((l) => (
                        <span key={l.id} className="personne">
                          {l.nomApparente} {l.prenomsApparente}
                          {l.modeCreation === 'DEDUIT' && <span className="role">deduit</span>}
                        </span>
                      ))}
                    </div>
                  </div>
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

      <div className="civilis-carte">
        <h2><GitMerge size={17} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Fusion de doublons</h2>
        <p style={{ fontSize: 13, color: 'var(--gris-500)', marginTop: -8, marginBottom: 16 }}>
          Vue cote-a-cote avant confirmation (RG-PER-002 : section 11.7). La fiche source est desactivee, jamais
          supprimee — toutes ses associations aux actes sont reportees vers la fiche cible.
        </p>

        <div className="civilis-formulaire-grille" style={{ alignItems: 'start' }}>
          <div>
            <label>Personne source (sera desactivee)
              <input
                value={rechercheSource}
                onChange={(e) => { setRechercheSource(e.target.value); setSource(null); rechercherCandidats(e.target.value, 'source') }}
                placeholder="Nom ou prenoms..."
              />
            </label>
            {candidatsSource.length > 0 && !source && (
              <div className="civilis-liste-candidats" style={{ marginTop: 6 }}>
                {candidatsSource.map((c) => (
                  <button key={c.id} type="button" className="civilis-btn secondaire" style={{ marginRight: 6, marginBottom: 6, fontSize: 12, padding: '4px 10px' }}
                    onClick={() => { setSource(c); setRechercheSource(`${c.nom} ${c.prenoms}`); setCandidatsSource([]) }}>
                    {c.nom} {c.prenoms}
                  </button>
                ))}
              </div>
            )}
            {source && (
              <div className="civilis-carte-info civilis-fusion-apercu" style={{ marginTop: 10, padding: 12, fontSize: 13 }}>
                <span className="civilis-avatar-md">{source.nom.slice(0, 2).toUpperCase()}</span>
                <div>
                  <strong>{source.nom} {source.prenoms}</strong><br />
                  {source.sexe ?? '—'} · {source.dateNaissance ?? 'date inconnue'}{source.dateApproximative ? ' (approximative)' : ''}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 30 }}>
            <ArrowRight size={20} style={{ color: 'var(--gris-400)' }} />
          </div>

          <div>
            <label>Personne cible (conservee)
              <input
                value={rechercheCible}
                onChange={(e) => { setRechercheCible(e.target.value); setCible(null); rechercherCandidats(e.target.value, 'cible') }}
                placeholder="Nom ou prenoms..."
              />
            </label>
            {candidatsCible.length > 0 && !cible && (
              <div className="civilis-liste-candidats" style={{ marginTop: 6 }}>
                {candidatsCible.map((c) => (
                  <button key={c.id} type="button" className="civilis-btn secondaire" style={{ marginRight: 6, marginBottom: 6, fontSize: 12, padding: '4px 10px' }}
                    onClick={() => { setCible(c); setRechercheCible(`${c.nom} ${c.prenoms}`); setCandidatsCible([]) }}>
                    {c.nom} {c.prenoms}
                  </button>
                ))}
              </div>
            )}
            {cible && (
              <div className="civilis-carte-info civilis-fusion-apercu" style={{ marginTop: 10, padding: 12, fontSize: 13 }}>
                <span className="civilis-avatar-md">{cible.nom.slice(0, 2).toUpperCase()}</span>
                <div>
                  <strong>{cible.nom} {cible.prenoms}</strong><br />
                  {cible.sexe ?? '—'} · {cible.dateNaissance ?? 'date inconnue'}{cible.dateApproximative ? ' (approximative)' : ''}
                </div>
              </div>
            )}
          </div>
        </div>

        {source && cible && (
          <form onSubmit={fusionner} style={{ marginTop: 18, borderTop: '1px solid var(--gris-100)', paddingTop: 14 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <input type="checkbox" checked={confirmationFusion} onChange={(e) => setConfirmationFusion(e.target.checked)} />
              Je confirme la fusion de <strong>&nbsp;{source.nom} {source.prenoms}&nbsp;</strong> vers <strong>&nbsp;{cible.nom} {cible.prenoms}&nbsp;</strong> — action irreversible sur le rattachement des actes.
            </label>
            <button className="civilis-btn primaire" type="submit" disabled={!confirmationFusion || enCoursFusion || source.id === cible.id}>
              {enCoursFusion ? 'Fusion en cours...' : 'Confirmer la fusion'}
            </button>
            {source.id === cible.id && <p style={{ color: 'var(--rouge-600, #b42318)', fontSize: 13, marginTop: 8 }}>La source et la cible doivent etre distinctes.</p>}
          </form>
        )}
        {messageFusion && <div className={`civilis-alerte-${messageFusion.type === 'succes' ? 'succes' : 'erreur'}`} style={{ marginTop: 12 }}>{messageFusion.texte}</div>}
      </div>
    </div>
  )
}
