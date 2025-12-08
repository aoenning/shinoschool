import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/ui/Logo";
import { LogOut, User, Shield } from "lucide-react";

export default function StudentLayout() {
    const { user, logout, isAdmin } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate("/");
        logout();
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <header className="bg-shino-yellow border-b border-yellow-600 h-16 flex items-center px-6 justify-between sticky top-0 z-10 shadow-lg">
                <Logo className="h-12" variant="pill" />
                <div className="flex items-center gap-4">
                    {/* Admin Panel Button - Only show for admins */}
                    {isAdmin && (
                        <button
                            onClick={() => navigate("/admin")}
                            className="flex items-center gap-2 px-4 py-2 bg-shino-blue text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md font-medium"
                            title="Voltar ao Painel Admin"
                        >
                            <Shield size={18} />
                            <span className="hidden sm:inline">Painel Admin</span>
                        </button>
                    )}
                    <div className="flex items-center gap-2 bg-shino-blue px-3 py-2 rounded-lg shadow-md">
                        <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-white">
                            <User size={16} />
                        </div>
                        <span className="text-sm font-medium text-white hidden sm:inline">
                            {user?.email || "Aluno"}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 bg-shino-blue text-white hover:bg-blue-700 rounded-lg transition-colors shadow-md"
                        title="Sair"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            <main className="h-[calc(100vh-64px)] overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}
