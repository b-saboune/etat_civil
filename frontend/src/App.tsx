import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthContext'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { useAuth } from '@/auth/AuthContext'
import AppLayout from '@/layouts/AppLayout'
import ToastHost from '@/components/ToastHost'
import PageLoader from '@/components/PageLoader'
import LoginPage from '@/features/authentification/LoginPage'

const RecherchePage = lazy(() => import('@/features/recherche/RecherchePage'))
const TableauDeBordPage = lazy(() => import('@/features/pilotage/TableauDeBordPage'))
const ReferentielsPage = lazy(() => import('@/features/referentiels/ReferentielsPage'))
const RegistresPage = lazy(() => import('@/features/registres/RegistresPage'))
const UtilisateursPage = lazy(() => import('@/features/utilisateurs/UtilisateursPage'))
const RolesPermissionsPage = lazy(() => import('@/features/rbac/RolesPermissionsPage'))
const JournalPage = lazy(() => import('@/features/audit/JournalPage'))
const ParametragePage = lazy(() => import('@/features/parametrage/ParametragePage'))
const PersonnesPage = lazy(() => import('@/features/personnes/PersonnesPage'))
const IndexationPage = lazy(() => import('@/features/indexation/IndexationPage'))
const AdministrationPage = lazy(() => import('@/features/administration/AdministrationPage'))
const RapportsPage = lazy(() => import('@/features/rapports/RapportsPage'))

function Protegee({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </AppLayout>
    </ProtectedRoute>
  )
}

function RedirectionAccueil() {
  const { utilisateur, aPermission } = useAuth()
  if (!utilisateur) return <Navigate to="/connexion" replace />
  if (aPermission('PILOTAGE_CONSULTER')) return <Navigate to="/tableau-de-bord" replace />
  if (aPermission('RECHERCHE_CONSULTER')) return <Navigate to="/recherche" replace />
  return <Navigate to="/connexion" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <ToastHost />
      <BrowserRouter>
        <Routes>
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/tableau-de-bord" element={<Protegee><TableauDeBordPage /></Protegee>} />
          <Route path="/rapports" element={<Protegee><RapportsPage /></Protegee>} />
          <Route path="/recherche" element={<Protegee><RecherchePage /></Protegee>} />
          <Route path="/indexation" element={<Protegee><IndexationPage /></Protegee>} />
          <Route path="/personnes" element={<Protegee><PersonnesPage /></Protegee>} />
          <Route path="/registres" element={<Protegee><RegistresPage /></Protegee>} />
          <Route path="/referentiels" element={<Protegee><ReferentielsPage /></Protegee>} />
          <Route path="/utilisateurs" element={<Protegee><UtilisateursPage /></Protegee>} />
          <Route path="/roles-permissions" element={<Protegee><RolesPermissionsPage /></Protegee>} />
          <Route path="/journal" element={<Protegee><JournalPage /></Protegee>} />
          <Route path="/parametrage" element={<Protegee><ParametragePage /></Protegee>} />
          <Route path="/administration" element={<Protegee><AdministrationPage /></Protegee>} />
          <Route path="*" element={<RedirectionAccueil />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
