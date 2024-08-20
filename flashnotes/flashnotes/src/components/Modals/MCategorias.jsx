import ReactModal from 'react-modal';
import React, { useState, useEffect } from 'react';

// ... (resto del código)

const styles  = {
    textinput:{
        padding: '10px',
        margin: '5px',
        borderRadius: '4px',
        border: '1px solid #ccc',
    },

    textArea: {
        padding: '10px',
        margin: '5px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        height: '100px',
    },

    button: {
        padding: '10px 20px',
        width: '140px',
        marginRight: '0 auto',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    }
}

const ModalCategoria = ({ isOpen, onClose, categoriaToEdit, onUpdatedCategoria }) => {

    const [editedCategoria, setEditedCategoria] = useState(categoriaToEdit);

    const handleChange = (event) => {
        setEditedCategoria({
            ...editedCategoria,
            [event.target.name]: event.target.value
        });
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();

        fetch(`http://localhost:3000/categorias/${categoriaToEdit.id}`, {
            method: 'PATCH',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(editedCategoria), // Enviamos los datos actualizados
        })
        .then(response => response.json())
        .then(data => {
            // ... (lo mismo que antes)
            console.log('valor de data: ', data);
            if ( data.ok ){
                onUpdatedCategoria(editedCategoria);
                onClose();
            } else {
                console.log('error en la actualización');
            }
        })
        .catch(error => console.error(error));
    };
    return (
        <ReactModal
            isOpen={isOpen}
            onRequestClose={onClose}
            contentLabel="Editar Categoría"
            style={{
                overlay: {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                },
                content: {
                // ... estilos para el contenido del modal
                    
                    position: 'relative',
                    top: 'auto',
                    left: 'auto',
                    right: 'auto',
                    bottom: 'auto',
                    border: 'none',
                    background: '#fff',
                    overflow: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    borderRadius: '4px',
                    outline: 'none',
                    padding: '20px',
                    width: '80%',
                    maxWidth: '600px'
                }
            }}
        >
            {/* Formulario de edición */}
            <form onSubmit={handleSubmit} style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
            }} >
                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    Nombre: <input style={ styles.textinput } type="text" name="nombre" value={editedCategoria.nombre} onChange={handleChange} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '5px'}}>
                    Descripción: <textarea style={styles.textArea} name="descripcion" value={editedCategoria.descripcion} onChange={handleChange}></textarea>
                </label>
                <button style={styles.button} type="submit">Guardar</button>
            </form>
        </ReactModal>
    );
};


export default ModalCategoria;
