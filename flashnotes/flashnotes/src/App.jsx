import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SessionProvider, SessionContext } from './Context/SessionContext';

import Home from './components/Home'
import LoginForm  from './components/UserLogin';
import CreateNote from './components/CreateNote';
import UserRegistrationForm from './components/UserRegistrationForm'
import AdminRole from './components/AdminRole';
import Categorias from './components/Categorias';
import ListCategorias from './components/ListCategorias';
import Notas from './components/Views/Notas';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './components/AdminDashboard';
import Profile from './components/Profile';
import './App.css'

function AppContent() {
  const { user, logout, isAdmin } = React.useContext(SessionContext);
  const [isMenuOpen, setMenuOpen] = React.useState(false);

  const handleLinkClick = () => {
    setMenuOpen(false); // Close menu when a link is clicked
  };

  const handleLogout = () => {
    logout();
    handleLinkClick();
  }

  return (
    <>
      <header className="header">
        <Link to="/" className="logo" onClick={handleLinkClick}>
          Flash <span>Notes</span>
          {isAdmin && <span className="badge-admin">Admin</span>}
        </Link>
        <i 
          className={`bx ${isMenuOpen ? 'bx-x' : 'bx-menu'}`} 
          id="menu-icon" 
          onClick={() => setMenuOpen(!isMenuOpen)}
        ></i>

        <div 
          className={`nav-backdrop ${isMenuOpen ? 'active' : ''}`} 
          onClick={() => setMenuOpen(false)}
        ></div>

        <nav className={`navigation ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={handleLinkClick}>
            <i className='bx bx-home-alt'></i> Home
          </Link>
          {!user ? (
            <>
              <Link to="/register" onClick={handleLinkClick}>
                <i className='bx bx-user-plus'></i> Register
              </Link>
              <Link to="/login" onClick={handleLinkClick}>
                <i className='bx bx-log-in'></i> Log in
              </Link>
            </>
          ) : (
            <>
              <Link to="/note" onClick={handleLinkClick}>
                <i className='bx bx-note'></i> Mis Notas
              </Link>
              <Link to="/create" onClick={handleLinkClick}>
                <i className='bx bx-plus-circle'></i> Crear Nota
              </Link>
              <Link to="/categorias" onClick={handleLinkClick}>
                <i className='bx bx-category'></i> Categorías
              </Link>
              <Link to="/profile" onClick={handleLinkClick}>
                <i className='bx bx-user-circle'></i> Perfil
              </Link>
              {isAdmin && (
                <Link to="/asignar-role" onClick={handleLinkClick}>
                  <i className='bx bx-shield-quarter'></i> Admin Roles
                </Link>
              )}
              {isAdmin && (
                <Link to="/admin" onClick={handleLinkClick}>
                  <i className='bx bx-cog'></i> Panel Admin
                </Link>
              )}
              <button onClick={handleLogout} className="btn-logout">
                <i className='bx bx-log-out'></i> Salir
              </button>
            </>
          )}
        </nav>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<UserRegistrationForm />} />
        <Route path="/create" element={
          <ProtectedRoute>
            <CreateNote />
          </ProtectedRoute>
        } />
        <Route path="/asignar-role" element={
          <ProtectedRoute>
            <AdminRole />
          </ProtectedRoute>
        } />
        <Route path="/categorias" element={
          <ProtectedRoute>
            <Categorias />
          </ProtectedRoute>
        } />
        <Route path="/listcategorias" element={
          <ProtectedRoute>
            <ListCategorias />
          </ProtectedRoute>
        } />
        <Route path="/note" element={
          <ProtectedRoute>
            <Notas />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </Router>
  )
}

export default App
