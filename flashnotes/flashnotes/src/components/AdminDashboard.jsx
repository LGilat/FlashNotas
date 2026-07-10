import React, { useEffect, useState } from 'react';
import { SessionContext } from '../Context/SessionContext';
import '../css/ui.css';
import '../css/admin.css';

const AdminDashboard = () => {
    const { token } = React.useContext(SessionContext);
    const [users, setUsers] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [notas, setNotas] = useState([]);
    const [audit, setAudit] = useState([]);
    const [roleRequests, setRoleRequests] = useState([]);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isLoading, setIsLoading] = useState(true);
    const [confirm, setConfirm] = useState({
        isOpen: false,
        title: '',
        text: '',
        onConfirm: null
    });

    const [editingCategoriaId, setEditingCategoriaId] = useState(null);
    const [categoriaEdit, setCategoriaEdit] = useState({ nombre: '', descripcion: '' });

    const [editingUserId, setEditingUserId] = useState(null);
    const [userEdit, setUserEdit] = useState({ nombre: '', email: '' });

    const [editingNotaId, setEditingNotaId] = useState(null);
    const [notaEdit, setNotaEdit] = useState({ titulo: '', contenido: '', categoriaId: '' });

    const handleAuth = (data) => {
        if (data?.mensaje === 'Token inválido' || data?.mensaje === 'No autorizado') {
            setSessionExpired(true);
            return true;
        }
        if (data?.mensaje === 'No autorizado (admin)') {
            setMessage({ type: 'error', text: 'No tienes permisos de administrador.' });
            return true;
        }
        return false;
    };

    const loadAll = () => {
        if (!token) return;
        setIsLoading(true);
        Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            }).then(r => r.json()),
            fetch(`${import.meta.env.VITE_API_URL}/admin/categorias`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            }).then(r => r.json()),
            fetch(`${import.meta.env.VITE_API_URL}/admin/notas`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            }).then(r => r.json()),
            fetch(`${import.meta.env.VITE_API_URL}/admin/audit`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            }).then(r => r.json()),
            fetch(`${import.meta.env.VITE_API_URL}/admin/role-requests?status=pending`, {
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            }).then(r => r.json()),
        ])
            .then(([u, c, n, a, rr]) => {
                if (handleAuth(u) || handleAuth(c) || handleAuth(n) || handleAuth(a) || handleAuth(rr)) return;
                setUsers(u.users || []);
                setCategorias(c.categorias || []);
                setNotas(n.notas || []);
                setAudit(a.logs || []);
                setRoleRequests(rr.requests || []);
            })
            .catch(() => setMessage({ type: 'error', text: 'No se pudo cargar el panel de admin.' }))
            .finally(() => setIsLoading(false));
    };

    useEffect(() => {
        loadAll();
    }, [token]);

    const deleteUser = (id) => {
        setConfirm({
            isOpen: true,
            title: 'Eliminar usuario',
            text: 'Se eliminarán también sus notas y categorías. ¿Continuar?',
            onConfirm: () => {
                fetch(`${import.meta.env.VITE_API_URL}/admin/users/${id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                })
                    .then(r => r.json())
                    .then(data => {
                        if (handleAuth(data)) return;
                        if (data.ok) {
                            setUsers(prev => prev.filter(u => u.id !== id));
                            setMessage({ type: 'success', text: 'Usuario eliminado.' });
                            loadAll();
                        } else {
                            setMessage({ type: 'error', text: data.mensaje || 'Error al eliminar usuario.' });
                        }
                    })
                    .catch(() => setMessage({ type: 'error', text: 'Error al eliminar usuario.' }));
            }
        });
    };

    const startEditUser = (user) => {
        setEditingUserId(user.id);
        setUserEdit({ nombre: user.nombre, email: user.email });
    };

    const saveUser = (id) => {
        fetch(`${import.meta.env.VITE_API_URL}/admin/users/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(userEdit),
        })
            .then(r => r.json())
            .then(data => {
                if (handleAuth(data)) return;
                if (data.ok) {
                    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data.user } : u));
                    setEditingUserId(null);
                    setMessage({ type: 'success', text: 'Usuario actualizado.' });
                    loadAll();
                } else {
                    setMessage({ type: 'error', text: data.mensaje || 'Error al actualizar usuario.' });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Error al actualizar usuario.' }));
    };

    const startEditCategoria = (categoria) => {
        setEditingCategoriaId(categoria.id);
        setCategoriaEdit({ nombre: categoria.nombre, descripcion: categoria.descripcion });
    };

    const saveCategoria = (id) => {
        fetch(`${import.meta.env.VITE_API_URL}/admin/categorias/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(categoriaEdit),
        })
            .then(r => r.json())
            .then(data => {
                if (handleAuth(data)) return;
                if (data.ok) {
                    setCategorias(prev => prev.map(c => c.id === id ? data.categoria : c));
                    setEditingCategoriaId(null);
                    setMessage({ type: 'success', text: 'Categoría actualizada.' });
                    loadAll();
                } else {
                    setMessage({ type: 'error', text: data.mensaje || 'Error al actualizar categoría.' });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Error al actualizar categoría.' }));
    };

    const deleteCategoria = (id) => {
        setConfirm({
            isOpen: true,
            title: 'Eliminar categoría',
            text: 'Se eliminarán las notas asociadas. ¿Continuar?',
            onConfirm: () => {
                fetch(`${import.meta.env.VITE_API_URL}/admin/categorias/${id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                })
                    .then(r => r.json())
                    .then(data => {
                        if (handleAuth(data)) return;
                        if (data.ok) {
                            setCategorias(prev => prev.filter(c => c.id !== id));
                            setMessage({ type: 'success', text: 'Categoría eliminada.' });
                            loadAll();
                        } else {
                            setMessage({ type: 'error', text: data.mensaje || 'Error al eliminar categoría.' });
                        }
                    })
                    .catch(() => setMessage({ type: 'error', text: 'Error al eliminar categoría.' }));
            }
        });
    };

    const startEditNota = (nota) => {
        setEditingNotaId(nota.id);
        setNotaEdit({
            titulo: nota.titulo,
            contenido: nota.contenido,
            categoriaId: nota.categoriaId || '',
        });
    };

    const saveNota = (id) => {
        fetch(`${import.meta.env.VITE_API_URL}/admin/notas/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
                ...notaEdit,
                categoriaId: Number(notaEdit.categoriaId),
            }),
        })
            .then(r => r.json())
            .then(data => {
                if (handleAuth(data)) return;
                if (data.ok) {
                    setNotas(prev => prev.map(n => n.id === id ? data.nota : n));
                    setEditingNotaId(null);
                    setMessage({ type: 'success', text: 'Nota actualizada.' });
                    loadAll();
                } else {
                    setMessage({ type: 'error', text: data.mensaje || 'Error al actualizar nota.' });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Error al actualizar nota.' }));
    };

    const deleteNota = (id) => {
        setConfirm({
            isOpen: true,
            title: 'Eliminar nota',
            text: '¿Deseas eliminar esta nota?',
            onConfirm: () => {
                fetch(`${import.meta.env.VITE_API_URL}/admin/notas/${id}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                })
                    .then(r => r.json())
                    .then(data => {
                        if (handleAuth(data)) return;
                        if (data.ok) {
                            setNotas(prev => prev.filter(n => n.id !== id));
                            setMessage({ type: 'success', text: 'Nota eliminada.' });
                            loadAll();
                        } else {
                            setMessage({ type: 'error', text: data.mensaje || 'Error al eliminar nota.' });
                        }
                    })
                    .catch(() => setMessage({ type: 'error', text: 'Error al eliminar nota.' }));
            }
        });
    };

    const exportAuditCsv = () => {
        if (!token) return;
        fetch(`${import.meta.env.VITE_API_URL}/admin/audit.csv`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'audit.csv';
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(() => setMessage({ type: 'error', text: 'No se pudo exportar CSV.' }));
    };

    const resolveRoleRequest = (id, action) => {
        fetch(`${import.meta.env.VITE_API_URL}/admin/role-requests/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ action }),
        })
            .then(r => r.json())
            .then(data => {
                if (handleAuth(data)) return;
                if (data.ok) {
                    setRoleRequests(prev => prev.filter(r => r.id !== id));
                    setMessage({ type: 'success', text: `Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'}.` });
                    loadAll();
                } else {
                    setMessage({ type: 'error', text: data.mensaje || 'Error al resolver solicitud.' });
                }
            })
            .catch(() => setMessage({ type: 'error', text: 'Error al resolver solicitud.' }));
    };

    return (
        <div className="admin-container">
            {confirm.isOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal">
                        <div className="admin-modal-title">{confirm.title}</div>
                        <div className="admin-modal-body">{confirm.text}</div>
                        <div className="admin-modal-footer">
                            <button className="toggle-btn" onClick={() => setConfirm({ isOpen: false, title: '', text: '', onConfirm: null })}>Cancelar</button>
                            <button className="toggle-btn active" onClick={() => {
                                const fn = confirm.onConfirm;
                                setConfirm({ isOpen: false, title: '', text: '', onConfirm: null });
                                if (fn) fn();
                            }}>Confirmar</button>
                        </div>
                    </div>
                </div>
            )}
            
            {sessionExpired && <div className="message-alert error">Tu sesión expiró. Vuelve a iniciar sesión.</div>}
            {message.text && <div className={`message-alert ${message.type}`}>{message.text}</div>}

            {/* Stats Summary */}
            <div className="admin-stats-grid">
                <div className="admin-stat-card">
                    <div className="admin-stat-icon users"><i className='bx bx-user'></i></div>
                    <div className="admin-stat-info">
                        <h3>{users.length}</h3>
                        <p>USUARIOS</p>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon notes"><i className='bx bx-note'></i></div>
                    <div className="admin-stat-info">
                        <h3>{notas.length}</h3>
                        <p>NOTAS</p>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon categories"><i className='bx bx-category'></i></div>
                    <div className="admin-stat-info">
                        <h3>{categorias.length}</h3>
                        <p>CATEGORÍAS</p>
                    </div>
                </div>
                <div className="admin-stat-card">
                    <div className="admin-stat-icon requests"><i className='bx bx-shield-quarter'></i></div>
                    <div className="admin-stat-info">
                        <h3>{roleRequests.length}</h3>
                        <p>SOLICITUDES</p>
                    </div>
                </div>
            </div>

            <div className="admin-section-card">
                <div className="admin-section-title"><i className='bx bx-notification'></i> Solicitudes de rol</div>
                {isLoading && <div className="skeleton" style={{ height: '80px' }} />}
                {roleRequests.map(r => (
                    <div key={r.id} className="admin-list-item">
                        <div className="admin-item-main">Usuario: {r.usuarioNombre}</div>
                        <div className="admin-item-sub">Rol solicitado: {r.role} | Motivo: {r.reason || '-'}</div>
                        <div className="admin-item-sub">Fecha: {new Date(r.createdAt).toLocaleString()}</div>
                        <div className="admin-actions">
                            <button className="toggle-btn active" onClick={() => resolveRoleRequest(r.id, 'approve')}>Aprobar</button>
                            <button className="toggle-btn" style={{background:'#fee2e2', color:'#dc2626'}} onClick={() => resolveRoleRequest(r.id, 'reject')}>Rechazar</button>
                        </div>
                    </div>
                ))}
                {!isLoading && !roleRequests.length && <div className="empty-state">No hay solicitudes pendientes.</div>}
            </div>

            <div className="admin-section-card">
                <div className="admin-section-title"><i className='bx bx-group'></i> Usuarios</div>
                {isLoading && <div className="skeleton" style={{ height: '80px' }} />}
                {users.map(u => (
                    <div key={u.id} className="admin-list-item">
                        {editingUserId === u.id ? (
                            <div className="filter-group">
                                <input
                                    className="modern-input"
                                    value={userEdit.nombre}
                                    onChange={(e) => setUserEdit({ ...userEdit, nombre: e.target.value })}
                                />
                                <input
                                    className="modern-input"
                                    value={userEdit.email}
                                    onChange={(e) => setUserEdit({ ...userEdit, email: e.target.value })}
                                />
                                <div className="admin-actions">
                                    <button className="toggle-btn active" onClick={() => saveUser(u.id)}>Guardar</button>
                                    <button className="toggle-btn" onClick={() => setEditingUserId(null)}>Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="admin-item-main">{u.nombre} - {u.email}</div>
                                <div className="admin-item-sub">Notas: {u._count?.notas || 0} | Categorías: {u._count?.categorias || 0}</div>
                                <div className="admin-actions">
                                    <button className="icon-btn" onClick={() => startEditUser(u)} title="Editar"><i className='bx bx-edit-alt'></i></button>
                                    <button className="icon-btn delete" onClick={() => deleteUser(u.id)} title="Eliminar"><i className='bx bx-trash'></i></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {!isLoading && !users.length && <div className="empty-state">No hay usuarios.</div>}
            </div>

            <div className="admin-section-card">
                <div className="admin-section-title"><i className='bx bx-category-alt'></i> Categorías</div>
                {isLoading && <div className="skeleton" style={{ height: '80px' }} />}
                {categorias.map(c => (
                    <div key={c.id} className="admin-list-item">
                        {editingCategoriaId === c.id ? (
                            <div className="filter-group">
                                <input
                                    className="modern-input"
                                    value={categoriaEdit.nombre}
                                    onChange={(e) => setCategoriaEdit({ ...categoriaEdit, nombre: e.target.value })}
                                />
                                <textarea
                                    className="modern-textarea"
                                    value={categoriaEdit.descripcion}
                                    onChange={(e) => setCategoriaEdit({ ...categoriaEdit, descripcion: e.target.value })}
                                />
                                <div className="admin-actions">
                                    <button className="toggle-btn active" onClick={() => saveCategoria(c.id)}>Guardar</button>
                                    <button className="toggle-btn" onClick={() => setEditingCategoriaId(null)}>Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="admin-item-main">{c.nombre} - {c.descripcion}</div>
                                <div className="admin-item-sub">Usuario: {c.usuario?.nombre}</div>
                                <div className="admin-actions">
                                    <button className="icon-btn" onClick={() => startEditCategoria(c)} title="Editar"><i className='bx bx-edit-alt'></i></button>
                                    <button className="icon-btn delete" onClick={() => deleteCategoria(c.id)} title="Eliminar"><i className='bx bx-trash'></i></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {!isLoading && !categorias.length && <div className="empty-state">No hay categorías.</div>}
            </div>

            <div className="admin-section-card">
                <div className="admin-section-title"><i className='bx bx-news'></i> Notas</div>
                {isLoading && <div className="skeleton" style={{ height: '80px' }} />}
                {notas.map(n => (
                    <div key={n.id} className="admin-list-item">
                        {editingNotaId === n.id ? (
                            <div className="filter-group">
                                <input
                                    className="modern-input"
                                    value={notaEdit.titulo}
                                    onChange={(e) => setNotaEdit({ ...notaEdit, titulo: e.target.value })}
                                />
                                <textarea
                                    className="modern-textarea"
                                    value={notaEdit.contenido}
                                    onChange={(e) => setNotaEdit({ ...notaEdit, contenido: e.target.value })}
                                />
                                <select
                                    className="modern-select"
                                    value={notaEdit.categoriaId}
                                    onChange={(e) => setNotaEdit({ ...notaEdit, categoriaId: e.target.value })}
                                >
                                    <option value="">Selecciona una categoría</option>
                                    {categorias.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                    ))}
                                </select>
                                <div className="admin-actions">
                                    <button className="toggle-btn active" onClick={() => saveNota(n.id)}>Guardar</button>
                                    <button className="toggle-btn" onClick={() => setEditingNotaId(null)}>Cancelar</button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="admin-item-main">{n.titulo}</div>
                                <div className="admin-item-sub" style={{display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{n.contenido}</div>
                                <div className="admin-item-sub">Usuario: {n.usuario?.nombre} | Categoría: {n.categoria?.nombre}</div>
                                <div className="admin-actions">
                                    <button className="icon-btn" onClick={() => startEditNota(n)} title="Editar"><i className='bx bx-edit-alt'></i></button>
                                    <button className="icon-btn delete" onClick={() => deleteNota(n.id)} title="Eliminar"><i className='bx bx-trash'></i></button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
                {!isLoading && !notas.length && <div className="empty-state">No hay notas.</div>}
            </div>

            <div className="admin-section-card">
                <div className="admin-section-title"><i className='bx bx-history'></i> Auditoría (últimos 200)</div>
                <div style={{marginBottom: '15px'}}>
                    <button className="toggle-btn" onClick={exportAuditCsv}><i className='bx bx-download'></i> Exportar CSV</button>
                </div>
                {isLoading && <div className="skeleton" style={{ height: '80px' }} />}
                <div className="notes-list" style={{maxHeight:'400px', overflowY:'auto'}}>
                    {audit.map(log => (
                        <div key={log.id} className="admin-list-item" style={{padding:'8px 12px'}}>
                            <div className="admin-item-main" style={{fontSize:'0.9rem'}}>{new Date(log.createdAt).toLocaleString()} - {log.action}</div>
                            <div className="admin-item-sub">Entidad: {log.entity} #{log.entityId || '-'} | Actor: {log.actorUserId || '-'} ({log.actorRole || '-'})</div>
                        </div>
                    ))}
                </div>
                {!isLoading && !audit.length && <div className="empty-state">No hay registros de auditoría.</div>}
            </div>
        </div>
    );
};

export default AdminDashboard;
