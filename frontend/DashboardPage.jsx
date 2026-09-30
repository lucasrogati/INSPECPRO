import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BuildingsPage from './pages/BuildingsPage';
import BuildingDetailPage from './pages/BuildingDetailPage';
import UsersPage from './pages/UsersPage';
import InspectionsPage from './pages/InspectionsPage';
import InspectionDetailPage from './pages/InspectionDetailPage';
import AnomaliasPage from './pages/AnomaliasPage';
import AnomaliaDetailPage from './pages/AnomaliaDetailPage';
import ManutencoesPage from './pages/ManutencoesPage';
import RelatoriosPage from './pages/RelatoriosPage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';
import AppLayout from './components/AppLayout';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/predios" element={<BuildingsPage />} />
        <Route path="/predios/:id" element={<BuildingDetailPage />} />
        <Route path="/inspecoes" element={<InspectionsPage />} />
        <Route path="/inspecoes/:id" element={<InspectionDetailPage />} />
        <Route path="/anomalias" element={<AnomaliasPage />} />
        <Route path="/anomalias/:id" element={<AnomaliaDetailPage />} />
        <Route path="/manutencoes" element={<ManutencoesPage />} />
        <Route path="/relatorios" element={<RelatoriosPage />} />
        <Route
          path="/usuarios"
          element={
            <RoleRoute tiposPermitidos={['administrador']}>
              <UsersPage />
            </RoleRoute>
          }
        />
        <Route path="/configuracoes" element={<ConfiguracoesPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
