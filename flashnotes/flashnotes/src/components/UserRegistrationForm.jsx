import React, { useContext, useEffect } from 'react';
import UserDataCreate from './UserDataCreate';
import {  useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { SessionContext } from '../Context/SessionContext';
import * as Yup from 'yup';
import '../css/register.css';

const UserSchema = Yup.object().shape({
    nombre: Yup.string()
        .min(2, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Required'),
    email: Yup.string()
        .email('Invalid email')
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
    }

};



const UserRegistrationForm = () => {
    const [userData, setUserData] = React.useState(null);
    const { user } = useContext(SessionContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            navigate('/');
        }
    }, [user, navigate]);

    return (
        <>
            
            { !user && (
                <>
                    <div style={styles.formregister}>
                        <Formik
                            initialValues={{
                                nombre: '',
                                email: '',
                                password: '',
                            }}
                            validationSchema={UserSchema}
                            onSubmit={(values, { setSubmitting }) => {
                                fetch('http://localhost:3000/signup', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify(values),
                                })
                                    .then(response => response.json())
                                    .then((data) => {
                                        console.log('Success data:', data);
                                        if (data.token) {
                                            window.localStorage.setItem('token', data.token);
                                        }
                                        if (data.usuario) {
                                            setUserData(data.usuario);
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
                                        <Field type="email" name="email" placeholder="Email" className="input-textbox" />
                                        <ErrorMessage name="email" component="div" />
                                    </div>

                                    <div>
                                        <Field type="password" name="password" placeholder="Password" className="input-textbox" />
                                        <ErrorMessage name="password" component="div" />
                                    </div>

                                    <button type="submit" disabled={isSubmitting}>
                                        Register
                                    </button>
                                </Form>
                            )}
                        </Formik>
                    </div>
                    <div style={styles.container}>
                        { !userData && <p> Already have account <Link to="/login">Login in here</Link> </p>}
                    </div>
                    <div style={userData && styles.userdata}>
                        {userData && <UserDataCreate userdata={userData} />}
                        {userData &&
                            <p>
                                Already have an account? 
                                <Link to="/login">Log in here</Link>
                            </p>
                        }
                    </div>
                </>
            )}
        </>
    )
}

export default UserRegistrationForm;