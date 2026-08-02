import { useEffect, useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { ResultatRechercheDTO, TypeActeDTO } from '@/types'
import { Search, SlidersHorizontal } from 'lucide-react'

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

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><Search size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Rechercher un acte</h1>
        <p>La localisation physique complete (commune, centre, salle, rayonnage, registre, page) est toujours affichee avec chaque resultat.</p>
      </div>

      <div className="civilis-carte">
        <form onSubmit={onSubmit} className="civilis-formulaire">
          <div className="civilis-formulaire-grille">
            <label>Nom
              <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="AMEGAN" />
            </label>
            <label>Prenoms
              <input value={prenoms} onChange={(e) => setPrenoms(e.target.value)} placeholder="Kossi Edem" />
            </label>
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

          <button type="submit" className="civilis-btn primaire" style={{ width: 'fit-content' }} disabled={chargement}>
            {chargement && <span className="civilis-spinner" />}
            {chargement ? 'Recherche...' : 'Rechercher'}
          </button>
        </form>
      </div>

      {erreur && <div className="civilis-alerte-erreur">{erreur}</div>}

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
          <h2 style={{ marginBottom: 16 }}>{resultats.length} resultat(s)</h2>
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
