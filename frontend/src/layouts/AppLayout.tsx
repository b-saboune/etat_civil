import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import NotificationCloche from '@/components/NotificationCloche'
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
  Landmark,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  FileBarChart2,
} from 'lucide-react'

interface NavItem {
  to: string
  label: string
  icon: ReactNode
  section: string
  permission?: string
  superAdminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { to: '/tableau-de-bord', label: 'Tableau de bord', icon: <LayoutDashboard size={19} />, section: 'Pilotage', permission: 'PILOTAGE_CONSULTER' },
  { to: '/rapports', label: 'Rapports', icon: <FileBarChart2 size={19} />, section: 'Pilotage', permission: 'PILOTAGE_CONSULTER' },
  { to: '/recherche', label: 'Recherche', icon: <Search size={19} />, section: 'Operations', permission: 'RECHERCHE_CONSULTER' },
  { to: '/indexation', label: 'Indexation', icon: <FileStack size={19} />, section: 'Operations', permission: 'INDEXATION_CREER' },
  { to: '/personnes', label: 'Personnes', icon: <Users size={19} />, section: 'Operations', permission: 'PERSONNE_GERER' },
  { to: '/registres', label: 'Registres', icon: <BookMarked size={19} />, section: 'Operations' },
  { to: '/referentiels', label: 'Referentiels', icon: <Building2 size={19} />, section: 'Administration', permission: 'REFERENTIEL_GERER' },
  { to: '/utilisateurs', label: 'Agents & utilisateurs', icon: <UserCog size={19} />, section: 'Administration', permission: 'UTILISATEUR_GERER' },
  { to: '/roles-permissions', label: 'Roles & permissions', icon: <ShieldCheck size={19} />, section: 'Administration', permission: 'ROLE_GERER' },
  { to: '/journal', label: "Journal d'activite", icon: <ScrollText size={19} />, section: 'Administration', permission: 'AUDIT_CONSULTER' },
  { to: '/parametrage', label: 'Parametrage', icon: <Settings size={19} />, section: 'Administration', permission: 'PARAMETRAGE_GERER' },
  { to: '/administration', label: 'Super Administration', icon: <Landmark size={19} />, section: 'Administration', superAdminOnly: true },
]

const SECTIONS = ['Pilotage', 'Operations', 'Administration']

// RG-transversal (vague 2 de la refonte UI) : la sidebar reduite/etendue est une
// preference d'affichage, pas une donnee metier -- elle est desormais persistee
// (localStorage) pour ne pas se reinitialiser a chaque rechargement de page,
// ce qui etait percu comme un defaut d'ergonomie sur un usage quotidien.
const CLE_SIDEBAR_REDUITE = 'civilis.sidebarReduite'

function lireSidebarReduite(): boolean {
  try {
    return localStorage.getItem(CLE_SIDEBAR_REDUITE) === '1'
  } catch {
    return false
  }
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { utilisateur, deconnecter, aPermission } = useAuth()
  const [reduit, setReduit] = useState(lireSidebarReduite)
  const [ouvertMobile, setOuvertMobile] = useState(false)
  const location = useLocation()
  const initiales = utilisateur ? utilisateur.identifiant.slice(0, 2).toUpperCase() : ''

  useEffect(() => {
    try {
      localStorage.setItem(CLE_SIDEBAR_REDUITE, reduit ? '1' : '0')
    } catch {
      /* stockage indisponible (navigation privee, quota) : degradation silencieuse, sans impact fonctionnel */
    }
  }, [reduit])

  const visible = (item: NavItem) => {
    if (item.superAdminOnly) return utilisateur?.typeCompte === 'SUPER_ADMIN'
    if (!item.permission) return true
    return aPermission(item.permission)
  }

  // Fil d'ariane reel (section > page courante), derive de la meme source que
  // la navigation plutot que d'un texte fixe sans rapport avec l'ecran affiche.
  const pageCourante = useMemo(() => NAV_ITEMS.find((i) => i.to === location.pathname), [location.pathname])

  return (
    <div className={`civilis-shell ${reduit ? 'reduit' : ''} ${ouvertMobile ? 'mobile-ouvert' : ''}`}>
      <a href="#civilis-contenu-principal" className="civilis-lien-evasion">Aller au contenu principal</a>
      <div className="civilis-voile-mobile" onClick={() => setOuvertMobile(false)} />
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

        <nav className="civilis-nav" aria-label="Navigation principale">
          {SECTIONS.map((section) => {
            const items = NAV_ITEMS.filter((i) => i.section === section && visible(i))
            if (items.length === 0) return null
            return (
              <div key={section} className="civilis-nav-section">
                {!reduit && <div className="civilis-nav-titre">{section}</div>}
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setOuvertMobile(false)}
                    className={({ isActive }) => `civilis-nav-item ${isActive ? 'actif' : ''}`}
                    title={reduit ? item.label : undefined}
                  >
                    <span className="civilis-nav-icone">{item.icon}</span>
                    {!reduit && <span>{item.label}</span>}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

        {!reduit && <div className="civilis-sidebar-pied">CIVILIS · Collectivites territoriales du Togo</div>}

        <button
          className="civilis-sidebar-toggle"
          onClick={() => setReduit((v) => !v)}
          aria-label={reduit ? 'Deplier le menu' : 'Reduire le menu'}
          aria-pressed={reduit}
        >
          {reduit ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </aside>

      <div className="civilis-corps">
        <header className="civilis-topbar-fine">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button className="civilis-bouton-menu-mobile" onClick={() => setOuvertMobile(true)} aria-label="Ouvrir le menu">
              <Menu size={20} />
            </button>
            <nav aria-label="Fil d'ariane" className="civilis-fil-ariane">
              <NavLink to="/tableau-de-bord">Accueil</NavLink>
              {pageCourante && (
                <>
                  <ChevronRight size={12} className="civilis-fil-ariane-separateur" />
                  <span className="civilis-fil-ariane-section">{pageCourante.section}</span>
                  <ChevronRight size={12} className="civilis-fil-ariane-separateur" />
                  <span aria-current="page">{pageCourante.label}</span>
                </>
              )}
            </nav>
          </div>
          {utilisateur && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <NotificationCloche />
              <div className="civilis-utilisateur-chip">
                <div className="civilis-avatar">{initiales}</div>
                <span>{utilisateur.identifiant} · {utilisateur.typeCompte}</span>
                <button className="civilis-btn secondaire civilis-btn-icone" onClick={deconnecter} title="Deconnexion">
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          )}
        </header>
        <main className="civilis-contenu" id="civilis-contenu-principal" tabIndex={-1}>
          <div key={location.pathname} className="civilis-contenu-transition">{children}</div>
        </main>
        <footer className="civilis-pied-shell">
          CIVILIS · Republique Togolaise · Collectivites territoriales
        </footer>
      </div>
    </div>
  )
}
