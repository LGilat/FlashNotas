import React from 'react';
import { Navigate } from 'react-router-dom';
import { SessionContext } from '../Context/SessionContext';

const AdminRoute = ({ children }) => {
    const { token, isReady, isAdmin } = React.useContext(SessionContext);

    if (!isReady) {
        return <div>Cargando sesión...</div>;
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminRoute;
