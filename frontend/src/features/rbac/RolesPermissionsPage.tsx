import { Fragment, useEffect, useState, type FormEvent } from 'react'
import { apiClient } from '@/api/client'
import type { RoleDTO, PermissionDTO } from '@/types'
import { ShieldCheck, Plus, Save, Pencil, Check, X } from 'lucide-react'

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<RoleDTO[]>([])
  const [permissions, setPermissions] = useState<PermissionDTO[]>([])
  const [selections, setSelections] = useState<Record<number, Set<number>>>({})
  const [chargement, setChargement] = useState(true)
  const [nouveauRole, setNouveauRole] = useState('')
  const [descriptionRole, setDescriptionRole] = useState('')
  const [enregistrementEnCours, setEnregistrementEnCours] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'succes' | 'erreur'; texte: string } | null>(null)
  const [roleEnEdition, setRoleEnEdition] = useState<number | null>(null)
  const [libelleEdition, setLibelleEdition] = useState('')

  const charger = () => {
    setChargement(true)
    Promise.all([apiClient.get<RoleDTO[]>('/roles'), apiClient.get<PermissionDTO[]>('/permissions')])
      .then(async ([r, p]) => {
        setRoles(r.data)
        setPermissions(p.data)
        const entrees = await Promise.all(
          r.data.map((role) => apiClient.get<number[]>(`/roles/${role.id}/permissions`).then((res) => [role.id, new Set(res.data)] as const))
        )
        setSelections(Object.fromEntries(entrees))
      })
      .catch(() => {})
      .finally(() => setChargement(false))
  }

  useEffect(charger, [])

  const basculerPermission = (roleId: number, permissionId: number) => {
    setSelections((prev) => {
      const ensemble = new Set(prev[roleId] ?? [])
      if (ensemble.has(permissionId)) ensemble.delete(permissionId)
      else ensemble.add(permissionId)
      return { ...prev, [roleId]: ensemble }
    })
  }

  const enregistrer = async (roleId: number) => {
    setEnregistrementEnCours(roleId)
    try {
      await apiClient.put(`/roles/${roleId}/permissions`, { permissionIds: Array.from(selections[roleId] ?? []) })
      setMessage({ type: 'succes', texte: 'Matrice de permissions mise a jour.' })
    } catch (err: any) {
      setMessage({ type: 'erreur', texte: err?.response?.data?.message ?? 'Enregistrement impossible.' })
    } finally {
      setEnregistrementEnCours(null)
    }
  }

  const creerRole = async (e: FormEvent) => {
    e.preventDefault()
    await apiClient.post('/roles', { libelle: nouveauRole, description: descriptionRole || undefined })
    setNouveauRole(''); setDescriptionRole('')
    charger()
  }

  const renommerRole = async (role: RoleDTO) => {
    const libelle = libelleEdition.trim()
    if (!libelle || libelle === role.libelle) { setRoleEnEdition(null); return }
    try {
      await apiClient.patch(`/roles/${role.id}`, { libelle, description: role.description })
      setRoles((prev) => prev.map((r) => (r.id === role.id ? { ...r, libelle } : r)))
      setMessage({ type: 'succes', texte: `Role renomme en "${libelle}".` })
    } catch (err: any) {
      setMessage({ type: 'erreur', texte: err?.response?.data?.message ?? 'Renommage impossible.' })
    } finally {
      setRoleEnEdition(null)
    }
  }

  const modules = Array.from(new Set(permissions.map((p) => p.module)))

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><ShieldCheck size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Roles & permissions</h1>
        <p>Matrice des permissions par role et par module (RG-RBAC-001, RG-RBAC-002). Le Super Admin echappe a cette evaluation (RG-ADM-002). Les modifications prennent effet a la prochaine connexion de l'utilisateur.</p>
      </div>

      {chargement ? (
        <div className="civilis-skeleton" style={{ height: 300 }} />
      ) : (
        <>
          {message && <div className={`civilis-alerte-${message.type === 'succes' ? 'succes' : 'erreur'}`} style={{ marginBottom: 16 }}>{message.texte}</div>}

          <div className="civilis-carte" style={{ overflowX: 'auto' }}>
            <table className="civilis-tableau">
              <thead>
                <tr>
                  <th>Module / Action</th>
                  {roles.map((r) => (
                    <th key={r.id}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, textTransform: 'none', fontSize: 13 }}>
                        {roleEnEdition === r.id ? (
                          <>
                            <input
                              autoFocus
                              value={libelleEdition}
                              onChange={(e) => setLibelleEdition(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') renommerRole(r); if (e.key === 'Escape') setRoleEnEdition(null) }}
                              style={{ width: 110, fontSize: 13, padding: '4px 6px' }}
                            />
                            <button className="civilis-btn secondaire civilis-btn-icone" title="Valider" onClick={() => renommerRole(r)}>
                              <Check size={13} />
                            </button>
                            <button className="civilis-btn secondaire civilis-btn-icone" title="Annuler" onClick={() => setRoleEnEdition(null)}>
                              <X size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            {r.libelle}
                            <span className="civilis-rbac-compte-badge" title="Permissions accordees">
                              {selections[r.id]?.size ?? 0}/{permissions.length}
                            </span>
                            <button
                              className="civilis-btn secondaire civilis-btn-icone"
                              onClick={() => { setRoleEnEdition(r.id); setLibelleEdition(r.libelle) }}
                              title="Renommer ce role"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              className="civilis-btn secondaire civilis-btn-icone"
                              onClick={() => enregistrer(r.id)}
                              disabled={enregistrementEnCours === r.id}
                              title="Enregistrer la matrice pour ce role"
                            >
                              <Save size={13} />
                            </button>
                          </>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => (
                  <Fragment key={module}>
                    <tr className="civilis-rbac-module-entete">
                      <td colSpan={roles.length + 1}>{module}</td>
                    </tr>
                    {permissions.filter((p) => p.module === module).map((p) => (
                      <tr key={p.id}>
                        <td style={{ paddingLeft: 20 }}>{p.action}</td>
                        {roles.map((r) => (
                          <td key={r.id} style={{ textAlign: 'center' }}>
                            <label className="civilis-toggle-permission">
                              <input
                                type="checkbox"
                                checked={selections[r.id]?.has(p.id) ?? false}
                                onChange={() => basculerPermission(r.id, p.id)}
                              />
                              <span className="civilis-toggle-permission-rail" />
                            </label>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </Fragment>
                ))}
                {permissions.length === 0 && <tr><td colSpan={roles.length + 1} className="civilis-vide">Aucune permission definie.</td></tr>}
              </tbody>
            </table>
          </div>

          <div className="civilis-carte" style={{ maxWidth: 480 }}>
            <h2>Nouveau role</h2>
            <form onSubmit={creerRole} className="civilis-formulaire">
              <label>Libelle
                <input value={nouveauRole} onChange={(e) => setNouveauRole(e.target.value)} required />
              </label>
              <label>Description
                <input value={descriptionRole} onChange={(e) => setDescriptionRole(e.target.value)} />
              </label>
              <button className="civilis-btn primaire" type="submit" style={{ width: 'fit-content' }}>
                <Plus size={14} style={{ marginRight: 6 }} />Creer le role
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
