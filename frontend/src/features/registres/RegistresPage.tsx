import { useEffect, useState } from 'react'
import { apiClient } from '@/api/client'
import type { RegistreDTO } from '@/types'
import { BookMarked } from 'lucide-react'

export default function RegistresPage() {
  const [registres, setRegistres] = useState<RegistreDTO[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    apiClient.get<RegistreDTO[]>('/registres').then(({ data }) => setRegistres(data)).finally(() => setChargement(false))
  }, [])

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><BookMarked size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Registres physiques</h1>
        <p>Suivi des registres, de leur emplacement et de leur historique de deplacement (RG-REG-001 a RG-REG-005).</p>
      </div>

      {chargement ? (
        <div className="civilis-skeleton" style={{ height: 300 }} />
      ) : (
        <div className="civilis-carte">
          <table className="civilis-tableau">
            <thead><tr><th>Numero</th><th>Annee</th><th>Pages</th><th>Statut</th></tr></thead>
            <tbody>
              {registres.map((r) => (
                <tr key={r.id} className="civilis-entree-echelonnee">
                  <td>{r.numeroRegistre}</td>
                  <td>{r.annee}</td>
                  <td>{r.nbPages}</td>
                  <td><span className={`civilis-badge ${r.statut === 'EN_SERVICE' ? 'succes' : 'neutre'}`}>{r.statut}</span></td>
                </tr>
              ))}
              {registres.length === 0 && <tr><td colSpan={4} className="civilis-vide">Aucun registre enregistre.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
