import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<h1>Halaman Beranda (Segera Hadir)</h1>} />
        <Route path="/login" element={<h1>Halaman Login (Segera Hadir)</h1>} />
      </Routes>
    </Router>
  );
}

export default App;