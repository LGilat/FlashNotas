import React, {useState, useEffect} from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';


const UserSchema = Yup.object().shape({
    nombre: Yup.string()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Required'),
    descripcion: Yup.string()
        .min(4, 'Password must be at least 8 characters')
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
    successMessage: {
        color: 'green',
        fontWeight: 'bold',
        marginTop: '10px',
    },
    errorMessage: {
        color: 'red',
        fontWeight: 'bold',
        marginTop: '10px',
    }

};





const Categorias = () => {
    const [userAdmin, setUserAdmin] = useState(null);
    const [ successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const storedAdminData = sessionStorage.getItem('adminData');
        if (storedAdminData) {
            setUserAdmin(JSON.parse(storedAdminData));
        }
    }, []); 


    return (
        <>
            <h1>Categorias</h1>
            { !userAdmin && <p> Necesita ser usuario y administrador para poder ingresar categorias</p> }
            { userAdmin && userAdmin.rol === 'admin' && 
                <>
                    <p> Usuario y administrador </p> 
                    <div style={styles.formregister}>
                        <Formik
                            initialValues={{
                                nombre: '',
                                descripcion: '',
                                username: userAdmin.nombre,
                            }}
                            validationSchema={UserSchema}
                            onSubmit={(values, { setSubmitting, resetForm }) => {
                                fetch('http://localhost:3000/categorias', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${userAdmin.token}`,
                                    },
                                    body: JSON.stringify(values),
                                })
                                    .then(response => response.json())
                                    .then((data) => {
                                        console.log('data: ', data);
                                        if (data.ok) {
                                            console.log('Success data:', data);
                                            setSuccessMessage(data.mensaje);
                                            resetForm();
                                            setTimeout(() => setSuccessMessage(''), 3000); 
                                        }
                                        else{
                                            console.log('Error data: ', data);
                                            setErrorMessage(data.mensaje);
                                            setTimeout(() => setErrorMessage(''), 3000);
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
                                        <Field type="text" name="descripcion" placeholder="descripcion" className="input-textbox" />
                                        <ErrorMessage name="email" component="div" />
                                    </div>

                                    

                                    <button type="submit" disabled={isSubmitting}>
                                        Add Rol
                                    </button>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </>
            
            }
            
            {successMessage && <div style={styles.successMessage}>{successMessage}</div>}
            {errorMessage && <div style={styles.errorMessage}>{errorMessage}</div>}
        
        </>

    );

}


export default Categorias;