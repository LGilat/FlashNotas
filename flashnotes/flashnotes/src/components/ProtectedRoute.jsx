import React from 'react';
import { Navigate } from 'react-router-dom';
import { SessionContext } from '../Context/SessionContext';

const ProtectedRoute = ({ children }) => {
    const { token, isReady } = React.useContext(SessionContext);

    if (!isReady) {
        return <div>Cargando sesión...</div>;
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
