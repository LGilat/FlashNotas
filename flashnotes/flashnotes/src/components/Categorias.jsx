import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { SessionContext } from '../Context/SessionContext';
import { Link, useNavigate } from 'react-router-dom';
import '../css/ui.css';

const CategorySchema = Yup.object().shape({
    nombre: Yup.string()
        .min(2, 'Muy corto')
        .max(50, 'Muy largo')
        .required('Requerido'),
    descripcion: Yup.string()
        .min(4, 'Mínimo 4 caracteres')
        .required('Requerido'),
});

const Categorias = () => {
    const [message, setMessage] = useState({ type: '', text: '' });
    const { user, token, roles, isAdmin } = React.useContext(SessionContext);
    const canCreate = isAdmin || (roles || []).includes('create_categories');
    const [sessionExpired, setSessionExpired] = useState(false);
    const navigate = useNavigate();

    if (!user || !token) {
        return (
            <div className="empty-state" style={{marginTop: '100px'}}>
                No tienes permiso para acceder. 
                <Link to="/login"> Iniciar sesión</Link>
            </div>
        )
    }

    return (
        <div className="create-note-container" style={{maxWidth: '600px'}}>
            <div className="create-note-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                    <h1>📁 Categorías</h1>
                    <p>Crea y organiza tus etiquetas maestras</p>
                </div>
                <Link to="/note" className="icon-btn" title="Volver a mis notas">
                    <i className='bx bx-arrow-back'></i>
                </Link>
            </div>

            <div className="form-card" style={{background: 'white', border: 'none', padding: 0}}>
                {!canCreate && <div className="message-alert error" style={{marginBottom: '1rem'}}>No tienes permiso para crear categorías.</div>}
                
                <Formik
                    initialValues={{
                        nombre: '',
                        descripcion: '',
                    }}
                    validationSchema={CategorySchema}
                    onSubmit={(values, { setSubmitting, resetForm }) => {
                        if (!canCreate) {
                            setMessage({ type: 'error', text: 'No tienes permiso para crear categorías.' });
                            setSubmitting(false);
                            return;
                        }
                        fetch(`${import.meta.env.VITE_API_URL}/categorias`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`,
                            },
                            body: JSON.stringify(values),
                        })
                        .then(response => response.json())
                        .then((data) => {
                            if (data.mensaje === 'Token inválido' || data.mensaje === 'No autorizado') {
                                setSessionExpired(true);
                                return;
                            }
                            if (data.ok) {
                                setMessage({ type: 'success', text: 'Categoría creada con éxito.' });
                                resetForm();
                                setTimeout(() => setMessage({ type: '', text: '' }), 3000); 
                            } else {
                                setMessage({ type: 'error', text: data.mensaje || 'Error al crear categoría' });
                            }
                        })
                        .catch(() => {
                            setMessage({ type: 'error', text: 'No se pudo conectar al servidor.' });
                        })
                        .finally(() => setSubmitting(false));
                    }}
                >
                    {({ isSubmitting }) => (
                        <Form className="create-note-form">
                            {sessionExpired && <div className="message-alert error">Tu sesión expiró. Vuelve a iniciar sesión.</div>}
                            {message.text && <div className={`message-alert ${message.type}`}>{message.text}</div>}
                            
                            <div className="filter-group">
                                <label className="checkbox-label" style={{fontWeight: 600}}>Nombre</label>
                                <Field type="text" name="nombre" placeholder="Ej: Trabajo, Personal, Viajes..." className="modern-input" />
                                <ErrorMessage name="nombre" render={msg => <span style={{color: 'red', fontSize: '0.8rem'}}>{msg}</span>} />
                            </div>

                            <div className="filter-group">
                                <label className="checkbox-label" style={{fontWeight: 600}}>Descripción</label>
                                <Field as="textarea" name="descripcion" placeholder="¿Para qué es esta categoría?" className="modern-textarea" rows="3" />
                                <ErrorMessage name="descripcion" render={msg => <span style={{color: 'red', fontSize: '0.8rem'}}>{msg}</span>} />
                            </div>

                            <div className="form-actions" style={{marginTop: '1rem'}}>
                                <button type="submit" disabled={isSubmitting || !canCreate} className="toggle-btn active" style={{width: '100%', justifyContent: 'center', padding: '0.8rem'}}>
                                    {isSubmitting ? 'Creando...' : 'Crear Categoría'}
                                </button>
                            </div>
                        </Form>
                    )}
                </Formik>
            </div>
        </div>
    );
}

export default Categorias;
