import React, { useContext, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { SessionContext } from '../Context/SessionContext';
import { useNavigate, Link } from 'react-router-dom';
import * as Yup from 'yup';
import '../css/auth.css';

const LoginSchema = Yup.object().shape({
    nombre: Yup.string().required('El nombre de usuario es requerido'),
    password: Yup.string().required('La contraseña es requerida'),
});

const LoginForm = () => {
    const { login, user } = useContext(SessionContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>Bienvenido de Nuevo</h1>
                    <p>Inicia sesión para acceder a tus notas.</p>
                </div>
                <Formik
                    initialValues={{ nombre: '', password: '' }}
                    validationSchema={LoginSchema}
                    onSubmit={(values, { setSubmitting, setFieldError }) => {
                        // The login function from context should handle the API call
                        // and navigation. We pass `setFieldError` to it so it can
                        // report back errors.
                        login(values, { setSubmitting, setFieldError });
                    }}
                >
                    {({ isSubmitting, errors }) => (
                        <Form>
                            <div className="input-group">
                                <label htmlFor="nombre">Nombre de Usuario</label>
                                <Field type="text" name="nombre" id="nombre" placeholder="Tu nombre de usuario" className="input-textbox" />
                                <ErrorMessage name="nombre" component="div" className="error-message" />
                            </div>

                            <div className="input-group">
                                <label htmlFor="password">Contraseña</label>
                                <Field type="password" name="password" id="password" placeholder="Tu contraseña" className="input-textbox" />
                                <ErrorMessage name="password" component="div" className="error-message" />
                            </div>
                            
                            {errors.general && <div className="error-message general-error">{errors.general}</div>}

                            <button type="submit" disabled={isSubmitting} className="btn-primary auth-btn">
                                {isSubmitting ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
                            </button>
                        </Form>
                    )}
                </Formik>
                <div className="auth-footer">
                    <p>¿No tienes una cuenta? <Link to="/register">Crea una aquí</Link></p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;