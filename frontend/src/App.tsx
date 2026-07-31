import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthContext'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import AppLayout from '@/layouts/AppLayout'
import LoginPage from '@/features/authentification/LoginPage'
import RecherchePage from '@/features/recherche/RecherchePage'
import TableauDeBordPage from '@/features/pilotage/TableauDeBordPage'
import ReferentielsPage from '@/features/referentiels/ReferentielsPage'
import RegistresPage from '@/features/registres/RegistresPage'
import UtilisateursPage from '@/features/utilisateurs/UtilisateursPage'
import RolesPermissionsPage from '@/features/rbac/RolesPermissionsPage'
import JournalPage from '@/features/audit/JournalPage'
import ParametragePage from '@/features/parametrage/ParametragePage'
import PersonnesPage from '@/features/personnes/PersonnesPage'
import IndexationPage from '@/features/indexation/IndexationPage'

function Protegee({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/tableau-de-bord" element={<Protegee><TableauDeBordPage /></Protegee>} />
          <Route path="/recherche" element={<Protegee><RecherchePage /></Protegee>} />
          <Route path="/indexation" element={<Protegee><IndexationPage /></Protegee>} />
          <Route path="/personnes" element={<Protegee><PersonnesPage /></Protegee>} />
          <Route path="/registres" element={<Protegee><RegistresPage /></Protegee>} />
          <Route path="/referentiels" element={<Protegee><ReferentielsPage /></Protegee>} />
          <Route path="/utilisateurs" element={<Protegee><UtilisateursPage /></Protegee>} />
          <Route path="/roles-permissions" element={<Protegee><RolesPermissionsPage /></Protegee>} />
          <Route path="/journal" element={<Protegee><JournalPage /></Protegee>} />
          <Route path="/parametrage" element={<Protegee><ParametragePage /></Protegee>} />
          <Route path="*" element={<Navigate to="/tableau-de-bord" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
