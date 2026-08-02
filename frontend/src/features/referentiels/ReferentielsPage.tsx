import { useEffect, useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { CommuneDTO, CentreDTO, SalleDTO, RayonnageDTO, TypeActeDTO } from '@/types'
import { Building2, Plus, Power, PowerOff } from 'lucide-react'

export default function ReferentielsPage() {
  const [communes, setCommunes] = useState<CommuneDTO[]>([])
  const [centres, setCentres] = useState<CentreDTO[]>([])
  const [salles, setSalles] = useState<SalleDTO[]>([])
  const [rayonnages, setRayonnages] = useState<RayonnageDTO[]>([])
  const [typesActe, setTypesActe] = useState<TypeActeDTO[]>([])
  const [chargement, setChargement] = useState(true)
  const [actionEnCours, setActionEnCours] = useState<string | null>(null)

  const [nomCommuneForm, setNomCommuneForm] = useState('')
  const [nomCentreForm, setNomCentreForm] = useState('')
  const [communeCentreForm, setCommuneCentreForm] = useState('')
  const [adresseCentreForm, setAdresseCentreForm] = useState('')
  const [centreSalleForm, setCentreSalleForm] = useState('')
  const [designationSalleForm, setDesignationSalleForm] = useState('')
  const [salleRayonnageForm, setSalleRayonnageForm] = useState('')
  const [designationRayonnageForm, setDesignationRayonnageForm] = useState('')

  const charger = () => {
    Promise.all([
      apiClient.get<CommuneDTO[]>('/referentiels/communes'),
      apiClient.get<CentreDTO[]>('/referentiels/centres'),
      apiClient.get<SalleDTO[]>('/referentiels/salles'),
      apiClient.get<RayonnageDTO[]>('/referentiels/rayonnages'),
      apiClient.get<TypeActeDTO[]>('/referentiels/types-acte'),
    ])
      .then(([c, ce, s, r, t]) => {
        setCommunes(c.data); setCentres(ce.data); setSalles(s.data); setRayonnages(r.data); setTypesActe(t.data)
      })
      // Le toast d'erreur global (voir api/client.ts) informe deja l'agent en cas
      // d'echec ; ce .catch() evite seulement une promesse rejetee non geree.
      .catch(() => {})
      .finally(() => setChargement(false))
  }

  useEffect(charger, [])

  const nomCommune = (id: number) => communes.find((c) => c.id === id)?.nom ?? `#${id}`

  const creerCommune = async (e: FormEvent) => {
    e.preventDefault()
    await apiClient.post('/referentiels/communes', { nom: nomCommuneForm })
    setNomCommuneForm('')
    charger()
  }

  const creerCentre = async (e: FormEvent) => {
    e.preventDefault()
    await apiClient.post('/referentiels/centres', {
      communeId: Number(communeCentreForm), nom: nomCentreForm, adresse: adresseCentreForm || undefined, statut: 'ACTIF',
    })
    setNomCentreForm(''); setCommuneCentreForm(''); setAdresseCentreForm('')
    charger()
  }

  const basculerCentre = async (centre: CentreDTO) => {
    setActionEnCours(`centre-${centre.id}`)
    try {
      const action = centre.statut === 'ACTIF' ? 'desactiver' : 'reactiver'
      await apiClient.patch(`/referentiels/centres/${centre.id}/${action}`)
      charger()
    } finally {
      setActionEnCours(null)
    }
  }

  const creerSalle = async (e: FormEvent) => {
    e.preventDefault()
    await apiClient.post('/referentiels/salles', { centreId: Number(centreSalleForm), designation: designationSalleForm })
    setCentreSalleForm(''); setDesignationSalleForm('')
    charger()
  }

  const creerRayonnage = async (e: FormEvent) => {
    e.preventDefault()
    await apiClient.post('/referentiels/rayonnages', { salleId: Number(salleRayonnageForm), designation: designationRayonnageForm })
    setSalleRayonnageForm(''); setDesignationRayonnageForm('')
    charger()
  }

  const basculerTypeActe = async (typeActe: TypeActeDTO) => {
    if (!typeActe.actif) return
    setActionEnCours(`type-${typeActe.id}`)
    try {
      await apiClient.patch(`/referentiels/types-acte/${typeActe.id}/desactiver`)
      charger()
    } finally {
      setActionEnCours(null)
    }
  }

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
        <h1><Building2 size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Referentiels</h1>
        <p>Communes, centres d'etat civil, salles d'archives, rayonnages et types d'actes (RG-REF-001 a RG-REF-004). Aucune suppression physique : uniquement desactivation.</p>
      </div>

      <div className="civilis-grille-tableaux">
        <div className="civilis-carte">
          <h2>Centres d'etat civil</h2>
          <table className="civilis-tableau">
            <thead><tr><th>Nom</th><th>Commune</th><th>Adresse</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              {centres.map((c) => (
                <tr key={c.id}>
                  <td>{c.nom}</td>
                  <td>{nomCommune(c.communeId)}</td>
                  <td>{c.adresse ?? '—'}</td>
                  <td><span className={`civilis-badge ${c.statut === 'ACTIF' ? 'succes' : 'neutre'}`}>{c.statut}</span></td>
                  <td>
                    <button
                      className="civilis-btn secondaire civilis-btn-icone"
                      disabled={actionEnCours === `centre-${c.id}`}
                      onClick={() => basculerCentre(c)}
                      title={c.statut === 'ACTIF' ? 'Desactiver' : 'Reactiver'}
                    >
                      {c.statut === 'ACTIF' ? <PowerOff size={14} /> : <Power size={14} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <form onSubmit={creerCentre} className="civilis-formulaire" style={{ marginTop: 16, borderTop: '1px solid var(--gris-100)', paddingTop: 14 }}>
            <div className="civilis-formulaire-grille">
              <label>Commune
                <select value={communeCentreForm} onChange={(e) => setCommuneCentreForm(e.target.value)} required>
                  <option value="">Selectionner...</option>
                  {communes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </label>
              <label>Nom du centre
                <input value={nomCentreForm} onChange={(e) => setNomCentreForm(e.target.value)} required />
              </label>
              <label>Adresse
                <input value={adresseCentreForm} onChange={(e) => setAdresseCentreForm(e.target.value)} />
              </label>
            </div>
            <button className="civilis-btn primaire" type="submit" style={{ width: 'fit-content' }}>
              <Plus size={14} style={{ marginRight: 6 }} />Ajouter un centre
            </button>
          </form>
        </div>

        <div className="civilis-carte">
          <h2>Communes</h2>
          <table className="civilis-tableau">
            <thead><tr><th>Nom</th></tr></thead>
            <tbody>
              {communes.map((c) => <tr key={c.id}><td>{c.nom}</td></tr>)}
            </tbody>
          </table>
          <form onSubmit={creerCommune} className="civilis-formulaire" style={{ marginTop: 16, borderTop: '1px solid var(--gris-100)', paddingTop: 14, flexDirection: 'row', gap: 10 }}>
            <input placeholder="Nouvelle commune" value={nomCommuneForm} onChange={(e) => setNomCommuneForm(e.target.value)} required style={{ flex: 1, padding: '10px 13px', border: '1.5px solid var(--gris-200)', borderRadius: 8 }} />
            <button className="civilis-btn primaire" type="submit"><Plus size={14} /></button>
          </form>
        </div>

        <div className="civilis-carte">
          <h2>Salles d'archives & rayonnages</h2>
          <table className="civilis-tableau">
            <thead><tr><th>Salle</th><th>Rayonnage</th></tr></thead>
            <tbody>
              {salles.map((s) => (
                rayonnages.filter((r) => r.salleId === s.id).map((r) => (
                  <tr key={r.id}><td>{s.designation}</td><td>{r.designation}</td></tr>
                ))
              ))}
            </tbody>
          </table>
          <form onSubmit={creerSalle} className="civilis-formulaire" style={{ marginTop: 16, borderTop: '1px solid var(--gris-100)', paddingTop: 14 }}>
            <div className="civilis-formulaire-grille">
              <label>Centre
                <select value={centreSalleForm} onChange={(e) => setCentreSalleForm(e.target.value)} required>
                  <option value="">Selectionner...</option>
                  {centres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </label>
              <label>Designation de la salle
                <input value={designationSalleForm} onChange={(e) => setDesignationSalleForm(e.target.value)} required />
              </label>
            </div>
            <button className="civilis-btn primaire" type="submit" style={{ width: 'fit-content' }}>
              <Plus size={14} style={{ marginRight: 6 }} />Ajouter une salle
            </button>
          </form>
          <form onSubmit={creerRayonnage} className="civilis-formulaire" style={{ marginTop: 14 }}>
            <div className="civilis-formulaire-grille">
              <label>Salle
                <select value={salleRayonnageForm} onChange={(e) => setSalleRayonnageForm(e.target.value)} required>
                  <option value="">Selectionner...</option>
                  {salles.map((s) => <option key={s.id} value={s.id}>{s.designation}</option>)}
                </select>
              </label>
              <label>Designation du rayonnage
                <input value={designationRayonnageForm} onChange={(e) => setDesignationRayonnageForm(e.target.value)} required />
              </label>
            </div>
            <button className="civilis-btn primaire" type="submit" style={{ width: 'fit-content' }}>
              <Plus size={14} style={{ marginRight: 6 }} />Ajouter un rayonnage
            </button>
          </form>
        </div>

        <div className="civilis-carte">
          <h2>Types d'actes</h2>
          <table className="civilis-tableau">
            <thead><tr><th>Libelle</th><th>Statut</th><th></th></tr></thead>
            <tbody>
              {typesActe.map((t) => (
                <tr key={t.id}>
                  <td>{t.libelle}</td>
                  <td><span className={`civilis-badge ${t.actif ? 'succes' : 'neutre'}`}>{t.actif ? 'Actif' : 'Inactif'}</span></td>
                  <td>
                    {t.actif && (
                      <button
                        className="civilis-btn secondaire civilis-btn-icone"
                        disabled={actionEnCours === `type-${t.id}`}
                        onClick={() => basculerTypeActe(t)}
                        title="Desactiver"
                      >
                        <PowerOff size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
