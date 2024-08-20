import React, { useState, useEffect }  from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Link } from 'react-router-dom';


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
    container: {
        borderColor: 'blue',
        padding: '10px',
        margin: '5px'
    },
    formregister: {
        marginTop: '12em',
        textAlign: 'right',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '2em',
    },
    userdata: {
        marginTop: '2em',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '2em',
    },
    linkblock:{
        display: 'block',
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
            <h1>Admin Role</h1>
            { userAdmin && 
                <div>
                    <a href="/categorias"  style={styles.linkblock}> Crear Categorias </a> 
                    <a href="/categorias/id" style={styles.linkblock}> Categoria por identificador </a>
                    <Link to="/listcategorias" style={styles.linkblock}> Mostrar categorias </Link>
                </div> 
            }

            { !userAdmin &&(
                <div style={styles.formregister}>
                    <Formik
                        initialValues={{
                            nombre: '',
                            secretKey: '',
                            password: '',
                        }}
                        validationSchema={UserSchema}
                        onSubmit={(values, { setSubmitting }) => {
                            fetch('http://localhost:3000/asignar-rol', {
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
                                <div>
                                    <Field type="text" name="nombre" placeholder="Nombre" className="input-textbox" />
                                    <ErrorMessage name="nombre" component="div" />
                                </div>

                                <div>
                                    <Field type="password" name="secretKey" placeholder="secretKey" className="input-textbox" />
                                    <ErrorMessage name="email" component="div" />
                                </div>

                                <div>
                                    <Field type="password" name="password" placeholder="Password" className="input-textbox" />
                                    <ErrorMessage name="password" component="div" />
                                </div>

                                <button type="submit" disabled={isSubmitting}>
                                    Add Rol
                                </button>
                            </Form>
                        )}
                    </Formik>
                </div>
                
            
            )}

        </>
    )


}

export default AdminRole;