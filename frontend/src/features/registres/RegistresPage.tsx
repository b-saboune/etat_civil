import { Fragment, useEffect, useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type {
  RegistreVueDTO, CentreDTO, SalleDTO, RayonnageDTO, TypeActeDTO,
  HistoriqueDeplacementDTO, CouvertureRecensementDTO,
} from '@/types'
import {
  BookMarked, FileWarning, Plus, ArrowRightLeft, ChevronDown, ChevronUp,
  Gauge, History, Archive, Ban, RotateCcw,
} from 'lucide-react'
import Pagination from '@/components/ui/Pagination'

const LIBELLES_STATUT: Record<string, string> = {
  EN_SERVICE: 'En service',
  ARCHIVE: 'Archive',
  RETIRE: 'Retire',
}

export default function RegistresPage() {
  const [registres, setRegistres] = useState<RegistreVueDTO[]>([])
  const [centres, setCentres] = useState<CentreDTO[]>([])
  const [salles, setSalles] = useState<SalleDTO[]>([])
  const [rayonnages, setRayonnages] = useState<RayonnageDTO[]>([])
  const [typesActe, setTypesActe] = useState<TypeActeDTO[]>([])
  const [chargement, setChargement] = useState(true)
  const [enErreur, setEnErreur] = useState(false)
  const [actionEnCours, setActionEnCours] = useState<string | null>(null)

  // Filtres (RG-LOC-001 / section 11.6 : liste filtrable centre / annee / statut)
  const [filtreCentre, setFiltreCentre] = useState('')
  const [filtreAnnee, setFiltreAnnee] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')

  // Formulaire de creation
  const [formCentreId, setFormCentreId] = useState('')
  const [formRayonnageId, setFormRayonnageId] = useState('')
  const [formTypeActeId, setFormTypeActeId] = useState('')
  const [formNumero, setFormNumero] = useState('')
  const [formAnnee, setFormAnnee] = useState('')
  const [formNbPages, setFormNbPages] = useState('')

  // Detail (couverture de recensement + historique des deplacements)
  const [ligneOuverte, setLigneOuverte] = useState<number | null>(null)
  const [couverture, setCouverture] = useState<CouvertureRecensementDTO | null>(null)
  const [historique, setHistorique] = useState<HistoriqueDeplacementDTO[]>([])
  const [chargementDetail, setChargementDetail] = useState(false)

  // Deplacement (RG-REG-006 : confirmation explicite obligatoire)
  const [deplacerId, setDeplacerId] = useState<number | null>(null)
  const [nouveauRayonnage, setNouveauRayonnage] = useState('')
  const [confirmationDeplacement, setConfirmationDeplacement] = useState(false)

  const charger = () => {
    const params: Record<string, string> = {}
    if (filtreCentre) params.centreId = filtreCentre
    if (filtreAnnee) params.annee = filtreAnnee
    if (filtreStatut) params.statut = filtreStatut

    apiClient.get<RegistreVueDTO[]>('/registres', { params })
      .then(({ data }) => { setRegistres(data); setEnErreur(false) })
      .catch(() => setEnErreur(true))
      .finally(() => setChargement(false))
  }

  useEffect(() => {
    Promise.all([
      apiClient.get<CentreDTO[]>('/referentiels/centres'),
      apiClient.get<SalleDTO[]>('/referentiels/salles'),
      apiClient.get<RayonnageDTO[]>('/referentiels/rayonnages'),
      apiClient.get<TypeActeDTO[]>('/referentiels/types-acte'),
    ])
      .then(([ce, s, r, t]) => { setCentres(ce.data); setSalles(s.data); setRayonnages(r.data); setTypesActe(t.data) })
      .catch(() => {})
    charger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    charger()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtreCentre, filtreAnnee, filtreStatut])

  const rayonnagesDuCentre = (centreId: string | number) => {
    const idNum = Number(centreId)
    const sallesDuCentre = new Set(salles.filter((s) => s.centreId === idNum).map((s) => s.id))
    return rayonnages.filter((r) => sallesDuCentre.has(r.salleId))
  }

  const creerRegistre = async (e: FormEvent) => {
    e.preventDefault()
    setActionEnCours('creation')
    try {
      await apiClient.post('/registres', {
        centreId: Number(formCentreId),
        rayonnageId: Number(formRayonnageId),
        typeActeId: Number(formTypeActeId),
        numeroRegistre: formNumero,
        annee: Number(formAnnee),
        nbPages: Number(formNbPages),
      })
      setFormCentreId(''); setFormRayonnageId(''); setFormTypeActeId('')
      setFormNumero(''); setFormAnnee(''); setFormNbPages('')
      charger()
    } finally {
      setActionEnCours(null)
    }
  }

  const basculerDetail = async (registre: RegistreVueDTO) => {
    if (ligneOuverte === registre.id) {
      setLigneOuverte(null)
      return
    }
    setLigneOuverte(registre.id)
    setChargementDetail(true)
    try {
      const [cRes, hRes] = await Promise.all([
        apiClient.get<CouvertureRecensementDTO>(`/registres/${registre.id}/couverture-recensement`),
        apiClient.get<HistoriqueDeplacementDTO[]>(`/registres/${registre.id}/historique`),
      ])
      setCouverture(cRes.data)
      setHistorique(hRes.data)
    } catch {
      setCouverture(null)
      setHistorique([])
    } finally {
      setChargementDetail(false)
    }
  }

  const changerStatut = async (registre: RegistreVueDTO, statut: string) => {
    setActionEnCours(`statut-${registre.id}`)
    try {
      await apiClient.patch(`/registres/${registre.id}/statut`, { statut })
      charger()
    } finally {
      setActionEnCours(null)
    }
  }

  const ouvrirDeplacement = (registre: RegistreVueDTO) => {
    setDeplacerId(registre.id)
    setNouveauRayonnage('')
    setConfirmationDeplacement(false)
  }

  const confirmerDeplacement = async (registre: RegistreVueDTO, e: FormEvent) => {
    e.preventDefault()
    if (!confirmationDeplacement || !nouveauRayonnage) return
    setActionEnCours(`deplacer-${registre.id}`)
    try {
      await apiClient.post(`/registres/${registre.id}/deplacer`, { nouveauRayonnageId: Number(nouveauRayonnage) })
      setDeplacerId(null)
      charger()
      if (ligneOuverte === registre.id) basculerDetail({ ...registre })
    } finally {
      setActionEnCours(null)
    }
  }

  const totalRegistres = registres.length
  const nbEnService = registres.filter((r) => r.statut === 'EN_SERVICE').length
  const nbArchives = registres.filter((r) => r.statut === 'ARCHIVE').length
  const nbRetires = registres.filter((r) => r.statut === 'RETIRE').length

  // Pagination (vague 2 de la refonte UI) : purement cote client, aucun
  // endpoint /registres ne supporte page/size actuellement (voir
  // ROADMAP_CONFORMITE.md). La page revient a 0 chaque fois que la liste
  // source change (nouveau filtre, creation, deplacement...) pour ne jamais
  // se retrouver sur une page qui n'existe plus.
  const [page, setPage] = useState(0)
  const [tailleParPage, setTailleParPage] = useState(10)
  useEffect(() => setPage(0), [registres.length, filtreCentre, filtreAnnee, filtreStatut])
  const totalPages = Math.max(1, Math.ceil(registres.length / tailleParPage))
  const registresAffiches = registres.slice(page * tailleParPage, (page + 1) * tailleParPage)

  if (chargement) {
    return (
      <div className="civilis-page">
        <div className="civilis-skeleton" style={{ height: 400 }} />
      </div>
    )
  }

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><BookMarked size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Registres physiques</h1>
        <p>Localisation, cycle de vie et historique de deplacement des registres (RG-REG-006, RG-REG-009, RG-REG-010, RG-LOC-001).</p>
      </div>

      <div className="civilis-stats-synthese">
        <div className="civilis-stat-synthese-carte">
          <BookMarked size={16} />
          <div><div className="civilis-stat-synthese-valeur">{totalRegistres}</div><div className="civilis-stat-synthese-libelle">Registres au total</div></div>
        </div>
        <div className="civilis-stat-synthese-carte">
          <Gauge size={16} />
          <div><div className="civilis-stat-synthese-valeur">{nbEnService}</div><div className="civilis-stat-synthese-libelle">En service</div></div>
        </div>
        <div className="civilis-stat-synthese-carte">
          <Archive size={16} />
          <div><div className="civilis-stat-synthese-valeur">{nbArchives}</div><div className="civilis-stat-synthese-libelle">Archives</div></div>
        </div>
        <div className="civilis-stat-synthese-carte">
          <Ban size={16} />
          <div><div className="civilis-stat-synthese-valeur">{nbRetires}</div><div className="civilis-stat-synthese-libelle">Retires</div></div>
        </div>
      </div>

      <div className="civilis-carte" style={{ marginBottom: 18 }}>
        <div className="civilis-formulaire-grille" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <label>Centre
            <select value={filtreCentre} onChange={(e) => setFiltreCentre(e.target.value)}>
              <option value="">Tous les centres</option>
              {centres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </label>
          <label>Annee
            <input type="number" placeholder="Ex. 2024" value={filtreAnnee} onChange={(e) => setFiltreAnnee(e.target.value)} />
          </label>
          <label>Statut
            <select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
              <option value="">Tous les statuts</option>
              <option value="EN_SERVICE">En service</option>
              <option value="ARCHIVE">Archive</option>
              <option value="RETIRE">Retire</option>
            </select>
          </label>
        </div>
      </div>

      <div className="civilis-carte">
        {enErreur ? (
          <div className="civilis-vide">
            <FileWarning size={30} />
            <span className="civilis-vide-titre">Impossible de charger les registres</span>
            <span className="civilis-vide-detail">Le service a repondu une erreur. Reessayez dans un instant ou contactez un administrateur si cela persiste.</span>
          </div>
        ) : (
          <table className="civilis-tableau">
            <thead>
              <tr>
                <th>Numero</th><th>Annee</th><th>Type d'acte</th><th>Localisation</th><th>Pages</th><th>Statut</th><th></th>
              </tr>
            </thead>
            <tbody>
              {registresAffiches.map((r) => (
                <Fragment key={r.id}>
                  <tr key={r.id} className="civilis-entree-echelonnee">
                    <td>{r.numeroRegistre}</td>
                    <td>{r.annee}</td>
                    <td>{r.typeActeLibelle}</td>
                    <td style={{ fontSize: 13, color: 'var(--gris-500)' }}>
                      {r.communeNom} &rsaquo; {r.centreNom} &rsaquo; {r.salleDesignation} &rsaquo; {r.rayonnageDesignation}
                    </td>
                    <td>{r.nbPages}</td>
                    <td><span className={`civilis-badge ${r.statut === 'EN_SERVICE' ? 'succes' : r.statut === 'ARCHIVE' ? 'neutre' : 'alerte'}`}>{LIBELLES_STATUT[r.statut] ?? r.statut}</span></td>
                    <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="civilis-btn secondaire civilis-btn-icone" title="Detail et historique" onClick={() => basculerDetail(r)}>
                        {ligneOuverte === r.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button className="civilis-btn secondaire civilis-btn-icone" title="Deplacer" onClick={() => ouvrirDeplacement(r)}>
                        <ArrowRightLeft size={14} />
                      </button>
                      {r.statut !== 'ARCHIVE' && (
                        <button className="civilis-btn secondaire civilis-btn-icone" title="Archiver" disabled={actionEnCours === `statut-${r.id}`} onClick={() => changerStatut(r, 'ARCHIVE')}>
                          <Archive size={14} />
                        </button>
                      )}
                      {r.statut !== 'RETIRE' && (
                        <button className="civilis-btn secondaire civilis-btn-icone" title="Retirer" disabled={actionEnCours === `statut-${r.id}`} onClick={() => changerStatut(r, 'RETIRE')}>
                          <Ban size={14} />
                        </button>
                      )}
                      {r.statut !== 'EN_SERVICE' && (
                        <button className="civilis-btn secondaire civilis-btn-icone" title="Remettre en service" disabled={actionEnCours === `statut-${r.id}`} onClick={() => changerStatut(r, 'EN_SERVICE')}>
                          <RotateCcw size={14} />
                        </button>
                      )}
                    </td>
                  </tr>

                  {deplacerId === r.id && (
                    <tr>
                      <td colSpan={7}>
                        <form onSubmit={(e) => confirmerDeplacement(r, e)} className="civilis-formulaire" style={{ background: 'var(--gris-050, #f7f8fa)', padding: 14, borderRadius: 10 }}>
                          <div className="civilis-formulaire-grille" style={{ gridTemplateColumns: '2fr 2fr 1fr' }}>
                            <label>Nouveau rayonnage (meme centre : {r.centreNom})
                              <select value={nouveauRayonnage} onChange={(e) => setNouveauRayonnage(e.target.value)} required>
                                <option value="">Selectionner...</option>
                                {rayonnagesDuCentre(r.centreId).filter((ray) => ray.id !== r.rayonnageId).map((ray) => (
                                  <option key={ray.id} value={ray.id}>{ray.designation}</option>
                                ))}
                              </select>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 22 }}>
                              <input type="checkbox" checked={confirmationDeplacement} onChange={(e) => setConfirmationDeplacement(e.target.checked)} />
                              Je confirme ce deplacement physique (RG-REG-006)
                            </label>
                            <div style={{ display: 'flex', gap: 8, marginTop: 22 }}>
                              <button className="civilis-btn primaire" type="submit" disabled={!confirmationDeplacement || !nouveauRayonnage || actionEnCours === `deplacer-${r.id}`}>Confirmer</button>
                              <button className="civilis-btn secondaire" type="button" onClick={() => setDeplacerId(null)}>Annuler</button>
                            </div>
                          </div>
                        </form>
                      </td>
                    </tr>
                  )}

                  {ligneOuverte === r.id && (
                    <tr>
                      <td colSpan={7}>
                        {chargementDetail ? (
                          <div className="civilis-skeleton" style={{ height: 80 }} />
                        ) : (
                          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', padding: 14 }}>
                            <div style={{ minWidth: 220 }}>
                              <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 8 }}>
                                <Gauge size={15} />Couverture de recensement
                              </h3>
                              {couverture && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                  <div
                                    className="civilis-anneau-progress"
                                    style={{ '--pourcentage': Math.min(100, couverture.tauxCouverturePourcent) } as React.CSSProperties}
                                  >
                                    <span className="civilis-anneau-progress-valeur">{Math.round(couverture.tauxCouverturePourcent)}%</span>
                                  </div>
                                  <p style={{ fontSize: 13, color: 'var(--gris-500)', margin: 0 }}>
                                    {couverture.nbFichesIndexees} fiche(s) indexee(s)<br />sur {couverture.nbPages} page(s)
                                  </p>
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 280 }}>
                              <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, marginBottom: 8 }}>
                                <History size={15} />Historique des deplacements
                              </h3>
                              {historique.length === 0 ? (
                                <p style={{ fontSize: 13, color: 'var(--gris-500)' }}>Aucun deplacement enregistre depuis la creation.</p>
                              ) : (
                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {historique.map((h) => (
                                    <li key={h.id} style={{ fontSize: 13, color: 'var(--gris-600)' }}>
                                      {h.ancienRayonnage ?? '—'} &rarr; {h.nouveauRayonnage} · {new Date(h.dateDeplacement).toLocaleString('fr-FR')} · {h.auteurIdentifiant ?? 'agent inconnu'}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {registresAffiches.length === 0 && (
                <tr><td colSpan={7}>
                  <div className="civilis-vide">
                    <BookMarked size={30} />
                    <span className="civilis-vide-titre">Aucun registre ne correspond a ces criteres</span>
                    <span className="civilis-vide-detail">Ajustez les filtres ou creez un nouveau registre ci-dessous.</span>
                  </div>
                </td></tr>
              )}
            </tbody>
          </table>
        )}

        {!enErreur && !chargement && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onChangerPage={setPage}
            totalElements={registres.length}
            tailleParPage={tailleParPage}
            onChangerTaille={(t) => { setTailleParPage(t); setPage(0) }}
          />
        )}

        <form onSubmit={creerRegistre} className="civilis-formulaire" style={{ marginTop: 20, borderTop: '1px solid var(--gris-100)', paddingTop: 16 }}>
          <h2 style={{ fontSize: 15, marginBottom: 10 }}>Nouveau registre</h2>
          <div className="civilis-formulaire-grille" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <label>Centre
              <select value={formCentreId} onChange={(e) => { setFormCentreId(e.target.value); setFormRayonnageId('') }} required>
                <option value="">Selectionner...</option>
                {centres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </label>
            <label>Rayonnage
              <select value={formRayonnageId} onChange={(e) => setFormRayonnageId(e.target.value)} required disabled={!formCentreId}>
                <option value="">Selectionner...</option>
                {rayonnagesDuCentre(formCentreId).map((r) => <option key={r.id} value={r.id}>{r.designation}</option>)}
              </select>
            </label>
            <label>Type d'acte
              <select value={formTypeActeId} onChange={(e) => setFormTypeActeId(e.target.value)} required>
                <option value="">Selectionner...</option>
                {typesActe.filter((t) => t.actif).map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
              </select>
            </label>
            <label>Numero du registre
              <input value={formNumero} onChange={(e) => setFormNumero(e.target.value)} required />
            </label>
            <label>Annee
              <input type="number" value={formAnnee} onChange={(e) => setFormAnnee(e.target.value)} required />
            </label>
            <label>Nombre de pages
              <input type="number" value={formNbPages} onChange={(e) => setFormNbPages(e.target.value)} required />
            </label>
          </div>
          <button className="civilis-btn primaire" type="submit" disabled={actionEnCours === 'creation'} style={{ width: 'fit-content', marginTop: 8 }}>
            <Plus size={14} style={{ marginRight: 6 }} />Creer le registre
          </button>
        </form>
      </div>
    </div>
  )
}
