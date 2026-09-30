import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', height: '100%', background: '#eef2f7' }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          overflowY: 'auto',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}
