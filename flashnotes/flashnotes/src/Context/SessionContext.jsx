import React, { createContext, useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const SessionContext = createContext();

const SessionProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [roles, setRoles] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const raw = window.localStorage.getItem('session');
        if (!raw) {
            setIsReady(true);
            return;
        }
        try {
            const session = JSON.parse(raw);
            if (session?.token && session?.user) {
                setToken(session.token);
                setUser(session.user);
                setIsLoggedIn(true);
                setIsAdmin(!!session.user?.isAdmin);
                setRoles(session.user?.roles || []);
            }
        } catch (error) {
            window.localStorage.removeItem('session');
        } finally {
            setIsReady(true);
        }
    }, []);

    useEffect(() => {
        if (isReady && token) {
            refreshSession();
        }
    }, [isReady, token]);

    const login = (values, { setSubmitting, setFieldError }) => {
        fetch(`${import.meta.env.VITE_API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                const sessionUser = { nombre: data.nombre, id: data.id, isAdmin: !!data.isAdmin, roles: data.roles || [] };
                setUser(sessionUser);
                setToken(data.token);
                setIsLoggedIn(true);
                setIsAdmin(!!data.isAdmin);
                setRoles(data.roles || []);
                window.localStorage.setItem('session', JSON.stringify({
                    token: data.token,
                    user: sessionUser,
                }));
                navigate('/');
            } else {
                // Set a general error on the form
                setFieldError('general', data.message || 'Credenciales inválidas. Por favor, intenta de nuevo.');
            }
            setSubmitting(false);
        })
        .catch(error => {
            setFieldError('general', 'No se pudo conectar al servidor. Intenta más tarde.');
            setSubmitting(false);
        });
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        setIsLoggedIn(false);
        setIsAdmin(false);
        setRoles([]);
        window.localStorage.removeItem('session');
    };

    const refreshSession = () => {
        if (!token) return;
        fetch(`${import.meta.env.VITE_API_URL}/me`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    const sessionUser = { ...user, ...data.user, isAdmin: !!data.isAdmin, roles: data.roles || [] };
                    setUser(sessionUser);
                    setIsAdmin(!!data.isAdmin);
                    setRoles(data.roles || []);
                    window.localStorage.setItem('session', JSON.stringify({
                        token,
                        user: sessionUser,
                    }));
                }
            })
            .catch(() => {});
    };

    const updateToken = (newToken) => {
        if (!newToken) return;
        setToken(newToken);
        const sessionUser = user || {};
        window.localStorage.setItem('session', JSON.stringify({
            token: newToken,
            user: sessionUser,
        }));
    };

    const contextValue = useMemo(() => ({
        user,
        login,
        logout,
        token,
        isLoggedIn,
        isReady,
        isAdmin,
        roles,
        refreshSession,
        updateToken
    }), [user, token, isLoggedIn, isReady, isAdmin, roles]);

    return (
        <SessionContext.Provider value={contextValue}>
            {children}
        </SessionContext.Provider>
    );
};

export { SessionProvider, SessionContext };
