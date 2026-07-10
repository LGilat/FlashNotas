import React, { useEffect, useState } from 'react';
import { SessionContext } from '../Context/SessionContext';
import '../css/ui.css';

const Profile = () => {
    const { user, token, roles, isAdmin, refreshSession, updateToken } = React.useContext(SessionContext);
    const [requests, setRequests] = useState([]);
    const [reason, setReason] = useState('');
    const [selectedRole, setSelectedRole] = useState('delete_own_notes');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [sessionExpired, setSessionExpired] = useState(false);
    const [profile, setProfile] = useState(null);
    const [stats, setStats] = useState({ totalNotes: 0, totalCategories: 0, favoriteNotes: 0, pinnedNotes: 0 });
    const [recentNotes, setRecentNotes] = useState([]);
    const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' });
    const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
    const [profileEdit, setProfileEdit] = useState({ nombre: '', email: '', avatarUrl: '' });
    const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
    const [sessionMessage, setSessionMessage] = useState({ type: '', text: '' });
    const [emailChange, setEmailChange] = useState({ newEmail: '', token: '' });
    const [emailMessage, setEmailMessage] = useState({ type: '', text: '' });
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadRequests = () => {
        return fetch(`${import.meta.env.VITE_API_URL}/role-requests`, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (data.mensaje === 'Token inválido' || data.mensaje === 'No autorizado') {
                    setSessionExpired(true);
                    return;
                }
                setRequests(data.requests || []);
            })
            .catch(() => setMessage({ type: 'error', text: 'No se pudieron cargar solicitudes.' }));
    };

    const loadProfile = () => {
        return fetch(`${import.meta.env.VITE_API_URL}/me`, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                if (data.mensaje === 'Token inválido' || data.mensaje === 'No autorizado') {
                    setSessionExpired(true);
                    return;
                }
                if (data.ok) {
                    setProfile(data.user);
                    setRecentNotes(data.recentNotes || []);
                    setSessions(data.sessions || []);
                    setStats(data.stats || { totalNotes: 0, totalCategories: 0, favoriteNotes: 0, pinnedNotes: 0 });
                    setProfileEdit({
                        nombre: data.user?.nombre || '',
                        email: data.user?.email || '',
                        avatarUrl: data.user?.avatarUrl || '',
                    });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'No se pudo cargar el perfil.' }));
    };

    useEffect(() => {
        if (!token) return;
        setIsLoading(true);
        Promise.all([loadRequests(), loadProfile()]).finally(() => setIsLoading(false));
    }, [token]);

    const submitRequest = (e) => {
        e.preventDefault();
        fetch(`${import.meta.env.VITE_API_URL}/role-requests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ role: selectedRole, reason }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.mensaje === 'Token inválido' || data.mensaje === 'No autorizado') {
                    setSessionExpired(true);
                    return;
                }
                if (data.ok) {
                    setMessage({ type: 'success', text: 'Solicitud enviada.' });
                    setReason('');
                    loadRequests();
                } else {
                    setMessage({ type: 'error', text: data.mensaje || 'Error al enviar solicitud.' });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Error al enviar solicitud.' }));
    };

    const submitPasswordChange = (e) => {
        e.preventDefault();
        setPasswordMessage({ type: '', text: '' });
        if (!passwords.current || !passwords.next || !passwords.confirm) {
            setPasswordMessage({ type: 'error', text: 'Completa todos los campos.' });
            return;
        }
        if (passwords.next.length < 8) {
            setPasswordMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres.' });
            return;
        }
        if (passwords.next !== passwords.confirm) {
            setPasswordMessage({ type: 'error', text: 'La confirmación no coincide.' });
            return;
        }
        fetch(`${import.meta.env.VITE_API_URL}/me/password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ currentPassword: passwords.current, newPassword: passwords.next }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.mensaje === 'Token inválido' || data.mensaje === 'No autorizado') {
                    setSessionExpired(true);
                    return;
                }
                if (data.ok) {
                    setPasswordMessage({ type: 'success', text: 'Contraseña actualizada.' });
                    setPasswords({ current: '', next: '', confirm: '' });
                } else {
                    setPasswordMessage({ type: 'error', text: data.mensaje || 'Error al cambiar contraseña.' });
                }
            })
            .catch(() => setPasswordMessage({ type: 'error', text: 'Error al cambiar contraseña.' }));
    };

    const submitProfileUpdate = (e) => {
        e.preventDefault();
        setProfileMessage({ type: '', text: '' });
        if (!profileEdit.nombre || !profileEdit.email) {
            setProfileMessage({ type: 'error', text: 'Nombre y email son obligatorios.' });
            return;
        }
        fetch(`${import.meta.env.VITE_API_URL}/me`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                nombre: profileEdit.nombre,
                email: profileEdit.email,
                avatarUrl: profileEdit.avatarUrl || null,
            }),
        })
            .then(r => r.json())
            .then(data => {
                if (data.mensaje === 'Token inválido' || data.mensaje === 'No autorizado') {
                    setSessionExpired(true);
                    return;
                }
                if (data.ok) {
                    setProfile(data.user);
                    setProfileMessage({ type: 'success', text: 'Perfil actualizado.' });
                    refreshSession();
                } else {
                    setProfileMessage({ type: 'error', text: data.mensaje || 'Error al actualizar perfil.' });
                }
            })
            .catch(() => setProfileMessage({ type: 'error', text: 'Error al actualizar perfil.' }));
    };

    const uploadAvatar = (file) => {
        if (!file) return;
        const form = new FormData();
        form.append('avatar', file);
        fetch(`${import.meta.env.VITE_API_URL}/me/avatar`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: form,
        })
            .then(r => r.json())
            .then(data => {
                if (data.mensaje === 'Token inválido' || data.mensaje === 'No autorizado') {
                    setSessionExpired(true);
                    return;
                }
                if (data.ok) {
                    setProfileEdit(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
                    setProfile(prev => ({ ...prev, avatarUrl: data.avatarUrl }));
                    setProfileMessage({ type: 'success', text: 'Avatar actualizado.' });
                } else {
                    setProfileMessage({ type: 'error', text: data.mensaje || 'Error al subir avatar.' });
                }
            })
            .catch(() => setProfileMessage({ type: 'error', text: 'Error al subir avatar.' }));
    };

    const exportAllData = () => {
        fetch(`${import.meta.env.VITE_API_URL}/note`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (!data.ok) return;
            const content = data.notes.map(n => `--- ${n.titulo} ---\n${n.contenido}\n\n`).join('\n');
            const blob = new Blob([content], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `flashnotes_backup_${new Date().toISOString().split('T')[0]}.md`;
            a.click();
        });
    };

    const logoutOthers = () => {
        setSessionMessage({ type: '', text: '' });
        fetch(`${import.meta.env.VITE_API_URL}/me/logout-others`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        })
            .then(r => r.json())
            .then(data => {
                if (data.mensaje === 'Token inválido' || data.mensaje === 'No autorizado') {
                    setSessionExpired(true);
                    return;
                }
                if (data.ok) {
                    updateToken(data.token);
                    setSessionMessage({ type: 'success', text: 'Otras sesiones cerradas.' });
                    loadProfile();
                } else {
                    setSessionMessage({ type: 'error', text: data.mensaje || 'Error al cerrar sesiones.' });
                }
            })
            .catch(() => setSessionMessage({ type: 'error', text: 'Error al cerrar sesiones.' }));
    };

    if (isLoading) return <div className="profile-page"><div className="skeleton" style={{width: '100%', maxWidth: '800px', height: '400px'}}></div></div>;

    const getFullUrl = (url) => {
        if (!url) return 'https://via.placeholder.com/150';
        if (url.startsWith('http')) return url;
        return `${import.meta.env.VITE_API_URL}${url}`;
    };

    return (
        <div className="profile-page">
            <div className="profile-container">
                {/* Header Card */}
                <div className="profile-header-card">
                    <img 
                        src={getFullUrl(profile?.avatarUrl)} 
                        alt="avatar" 
                        className="profile-avatar-large" 
                    />
                    <div className="profile-info-main">
                        <h2>{profile?.nombre || user?.nombre}</h2>
                        <p><i className='bx bx-envelope'></i> {profile?.email}</p>
                        <p><i className='bx bx-calendar'></i> Miembro desde {new Date(profile?.fecha_registro).toLocaleDateString()}</p>
                        <div style={{marginTop: '10px'}}>
                            {isAdmin && <span className="badge-admin">Administrador</span>}
                            {roles.map(r => <span key={r} className="category-badge" style={{marginLeft: '5px', background: '#f3f4f6', color: '#4b5563'}}>{r}</span>)}
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="stats-overview">
                    <div className="profile-stat-card">
                        <i className='bx bx-note'></i>
                        <h4>{stats.totalNotes}</h4>
                        <span>NOTAS</span>
                    </div>
                    <div className="profile-stat-card">
                        <i className='bx bx-category'></i>
                        <h4>{stats.totalCategories}</h4>
                        <span>CATEGORÍAS</span>
                    </div>
                    <div className="profile-stat-card">
                        <i className='bx bxs-star' style={{color: '#facc15'}}></i>
                        <h4>{stats.favoriteNotes}</h4>
                        <span>FAVORITAS</span>
                    </div>
                    <div className="profile-stat-card">
                        <i className='bx bxs-pin'></i>
                        <h4>{stats.pinnedNotes}</h4>
                        <span>FIJADAS</span>
                    </div>
                </div>

                {/* Export Section (Premium Feel) */}
                <div className="export-section">
                    <div className="export-content">
                        <h3>Tus datos son tuyos</h3>
                        <p>Descarga todas tus notas en un solo archivo Markdown para llevarlas donde quieras.</p>
                    </div>
                    <button className="btn-export-all" onClick={exportAllData}>
                        <i className='bx bx-download'></i> Exportar Todo
                    </button>
                </div>

                <div className="profile-grid">
                    {/* Security Section */}
                    <div className="section-card">
                        <h3><i className='bx bx-shield-quarter'></i> Seguridad <span className="security-badge">Protegido</span></h3>
                        
                        {passwordMessage.text && <div className={`message-alert ${passwordMessage.type}`}>{passwordMessage.text}</div>}
                        
                        <form onSubmit={submitPasswordChange} className="filter-group">
                            <label className="meta-info">Cambiar Contraseña</label>
                            <input 
                                className="modern-input" 
                                type="password" 
                                placeholder="Contraseña actual" 
                                value={passwords.current} 
                                onChange={e => setPasswords({...passwords, current: e.target.value})} 
                            />
                            <div style={{display: 'flex', gap: '10px'}}>
                                <input 
                                    className="modern-input" 
                                    type="password" 
                                    placeholder="Nueva" 
                                    value={passwords.next} 
                                    onChange={e => setPasswords({...passwords, next: e.target.value})} 
                                />
                                <input 
                                    className="modern-input" 
                                    type="password" 
                                    placeholder="Confirmar" 
                                    value={passwords.confirm} 
                                    onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
                                />
                            </div>
                            <button type="submit" className="toggle-btn active" style={{justifyContent: 'center'}}>Actualizar Contraseña</button>
                        </form>

                        <div style={{marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6'}}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
                                <label className="meta-info">Sesiones Activas ({sessions.length})</label>
                                <button className="icon-btn delete" title="Cerrar otras" onClick={logoutOthers}><i className='bx bx-log-out-circle'></i></button>
                            </div>
                            {sessions.map(s => (
                                <div key={s.id} style={{fontSize: '0.8rem', padding: '8px', background: '#f9fafb', borderRadius: '8px', marginBottom: '5px'}}>
                                    <div style={{fontWeight: 600}}><i className='bx bx-laptop'></i> {s.userAgent?.split(' ')[0] || 'Desconocido'}</div>
                                    <div style={{color: 'var(--text-muted)'}}>{s.ip} • {new Date(s.lastSeen).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Personalization Section */}
                    <div className="section-card">
                        <h3><i className='bx bx-paint-roll'></i> Personalización</h3>
                        
                        {profileMessage.text && <div className={`message-alert ${profileMessage.type}`}>{profileMessage.text}</div>}
                        
                        <form onSubmit={submitProfileUpdate} className="filter-group">
                            <div className="profile-edit-avatar-group" style={{display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem'}}>
                                <img src={getFullUrl(profileEdit.avatarUrl)} alt="avatar preview" style={{width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover'}} />
                                <input 
                                    type="file" 
                                    id="avatar-upload" 
                                    style={{display: 'none'}} 
                                    onChange={e => uploadAvatar(e.target.files?.[0])} 
                                />
                                <label htmlFor="avatar-upload" className="toggle-btn" style={{cursor: 'pointer', background: '#f3f4f6'}}>
                                    <i className='bx bx-upload'></i> Subir foto
                                </label>
                            </div>
                            
                            <input 
                                className="modern-input" 
                                placeholder="Nombre completo" 
                                value={profileEdit.nombre} 
                                onChange={e => setProfileEdit({...profileEdit, nombre: e.target.value})} 
                            />
                            <input 
                                className="modern-input" 
                                placeholder="Email" 
                                value={profileEdit.email} 
                                onChange={e => setProfileEdit({...profileEdit, email: e.target.value})} 
                            />
                            
                            <button type="submit" className="toggle-btn active" style={{justifyContent: 'center', marginTop: '1rem'}}>Guardar Perfil</button>
                        </form>

                        <div style={{marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6'}}>
                            <h3><i className='bx bx-star'></i> Plan & Permisos</h3>
                            <div className="filter-group">
                                <select className="modern-select" value={selectedRole} onChange={e => setSelectedRole(e.target.value)}>
                                    <option value="delete_own_notes">Eliminar mis notas</option>
                                    <option value="edit_own_notes">Editar mis notas</option>
                                    <option value="create_categories">Crear categorías</option>
                                </select>
                                <textarea 
                                    className="modern-textarea" 
                                    placeholder="¿Por qué necesitas este permiso?" 
                                    rows="2"
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                ></textarea>
                                <button onClick={submitRequest} className="toggle-btn" style={{border: '1px solid var(--border-color)', justifyContent: 'center'}}>
                                    Solicitar Acceso
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Card */}
                <div className="section-card">
                    <h3><i className='bx bx-history'></i> Actividad Reciente</h3>
                    <div className="notes-list">
                        {recentNotes.map(n => (
                            <div key={n.id} className="note-row" style={{gridTemplateColumns: '1fr 150px 40px'}}>
                                <div className="row-title">{n.titulo}</div>
                                <div className="row-date">{new Date(n.fecha_ultima_modificacion).toLocaleString()}</div>
                                <i className='bx bx-chevron-right' style={{color: 'var(--text-muted)'}}></i>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
