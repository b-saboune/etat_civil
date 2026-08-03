import { useEffect, useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { ResultatRechercheDTO, TypeActeDTO } from '@/types'
import { Search, SlidersHorizontal, Lightbulb, Copy, CheckCircle2, CircleDot } from 'lucide-react'

export default function RecherchePage() {
  const [nom, setNom] = useState('')
  const [prenoms, setPrenoms] = useState('')
  const [typeActe, setTypeActe] = useState('')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  // Recherche par affiliation (section 11.9 du prompt maitre) : ne retenir
  // le nom/prenoms saisis que lorsqu'ils correspondent a ce role precis sur
  // l'acte (ex. chercher AMEGAN uniquement en tant que PERE).
  const [roleAffiliation, setRoleAffiliation] = useState('')
  const [afficherFiltres, setAfficherFiltres] = useState(false)
  const [typesActe, setTypesActe] = useState<TypeActeDTO[]>([])
  const [resultats, setResultats] = useState<ResultatRechercheDTO[] | null>(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [aRecherche, setARecherche] = useState(false)
  const [copieId, setCopieId] = useState<number | null>(null)

  useEffect(() => {
    apiClient.get<TypeActeDTO[]>('/referentiels/types-acte').then(({ data }) => setTypesActe(data)).catch(() => {})
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setChargement(true)
    setErreur(null)
    setARecherche(true)
    try {
      const { data } = await apiClient.get<ResultatRechercheDTO[]>('/recherche', {
        params: {
          nom, prenoms,
          typeActe: typeActe || undefined,
          dateDebut: dateDebut || undefined,
          dateFin: dateFin || undefined,
          roleAffiliation: roleAffiliation || undefined,
        },
      })
      setResultats(data)
    } catch (e: any) {
      setErreur(e?.response?.data?.message ?? 'La recherche a echoue. Reessayez.')
      setResultats(null)
    } finally {
      setChargement(false)
    }
  }

  const copierLocalisation = (r: ResultatRechercheDTO) => {
    const texte = `${r.localisation.commune} > ${r.localisation.centre} > ${r.localisation.salleArchive} > ${r.localisation.rayonnage} > Registre ${r.localisation.numeroRegistre} (${r.localisation.annee}) > Page ${r.localisation.page}`
    navigator.clipboard?.writeText(texte).then(() => {
      setCopieId(r.ficheIndexationId)
      setTimeout(() => setCopieId((v) => (v === r.ficheIndexationId ? null : v)), 1800)
    })
  }

  const nombreExacts = resultats?.filter((r) => !r.correspondanceApprochee).length ?? 0
  const nombreApproches = resultats?.filter((r) => r.correspondanceApprochee).length ?? 0

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><Search size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Rechercher un acte</h1>
        <p>La localisation physique complete (commune, centre, salle, rayonnage, registre, page) est toujours affichee avec chaque resultat.</p>
      </div>

      <div className="civilis-carte civilis-recherche-hero">
        <form onSubmit={onSubmit} className="civilis-formulaire">
          <div className="civilis-recherche-hero-champs">
            <div className="civilis-recherche-hero-champ">
              <Search size={17} />
              <input aria-label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom (ex. AMEGAN)" />
            </div>
            <div className="civilis-recherche-hero-champ">
              <Search size={17} />
              <input aria-label="Prenoms" value={prenoms} onChange={(e) => setPrenoms(e.target.value)} placeholder="Prenoms (ex. Kossi Edem)" />
            </div>
            <button type="submit" className="civilis-btn primaire civilis-recherche-hero-bouton" disabled={chargement}>
              {chargement && <span className="civilis-spinner" />}
              {chargement ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>

          <button
            type="button"
            className="civilis-btn secondaire"
            style={{ width: 'fit-content', fontSize: 12.5, padding: '8px 14px' }}
            onClick={() => setAfficherFiltres((v) => !v)}
          >
            <SlidersHorizontal size={13} style={{ marginRight: 6 }} />
            {afficherFiltres ? 'Masquer les filtres avances' : 'Filtres avances'}
          </button>

          {afficherFiltres && (
            <div className="civilis-formulaire-grille civilis-entree-douce">
              <label>Type d'acte
                <select value={typeActe} onChange={(e) => setTypeActe(e.target.value)}>
                  <option value="">Tous</option>
                  {typesActe.map((t) => <option key={t.id} value={t.libelle}>{t.libelle}</option>)}
                </select>
              </label>
              <label>Date de debut
                <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} />
              </label>
              <label>Date de fin
                <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} />
              </label>
              <label>Affiliation (role sur l'acte)
                <select value={roleAffiliation} onChange={(e) => setRoleAffiliation(e.target.value)}>
                  <option value="">Tous les roles</option>
                  <option value="TITULAIRE">Titulaire (personne concernee par l'acte)</option>
                  <option value="PERE">Pere</option>
                  <option value="MERE">Mere</option>
                  <option value="TEMOIN">Temoin</option>
                </select>
              </label>
            </div>
          )}
        </form>
      </div>

      {erreur && <div className="civilis-alerte-erreur">{erreur}</div>}

      {!aRecherche && !chargement && (
        <div className="civilis-carte civilis-conseils-carte">
          <div className="civilis-conseils-icone"><Lightbulb size={18} /></div>
          <div>
            <div className="civilis-conseils-titre">Conseils pour une recherche efficace</div>
            <ul className="civilis-conseils-liste">
              <li>Le nom seul suffit souvent : la recherche tolere les variantes orthographiques et les accents (RG-REC-007, RG-PER-003).</li>
              <li>Sans resultat exact, des correspondances approchees sont proposees automatiquement — jamais presentees comme certaines (RG-REC-006).</li>
              <li>Utilisez le filtre "Affiliation" pour ne retrouver une personne que dans un role precis (ex. uniquement comme pere sur l'acte).</li>
            </ul>
          </div>
        </div>
      )}

      {chargement && (
        <div className="civilis-carte">
          {[0, 1].map((i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <div className="civilis-skeleton" style={{ width: '40%', marginBottom: 8 }} />
              <div className="civilis-skeleton" style={{ width: '70%' }} />
            </div>
          ))}
        </div>
      )}

      {!chargement && aRecherche && resultats && resultats.length === 0 && (
        <div className="civilis-carte civilis-vide">
          <div className="icone">⌕</div>
          Aucun acte ne correspond a cette recherche, meme approximativement.
        </div>
      )}

      {!chargement && resultats && resultats.length > 0 && (
        <div className="civilis-carte">
          <div className="civilis-resultats-resume">
            <h2 style={{ margin: 0 }}>{resultats.length} resultat(s)</h2>
            <div className="civilis-resultats-puces">
              {nombreExacts > 0 && <span className="civilis-resultats-puce exacte"><CircleDot size={11} />{nombreExacts} exacte(s)</span>}
              {nombreApproches > 0 && <span className="civilis-resultats-puce approchee"><CircleDot size={11} />{nombreApproches} approchee(s)</span>}
            </div>
          </div>
          {resultats.map((r, index) => (
            <div
              key={r.ficheIndexationId}
              className={`civilis-resultat ${r.correspondanceApprochee ? 'approchee' : ''}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{r.typeActe}</strong> — Acte n° {r.numeroActe}
                  <span style={{ color: 'var(--gris-500)', marginLeft: 10, fontSize: 13 }}>
                    {new Date(r.dateEvenement).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <span className={`civilis-badge ${r.correspondanceApprochee ? 'approchee' : 'exacte'}`}>
                  {r.correspondanceApprochee ? 'Correspondance approchee' : 'Correspondance exacte'}
                </span>
              </div>

              <div className="civilis-personnes">
                {r.personnesAssociees.map((p) => (
                  <span key={p.personneId} className="personne">
                    {p.nom} {p.prenoms}<span className="role">{p.role}</span>
                  </span>
                ))}
              </div>

              <div className="civilis-chaine-loc">
                <span className="maillon">{r.localisation.commune}</span>
                <span className="fleche">→</span>
                <span className="maillon">{r.localisation.centre}</span>
                <span className="fleche">→</span>
                <span className="maillon">{r.localisation.salleArchive}</span>
                <span className="fleche">→</span>
                <span className="maillon">{r.localisation.rayonnage}</span>
                <span className="fleche">→</span>
                <span className="maillon">Registre {r.localisation.numeroRegistre} ({r.localisation.annee})</span>
                <span className="fleche">→</span>
                <span className="maillon">Page {r.localisation.page}</span>
                <button
                  type="button"
                  className="civilis-btn secondaire civilis-btn-icone civilis-copier-loc"
                  title="Copier la localisation"
                  onClick={() => copierLocalisation(r)}
                >
                  {copieId === r.ficheIndexationId ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
