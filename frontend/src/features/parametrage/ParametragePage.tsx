import { useEffect, useState } from 'react'
import { apiClient } from '@/api/client'
import { Settings, DatabaseBackup } from 'lucide-react'

interface Parametre { id: number; cle: string; valeur: string; categorie?: string }
interface Sauvegarde { id: number; dateExecution: string; type: string; statut: string; tailleOctets?: number }

export default function ParametragePage() {
  const [parametres, setParametres] = useState<Parametre[]>([])
  const [sauvegardes, setSauvegardes] = useState<Sauvegarde[]>([])
  const [chargement, setChargement] = useState(true)
  const [enCours, setEnCours] = useState(false)

  const charger = () => {
    Promise.all([apiClient.get<Parametre[]>('/parametres'), apiClient.get<Sauvegarde[]>('/sauvegardes')])
      .then(([p, s]) => { setParametres(p.data); setSauvegardes(s.data) })
      .finally(() => setChargement(false))
  }

  useEffect(charger, [])

  const executerSauvegarde = async () => {
    setEnCours(true)
    try {
      await apiClient.post('/sauvegardes/executer')
      charger()
    } finally {
      setEnCours(false)
    }
  }

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><Settings size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Parametrage & sauvegarde</h1>
        <p>Parametres systeme et sauvegardes (RG-PAR-001, RG-PAR-002 — sauvegarde planifiee quotidienne 02h00).</p>
      </div>

      {chargement ? (
        <div className="civilis-skeleton" style={{ height: 300 }} />
      ) : (
        <div className="civilis-grille-tableaux">
          <div className="civilis-carte">
            <h2>Parametres</h2>
            <table className="civilis-tableau">
              <thead><tr><th>Cle</th><th>Valeur</th></tr></thead>
              <tbody>
                {parametres.map((p) => (
                  <tr key={p.id}><td>{p.cle}</td><td>{p.valeur}</td></tr>
                ))}
                {parametres.length === 0 && <tr><td colSpan={2} className="civilis-vide">Aucun parametre.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="civilis-carte">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Sauvegardes</h2>
              <button className="civilis-btn primaire" onClick={executerSauvegarde} disabled={enCours}>
                <DatabaseBackup size={15} style={{ marginRight: 6 }} />
                {enCours ? 'Execution...' : 'Executer maintenant'}
              </button>
            </div>
            <table className="civilis-tableau">
              <thead><tr><th>Date</th><th>Type</th><th>Statut</th></tr></thead>
              <tbody>
                {sauvegardes
                  .slice()
                  .sort((a, b) => (a.dateExecution < b.dateExecution ? 1 : -1))
                  .map((s) => (
                    <tr key={s.id}>
                      <td>{new Date(s.dateExecution).toLocaleString('fr-FR')}</td>
                      <td>{s.type}</td>
                      <td><span className={`civilis-badge ${s.statut === 'REUSSIE' ? 'succes' : 'alerte'}`}>{s.statut}</span></td>
                    </tr>
                  ))}
                {sauvegardes.length === 0 && <tr><td colSpan={3} className="civilis-vide">Aucune sauvegarde.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
