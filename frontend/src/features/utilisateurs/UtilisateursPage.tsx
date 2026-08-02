import { useEffect, useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { AgentDTO, RoleDTO, CentreDTO } from '@/types'
import { UserCog, Unlock, KeyRound, UserPlus, UserX, UserCheck, Building2, X } from 'lucide-react'

export default function UtilisateursPage() {
  const [agents, setAgents] = useState<AgentDTO[]>([])
  const [chargement, setChargement] = useState(true)
  const [actionEnCours, setActionEnCours] = useState<number | null>(null)
  const [identifiant, setIdentifiant] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [enCoursCreation, setEnCoursCreation] = useState(false)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)
  const [roles, setRoles] = useState<RoleDTO[]>([])
  const [rolesParAgent, setRolesParAgent] = useState<Record<number, number | ''>>({})
  const [centres, setCentres] = useState<CentreDTO[]>([])
  const [centresParAgent, setCentresParAgent] = useState<Record<number, number[]>>({})

  const charger = () => {
    apiClient.get<AgentDTO[]>('/agents').then(({ data }) => {
      setAgents(data)
      data.filter((a) => a.typeCompte === 'AGENT').forEach((a) => {
        apiClient.get<number[]>(`/agents/${a.id}/roles`).then(({ data: ids }) => {
          setRolesParAgent((prev) => ({ ...prev, [a.id]: ids[0] ?? '' }))
        }).catch(() => {})
        apiClient.get<number[]>(`/agents/${a.id}/centres`).then(({ data: ids }) => {
          setCentresParAgent((prev) => ({ ...prev, [a.id]: ids }))
        }).catch(() => {})
      })
    }).catch(() => {}).finally(() => setChargement(false))
  }

  useEffect(() => {
    charger()
    apiClient.get<RoleDTO[]>('/roles').then(({ data }) => setRoles(data)).catch(() => {})
    apiClient.get<CentreDTO[]>('/referentiels/centres').then(({ data }) => setCentres(data)).catch(() => {})
  }, [])

  const affecterCentre = async (agentId: number, centreId: number) => {
    if (!centreId) return
    setActionEnCours(agentId)
    try {
      await apiClient.post(`/agents/${agentId}/centres`, { centreId })
      setCentresParAgent((prev) => ({ ...prev, [agentId]: [...(prev[agentId] ?? []), centreId] }))
    } finally {
      setActionEnCours(null)
    }
  }

  const retirerCentre = async (agentId: number, centreId: number) => {
    setActionEnCours(agentId)
    try {
      await apiClient.delete(`/agents/${agentId}/centres/${centreId}`)
      setCentresParAgent((prev) => ({ ...prev, [agentId]: (prev[agentId] ?? []).filter((id) => id !== centreId) }))
    } finally {
      setActionEnCours(null)
    }
  }

  const affecterRole = async (agentId: number, roleId: number) => {
    setActionEnCours(agentId)
    try {
      await apiClient.post(`/agents/${agentId}/roles`, { roleId })
      setRolesParAgent((prev) => ({ ...prev, [agentId]: roleId }))
    } finally {
      setActionEnCours(null)
    }
  }

  const creer = async (e: FormEvent) => {
    e.preventDefault()
    setEnCoursCreation(true)
    setMessage(null)
    try {
      await apiClient.post('/agents', { identifiant, motDePasseInitial: motDePasse })
      setMessage({ type: 'succes', texte: 'Agent cree avec succes.' })
      setIdentifiant(''); setMotDePasse('')
      charger()
    } catch (err: any) {
      setMessage({ type: 'erreur', texte: err?.response?.data?.message ?? 'Creation impossible.' })
    } finally {
      setEnCoursCreation(false)
    }
  }

  const deverrouiller = async (id: number) => {
    setActionEnCours(id)
    try {
      await apiClient.patch(`/agents/${id}/deverrouiller`)
      charger()
    } finally {
      setActionEnCours(null)
    }
  }

  const basculerStatut = async (agent: AgentDTO) => {
    setActionEnCours(agent.id)
    try {
      const action = agent.statut === 'ACTIF' ? 'desactiver' : 'reactiver'
      await apiClient.patch(`/agents/${agent.id}/${action}`)
      charger()
    } finally {
      setActionEnCours(null)
    }
  }

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><UserCog size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Agents & utilisateurs</h1>
        <p>Creation de comptes agents, verrouillage automatique apres echecs (RG-UTI-009), desactivation (RG-UTI-002 : aucune suppression physique).</p>
      </div>

      <div className="civilis-grille-deux">
        <div className="civilis-carte">
          <h2>Comptes agents</h2>
          {chargement ? (
            <div className="civilis-skeleton" style={{ height: 220 }} />
          ) : (
            <table className="civilis-tableau">
              <thead><tr><th>Identifiant</th><th>Type</th><th>Role</th><th>Centres (RG-UTI-001)</th><th>Statut</th><th>Actions</th></tr></thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="civilis-entree-echelonnee">
                    <td>{a.identifiant}</td>
                    <td>{a.typeCompte}</td>
                    <td>
                      {a.typeCompte === 'AGENT' ? (
                        <select
                          value={rolesParAgent[a.id] ?? ''}
                          disabled={actionEnCours === a.id}
                          onChange={(e) => e.target.value && affecterRole(a.id, Number(e.target.value))}
                          className="civilis-select-compact"
                        >
                          <option value="">— Aucun —</option>
                          {roles.map((r) => (
                            <option key={r.id} value={r.id}>{r.libelle}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="civilis-texte-discret">—</span>
                      )}
                    </td>
                    <td>
                      {a.typeCompte === 'AGENT' ? (
                        <div className="civilis-chips-centres">
                          {(centresParAgent[a.id] ?? []).map((cid) => {
                            const centre = centres.find((c) => c.id === cid)
                            return (
                              <span key={cid} className="civilis-chip">
                                <Building2 size={11} />
                                {centre?.nom ?? cid}
                                <button type="button" onClick={() => retirerCentre(a.id, cid)} title="Retirer">
                                  <X size={11} />
                                </button>
                              </span>
                            )
                          })}
                          <select
                            value=""
                            disabled={actionEnCours === a.id}
                            onChange={(e) => e.target.value && affecterCentre(a.id, Number(e.target.value))}
                            className="civilis-select-compact"
                          >
                            <option value="">+ Affecter...</option>
                            {centres
                              .filter((c) => !(centresParAgent[a.id] ?? []).includes(c.id))
                              .map((c) => (
                                <option key={c.id} value={c.id}>{c.nom}</option>
                              ))}
                          </select>
                        </div>
                      ) : (
                        <span className="civilis-texte-discret">—</span>
                      )}
                    </td>
                    <td><span className={`civilis-badge ${a.statut === 'ACTIF' ? 'succes' : a.statut === 'VERROUILLE' ? 'alerte' : 'neutre'}`}>{a.statut}</span></td>
                    <td className="civilis-actions-cellule">
                      {a.statut === 'VERROUILLE' && (
                        <button
                          className="civilis-btn secondaire civilis-btn-icone"
                          disabled={actionEnCours === a.id}
                          onClick={() => deverrouiller(a.id)}
                          title="Deverrouiller le compte"
                        >
                          <Unlock size={14} />
                        </button>
                      )}
                      {a.typeCompte === 'AGENT' && (
                        <button
                          className="civilis-btn secondaire civilis-btn-icone"
                          disabled={actionEnCours === a.id}
                          onClick={() => basculerStatut(a)}
                          title={a.statut === 'ACTIF' ? 'Desactiver' : 'Reactiver'}
                        >
                          {a.statut === 'ACTIF' ? <UserX size={14} /> : <UserCheck size={14} />}
                        </button>
                      )}
                      <button className="civilis-btn secondaire civilis-btn-icone" title="Reinitialiser le mot de passe" disabled>
                        <KeyRound size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {agents.length === 0 && <tr><td colSpan={6} className="civilis-vide">Aucun agent enregistre.</td></tr>}
              </tbody>
            </table>
          )}
        </div>

        <div className="civilis-carte">
          <h2><UserPlus size={17} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Nouvel agent</h2>
          <form onSubmit={creer} className="civilis-formulaire">
            <label>Identifiant
              <input value={identifiant} onChange={(e) => setIdentifiant(e.target.value)} required />
            </label>
            <label>Mot de passe initial
              <input type="password" minLength={8} value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
            </label>
            <button className="civilis-btn primaire" type="submit" disabled={enCoursCreation}>
              {enCoursCreation ? 'Creation...' : 'Creer l’agent'}
            </button>
            {message && <div className={`civilis-alerte-${message.type === 'succes' ? 'succes' : 'erreur'}`}>{message.texte}</div>}
          </form>
        </div>
      </div>
    </div>
  )
}
