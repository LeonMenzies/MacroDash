import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/Nav';
import Dashboard from './pages/Dashboard';
import ExecSummary from './pages/ExecSummary';
import CatalystBrain from './pages/CatalystBrain';
import CatalystTicker from './pages/CatalystTicker';

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main style={{ padding: '24px 32px' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/exec-summary" element={<ExecSummary />} />
          <Route path="/catalyst-brain" element={<CatalystBrain />} />
          <Route path="/catalyst-brain/:ticker" element={<CatalystTicker />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
