import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedRoute({ children, role }) {
    const { user, role: userRole, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (role && userRole !== role) {
        // Allow admins to access student routes for preview/testing
        if (userRole === 'admin' && role === 'student') {
            return children;
        }

        // User is logged in but doesn't have the required role
        // Redirect to their appropriate dashboard or an unauthorized page
        if (userRole === 'admin') return <Navigate to="/admin" replace />;
        if (userRole === 'student') return <Navigate to="/student" replace />;
        return <div className="min-h-screen flex items-center justify-center">Acesso não autorizado</div>;
    }

    return children;
}
