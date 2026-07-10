import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import '../css/auth.css';

const UserSchema = Yup.object().shape({
    nombre: Yup.string()
        .min(2, 'El nombre es muy corto')
        .max(50, 'El nombre es muy largo')
        .required('El nombre es requerido'),
    email: Yup.string()
        .email('Email inválido')
        .required('El email es requerido'),
    password: Yup.string()
        .min(8, 'La contraseña debe tener al menos 8 caracteres')
        .required('La contraseña es requerida'),
});

const UserRegistrationForm = () => {
    const [registrationSuccess, setRegistrationSuccess] = useState(false);
    const navigate = useNavigate();

    // If user is already logged in, redirect to home
    // Note: A proper session check should be done here.
    // This is a placeholder for session logic from context.
    useEffect(() => {
        // Example: if (session.user) navigate('/');
    }, [navigate]);

    if (registrationSuccess) {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-header">
                        <h2>¡Registro Exitoso!</h2>
                    </div>
                    <p className="auth-success-message">Tu cuenta ha sido creada. Ahora puedes iniciar sesión.</p>
                    <Link to="/login" className="btn-primary auth-btn">Ir a Iniciar Sesión</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>Crear una Cuenta</h1>
                    <p>Únete a Flash Notes para guardar tus ideas.</p>
                </div>
                <Formik
                    initialValues={{
                        nombre: '',
                        email: '',
                        password: '',
                    }}
                    validationSchema={UserSchema}
                    onSubmit={(values, { setSubmitting, setFieldError }) => {
                        fetch(`${import.meta.env.VITE_API_URL}/signup`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(values),
                        })
                        .then(response => response.json())
                        .then((data) => {
                            if (data.usuario) {
                                setRegistrationSuccess(true);
                            } else if (data.error) {
                                // Handle specific errors, e.g., email already exists
                                setFieldError('general', data.error);
                            }
                            setSubmitting(false);
                        })
                        .catch(() => {
                            setFieldError('general', 'Ocurrió un error. Por favor, intenta de nuevo.');
                            setSubmitting(false);
                        });
                    }}
                >
                    {({ isSubmitting, errors }) => (
                        <Form>
                            <div className="input-group">
                                <label htmlFor="nombre">Nombre</label>
                                <Field type="text" name="nombre" id="nombre" placeholder="Tu nombre" className="input-textbox" />
                                <ErrorMessage name="nombre" component="div" className="error-message" />
                            </div>

                            <div className="input-group">
                                <label htmlFor="email">Email</label>
                                <Field type="email" name="email" id="email" placeholder="tu@email.com" className="input-textbox" />
                                <ErrorMessage name="email" component="div" className="error-message" />
                            </div>

                            <div className="input-group">
                                <label htmlFor="password">Contraseña</label>
                                <Field type="password" name="password" id="password" placeholder="Mínimo 8 caracteres" className="input-textbox" />
                                <ErrorMessage name="password" component="div" className="error-message" />
                            </div>

                            {errors.general && <div className="error-message general-error">{errors.general}</div>}

                            <button type="submit" disabled={isSubmitting} className="btn-primary auth-btn">
                                {isSubmitting ? 'Registrando...' : 'Crear Cuenta'}
                            </button>
                        </Form>
                    )}
                </Formik>
                <div className="auth-footer">
                    <p>¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link></p>
                </div>
            </div>
        </div>
    );
}

export default UserRegistrationForm;