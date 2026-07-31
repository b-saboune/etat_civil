import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import {
  LayoutDashboard,
  Search,
  FileStack,
  Users,
  BookMarked,
  Building2,
  ShieldCheck,
  UserCog,
  ScrollText,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  section: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/tableau-de-bord', label: 'Tableau de bord', icon: <LayoutDashboard size={19} />, section: 'Pilotage' },
  { to: '/recherche', label: 'Recherche', icon: <Search size={19} />, section: 'Operations' },
  { to: '/indexation', label: 'Indexation', icon: <FileStack size={19} />, section: 'Operations' },
  { to: '/personnes', label: 'Personnes', icon: <Users size={19} />, section: 'Operations' },
  { to: '/registres', label: 'Registres', icon: <BookMarked size={19} />, section: 'Operations' },
  { to: '/referentiels', label: 'Referentiels', icon: <Building2 size={19} />, section: 'Administration' },
  { to: '/utilisateurs', label: 'Agents & utilisateurs', icon: <UserCog size={19} />, section: 'Administration' },
  { to: '/roles-permissions', label: 'Roles & permissions', icon: <ShieldCheck size={19} />, section: 'Administration' },
  { to: '/journal', label: "Journal d'activite", icon: <ScrollText size={19} />, section: 'Administration' },
  { to: '/parametrage', label: 'Parametrage', icon: <Settings size={19} />, section: 'Administration' },
]

const SECTIONS = ['Pilotage', 'Operations', 'Administration']

export default function AppLayout({ children }: { children: ReactNode }) {
  const { utilisateur, deconnecter } = useAuth()
  const [reduit, setReduit] = useState(false)
  const initiales = utilisateur ? utilisateur.identifiant.slice(0, 2).toUpperCase() : ''

  return (
    <div className={`civilis-shell ${reduit ? 'reduit' : ''}`}>
      <aside className="civilis-sidebar">
        <div className="civilis-sidebar-tete">
          <div className="civilis-logo">CV</div>
          {!reduit && (
            <div>
              <div className="marque">CIVILIS</div>
              <div className="sous-marque">Republique togolaise</div>
            </div>
          )}
        </div>

        <nav className="civilis-nav">
          {SECTIONS.map((section) => (
            <div key={section} className="civilis-nav-section">
              {!reduit && <div className="civilis-nav-titre">{section}</div>}
              {NAV_ITEMS.filter((i) => i.section === section).map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `civilis-nav-item ${isActive ? 'actif' : ''}`}
                  title={reduit ? item.label : undefined}
                >
                  <span className="civilis-nav-icone">{item.icon}</span>
                  {!reduit && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <button className="civilis-sidebar-toggle" onClick={() => setReduit((v) => !v)}>
          {reduit ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      <div className="civilis-corps">
        <header className="civilis-topbar-fine">
          <div className="civilis-fil-ariane">Republique togolaise · Ministere de l'Administration territoriale</div>
          {utilisateur && (
            <div className="civilis-utilisateur-chip">
              <div className="civilis-avatar">{initiales}</div>
              <span>{utilisateur.identifiant} · {utilisateur.typeCompte}</span>
              <button className="civilis-btn secondaire civilis-btn-icone" onClick={deconnecter} title="Deconnexion">
                <LogOut size={15} />
              </button>
            </div>
          )}
        </header>
        <main className="civilis-contenu">{children}</main>
      </div>
    </div>
  )
}
