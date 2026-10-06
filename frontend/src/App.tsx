import { Routes, Route } from 'react-router-dom';
import HealthPage from './pages/HealthPage';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>ShiftOps</h1>
        <p>Staff Operations Platform</p>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HealthPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
