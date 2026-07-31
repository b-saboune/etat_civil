import { useEffect, useState } from 'react'
import { apiClient } from '@/api/client'
import type { RoleDTO, PermissionDTO } from '@/types'
import { ShieldCheck } from 'lucide-react'

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<RoleDTO[]>([])
  const [permissions, setPermissions] = useState<PermissionDTO[]>([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    Promise.all([apiClient.get<RoleDTO[]>('/roles'), apiClient.get<PermissionDTO[]>('/permissions')])
      .then(([r, p]) => { setRoles(r.data); setPermissions(p.data) })
      .finally(() => setChargement(false))
  }, [])

  const modules = Array.from(new Set(permissions.map((p) => p.module)))

  return (
    <div className="civilis-page civilis-entree-douce">
      <div className="civilis-page-entete">
        <h1><ShieldCheck size={22} style={{ verticalAlign: 'text-bottom', marginRight: 8 }} />Roles & permissions</h1>
        <p>Matrice des permissions par role et par module (RG-RBAC-001, RG-RBAC-002). Le Super Admin echappe a cette evaluation (RG-ADM-002).</p>
      </div>

      {chargement ? (
        <div className="civilis-skeleton" style={{ height: 300 }} />
      ) : (
        <div className="civilis-carte" style={{ overflowX: 'auto' }}>
          <table className="civilis-tableau">
            <thead>
              <tr>
                <th>Module</th>
                {roles.map((r) => <th key={r.id}>{r.libelle}</th>)}
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => (
                <tr key={module}>
                  <td>{module}</td>
                  {roles.map((r) => (
                    <td key={r.id}>
                      {permissions.filter((p) => p.module === module).map((p) => (
                        <span key={p.code} className="civilis-badge neutre" style={{ marginRight: 4, marginBottom: 4 }}>{p.action}</span>
                      ))}
                    </td>
                  ))}
                </tr>
              ))}
              {modules.length === 0 && <tr><td colSpan={roles.length + 1} className="civilis-vide">Aucune permission definie.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
