import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import StudentList from './components/StudentList';
import StudentDetail from './components/StudentDetail';
import Toast from './components/Toast';

function App() {
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
        {/* Navigation Bar */}
        <header className="sticky top-0 z-30 w-full glass-panel border-b border-white/5 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <span className="h-9 w-9 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-all">
                Z
              </span>
              <span className="text-lg font-extrabold text-white tracking-tight group-hover:text-indigo-400 transition-colors">
                Zeero<span className="gradient-text font-black">stock</span>
              </span>
            </Link>

            <nav className="flex items-center gap-6">
              <Link
                to="/"
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <a
                href="http://localhost:5001/api/health"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              >
                ● API Online
              </a>
            </nav>
          </div>
        </header>

        {/* Main Workspace content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={<StudentList showToast={showToast} />} />
            <Route path="/students/:id" element={<StudentDetail showToast={showToast} />} />
          </Routes>
        </main>

        {/* Global Footer */}
        <footer className="w-full py-6 mt-12 border-t border-white/5 bg-black/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Zeerostock Systems. All rights reserved.
            </p>
            <div className="flex gap-4">
              <span className="text-xs text-indigo-400/70 font-semibold font-mono">
                Express + PostgreSQL + React.js
              </span>
            </div>
          </div>
        </footer>

        {/* Global Toast Alerts */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
