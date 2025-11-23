import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Mail, Phone, BookOpen, Users, Award, CheckCircle, Star, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LandingPage() {
    const { user, role } = useAuth();

    const getDashboardLink = () => {
        if (role === 'admin') return "/admin";
        if (role === 'student') return "/student";
        return "/login";
    };

    const getButtonText = () => {
        if (user) return "Meu Painel";
        return "Área do Aluno";
    };

    return (
        <div className="min-h-screen font-sans text-slate-900 overflow-x-hidden bg-slate-50">
            {/* Header - YELLOW BACKGROUND */}
            <header className="fixed w-full bg-shino-yellow border-b border-yellow-500/10 z-50 shadow-lg shadow-yellow-500/10">
                <div className="w-full px-6 md:px-12 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Logo: Wrapped in white pill for better contrast on yellow */}
                        <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-white/50">
                            <img src="/shino-logo.png" alt="Shino School" className="h-8 w-auto object-contain" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link
                            to={getDashboardLink()}
                            className="px-6 py-2.5 rounded-full bg-white text-shino-blue font-bold hover:bg-blue-50 transition-all hover:shadow-lg hover:-translate-y-0.5 shadow-sm flex items-center gap-2"
                        >
                            {getButtonText()}
                            <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
            </header>

            {/* Hero Section - BLUE GRADIENT (Restoring the "Effect") */}
            <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 relative overflow-hidden bg-gradient-to-br from-shino-blue via-blue-600 to-blue-800 text-white">
                {/* Background Patterns - Simplified to avoid CSS errors */}
                <div className="absolute inset-0 opacity-20 bg-white/5 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-shino-yellow/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4"></div>

                <div className="w-full px-6 md:px-12 mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-50 font-medium mb-8 shadow-lg">
                        <Star size={16} className="text-shino-yellow fill-shino-yellow" />
                        <span>Excelência em ensino desde 2022</span>
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-tight drop-shadow-lg">
                        Domine o Inglês com <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-shino-yellow to-amber-300">
                            Confiança e Fluência
                        </span>
                    </h1>

                    <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-12 leading-relaxed font-medium drop-shadow-md">
                        Uma metodologia moderna que une tecnologia e personalização.
                        Transforme seu futuro com a Shino School.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a
                            href="#contact"
                            className="w-full sm:w-auto px-8 py-4 rounded-full bg-shino-yellow text-shino-blue font-bold text-lg hover:bg-yellow-400 transition-all hover:scale-105 shadow-xl shadow-yellow-900/30 flex items-center justify-center gap-2"
                        >
                            Comece Agora <ArrowRight size={20} />
                        </a>
                        <a
                            href="#about"
                            className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            Conhecer a Escola
                        </a>
                    </div>
                </div>
            </section>

            {/* Stats / Features */}
            <section className="py-20 bg-white relative z-20 -mt-10 rounded-t-[2.5rem] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.1)]">
                <div className="w-full px-6 md:px-12 mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-shino-blue/20 hover:bg-blue-50/30 transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-slate-200/50">
                            <div className="w-14 h-14 rounded-2xl bg-blue-100 text-shino-blue flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <BookOpen size={28} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Metodologia Própria</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Material didático exclusivo focado em conversação e resultados práticos para o seu dia a dia.
                            </p>
                        </div>

                        {/* Card 2 */}
                        <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-shino-red/20 hover:bg-red-50/30 transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-slate-200/50">
                            <div className="w-14 h-14 rounded-2xl bg-red-100 text-shino-red flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Users size={28} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Aulas Personalizadas</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Turmas reduzidas ou aulas VIP, adaptadas ao seu ritmo e objetivos específicos.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="group p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-shino-yellow/50 hover:bg-yellow-50/30 transition-all duration-300 hover:-translate-y-1 shadow-lg shadow-slate-200/50">
                            <div className="w-14 h-14 rounded-2xl bg-yellow-100 text-yellow-700 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <Award size={28} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-3">Excelência Comprovada</h3>
                            <p className="text-slate-600 leading-relaxed">
                                Liderada pelo professor Junior Shinohara, referência no ensino de inglês em Cuiabá.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-24 bg-slate-50">
                <div className="w-full px-6 md:px-12 mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="lg:w-1/2 relative">
                            <div className="absolute -inset-4 bg-gradient-to-tr from-shino-blue to-shino-red rounded-[2rem] opacity-20 blur-lg rotate-2"></div>
                            <div className="relative rounded-[1.5rem] shadow-2xl w-full h-[500px] z-10 overflow-hidden group">
                                <div className="absolute inset-0 bg-shino-blue/20 group-hover:bg-shino-blue/10 transition-colors z-10"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                                    alt="Ambiente de Estudos"
                                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                                />
                            </div>
                            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-2xl shadow-xl z-20 border border-slate-100 max-w-xs hidden md:block">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white"></div>
                                        ))}
                                    </div>
                                    <span className="font-bold text-slate-900">+500 Alunos</span>
                                </div>
                                <p className="text-sm text-slate-500">Já transformaram suas carreiras com a Shino School.</p>
                            </div>
                        </div>

                        <div className="lg:w-1/2">
                            <div className="inline-block px-3 py-1 rounded-full bg-blue-100 text-shino-blue text-xs font-bold uppercase tracking-wider mb-6">
                                Sobre a Escola
                            </div>
                            <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
                                Mais que uma escola, <br />
                                <span className="text-shino-blue">um centro de inovação.</span>
                            </h2>
                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                A Shino School combina a tradição do ensino de qualidade com as mais modernas ferramentas tecnológicas.
                                Nosso ambiente foi projetado para estimular a criatividade e a comunicação natural.
                            </p>

                            <ul className="space-y-4 mb-10">
                                {[
                                    "Ambiente 100% climatizado e moderno",
                                    "Material didático digital e interativo",
                                    "Foco em conversação desde a primeira aula"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-700 font-medium">
                                        <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            <a href="#contact" className="text-shino-blue font-bold hover:text-blue-800 inline-flex items-center gap-2 group">
                                Agendar Visita <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-32 bg-shino-blue relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-shino-blue to-blue-900"></div>
                {/* Decorative circles */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-white/5"></div>

                <div className="w-full px-6 md:px-12 mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Fale Conosco</h2>
                        <p className="text-blue-100 text-xl max-w-2xl mx-auto">
                            Estamos prontos para atender você. Entre em contato e agende sua aula experimental.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Contact Card 1 */}
                        <a href="https://wa.me/5565992935000" target="_blank" rel="noreferrer" className="group bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all hover:-translate-y-1 text-center">
                            <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center text-shino-blue mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Phone size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">WhatsApp</h3>
                            <p className="text-blue-100 mb-6">(65) 99293-5000</p>
                            <span className="inline-block px-6 py-2 rounded-full bg-green-500 text-white font-bold text-sm shadow-lg shadow-green-500/30 group-hover:bg-green-400 transition-colors">
                                Enviar Mensagem
                            </span>
                        </a>

                        {/* Contact Card 2 */}
                        <a href="mailto:junior.shinohara@gmail.com" className="group bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all hover:-translate-y-1 text-center">
                            <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center text-shino-red mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <Mail size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Email</h3>
                            <p className="text-blue-100 mb-6">junior.shinohara@gmail.com</p>
                            <span className="inline-block px-6 py-2 rounded-full bg-shino-red text-white font-bold text-sm shadow-lg shadow-red-500/30 group-hover:bg-red-500 transition-colors">
                                Enviar Email
                            </span>
                        </a>

                        {/* Contact Card 3 */}
                        <a href="https://maps.google.com/?q=Rua+Bahia,+CPA+2,+Cuiaba" target="_blank" rel="noreferrer" className="group bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 hover:bg-white/20 transition-all hover:-translate-y-1 text-center">
                            <div className="w-16 h-16 mx-auto bg-white rounded-2xl flex items-center justify-center text-yellow-600 mb-6 shadow-lg group-hover:scale-110 transition-transform">
                                <MapPin size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Endereço</h3>
                            <p className="text-blue-100 mb-6">Rua Bahia, CPA 2, Cuiabá</p>
                            <span className="inline-block px-6 py-2 rounded-full bg-shino-yellow text-shino-dark font-bold text-sm shadow-lg shadow-yellow-500/30 group-hover:bg-yellow-400 transition-colors">
                                Ver no Mapa
                            </span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Footer - STRONG BLUE */}
            <footer className="bg-shino-blue text-blue-100 py-12 border-t border-blue-800">
                <div className="w-full px-6 md:px-12 mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-full border border-white/10 hover:bg-white/20 transition-colors cursor-default">
                        <p>© {new Date().getFullYear()} Todos os direitos reservados Shino School.</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-white/10 px-4 py-2 rounded-full border border-white/10 hover:bg-white/20 transition-colors cursor-default">
                        <span>Developed by</span>
                        <span className="font-bold text-white">ongsystem</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}
