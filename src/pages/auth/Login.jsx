import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import Logo from "@/components/ui/Logo";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { login, user, role } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user && role) {
            if (role === 'admin') {
                navigate("/admin");
            } else if (role === 'student') {
                navigate("/student");
            }
        }
    }, [user, role, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            // The useEffect will handle the navigation once the user and role are updated in the context
        } catch (err) {
            console.error(err);
            setError("Falha ao fazer login. Verifique suas credenciais.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row">

                {/* Left Side - Branding (Hidden on mobile) */}
                <div className="hidden md:flex md:w-1/2 bg-shino-blue relative flex-col justify-between p-12 text-white">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-shino-blue to-blue-900 opacity-90"></div>

                    <div className="relative z-10">
                        <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20 text-yellow-300 text-xs font-semibold tracking-wider mb-6">
                            PORTAL DO ALUNO
                        </div>
                        <h1 className="font-heading text-4xl font-bold leading-tight mb-4">
                            Bem-vindo à <br />
                            <span className="text-shino-yellow">Shino School</span>
                        </h1>
                        <p className="text-blue-100 text-lg leading-relaxed">
                            Sua jornada de conhecimento começa aqui. Acesse aulas, materiais e acompanhe sua evolução.
                        </p>
                    </div>

                    <div className="relative z-10 text-sm text-blue-200">
                        &copy; {new Date().getFullYear()} Shino School. Todos os direitos reservados.
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex justify-center mb-8">
                        <Logo className="w-full max-w-[150px]" />
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-slate-800">Acesse sua conta</h2>
                        <p className="text-slate-500 mt-2">Informe seus dados para continuar</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 flex items-start gap-3 text-sm">
                            <AlertCircle size={18} className="mt-0.5 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-shino-blue focus:border-transparent transition-all text-slate-900 placeholder-slate-400"
                                placeholder="exemplo@email.com"
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-slate-700">Senha</label>
                                <a href="#" className="text-sm text-shino-blue hover:text-blue-700 font-medium">
                                    Esqueceu?
                                </a>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-shino-blue focus:border-transparent transition-all text-slate-900 placeholder-slate-400"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-shino-blue text-white px-6 py-4 rounded-xl font-bold hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20 mt-4"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Entrar</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center pt-6 border-t border-slate-100">
                        <p className="text-slate-500 text-sm">
                            Não possui cadastro?{" "}
                            <Link to="/signup" className="text-shino-blue font-bold hover:text-blue-700 hover:underline">
                                Criar conta
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
