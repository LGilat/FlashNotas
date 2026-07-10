import React, {useEffect, useState} from 'react';
import Modal from '../components/Modals/MCategorias';
import { SessionContext } from '../Context/SessionContext';
import '../css/ui.css';

const styles = {
    container: {
        padding: '10px',
        margin: '5rem'
    },

    cardcontainer: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '3rem',
        margin: '5rem',
    },

    card: {
        display: 'flex',
        flexDirection: 'column',
        width: '300px',
        border: '1px solid #ddd',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        transition: 'transform 0.3s ease',
        cursor: 'pointer',
        height: '100%',
        marginTop: '14px',
    },

    cardheader: {
        backgroundColor: '#f9f9f9',
        padding: '10px',
    },

    cardheaderh3: {
        margin: 0,
        color: '#333',
    },

    cardbody: {
       padding: '15px',
    },

    cardfooter: {
        backgroundColor: '#f9f9f9',
        padding: '20px',
        textAlign: 'right',
        fontsize: '0.8em',
        color: '#666',
        marginTop: 'auto',
    },
    linkblock:{
        
        width: '30%',
        margin: '10px',
        padding: '10px',
        border: '1px solid rgba(204,0,0,0.25)',
        borderRadius: '8px',
        textAlign: 'center',
        textDecoration: 'none',
        color: 'var(--primary-color)',
        backgroundColor: '#fff1f1',
        transition: 'background-color 0.3s ease',
        cursor: 'pointer',
        fontWeight: 600,
    },
    
}

const ListCategorias = () => {
    const [categorias, setCategorias] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categoriaToEdit, setCategoriaToEdit] = useState(null);
    const { token, user, roles, isAdmin } = React.useContext(SessionContext);
    const canEdit = isAdmin || (roles || []).includes('edit_own_categories');
    const canDelete = isAdmin || (roles || []).includes('delete_own_categories');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [sessionExpired, setSessionExpired] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleEditClick = (categoriaid) => {
        const categoria = categorias.find(categoria => categoria.id === categoriaid);
        setCategoriaToEdit(categoria);
        setIsModalOpen(true);
    };

    const onUpdatedCategoria = (updatedCategoria) =>{
       let newCategorias = categorias.map(categoria => {
            if (categoria.id === updatedCategoria.id) {
                return updatedCategoria;
            }
            return categoria;
        });
        setCategorias(newCategorias);
        setIsModalOpen(false);
    }
    
    useEffect(() => {
        if (!token) return;
        fetch(`${import.meta.env.VITE_API_URL}/categorias`,{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        })
            .then(response => response.json())
            .then(data => setCategorias(data.categorias || []))
            .catch(error => {
                console.log(error);
                setMessage({ type: 'error', text: 'No se pudieron cargar las categorías.' });
            })
            .finally(() => setIsLoading(false));
    }, [token]);

    const handleDeleteClick = (categoriaid) => {
        if (!token) return;
        fetch(`${import.meta.env.VITE_API_URL}/categorias/${categoriaid}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.mensaje === 'Token inválido' || data.mensaje === 'No autorizado') {
                setSessionExpired(true);
                return;
            }
            if (data.ok) {
                setCategorias(categorias.filter(c => c.id !== categoriaid));
                setMessage({ type: 'success', text: 'Categoría eliminada.' });
            } else {
                console.log('Error al eliminar categoria', data);
                setMessage({ type: 'error', text: data.mensaje || 'Error al eliminar categoría.' });
            }
        })
        .catch(error => {
            console.log(error);
            setMessage({ type: 'error', text: 'Error al eliminar categoría.' });
        });
    }

    return (
        <div style={styles.container}>
            <h1>ListCategorias</h1>
            { !user && <p>Necesitas iniciar sesión para ver tus categorías.</p> }
            {sessionExpired && (
                <div style={{ marginTop: '10px', color: '#b00020' }}>
                    Tu sesión expiró. Vuelve a iniciar sesión.
                </div>
            )}
            {message.text && (
                <div style={{ marginTop: '10px', color: message.type === 'error' ? '#b00020' : '#1b5e20' }}>
                    {message.text}
                </div>
            )}
            <div style={styles.cardcontainer}>
                {isLoading && [1,2,3,4,5,6].map(i => (
                    <div key={i} style={styles.card} className="skeleton" />
                ))}
                {categorias.map(categoria =>  (
                    <div key={categoria.id} style={styles.card}>
                        <div style={styles.cardheader}>
                            <h3>{categoria.nombre}</h3>
                        </div>
                        <div style={styles.cardbody}>
                            <p>{categoria.descripcion}</p>
                        </div>
                        <div style={styles.cardfooter}>
                            <span>Creado el: {new Date(categoria.fecha_creacion).toLocaleDateString()}</span>
                            { user && (
                                <>
                                    {canEdit && (
                                        <button  onClick={() => handleEditClick(categoria.id)} style={styles.linkblock}>
                                            Editar
                                        </button>
                                    )}
                                    {canDelete && (
                                        <button  onClick={() => handleDeleteClick(categoria.id)} style={styles.linkblock}>
                                            Eliminar
                                        </button>
                                    )}
                                </>
                            )}                            
                        </div>
                    </div>
                ))}

                {!isLoading && !categorias.length && <div className="empty-state">No hay categorías aún.</div>}

                {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    categoriaToEdit={categoriaToEdit}
                    onUpdatedCategoria={onUpdatedCategoria}
                    token={token}
                />
            )}
            </div>
        </div>
    );
};

export default ListCategorias;
