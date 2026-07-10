import React, { useState, useEffect, useContext } from 'react'
import { SessionContext } from '../Context/SessionContext'
import LoggedOutHome from '../views/home/LoggedOutHome'
import { Link, useNavigate } from 'react-router-dom'
import '../css/home.css'

const Home = () => {
    const { user, token } = useContext(SessionContext);
    const [dashboardData, setDashboardData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!user || !token) return;

        fetch(`${import.meta.env.VITE_API_URL}/dashboard/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.ok) {
                    setDashboardData(data);
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Error fetching dashboard data:', err);
                setIsLoading(false);
            });
    }, [user, token]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/note?search=${encodeURIComponent(searchQuery)}`);
        }
    };

    if (!user) {
        return <LoggedOutHome />;
    }

    if (isLoading) {
        return <div className="home-container logged-in"><div className="loader">Cargando dashboard...</div></div>;
    }

    const { stats, latestNotes, recentActivity } = dashboardData || {
        stats: { totalNotes: 0, totalCategories: 0, pinnedNotes: 0, favoriteNotes: 0 },
        latestNotes: [],
        recentActivity: []
    };

    return (
        <div className='home-container logged-in'>
            <div className="dashboard-header">
                <h1>Hola de nuevo, <span className="user-name">{user.nombre}</span> ✨</h1>
                <p>Tu espacio personal de ideas y organización.</p>
            </div>

            {/* Accesos Rápidos */}
            <div className="shortcuts-grid">
                <Link to="/create" className="shortcut-card">
                    <i className='bx bx-plus-circle'></i>
                    <span>Nueva Nota</span>
                </Link>
                <Link to="/note?pinned=true" className="shortcut-card">
                    <i className='bx bxs-pin'></i>
                    <span>Importantes</span>
                </Link>
                <Link to="/note?favorite=true" className="shortcut-card">
                    <i className='bx bxs-star'></i>
                    <span>Favoritas</span>
                </Link>
                <Link to="/note?sort=updated_desc" className="shortcut-card">
                    <i className='bx bx-history'></i>
                    <span>Recientes</span>
                </Link>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon notes"><i className='bx bx-note'></i></div>
                    <div className="stat-info">
                        <h3>{stats.totalNotes}</h3>
                        <p>Notas</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon pinned"><i className='bx bx-check-shield'></i></div>
                    <div className="stat-info">
                        <h3>{recentActivity.length}</h3>
                        <p>Acciones hoy</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon favorites"><i className='bx bx-calendar-check'></i></div>
                    <div className="stat-info">
                        <p style={{fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)'}}>Última actividad</p>
                        <p style={{fontSize: '0.8rem'}}>{recentActivity[0] ? new Date(recentActivity[0].createdAt).toLocaleDateString() : 'Sin actividad'}</p>
                    </div>
                </div>
            </div>

            {stats.totalNotes === 0 ? (
                <div className="empty-dashboard-state">
                    <div style={{background: 'var(--primary-light)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem'}}>
                        <i className='bx bx-edit-alt' style={{fontSize: '2.5rem', color: 'var(--primary-color)'}}></i>
                    </div>
                    <h3>¡Empieza tu aventura!</h3>
                    <p>Todavía no has creado ninguna nota. Captura tus ideas, tareas o proyectos ahora mismo.</p>
                    <Link to="/create" className="toggle-btn active" style={{textDecoration: 'none', padding: '1rem 2rem', marginTop: '1rem'}}>
                        <i className='bx bx-plus-circle'></i> Crear mi primera nota
                    </Link>
                </div>
            ) : (
                <div className="dashboard-main-content">
                    <section className="latest-notes-section">
                        <div className="section-header">
                            <h2><i className='bx bx-time-five'></i> Últimas modificadas</h2>
                            <Link to="/note" className="view-all-link">
                                Ver todas <i className='bx bx-right-arrow-alt'></i>
                            </Link>
                        </div>
                        <div className="latest-notes-list">
                            {latestNotes.length > 0 ? latestNotes.map(note => (
                                <Link key={note.id} to={`/note`} className="note-item-link">
                                    <div className="note-item">
                                        <div className="note-item-info">
                                            <h4>{note.titulo}</h4>
                                            <p className="category-badge" style={{display: 'inline-block', fontSize: '0.7rem', padding: '2px 6px'}}>{note.categoria?.nombre || 'Sin categoría'}</p>
                                        </div>
                                        <div className="note-item-date">
                                            <i className='bx bx-calendar'></i> {new Date(note.fecha_ultima_modificacion).toLocaleDateString()}
                                        </div>
                                    </div>
                                </Link>
                            )) : (
                                <div className="empty-text">
                                    <i className='bx bx-info-circle'></i> No hay notas recientes.
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="activity-section">
                        <div className="section-header">
                            <h2><i className='bx bx-pulse'></i> Tu pulso</h2>
                        </div>
                        <div className="activity-timeline">
                            {recentActivity.length > 0 ? recentActivity.map(log => (
                                <div key={log.id} className="activity-item">
                                    <div className="activity-dot" style={{background: log.action === 'create' ? '#16a34a' : log.action === 'update' ? '#2563eb' : '#dc2626'}}></div>
                                    <div className="activity-content">
                                        <p>
                                            <strong>{log.action === 'create' ? 'Nueva' : log.action === 'update' ? 'Editada' : 'Eliminada'}</strong>
                                            {' '}{log.entity}
                                        </p>
                                        <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                            )) : (
                                <div className="empty-text">
                                    <i className='bx bx-sleepy'></i> Sin actividad hoy.
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </div>
    )
}

export default Home;