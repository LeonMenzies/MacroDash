import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Nav from './components/Nav';
import MacroDashboard from './pages/MacroDashboard';
import ExecSummary from './pages/ExecSummary';
import CatalystBrain from './pages/CatalystBrain';
import StockDetail from './pages/StockDetail';
import Ideas from './pages/Ideas';
import Tickers from './pages/Tickers';
import IndustryDrilldown from './pages/IndustryDrilldown';

function CatalystTickerRedirect() {
  const { ticker } = useParams<{ ticker: string }>();
  return <Navigate to={`/stock/${ticker}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Nav />
      <main className="page-main">
        <Routes>
          <Route path="/" element={<MacroDashboard />} />
          <Route path="/exec-summary" element={<ExecSummary />} />
          <Route path="/catalyst-brain" element={<CatalystBrain />} />
          <Route path="/catalyst-brain/:ticker" element={<CatalystTickerRedirect />} />
          <Route path="/stock/:ticker" element={<StockDetail />} />
          <Route path="/ideas" element={<Ideas />} />
          <Route path="/tickers" element={<Tickers />} />
          <Route path="/industry" element={<IndustryDrilldown />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
