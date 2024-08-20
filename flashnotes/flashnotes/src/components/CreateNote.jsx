import React from 'react'
import { Link } from 'react-router-dom';
import { SessionContext } from '../Context/SessionContext'; 
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';


const NoteSchema = Yup.object().shape({
    titulo: Yup.string()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Required'),
    contenido: Yup.string()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Required'),
    fecha_creacion: Yup.date()
        .required('Date is required')
        .min(new Date(), 'Date must be in the future')
        .max(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'Date cannot be more than a year from now')
        .typeError('Invalid date format')
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
    warning: {
        marginTop: '12em',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '2em',
        textAlign: 'center',
    },
    textbox: {
        width: '100%',
        padding: '12px 20px',
        margin: '8px 0',
        display: 'inline-block',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxSizing: 'border-box',
    }

};





const CreateNote = () => {
    const { user, token } = React.useContext(SessionContext);

    if ( !user || !token ) {
        return ( 
            <div style={styles.warning}>
                No tienes permiso para acceder a esta página
                    <Link to="/login"> Iniciar sesión</Link> o <Link to="/register">Registrarse</Link> para continuar. <br /><Link to="/">Volver al inicio</Link>
            </div>
        )
    }    

    return (
        <div>
            <h1>Crear Nota</h1>
            <Formik
                initialValues={{
                    titulo: '',
                    contenido: '',
                    fecha_creacion: '',
                }}
                validationSchema={NoteSchema}
                onSubmit={(values, { setSubmitting }) => {
                    setTimeout(() => {
                        alert(JSON.stringify(values, null, 2));
                        setSubmitting(false);
                    }, 400);
                }}
            >
                {({ isSubmitting }) => (
                    <Form style={styles.formregister}>
                        <Field type="text" name="titulo" placeholder="Titulo"  style={styles.textbox} />
                        <ErrorMessage name="titulo" component="div" />
                        <Field type="text" name="contenido" placeholder="Contenido" style={styles.textbox} />
                        <ErrorMessage name="contenido" component="div" />
                        <Field type="date" name="fecha_creacion" placeholder="Fecha de Creación" style={styles.textbox} />
                        <ErrorMessage name="fecha_creacion" component="div" />
                        <button type="submit" disabled={isSubmitting}>
                            Crear Nota
                        </button>
                    </Form>
                )}
                </Formik>

            <Link to="/">Volver al inicio</Link>
        </div>

    )
 };

 export default CreateNote;
