import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import { SessionContext } from '../Context/SessionContext';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import '../css/ui.css';

const NoteSchema = Yup.object().shape({
    titulo: Yup.string()
        .min(2, 'Muy corto')
        .max(100, 'Muy largo')
        .required('Requerido'),
    contenido: Yup.string()
        .min(2, 'Muy corto')
        .max(2000, 'Muy largo')
        .required('Requerido'),
    fecha_creacion: Yup.date()
        .required('Fecha requerida')
        .typeError('Formato de fecha inválido'),
    categoriaId: Yup.number().required('Selecciona una categoría'),
    tags: Yup.string()
});

const CreateNote = () => {
    const { user, token } = React.useContext(SessionContext);
    const [categorias, setCategorias] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();
    const [isDirty, setIsDirty] = useState(false);

    // Confirmación de salida al cerrar pestaña o recargar
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);

    const handleBackClick = (e) => {
        if (isDirty && !window.confirm('Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?')) {
            e.preventDefault();
        }
    };

    useEffect(() => {
        if (!token) return;
        fetch(`${import.meta.env.VITE_API_URL}/categorias`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            setCategorias(data.categorias || []);
        });
    }, [token]);

    if (!user || !token) {
        return (
            <div className="empty-state" style={{marginTop: '100px'}}>
                No tienes permiso para acceder. 
                <Link to="/login"> Iniciar sesión</Link>
            </div>
        )
    }

    return (
        <div className="create-note-container">
            <div className="create-note-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <div>
                    <h1>✨ Nueva Nota</h1>
                    <p>Organiza tus ideas de forma profesional</p>
                </div>
                <Link to="/note" className="icon-btn" title="Volver a mis notas" onClick={handleBackClick}>
                    <i className='bx bx-arrow-back'></i>
                </Link>
            </div>

            <Formik
                initialValues={{
                    titulo: '',
                    contenido: '',
                    fecha_creacion: new Date().toISOString().split('T')[0],
                    categoriaId: '',
                    tags: '',
                    pinned: false,
                    favorite: false,
                }}
                validationSchema={NoteSchema}
                onSubmit={(values, { setSubmitting }) => {
                    fetch(`${import.meta.env.VITE_API_URL}/note`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                            ...values,
                            categoriaId: parseInt(values.categoriaId, 10)
                        }),
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.ok) {
                            setIsDirty(false);
                            setMessage({ type: 'success', text: '¡Nota creada con éxito!' });
                            setTimeout(() => navigate('/note'), 1500);
                        } else {
                            setMessage({ type: 'error', text: data.mensaje });
                        }
                    })
                    .finally(() => setSubmitting(false));
                }}
            >
                {({ isSubmitting, values }) => (
                    <Form className="create-note-form" onChange={() => setIsDirty(true)}>
                        {message.text && (
                            <div className={`message-alert ${message.type}`} style={{marginBottom: '1rem', padding: '10px', borderRadius: '8px'}}>
                                {message.text}
                            </div>
                        )}

                        {categorias.length === 0 && (
                            <div className="message-alert error" style={{marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', textAlign: 'center'}}>
                                <span><i className='bx bx-error-circle'></i> No tienes categorías creadas.</span>
                                <p style={{fontSize: '0.9rem', margin: 0}}>Necesitas al menos una categoría para organizar tus notas.</p>
                                <Link to="/categorias" className="toggle-btn active" style={{textDecoration: 'none', background: 'white', color: 'var(--primary-color)'}}>
                                    <i className='bx bx-plus'></i> Crear mi primera categoría
                                </Link>
                            </div>
                        )}

                        <div className="filter-group">
                            <label className="checkbox-label" style={{fontWeight: 600}}>Título de la nota</label>
                            <Field name="titulo" className="modern-input" placeholder="Ej: Ideas para el proyecto..." />
                            <div className={`char-counter ${values.titulo.length > 90 ? 'limit-near' : ''}`}>
                                {values.titulo.length} / 100
                            </div>
                            <ErrorMessage name="titulo" render={msg => <span style={{color: 'red', fontSize: '0.8rem'}}>{msg}</span>} />
                        </div>

                        <div className="filter-group">
                            <label className="checkbox-label" style={{fontWeight: 600}}>Contenido</label>
                            <Field as="textarea" name="contenido" className="modern-textarea" rows="6" placeholder="Escribe aquí tu contenido..." />
                            <div className={`char-counter ${values.contenido.length > 1800 ? 'limit-near' : ''}`}>
                                {values.contenido.length} / 2000
                            </div>
                            <ErrorMessage name="contenido" render={msg => <span style={{color: 'red', fontSize: '0.8rem'}}>{msg}</span>} />
                        </div>

                        <div className="responsive-grid">
                            <div className="filter-group">
                                <label className="checkbox-label" style={{fontWeight: 600}}>Categoría</label>
                                <Field as="select" name="categoriaId" className="modern-select">
                                    <option value="">Selecciona...</option>
                                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                                </Field>
                                <ErrorMessage name="categoriaId" render={msg => <span style={{color: 'red', fontSize: '0.8rem'}}>{msg}</span>} />
                            </div>

                            <div className="filter-group">
                                <label className="checkbox-label" style={{fontWeight: 600}}>Fecha</label>
                                <Field type="date" name="fecha_creacion" className="modern-input" />
                            </div>
                        </div>

                        <div className="filter-group">
                            <label className="checkbox-label" style={{fontWeight: 600}}>Etiquetas (separadas por comas)</label>
                            <Field name="tags" className="modern-input" placeholder="ej: trabajo, react, importante" />
                        </div>

                        <div style={{ display: 'flex', gap: '20px', padding: '10px 0' }}>
                            <label className="checkbox-label">
                                <Field type="checkbox" name="pinned" />
                                📌 Fijar nota arriba
                            </label>
                            <label className="checkbox-label">
                                <Field type="checkbox" name="favorite" />
                                ⭐ Añadir a favoritas
                            </label>
                        </div>

                        <div className="form-actions">
                            <Link to="/note" className="toggle-btn" style={{textDecoration: 'none'}} onClick={handleBackClick}>Cancelar</Link>
                            <button type="submit" disabled={isSubmitting} className="toggle-btn active" style={{padding: '0.8rem 2rem'}}>
                                {isSubmitting ? 'Guardando...' : 'Guardar Nota'}
                            </button>
                        </div>
                    </Form>
                )}
            </Formik>
        </div>
    )
};

export default CreateNote;
