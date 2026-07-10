import React, { useState, useEffect }  from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';
import '../css/forms.css';


const UserSchema = Yup.object().shape({
    nombre: Yup.string()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Required'),
    secretKey: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Required'),
    password: Yup.string()
        .min(8, 'Password must be at least 8 characters')
        .required('Required'),
});

const styles = {
    linkblock:{
        display: 'block',
        margin: '10px 0',
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
    }
};


const AdminRole = () => {
    
    const [userAdmin, setUserAdmin] = useState(null);

    useEffect(() => {
        const storedAdminData = sessionStorage.getItem('adminData');
        if (storedAdminData) {
            setUserAdmin(JSON.parse(storedAdminData));
        }
    }, []);


    return (
        <>
            <div className="form-page">
            <h1 style={{ marginBottom: '10px' }}>Admin Role</h1>
            <p className="form-subtitle">Asigna rol de administrador a un usuario.</p>
            { userAdmin && 
                <div>
                    <a href="/categorias"  style={styles.linkblock}> Crear Categorias </a> 
                    <a href="/categorias/id" style={styles.linkblock}> Categoria por identificador </a>
                    <Link to="/listcategorias" style={styles.linkblock}> Mostrar categorias </Link>
                </div> 
            }

            { !userAdmin &&(
                <div className="form-card">
                    <Formik
                        initialValues={{
                            nombre: '',
                            secretKey: '',
                            password: '',
                        }}
                        validationSchema={UserSchema}
                        onSubmit={(values, { setSubmitting }) => {
                            fetch(`${import.meta.env.VITE_API_URL}/asignar-rol`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify(values),
                            })
                                .then(response => response.json())
                                .then((data) => {
                                    console.log('data: ', data.error);
                                    if (data.ok) {
                                        sessionStorage.setItem('adminData', JSON.stringify({
                                            token: data.token,
                                            nombre: data.nombre,
                                            rol: data.rol,
                                        }));
                                        setUserAdmin(data);
                                        console.log('Success data:', data);
                                    }
                                    setSubmitting(false);
                                })
                                .catch((error) => {
                                    console.error('Error data: ', error);
                                    setSubmitting(false);
                                });
                        }}
                    >
                        {({ isSubmitting }) => (
                            <Form>
                                <label className="form-label">Nombre</label>
                                <div>
                                    <Field type="text" name="nombre" placeholder="Nombre" className="form-input" />
                                    <ErrorMessage name="nombre" component="div" />
                                </div>

                                <label className="form-label">Secret Key</label>
                                <div>
                                    <Field type="password" name="secretKey" placeholder="secretKey" className="form-input" />
                                    <ErrorMessage name="email" component="div" />
                                </div>

                                <label className="form-label">Password</label>
                                <div>
                                    <Field type="password" name="password" placeholder="Password" className="form-input" />
                                    <ErrorMessage name="password" component="div" />
                                </div>

                                <button type="submit" disabled={isSubmitting} className="form-button">
                                    Add Rol
                                </button>
                            </Form>
                        )}
                    </Formik>
                </div>
                
            
            )}

            </div>
        </>
    )


}

export default AdminRole;
