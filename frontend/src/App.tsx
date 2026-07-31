import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/auth/AuthContext'
import { ProtectedRoute } from '@/auth/ProtectedRoute'
import AppLayout from '@/layouts/AppLayout'
import LoginPage from '@/features/authentification/LoginPage'
import RecherchePage from '@/features/recherche/RecherchePage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/connexion" element={<LoginPage />} />
          <Route
            path="/recherche"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <RecherchePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/recherche" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
