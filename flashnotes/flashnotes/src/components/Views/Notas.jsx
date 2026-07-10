import React, { useState, useEffect, useRef } from 'react'
import { SessionContext } from '../../Context/SessionContext';
import { Link, useLocation } from 'react-router-dom';
import '../../css/ui.css';

const useQuery = () => {
    return new URLSearchParams(useLocation().search);
};

const CATEGORY_COLORS = {
    'Frontend': { bg: '#e0f2fe', color: '#0369a1', border: '#3b82f6' },
    'Backend': { bg: '#dcfce7', color: '#15803d', border: '#10b981' },
    'DevOps': { bg: '#fef3c7', color: '#b45309', border: '#f59e0b' },
    'Personal': { bg: '#f3e8ff', color: '#7e22ce', border: '#8b5cf6' },
    'Diseño': { bg: '#fce7f3', color: '#be185d', border: '#ec4899' },
    'Trabajo': { bg: '#ffedd5', color: '#c2410c', border: '#f97316' },
    'default': { bg: '#f3f4f6', color: '#4b5563', border: '#9ca3af' }
};

const getCategoryStyle = (name) => {
    return CATEGORY_COLORS[name] || CATEGORY_COLORS['default'];
};

const Highlight = ({ text, highlight }) => {
    if (!highlight.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) => 
                part.toLowerCase() === highlight.toLowerCase() 
                    ? <mark key={i} className="highlight-text">{part}</mark> 
                    : part
            )}
        </span>
    );
};

const NoteActions = ({ nota, onEdit, onDelete, onToggle, onExport }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="note-actions-container" ref={menuRef}>
            <button className="action-trigger" onClick={() => setIsOpen(!isOpen)}>
                <i className='bx bx-dots-vertical-rounded'></i>
            </button>
            {isOpen && (
                <div className="actions-dropdown">
                    <button onClick={() => { copyToClipboard(nota.contenido); setIsOpen(false); }}>
                        <i className='bx bx-copy'></i> Copiar contenido
                    </button>
                    <button onClick={() => { onEdit(nota); setIsOpen(false); }}>
                        <i className='bx bx-edit-alt'></i> Editar
                    </button>
                    <button onClick={() => { onToggle(nota.id, 'pinned'); setIsOpen(false); }}>
                        <i className={`bx ${nota.pinned ? 'bxs-pin' : 'bx-pin'}`}></i> {nota.pinned ? 'Desfijar' : 'Fijar'}
                    </button>
                    <button onClick={() => { onToggle(nota.id, 'favorite'); setIsOpen(false); }}>
                        <i className={`bx ${nota.favorite ? 'bxs-star' : 'bx-star'}`}></i> {nota.favorite ? 'Quitar favorito' : 'Favorito'}
                    </button>
                    <button onClick={() => { onExport(nota, 'md'); setIsOpen(false); }}>
                        <i className='bx bxl-markdown'></i> Exportar MD
                    </button>
                    <button onClick={() => { onExport(nota, 'txt'); setIsOpen(false); }}>
                        <i className='bx bx-file-blank'></i> Exportar TXT
                    </button>
                    <button className="delete-btn" onClick={() => { onDelete(nota.id); setIsOpen(false); }}>
                        <i className='bx bx-trash'></i> Eliminar
                    </button>
                </div>
            )}
        </div>
    );
};

const Notas = () => {
    const { token, roles, isAdmin } = React.useContext(SessionContext);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const initialSearch = queryParams.get('search') || '';
    const initialPinned = queryParams.get('pinned') === 'true';
    const initialFavorite = queryParams.get('favorite') === 'true';
    const initialSort = queryParams.get('sort') || 'updated_desc';

    const [notas, setNotas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editValues, setEditValues] = useState({
        titulo: '', contenido: '', categoriaId: '', tags: '', pinned: false, favorite: false
    });
    const [quickValues, setQuickValues] = useState({
        titulo: '', contenido: '', categoriaId: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [search, setSearch] = useState(initialSearch);
    const [filterCategory, setFilterCategory] = useState('');
    const [onlyFavorites, setOnlyFavorites] = useState(initialFavorite);
    const [onlyPinned, setOnlyPinned] = useState(initialPinned);
    const [sortBy, setSortBy] = useState(initialSort);
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState('grid');
    const pageSize = 9;

    useEffect(() => {
        setPage(1);
    }, [search, filterCategory, onlyFavorites, onlyPinned, sortBy]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);

    const canDelete = isAdmin || (roles || []).includes('delete_own_notes');
    const canEdit = isAdmin || (roles || []).includes('edit_own_notes');

    useEffect(() => {
        if (!token) return;
        Promise.all([
            fetch(`${import.meta.env.VITE_API_URL}/note`, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json()),
            fetch(`${import.meta.env.VITE_API_URL}/categorias`, { headers: { 'Authorization': `Bearer ${token}` } }).then(res => res.json())
        ]).then(([notesData, catsData]) => {
            if (notesData.mensaje === 'Token inválido' || catsData.mensaje === 'Token inválido') {
                setSessionExpired(true);
                return;
            }
            setNotas(notesData.notes || []);
            setCategorias(catsData.categorias || []);
            setIsLoading(false);
        }).catch(err => {
            console.error(err);
            setIsLoading(false);
        });
    }, [token]);

    const handleQuickCreate = (e) => {
        e.preventDefault();
        if (!quickValues.titulo.trim() || !quickValues.contenido.trim() || !quickValues.categoriaId) {
            setMessage({ type: 'error', text: 'Completa todos los campos.' });
            return;
        }
        setIsSubmitting(true);
        fetch(`${import.meta.env.VITE_API_URL}/note`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ...quickValues, fecha_creacion: new Date().toISOString() })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                setNotas([data.note, ...notas]);
                setQuickValues({ titulo: '', contenido: '', categoriaId: '' });
                setMessage({ type: 'success', text: 'Nota creada.' });
                setTimeout(() => setMessage({type:'', text:''}), 3000);
            }
        })
        .finally(() => setIsSubmitting(false));
    };

    const startEdit = (nota) => {
        setEditingId(nota.id);
        setEditValues({
            titulo: nota.titulo,
            contenido: nota.contenido,
            categoriaId: nota.categoriaId,
            tags: nota.tags || '',
            pinned: nota.pinned,
            favorite: nota.favorite
        });
    };

    const handleUpdate = (id) => {
        setIsSubmitting(true);
        fetch(`${import.meta.env.VITE_API_URL}/note/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(editValues)
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                setNotas(notas.map(n => n.id === id ? data.note : n));
                setEditingId(null);
            }
        })
        .finally(() => setIsSubmitting(false));
    };

    const handleDelete = (id) => {
        if (!window.confirm('¿Eliminar esta nota?')) return;
        fetch(`${import.meta.env.VITE_API_URL}/note/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                setNotas(notas.filter(n => n.id !== id));
            }
        });
    };

    const toggleFlag = (id, field) => {
        const nota = notas.find(n => n.id === id);
        const nextValue = !nota[field];
        fetch(`${import.meta.env.VITE_API_URL}/note/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ [field]: nextValue })
        })
        .then(res => res.json())
        .then(data => {
            if (data.ok) {
                setNotas(notas.map(n => n.id === id ? { ...n, [field]: nextValue } : n));
            }
        });
    };

    const exportNote = (nota, format) => {
        const content = format === 'md' 
            ? `# ${nota.titulo}\n\n${nota.contenido}`
            : `TÍTULO: ${nota.titulo}\nCONTENIDO: ${nota.contenido}`;
        
        const element = document.createElement("a");
        const file = new Blob([content], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = `${nota.titulo.replace(/\s+/g, '_')}.${format}`;
        document.body.appendChild(element);
        element.click();
    };

    const filteredNotas = notas
        .filter(n => {
            const q = search.toLowerCase();
            return n.titulo.toLowerCase().includes(q) || n.contenido.toLowerCase().includes(q) || (n.tags && n.tags.toLowerCase().includes(q));
        })
        .filter(n => filterCategory ? n.categoriaId === Number(filterCategory) : true)
        .filter(n => onlyFavorites ? n.favorite : true)
        .filter(n => onlyPinned ? n.pinned : true)
        .sort((a, b) => {
            if (sortBy === 'updated_desc') return new Date(b.fecha_ultima_modificacion) - new Date(a.fecha_ultima_modificacion);
            if (sortBy === 'created_desc') return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
            return 0;
        });

    const pagedNotas = filteredNotas.slice((page - 1) * pageSize, page * pageSize);
    const totalPages = Math.ceil(filteredNotas.length / pageSize);

    if (isLoading) return <div className="notes-view-container"><div className="skeleton"></div></div>;

    return (
        <div className="notes-view-container">
            <aside className="notes-sidebar">
                <div className="sidebar-card">
                    <h3><i className='bx bx-plus-circle'></i> Nota Rápida</h3>
                    {message.text && <div className={`message-alert ${message.type}`}>{message.text}</div>}
                    
                    {categorias.length === 0 ? (
                        <div className="message-alert error" style={{fontSize: '0.85rem', padding: '10px'}}>
                            <p style={{margin: '0 0 8px 0'}}>Necesitas crear una categoría primero.</p>
                            <Link to="/categorias" className="toggle-btn active" style={{width: '100%', justifyContent: 'center', textDecoration: 'none', fontSize: '0.8rem'}}>
                                Crear Categoría
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleQuickCreate} className="filter-group">
                            <input className="modern-input" placeholder="Título..." value={quickValues.titulo} onChange={e => setQuickValues({...quickValues, titulo: e.target.value})} />
                            <textarea className="modern-textarea" placeholder="Contenido..." rows="3" value={quickValues.contenido} onChange={e => setQuickValues({...quickValues, contenido: e.target.value})}></textarea>
                            <select className="modern-select" value={quickValues.categoriaId} onChange={e => setQuickValues({...quickValues, categoriaId: e.target.value})}>
                                <option value="">Categoría...</option>
                                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                            </select>
                            <button type="submit" className="toggle-btn active" style={{width: '100%', justifyContent: 'center'}} disabled={isSubmitting}>Crear</button>
                        </form>
                    )}
                </div>

                <div className="sidebar-card">
                    <h3><i className='bx bx-filter-alt'></i> Filtros</h3>
                    <div className="filter-group">
                        <input className="modern-input" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
                        <select className="modern-select" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                            <option value="">Categorías</option>
                            {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                        <div className="checkbox-list">
                            <label className="checkbox-label"><input type="checkbox" checked={onlyPinned} onChange={e => setOnlyPinned(e.target.checked)} /> Solo fijadas</label>
                            <label className="checkbox-label"><input type="checkbox" checked={onlyFavorites} onChange={e => setOnlyFavorites(e.target.checked)} /> Solo favoritas</label>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="notes-main-content">
                <header className="notes-header-actions">
                    <div className="view-toggles">
                        <button className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><i className='bx bx-grid-alt'></i></button>
                        <button className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><i className='bx bx-list-ul'></i></button>
                    </div>
                    <select className="modern-select" style={{width: 'auto'}} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="updated_desc">Recientes</option>
                        <option value="created_desc">Antiguas</option>
                    </select>
                </header>

                <div className={viewMode === 'grid' ? 'notes-grid' : 'notes-list'}>
                    {pagedNotas.map(nota => {
                        const style = getCategoryStyle(nota.categoria?.nombre);
                        const isEditing = editingId === nota.id;

                        if (isEditing) {
                            return (
                                <div key={nota.id} className="notion-card editing">
                                    <div className="filter-group">
                                        <input className="modern-input" value={editValues.titulo} onChange={e => setEditValues({...editValues, titulo: e.target.value})} />
                                        <textarea className="modern-textarea" rows="3" value={editValues.contenido} onChange={e => setEditValues({...editValues, contenido: e.target.value})}></textarea>
                                        <div style={{display:'flex', gap:'5px'}}>
                                            <button className="toggle-btn active" onClick={() => handleUpdate(nota.id)}>OK</button>
                                            <button className="toggle-btn" onClick={() => setEditingId(null)}>X</button>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        if (viewMode === 'list') {
                            return (
                                <div key={nota.id} className="note-row">
                                    <div className="row-icons">
                                        {nota.pinned && <i className='bx bxs-pin' style={{color:'var(--primary-color)'}}></i>}
                                        {nota.favorite && <i className='bx bxs-star' style={{color:'#facc15'}}></i>}
                                    </div>
                                    <div className="row-title">
                                        <Highlight text={nota.titulo} highlight={search} />
                                    </div>
                                    <div className="row-excerpt">
                                        <Highlight text={nota.contenido} highlight={search} />
                                    </div>
                                    <div className="row-category">
                                        <span className="category-badge" style={{color: style.color, background: style.bg}}>{nota.categoria?.nombre}</span>
                                    </div>
                                    <div className="row-date">{new Date(nota.fecha_ultima_modificacion).toLocaleDateString()}</div>
                                    <NoteActions nota={nota} onEdit={startEdit} onDelete={handleDelete} onToggle={toggleFlag} onExport={exportNote} />
                                </div>
                            );
                        }

                        return (
                            <div key={nota.id} className="notion-card" style={{ '--category-color': style.border }}>
                                <div className="card-header">
                                    <h4 className="card-title">
                                        <Highlight text={nota.titulo} highlight={search} />
                                    </h4>
                                    <NoteActions nota={nota} onEdit={startEdit} onDelete={handleDelete} onToggle={toggleFlag} onExport={exportNote} />
                                </div>
                                <span className="category-badge" style={{color: style.color, background: style.bg, alignSelf:'flex-start'}}>{nota.categoria?.nombre}</span>
                                <p className="card-excerpt">
                                    <Highlight text={nota.contenido} highlight={search} />
                                </p>
                                {nota.tags && (
                                    <div className="card-tags">
                                        {nota.tags.split(',').map((tag, idx) => (
                                            <span key={idx} className="tag-chip" onClick={() => setSearch(tag.trim())}>#{tag.trim()}</span>
                                        ))}
                                    </div>
                                )}
                                <div className="card-footer">
                                    <div className="meta-info"><i className='bx bx-calendar'></i> {new Date(nota.fecha_ultima_modificacion).toLocaleDateString()}</div>
                                    <div className="card-icons">
                                        {nota.pinned && <i className='bx bxs-pin' style={{color:'var(--primary-color)'}}></i>}
                                        {nota.favorite && <i className='bx bxs-star' style={{color:'#facc15'}}></i>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {totalPages > 1 && (
                    <div className="pagination-container">
                        <button 
                            className="pagination-btn" 
                            disabled={page === 1} 
                            onClick={() => setPage(page - 1)}
                        >
                            <i className='bx bx-chevron-left'></i>
                        </button>
                        
                        <span className="pagination-info">
                            Página {page} de {totalPages}
                        </span>

                        <button 
                            className="pagination-btn" 
                            disabled={page === totalPages} 
                            onClick={() => setPage(page + 1)}
                        >
                            <i className='bx bx-chevron-right'></i>
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Notas;
