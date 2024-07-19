import React, { createContext, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
const SessionContext = createContext();

const SessionProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const navigate = useNavigate();

    const login = (values, { setSubmitting }) => {
        // Lógica de autenticación aquí
        // Por ejemplo, una llamada a una API para autenticar al usuario
        fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        })
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    setUser(data.nombre);
                    setIsLoggedIn(true);
                    setSubmitting(false);
                    console.log("Usuario autenticado: " , data);
                    navigate('/');
                } else {
                    setSubmitting(false);
                    // Mostrar un mensaje de error
                }
            })
            .catch(error => {
                setSubmitting(false);
                setIsLoggedIn(false);
                // Mostrar un mensaje de error
            });
    };

    const logout = () => {
        setUser(null);
    };

    const contextValue = useMemo(() => ({
        user,
        login,
        logout,
        token,
        isLoggedIn
    }), [user, token, isLoggedIn]);

    return (
        <SessionContext.Provider value={contextValue}>
            {children}
        </SessionContext.Provider>
    );
};

export { SessionProvider, SessionContext };