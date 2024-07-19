import UserRegistrationForm from './components/UserRegistrationForm'
import Home from './components/Home'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { SessionProvider } from './Context/SessionContext';
import   LoginForm  from './components/UserLogin';
import CreateNote from './components/CreateNote';
import './App.css'

function App() {

  return (
    <Router>
        <SessionProvider> 
        <header className="header">
          <a href="#home" className="logo">Flash <span>Notes</span></a>
          <i className='bx bx-menu' id="menu-icon"></i>
          <nav className='navigation'>
            <Link to="/">Home</Link>
            <Link to="/register">Register</Link>
            <Link to="/login">Log in</Link>
            <Link to="/create">Create Note</Link>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<UserRegistrationForm />} />
          <Route path="/create" element={<CreateNote />} />
        </Routes>
     </SessionProvider>
      </Router>
  )
}

export default App
