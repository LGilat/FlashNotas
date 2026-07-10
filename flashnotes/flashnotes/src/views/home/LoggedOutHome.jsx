import React from 'react';
import { Link } from 'react-router-dom';

const LoggedOutHome = () => {
    return (
        <div className="landing-page">
            <section className="hero">
                <div className="hero-content">
                    <h1>Organiza tus ideas con <span className="highlight">Flash Notes</span></h1>
                    <p>La forma más rápida y sencilla de capturar tus pensamientos, organizar tus tareas y nunca olvidar lo que importa.</p>
                    <div className="hero-btns">
                        <Link to="/register" className="btn-primary">Empieza Gratis</Link>
                        <Link to="/login" className="btn-secondary">Iniciar Sesión</Link>
                    </div>
                </div>
            </section>

            <section className="features">
                <h2>¿Qué puedes hacer en Flash Notes?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <i className='bx bx-note'></i>
                        <h3>Notas Rápidas</h3>
                        <p>Crea notas al instante con un solo clic. Perfecto para ideas fugaces.</p>
                    </div>
                    <div className="feature-card">
                        <i className='bx bx-category'></i>
                        <h3>Categorías Personalizadas</h3>
                        <p>Organiza tu contenido por temas, proyectos o prioridades para encontrar todo fácilmente.</p>
                    </div>
                    <div className="feature-card">
                        <i className='bx bx-shield-quarter'></i>
                        <h3>Seguridad y Privacidad</h3>
                        <p>Tus notas son personales. Solo tú puedes acceder a ellas mediante tu cuenta segura.</p>
                    </div>
                </div>
            </section>

            <section className="about-app">
                <div className="about-content">
                    <h2>¿Por qué Flash Notes?</h2>
                    <p>
                        Flash Notes nació de la necesidad de tener un espacio limpio y sin distracciones para escribir. 
                        Ya seas un estudiante tomando apuntes, un desarrollador documentando código o simplemente alguien 
                        que necesita una lista de la compra, nuestra plataforma se adapta a ti.
                    </p>
                </div>
            </section>
        </div>
    );
};

export default LoggedOutHome;
