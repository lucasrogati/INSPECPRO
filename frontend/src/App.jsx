import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BuildingsPage from './pages/BuildingsPage';
import BuildingDetailPage from './pages/BuildingDetailPage';
import UsersPage from './pages/UsersPage';
import InspectionsPage from './pages/InspectionsPage';
import InspectionDetailPage from './pages/InspectionDetailPage';
import EmDesenvolvimento from './pages/EmDesenvolvimento';
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
        <Route path="/anomalias" element={<EmDesenvolvimento titulo="Anomalias" fase="Fase 4" />} />
        <Route path="/manutencoes" element={<EmDesenvolvimento titulo="Manutenções" fase="Fase 5" />} />
        <Route path="/relatorios" element={<EmDesenvolvimento titulo="Relatórios" fase="Fase 6" />} />
        <Route
          path="/usuarios"
          element={
            <RoleRoute tiposPermitidos={['administrador']}>
              <UsersPage />
            </RoleRoute>
          }
        />
        <Route path="/configuracoes" element={<EmDesenvolvimento titulo="Configurações" fase="uma próxima fase" />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
