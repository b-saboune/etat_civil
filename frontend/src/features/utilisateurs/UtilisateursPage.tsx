import { useEffect, useState } from 'react'
import { apiClient } from '@/api/client'
import type { AgentDTO } from '@/types'
import { UserCog, Unlock, KeyRound } from 'lucide-react'

export default function UtilisateursPage() {
  const [agents, setAgents] = useState<AgentDTO[]>([])
  const [chargement, setChargement] = useState(true)
  const [actionEnCours, setActionEnCours] = useState<number | null>(null)

  const charger = () => {
    apiClient.get<AgentDTO[]>('/agents').then(({ data }) => setAgents(data)).finally(() => setChargement(false))
  }

  useEffect(charger, [])

  const deverrouiller = async (id: number) => {
    setActionEnCours(id)
    try {
      await apiClient.patch(`/agents/${id}/deverrouiller`)
      charger()
    } finally {
      setActionEnCours(null)
    }
  }

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><UserCog size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Agents & utilisateurs</h1>
        <p>Gestion des comptes agents : verrouillage apres echecs (RG-UTI-009), reinitialisation de mot de passe.</p>
      </div>

      {chargement ? (
        <div className="civilis-skeleton" style={{ height: 260 }} />
      ) : (
        <div className="civilis-carte">
          <table className="civilis-tableau">
            <thead><tr><th>Identifiant</th><th>Type de compte</th><th>Statut</th><th>Actions</th></tr></thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="civilis-entree-echelonnee">
                  <td>{a.identifiant}</td>
                  <td>{a.typeCompte}</td>
                  <td><span className={`civilis-badge ${a.statut === 'ACTIF' ? 'succes' : 'alerte'}`}>{a.statut}</span></td>
                  <td className="civilis-actions-cellule">
                    <button
                      className="civilis-btn secondaire civilis-btn-icone"
                      disabled={actionEnCours === a.id}
                      onClick={() => deverrouiller(a.id)}
                      title="Deverrouiller le compte"
                    >
                      <Unlock size={14} />
                    </button>
                    <button className="civilis-btn secondaire civilis-btn-icone" title="Reinitialiser le mot de passe" disabled>
                      <KeyRound size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {agents.length === 0 && <tr><td colSpan={4} className="civilis-vide">Aucun agent enregistre.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
