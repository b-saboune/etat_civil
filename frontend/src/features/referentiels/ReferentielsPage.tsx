import { useEffect, useState } from 'react'
import { apiClient } from '@/api/client'
import type { CommuneDTO, CentreDTO, SalleDTO, RayonnageDTO, TypeActeDTO } from '@/types'
import { Building2 } from 'lucide-react'

export default function ReferentielsPage() {
  const [communes, setCommunes] = useState<CommuneDTO[]>([])
  const [centres, setCentres] = useState<CentreDTO[]>([])
  const [salles, setSalles] = useState<SalleDTO[]>([])
  const [rayonnages, setRayonnages] = useState<RayonnageDTO[]>([])
  const [typesActe, setTypesActe] = useState<TypeActeDTO[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
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
      .finally(() => setChargement(false))
  }, [])

  const nomCommune = (id: number) => communes.find((c) => c.id === id)?.nom ?? `#${id}`

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><Building2 size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Referentiels</h1>
        <p>Communes, centres d'etat civil, salles d'archives, rayonnages et types d'actes (RG-REF-001 a RG-REF-004).</p>
      </div>

      {chargement ? (
        <div className="civilis-skeleton" style={{ height: 300 }} />
      ) : (
        <div className="civilis-grille-tableaux">
          <div className="civilis-carte">
            <h2>Centres d'etat civil</h2>
            <table className="civilis-tableau">
              <thead><tr><th>Nom</th><th>Commune</th><th>Adresse</th><th>Statut</th></tr></thead>
              <tbody>
                {centres.map((c) => (
                  <tr key={c.id}>
                    <td>{c.nom}</td>
                    <td>{nomCommune(c.communeId)}</td>
                    <td>{c.adresse ?? '—'}</td>
                    <td><span className={`civilis-badge ${c.statut === 'ACTIF' ? 'succes' : 'neutre'}`}>{c.statut}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          </div>

          <div className="civilis-carte">
            <h2>Types d'actes</h2>
            <table className="civilis-tableau">
              <thead><tr><th>Libelle</th><th>Statut</th></tr></thead>
              <tbody>
                {typesActe.map((t) => (
                  <tr key={t.id}>
                    <td>{t.libelle}</td>
                    <td><span className={`civilis-badge ${t.actif ? 'succes' : 'neutre'}`}>{t.actif ? 'Actif' : 'Inactif'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
