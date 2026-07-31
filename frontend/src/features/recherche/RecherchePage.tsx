import { useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { ResultatRechercheDTO } from '@/types'

export default function RecherchePage() {
  const [nom, setNom] = useState('')
  const [prenoms, setPrenoms] = useState('')
  const [resultats, setResultats] = useState<ResultatRechercheDTO[] | null>(null)
  const [chargement, setChargement] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  const [aRecherche, setARecherche] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setChargement(true)
    setErreur(null)
    setARecherche(true)
    try {
      const { data } = await apiClient.get<ResultatRechercheDTO[]>('/recherche', { params: { nom, prenoms } })
      setResultats(data)
    } catch (e: any) {
      setErreur(e?.response?.data?.message ?? 'La recherche a echoue. Reessayez.')
      setResultats(null)
    } finally {
      setChargement(false)
    }
  }

  return (
    <div className="civilis-contenu">
      <div className="civilis-card">
        <h2 style={{ marginTop: 0 }}>Rechercher un acte</h2>
        <p style={{ color: '#777', fontSize: 13, marginTop: -8 }}>
          La localisation physique complete (commune, centre, salle, rayonnage, registre, page)
          est toujours affichee avec chaque resultat.
        </p>
        <form onSubmit={onSubmit} className="civilis-recherche-form">
          <div className="civilis-field">
            <label htmlFor="nom">Nom</label>
            <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="AMEGAN" />
          </div>
          <div className="civilis-field">
            <label htmlFor="prenoms">Prenoms</label>
            <input id="prenoms" value={prenoms} onChange={(e) => setPrenoms(e.target.value)} placeholder="Kossi Edem" />
          </div>
          <button type="submit" className="civilis-btn" disabled={chargement}>
            {chargement ? 'Recherche...' : 'Rechercher'}
          </button>
        </form>
      </div>

      {erreur && <div className="civilis-erreur">{erreur}</div>}

      {aRecherche && !chargement && resultats && resultats.length === 0 && (
        <div className="civilis-card civilis-vide">
          Aucun acte ne correspond a cette recherche, meme approximativement.
        </div>
      )}

      {resultats && resultats.length > 0 && (
        <div className="civilis-card">
          <h3 style={{ marginTop: 0 }}>{resultats.length} resultat(s)</h3>
          {resultats.map((r) => (
            <div key={r.ficheIndexationId} className={`civilis-resultat ${r.correspondanceApprochee ? 'approchee' : ''}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{r.typeActe}</strong> — Acte n° {r.numeroActe}
                  <span style={{ color: '#888', marginLeft: 10, fontSize: 13 }}>
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
                    {p.nom} {p.prenoms} <span className="role">({p.role})</span>
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
