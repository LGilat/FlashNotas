import React, { useContext, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { SessionContext } from '../Context/SessionContext';
import { useNavigate, Link} from 'react-router-dom';



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
    textbox: {
        width: '100%',
        padding: '12px 20px',
        margin: '8px 0',
        display: 'inline-block',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxSizing: 'border-box',
    }
}

const LoginForm = () => {
  const { login, user } = useContext(SessionContext);
  const navigate = useNavigate(); 

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <>
      <Formik
        initialValues={{ username: '', password: '' }}
        onSubmit={login}
      >
        {({ isSubmitting }) => (
          <Form style={styles.formregister }>
            <Field type="text" name="nombre" placeholder="nombre" style={styles.textbox} />
            <ErrorMessage name="nombre" component="div" />
            <Field type="password" name="password" placeholder="Password"  style={styles.textbox} />
            <ErrorMessage name="password" component="div" />
            <button type="submit" disabled={isSubmitting}>
              Iniciar sesión
            </button>
          </Form>
        )}
      </Formik>
    <div style={styles.container}>
        { !user && <p> D'ont have an account Please visit:  <Link to="/register">Create an account</Link> </p>}
    </div>
    </>
  );
};

export default LoginForm;