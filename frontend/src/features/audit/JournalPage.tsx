import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '@/api/client'
import { ScrollText, User, Clock } from 'lucide-react'

interface JournalEntree {
  id: number
  utilisateur?: { identifiant: string } | null
  module: string
  action: string
  dateHeure: string
  details?: string
}

const PALETTE_MODULE = ['#2f5da3', '#c98a2e', '#1f8a4c', '#4338ca', '#b42318', '#0f766e']

function couleurModule(module: string) {
  let hash = 0
  for (let i = 0; i < module.length; i += 1) hash = module.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE_MODULE[Math.abs(hash) % PALETTE_MODULE.length]
}

export default function JournalPage() {
  const [entrees, setEntrees] = useState<JournalEntree[]>([])
  const [chargement, setChargement] = useState(true)
  const [filtreModule, setFiltreModule] = useState<string | null>(null)

  useEffect(() => {
    apiClient.get<JournalEntree[]>('/journal').then(({ data }) => setEntrees(data)).catch(() => {}).finally(() => setChargement(false))
  }, [])

  const trie = useMemo(
    () => entrees.slice().sort((a, b) => (a.dateHeure < b.dateHeure ? 1 : -1)),
    [entrees]
  )
  const modules = useMemo(() => Array.from(new Set(entrees.map((e) => e.module))).sort(), [entrees])
  const filtrees = filtreModule ? trie.filter((e) => e.module === filtreModule) : trie

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
          {modules.length > 1 && (
            <div className="civilis-journal-filtres">
              <button
                className={`civilis-filtre-puce ${filtreModule === null ? 'actif' : ''}`}
                onClick={() => setFiltreModule(null)}
              >
                Tous ({entrees.length})
              </button>
              {modules.map((m) => (
                <button
                  key={m}
                  className={`civilis-filtre-puce ${filtreModule === m ? 'actif' : ''}`}
                  onClick={() => setFiltreModule(m)}
                >
                  {m} ({entrees.filter((e) => e.module === m).length})
                </button>
              ))}
            </div>
          )}

          {filtrees.length === 0 ? (
            <div className="civilis-vide">Aucune activite enregistree.</div>
          ) : (
            <div className="civilis-timeline">
              {filtrees.map((e, index) => {
                const couleur = couleurModule(e.module)
                return (
                  <div key={e.id} className="civilis-timeline-item" style={{ animationDelay: `${Math.min(index, 20) * 25}ms` }}>
                    <span className="civilis-timeline-point" style={{ background: couleur }} />
                    <div className="civilis-timeline-carte">
                      <div className="civilis-timeline-module" style={{ color: couleur }}>{e.module} · {e.action}</div>
                      <div className="civilis-timeline-meta">
                        <span><Clock size={11} style={{ verticalAlign: 'text-bottom', marginRight: 3 }} />{new Date(e.dateHeure).toLocaleString('fr-FR')}</span>
                        <span><User size={11} style={{ verticalAlign: 'text-bottom', marginRight: 3 }} />{e.utilisateur?.identifiant ?? 'Systeme'}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
