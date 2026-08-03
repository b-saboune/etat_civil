import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { AgentDTO, RoleDTO, CentreDTO, HistoriqueConnexionDTO } from '@/types'
import {
  UserCog, Unlock, KeyRound, UserPlus, UserX, UserCheck, Building2, X,
  Search, History, LogIn, LogOut as LogOutIcon, ShieldAlert, Users, ShieldCheck,
  Lock, CircleCheck, CircleX,
} from 'lucide-react'

const LIBELLES_TYPE: Record<string, string> = {
  AGENT: 'Agent',
  ADMINISTRATEUR: 'Administrateur',
  SUPER_ADMIN: 'Super administrateur',
}

function initialesDe(identifiant: string) {
  return identifiant.slice(0, 2).toUpperCase()
}

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

  // Recherche / filtres de la liste (panneau maitre-detail)
  const [recherche, setRecherche] = useState('')
  const [filtreType, setFiltreType] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('')

  // Panneau de detail : agent selectionne + son historique de connexion (RG-UTI-003)
  const [agentSelectionneId, setAgentSelectionneId] = useState<number | null>(null)
  const [historique, setHistorique] = useState<HistoriqueConnexionDTO[]>([])
  const [chargementHistorique, setChargementHistorique] = useState(false)

  // Reinitialisation de mot de passe (RG-UTI-003) — auparavant un bouton present mais inerte
  const [resetOuvert, setResetOuvert] = useState(false)
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('')
  const [enCoursReset, setEnCoursReset] = useState(false)
  const [messageReset, setMessageReset] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)

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

  const agentsFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return agents.filter((a) => {
      if (q && !a.identifiant.toLowerCase().includes(q)) return false
      if (filtreType && a.typeCompte !== filtreType) return false
      if (filtreStatut && a.statut !== filtreStatut) return false
      return true
    })
  }, [agents, recherche, filtreType, filtreStatut])

  const stats = useMemo(() => ({
    total: agents.length,
    actifs: agents.filter((a) => a.statut === 'ACTIF').length,
    verrouilles: agents.filter((a) => a.statut === 'VERROUILLE').length,
    inactifs: agents.filter((a) => a.statut === 'INACTIF').length,
  }), [agents])

  const agentSelectionne = agents.find((a) => a.id === agentSelectionneId) ?? null

  const selectionnerAgent = (agent: AgentDTO) => {
    setAgentSelectionneId(agent.id)
    setResetOuvert(false)
    setNouveauMotDePasse('')
    setMessageReset(null)
    setChargementHistorique(true)
    apiClient.get<HistoriqueConnexionDTO[]>(`/agents/${agent.id}/historique-connexion`)
      .then(({ data }) => setHistorique(data))
      .catch(() => setHistorique([]))
      .finally(() => setChargementHistorique(false))
  }

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

  const reinitialiserMotDePasse = async (e: FormEvent) => {
    e.preventDefault()
    if (!agentSelectionne) return
    setEnCoursReset(true)
    setMessageReset(null)
    try {
      await apiClient.post(`/agents/${agentSelectionne.id}/reset-password`, { nouveauMotDePasse })
      setMessageReset({ type: 'succes', texte: `Mot de passe reinitialise pour ${agentSelectionne.identifiant}.` })
      setNouveauMotDePasse('')
      setResetOuvert(false)
    } catch (err: any) {
      setMessageReset({ type: 'erreur', texte: err?.response?.data?.message ?? 'Reinitialisation impossible.' })
    } finally {
      setEnCoursReset(false)
    }
  }

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><UserCog size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Agents & utilisateurs</h1>
        <p>Creation de comptes, affectation multi-centre (RG-UTI-001), verrouillage automatique apres echecs (RG-UTI-009), reinitialisation de mot de passe et historique de connexion (RG-UTI-003). Aucune suppression physique (RG-UTI-002).</p>
      </div>

      <div className="civilis-stats-mini-rangee">
        <div className="civilis-stat-mini">
          <div className="civilis-stat-mini-icone accent-bleu"><Users size={16} /></div>
          <div><div className="civilis-stat-mini-valeur">{stats.total}</div><div className="civilis-stat-mini-libelle">Comptes au total</div></div>
        </div>
        <div className="civilis-stat-mini">
          <div className="civilis-stat-mini-icone accent-vert"><CircleCheck size={16} /></div>
          <div><div className="civilis-stat-mini-valeur">{stats.actifs}</div><div className="civilis-stat-mini-libelle">Actifs</div></div>
        </div>
        <div className="civilis-stat-mini">
          <div className="civilis-stat-mini-icone accent-ocre"><Lock size={16} /></div>
          <div><div className="civilis-stat-mini-valeur">{stats.verrouilles}</div><div className="civilis-stat-mini-libelle">Verrouilles</div></div>
        </div>
        <div className="civilis-stat-mini">
          <div className="civilis-stat-mini-icone accent-violet"><CircleX size={16} /></div>
          <div><div className="civilis-stat-mini-valeur">{stats.inactifs}</div><div className="civilis-stat-mini-libelle">Desactives</div></div>
        </div>
      </div>

      <div className="civilis-agents-layout">
        <div className="civilis-colonne-liste">
          <div className="civilis-carte civilis-agents-liste-carte">
            <div className="civilis-agents-barre-outils">
              <div className="civilis-agents-recherche">
                <Search size={15} />
                <input aria-label="Rechercher un identifiant" placeholder="Rechercher un identifiant..." value={recherche} onChange={(e) => setRecherche(e.target.value)} />
              </div>
              <div className="civilis-agents-filtres">
                <select className="civilis-select-compact" value={filtreType} onChange={(e) => setFiltreType(e.target.value)}>
                  <option value="">Tous les types</option>
                  <option value="AGENT">Agent</option>
                  <option value="ADMINISTRATEUR">Administrateur</option>
                  <option value="SUPER_ADMIN">Super administrateur</option>
                </select>
                <select className="civilis-select-compact" value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
                  <option value="">Tous les statuts</option>
                  <option value="ACTIF">Actif</option>
                  <option value="VERROUILLE">Verrouille</option>
                  <option value="INACTIF">Desactive</option>
                </select>
              </div>
            </div>

            {chargement ? (
              <div className="civilis-skeleton" style={{ height: 260 }} />
            ) : (
              <div className="civilis-agents-liste">
                {agentsFiltres.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={`civilis-agent-carte-liste ${agentSelectionneId === a.id ? 'actif' : ''}`}
                    onClick={() => selectionnerAgent(a)}
                  >
                    <span className="civilis-avatar-md">{initialesDe(a.identifiant)}</span>
                    <span className="civilis-agent-carte-corps">
                      <span className="civilis-agent-carte-nom">{a.identifiant}</span>
                      <span className="civilis-agent-carte-sous">{LIBELLES_TYPE[a.typeCompte] ?? a.typeCompte}</span>
                    </span>
                    <span className={`civilis-badge ${a.statut === 'ACTIF' ? 'succes' : a.statut === 'VERROUILLE' ? 'alerte' : 'neutre'}`}>{a.statut}</span>
                  </button>
                ))}
                {agentsFiltres.length === 0 && (
                  <div className="civilis-vide" style={{ padding: 30 }}>
                    <ShieldAlert size={26} />
                    <span className="civilis-vide-titre">Aucun compte ne correspond</span>
                    <span className="civilis-vide-detail">Ajustez la recherche ou les filtres ci-dessus.</span>
                  </div>
                )}
              </div>
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
                {enCoursCreation ? 'Creation...' : "Creer l'agent"}
              </button>
              {message && <div className={`civilis-alerte-${message.type === 'succes' ? 'succes' : 'erreur'}`}>{message.texte}</div>}
            </form>
          </div>
        </div>

        <div className="civilis-carte civilis-agent-detail">
          {!agentSelectionne ? (
            <div className="civilis-vide" style={{ padding: 60 }}>
              <UserCog size={32} />
              <span className="civilis-vide-titre">Selectionnez un compte</span>
              <span className="civilis-vide-detail">Cliquez sur un agent dans la liste pour consulter son detail, son historique de connexion et gerer ses acces.</span>
            </div>
          ) : (
            <>
              <div className="civilis-agent-detail-entete">
                <span className="civilis-avatar-lg">{initialesDe(agentSelectionne.identifiant)}</span>
                <div>
                  <div className="civilis-agent-detail-nom">{agentSelectionne.identifiant}</div>
                  <div className="civilis-agent-detail-meta">
                    <span className="civilis-badge neutre">{LIBELLES_TYPE[agentSelectionne.typeCompte] ?? agentSelectionne.typeCompte}</span>
                    <span className={`civilis-badge ${agentSelectionne.statut === 'ACTIF' ? 'succes' : agentSelectionne.statut === 'VERROUILLE' ? 'alerte' : 'neutre'}`}>{agentSelectionne.statut}</span>
                  </div>
                </div>
              </div>

              <div className="civilis-agent-detail-actions">
                {agentSelectionne.statut === 'VERROUILLE' && (
                  <button className="civilis-btn secondaire" disabled={actionEnCours === agentSelectionne.id} onClick={() => deverrouiller(agentSelectionne.id)}>
                    <Unlock size={14} style={{ marginRight: 6 }} />Deverrouiller
                  </button>
                )}
                {agentSelectionne.typeCompte === 'AGENT' && (
                  <button className="civilis-btn secondaire" disabled={actionEnCours === agentSelectionne.id} onClick={() => basculerStatut(agentSelectionne)}>
                    {agentSelectionne.statut === 'ACTIF' ? <UserX size={14} style={{ marginRight: 6 }} /> : <UserCheck size={14} style={{ marginRight: 6 }} />}
                    {agentSelectionne.statut === 'ACTIF' ? 'Desactiver' : 'Reactiver'}
                  </button>
                )}
                <button className="civilis-btn secondaire" onClick={() => { setResetOuvert((v) => !v); setMessageReset(null) }}>
                  <KeyRound size={14} style={{ marginRight: 6 }} />Reinitialiser le mot de passe
                </button>
              </div>

              {resetOuvert && (
                <form onSubmit={reinitialiserMotDePasse} className="civilis-agent-reset-form">
                  <label>Nouveau mot de passe (min. 8 caracteres, une lettre et un chiffre)
                    <input type="password" minLength={8} value={nouveauMotDePasse} onChange={(e) => setNouveauMotDePasse(e.target.value)} required autoFocus />
                  </label>
                  <button className="civilis-btn primaire" type="submit" disabled={enCoursReset}>
                    {enCoursReset ? 'Enregistrement...' : 'Confirmer la reinitialisation'}
                  </button>
                </form>
              )}
              {messageReset && <div className={`civilis-alerte-${messageReset.type === 'succes' ? 'succes' : 'erreur'}`} style={{ marginTop: 10 }}>{messageReset.texte}</div>}

              {agentSelectionne.typeCompte === 'AGENT' && (
                <div className="civilis-agent-section">
                  <h3><ShieldCheck size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Role</h3>
                  <select
                    value={rolesParAgent[agentSelectionne.id] ?? ''}
                    disabled={actionEnCours === agentSelectionne.id}
                    onChange={(e) => e.target.value && affecterRole(agentSelectionne.id, Number(e.target.value))}
                  >
                    <option value="">— Aucun —</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.libelle}</option>)}
                  </select>
                </div>
              )}

              {agentSelectionne.typeCompte === 'AGENT' && (
                <div className="civilis-agent-section">
                  <h3><Building2 size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Centres affectes (RG-UTI-001)</h3>
                  <div className="civilis-chips-centres">
                    {(centresParAgent[agentSelectionne.id] ?? []).map((cid) => {
                      const centre = centres.find((c) => c.id === cid)
                      return (
                        <span key={cid} className="civilis-chip">
                          <Building2 size={11} />
                          {centre?.nom ?? cid}
                          <button type="button" onClick={() => retirerCentre(agentSelectionne.id, cid)} title="Retirer">
                            <X size={11} />
                          </button>
                        </span>
                      )
                    })}
                    <select
                      value=""
                      disabled={actionEnCours === agentSelectionne.id}
                      onChange={(e) => e.target.value && affecterCentre(agentSelectionne.id, Number(e.target.value))}
                      className="civilis-select-compact"
                    >
                      <option value="">+ Affecter...</option>
                      {centres.filter((c) => !(centresParAgent[agentSelectionne.id] ?? []).includes(c.id)).map((c) => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="civilis-agent-section">
                <h3><History size={14} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />Historique de connexion</h3>
                {chargementHistorique ? (
                  <div className="civilis-skeleton" style={{ height: 100 }} />
                ) : historique.length === 0 ? (
                  <p className="civilis-texte-discret">Aucune tentative de connexion enregistree pour ce compte.</p>
                ) : (
                  <ul className="civilis-historique-liste">
                    {historique.map((h) => (
                      <li key={h.id} className={`civilis-historique-item ${h.statut === 'REUSSIE' ? 'succes' : 'echec'}`}>
                        <span className="civilis-historique-icone">
                          {h.statut === 'REUSSIE' ? <LogIn size={13} /> : <LogOutIcon size={13} />}
                        </span>
                        <span className="civilis-historique-texte">
                          {h.statut === 'REUSSIE' ? 'Connexion reussie' : 'Tentative echouee'}
                          {h.adresseIp && <span className="civilis-texte-discret"> · {h.adresseIp}</span>}
                        </span>
                        <span className="civilis-historique-date">{new Date(h.dateConnexion).toLocaleString('fr-FR')}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
