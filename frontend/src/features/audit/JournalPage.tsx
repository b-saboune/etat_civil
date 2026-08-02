import { useEffect, useState } from 'react'
import { apiClient } from '@/api/client'
import { ScrollText } from 'lucide-react'

interface JournalEntree {
  id: number
  utilisateur?: { identifiant: string } | null
  module: string
  action: string
  dateHeure: string
  details?: string
}

export default function JournalPage() {
  const [entrees, setEntrees] = useState<JournalEntree[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    apiClient.get<JournalEntree[]>('/journal').then(({ data }) => setEntrees(data)).catch(() => {}).finally(() => setChargement(false))
  }, [])

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><ScrollText size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Journal d'activite</h1>
        <p>Tracabilite complete, en lecture seule (RG-AUD-001). Ecriture unique via l'aspect d'audit (RG-AUD-002).</p>
      </div>

      {chargement ? (
        <div className="civilis-skeleton" style={{ height: 300 }} />
      ) : (
        <div className="civilis-carte">
          <table className="civilis-tableau">
            <thead><tr><th>Horodatage</th><th>Acteur</th><th>Module</th><th>Action</th></tr></thead>
            <tbody>
              {entrees
                .slice()
                .sort((a, b) => (a.dateHeure < b.dateHeure ? 1 : -1))
                .map((e) => (
                  <tr key={e.id} className="civilis-entree-echelonnee">
                    <td>{new Date(e.dateHeure).toLocaleString('fr-FR')}</td>
                    <td>{e.utilisateur?.identifiant ?? 'Systeme'}</td>
                    <td>{e.module}</td>
                    <td>{e.action}</td>
                  </tr>
                ))}
              {entrees.length === 0 && <tr><td colSpan={4} className="civilis-vide">Aucune activite enregistree.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
