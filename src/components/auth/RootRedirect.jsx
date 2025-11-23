import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function RootRedirect() {
    const { user, role, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    if (role === 'student') {
        return <Navigate to="/student" replace />;
    }

    // User is logged in but has no role (or role fetch failed)
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-2">Acesso Pendente</h1>
                <p className="text-slate-600 mb-6">
                    Sua conta foi criada, mas ainda não está associada a um perfil de Aluno ou Administrador.
                </p>
                <p className="text-sm text-slate-500 bg-slate-100 p-4 rounded-lg mb-6">
                    Email: {user.email}
                </p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-primary hover:underline font-medium"
                >
                    Verificar novamente
                </button>
            </div>
        </div>
    );
}
