import React, {useEffect, useState} from 'react';
import Modal from '../components/Modals/MCategorias';

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
        border: '1px solid #ccc',
        borderRadius: '4px',
        textAlign: 'center',
        textDecoration: 'none',
        color: 'blue',
        backgroundColor: '#f0f0f0',
        transition: 'background-color 0.3s ease',
        cursor: 'pointer',
    },
    
}

const ListCategorias = () => {
    const [categorias, setCategorias] = useState([]);
    const [userAdmin, setUserAdmin] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categoriaToEdit, setCategoriaToEdit] = useState(null);

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
        const userAdmin = sessionStorage.getItem('adminData');
        if ( userAdmin ) {
            const userAdminData = JSON.parse(userAdmin);
            setUserAdmin(userAdminData);
        }
        fetch('http://localhost:3000/categorias',{
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then(response => response.json())
            .then(data => setCategorias(data.categorias))
            .catch(error => console.log(error));
    }, []);

    return (
        <div style={styles.container}>
            <h1>ListCategorias</h1>
            <div style={styles.cardcontainer}>
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
                            { userAdmin && userAdmin.rol === 'admin' && (
                                <button  onClick={() => handleEditClick(categoria.id)} style={styles.linkblock}>
                                    Editar
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {isModalOpen && (
                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    categoriaToEdit={categoriaToEdit}
                    onUpdatedCategoria={onUpdatedCategoria}
                />
            )}
            </div>
        </div>
    );
};

export default ListCategorias;

