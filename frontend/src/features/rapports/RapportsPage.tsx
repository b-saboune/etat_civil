import { useEffect, useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { RapportResumeDTO, RapportDTO, RapportSnapshot, CentreDTO } from '@/types'
import { FileBarChart2, Download, Eye } from 'lucide-react'

const TYPES_RAPPORT = [
  { valeur: 'FICHES_PAR_CENTRE', libelle: 'Fiches indexees par centre' },
  { valeur: 'FICHES_PAR_AGENT', libelle: 'Fiches indexees par agent' },
  { valeur: 'REPARTITION_TYPE_ACTE', libelle: "Repartition par type d'acte" },
]

export default function RapportsPage() {
  const [rapports, setRapports] = useState<RapportResumeDTO[]>([])
  const [chargement, setChargement] = useState(true)
  const [type, setType] = useState('FICHES_PAR_CENTRE')
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')
  const [centreId, setCentreId] = useState('')
  const [centres, setCentres] = useState<CentreDTO[]>([])
  const [enCours, setEnCours] = useState(false)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)
  const [rapportOuvert, setRapportOuvert] = useState<{ resume: RapportResumeDTO; snapshot: RapportSnapshot } | null>(null)

  const charger = () => {
    apiClient.get<RapportResumeDTO[]>('/rapports').then(({ data }) => setRapports(data)).catch(() => {}).finally(() => setChargement(false))
  }

  useEffect(() => {
    charger()
    apiClient.get<CentreDTO[]>('/referentiels/centres').then(({ data }) => setCentres(data)).catch(() => {})
  }, [])

  const genererRapport = async (e: FormEvent) => {
    e.preventDefault()
    setEnCours(true)
    setMessage(null)
    try {
      await apiClient.post('/rapports/generer', {
        type,
        dateDebut,
        dateFin,
        centreId: type === 'FICHES_PAR_CENTRE' && centreId ? Number(centreId) : null,
      })
      setMessage({ type: 'succes', texte: 'Rapport genere et fige (RG-RAP-001) : les donnees ne seront plus recalculees.' })
      charger()
    } catch (err: any) {
      setMessage({ type: 'erreur', texte: err?.response?.data?.message ?? 'Generation impossible.' })
    } finally {
      setEnCours(false)
    }
  }

  const consulter = async (resume: RapportResumeDTO) => {
    const { data } = await apiClient.get<RapportDTO>(`/rapports/${resume.id}`)
    const snapshot: RapportSnapshot = JSON.parse(data.criteres)
    setRapportOuvert({ resume, snapshot })
  }

  const exporterCsv = async (id: number) => {
    const { data } = await apiClient.get(`/rapports/${id}/export`, { params: { format: 'csv' }, responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([data]))
    const lien = document.createElement('a')
    lien.href = url
    lien.download = `rapport-${id}.csv`
    document.body.appendChild(lien)
    lien.click()
    lien.remove()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><FileBarChart2 size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Rapports</h1>
        <p>RG-RAP-001 : chaque rapport genere est un instantane fige des donnees deja indexees au moment de sa generation — il n'est jamais recalcule apres coup, meme si les donnees sous-jacentes evoluent ensuite.</p>
      </div>

      <div className="civilis-grille-deux">
        <div className="civilis-carte">
          <h2>Nouveau rapport</h2>
          <form onSubmit={genererRapport} className="civilis-formulaire">
            <label>Type de rapport
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {TYPES_RAPPORT.map((t) => <option key={t.valeur} value={t.valeur}>{t.libelle}</option>)}
              </select>
            </label>
            {type === 'FICHES_PAR_CENTRE' && (
              <label>Centre (optionnel — tous les centres si vide)
                <select value={centreId} onChange={(e) => setCentreId(e.target.value)}>
                  <option value="">Tous les centres</option>
                  {centres.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </label>
            )}
            <label>Date de debut
              <input type="date" value={dateDebut} onChange={(e) => setDateDebut(e.target.value)} required />
            </label>
            <label>Date de fin
              <input type="date" value={dateFin} onChange={(e) => setDateFin(e.target.value)} required />
            </label>
            <button className="civilis-btn primaire" type="submit" disabled={enCours}>
              {enCours ? 'Generation...' : 'Generer le rapport'}
            </button>
            {message && <div className={`civilis-alerte-${message.type === 'succes' ? 'succes' : 'erreur'}`}>{message.texte}</div>}
          </form>
        </div>

        <div className="civilis-carte">
          <h2>Rapports generes</h2>
          {chargement ? (
            <div className="civilis-skeleton" style={{ height: 220 }} />
          ) : (
            <table className="civilis-tableau">
              <thead><tr><th>Type</th><th>Genere par</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {rapports.map((r) => (
                  <tr key={r.id}>
                    <td>{TYPES_RAPPORT.find((t) => t.valeur === r.type)?.libelle ?? r.type}</td>
                    <td>{r.genereParIdentifiant}</td>
                    <td>{new Date(r.dateGeneration).toLocaleString('fr-FR')}</td>
                    <td className="civilis-actions-cellule">
                      <button className="civilis-btn secondaire civilis-btn-icone" onClick={() => consulter(r)} title="Consulter"><Eye size={14} /></button>
                      <button className="civilis-btn secondaire civilis-btn-icone" onClick={() => exporterCsv(r.id)} title="Exporter en CSV"><Download size={14} /></button>
                    </td>
                  </tr>
                ))}
                {rapports.length === 0 && <tr><td colSpan={4} className="civilis-vide">Aucun rapport genere.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {rapportOuvert && (
        <div className="civilis-carte" style={{ marginTop: 18 }}>
          <h2>{TYPES_RAPPORT.find((t) => t.valeur === rapportOuvert.resume.type)?.libelle}</h2>
          <p style={{ fontSize: 12.5, color: 'var(--gris-500)' }}>
            Periode : {rapportOuvert.snapshot.criteres.dateDebut} au {rapportOuvert.snapshot.criteres.dateFin} — instantane fige au moment de la generation.
          </p>
          <table className="civilis-tableau">
            <thead><tr>{rapportOuvert.snapshot.colonnes.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {rapportOuvert.snapshot.lignes.map((ligne, i) => (
                <tr key={i}>{ligne.map((v, j) => <td key={j}>{v}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
