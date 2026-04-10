import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Nav from './components/Nav';
import MacroDashboard from './pages/MacroDashboard';
import ExecSummary from './pages/ExecSummary';
import CatalystBrain from './pages/CatalystBrain';
import CatalystTicker from './pages/CatalystTicker';
import Ideas from './pages/Ideas';

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main style={{ padding: '24px 32px' }}>
        <Routes>
          <Route path="/" element={<MacroDashboard />} />
          <Route path="/exec-summary" element={<ExecSummary />} />
          <Route path="/catalyst-brain" element={<CatalystBrain />} />
          <Route path="/catalyst-brain/:ticker" element={<CatalystTicker />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
