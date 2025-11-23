import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, BookOpen, Users, GraduationCap, LogOut, User, DollarSign, Eye, ClipboardList } from "lucide-react";
import clsx from "clsx";
import Logo from "@/components/ui/Logo";

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        navigate("/");
        logout();
    };

    if (!user) {
        // For development, we might want to bypass this or have a mock login
        // return <Navigate to="/login" />;
        // Keeping it open for now as we don't have login page yet
    }

    const navItems = [
        { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
        { icon: BookOpen, label: "Livros", path: "/admin/books" },
        { icon: GraduationCap, label: "Turmas", path: "/admin/classes" },
        { icon: Users, label: "Alunos", path: "/admin/students" },
        { icon: DollarSign, label: "Financeiro", path: "/admin/financial" },
        { icon: ClipboardList, label: "Diário de Aulas", path: "/teacher" },
        { icon: Eye, label: "Ver como Aluno", path: "/student" },
    ];

    return (
        <div className="h-screen flex bg-slate-50 overflow-hidden">
            {/* Sidebar */}
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 bg-gradient-to-b from-shino-blue to-blue-900 text-white flex flex-col shadow-2xl overflow-y-auto relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>

                <div className="p-6 border-b border-blue-400/30 flex justify-center relative z-10">
                    <Logo className="h-16" variant="pill" />
                </div>

                <nav className="flex-1 p-4 space-y-2 relative z-10">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                                    isActive
                                        ? "bg-shino-yellow text-blue-900 shadow-lg shadow-yellow-500/20 translate-x-1"
                                        : "text-blue-100 hover:bg-white/10 hover:text-white hover:translate-x-1"
                                )}
                            >
                                <Icon size={20} className={isActive ? "text-blue-800" : "text-blue-200"} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-blue-400/30 relative z-10">
                    <div className="flex items-center gap-3 px-3 py-2 mb-3 bg-black/20 rounded-lg border border-white/5">
                        <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center border border-blue-400/30">
                            <User size={16} className="text-blue-200" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">{user?.email || "Admin"}</p>
                            <p className="text-xs text-blue-200">Administrador</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-sm font-medium text-red-200 hover:bg-red-500/20 hover:text-white rounded-xl transition-colors"
                    >
                        <LogOut size={20} />
                        Sair
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
