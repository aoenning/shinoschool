import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, GraduationCap, DollarSign, Plus, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
    const [stats, setStats] = useState({
        activeStudents: 0,
        totalClasses: 0,
        monthlyRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Active Students
                const studentsQuery = query(collection(db, "students"), where("status", "==", "active"));
                const studentsSnap = await getDocs(studentsQuery);

                // Classes
                const classesSnap = await getDocs(collection(db, "classes"));

                // Monthly Revenue (Current Month)
                // Fetch all paid payments and filter by date in JavaScript to avoid index requirement
                const paymentsQuery = query(
                    collection(db, "payments"),
                    where("status", "==", "paid")
                );
                const paymentsSnap = await getDocs(paymentsQuery);

                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

                const revenue = paymentsSnap.docs
                    .filter(doc => {
                        const paidDate = doc.data().paidDate?.toDate();
                        return paidDate && paidDate >= startOfMonth && paidDate <= endOfMonth;
                    })
                    .reduce((acc, doc) => acc + Number(doc.data().amount || 0), 0);

                setStats({
                    activeStudents: studentsSnap.size,
                    totalClasses: classesSnap.size,
                    monthlyRevenue: revenue
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                // Set default values on error
                setStats({
                    activeStudents: 0,
                    totalClasses: 0,
                    monthlyRevenue: 0
                });
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const StatCard = ({ title, value, icon: Icon, color, link }) => (
        <Link to={link} className="block">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${color}`}>
                        <Icon size={24} />
                    </div>
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                        <ArrowRight size={16} />
                    </div>
                </div>
                <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
                <div className="text-2xl font-bold text-slate-900">{value}</div>
            </div>
        </Link>
    );

    const QuickAction = ({ title, icon: Icon, link, color }) => (
        <Link
            to={link}
            className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all group"
        >
            <div className={`p-4 rounded-full ${color} group-hover:scale-110 transition-transform mb-3`}>
                <Icon size={24} />
            </div>
            <span className="font-medium text-slate-700 group-hover:text-slate-900">{title}</span>
        </Link>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Bem-vindo ao Shino School</h1>
                <p className="text-slate-500">Visão geral da sua escola</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Alunos Ativos"
                    value={stats.activeStudents}
                    icon={Users}
                    color="bg-blue-50 text-blue-600"
                    link="/admin/students"
                />
                <StatCard
                    title="Turmas"
                    value={stats.totalClasses}
                    icon={GraduationCap}
                    color="bg-purple-50 text-purple-600"
                    link="/admin/classes"
                />
                <StatCard
                    title="Receita (Mês)"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.monthlyRevenue)}
                    icon={DollarSign}
                    color="bg-emerald-50 text-emerald-600"
                    link="/admin/financial"
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-lg font-bold text-slate-900 mb-4">Ações Rápidas</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <QuickAction
                        title="Novo Aluno"
                        icon={Plus}
                        link="/admin/students/new"
                        color="bg-slate-100 text-slate-600"
                    />
                    <QuickAction
                        title="Nova Cobrança"
                        icon={DollarSign}
                        link="/admin/financial/payments/new"
                        color="bg-emerald-50 text-emerald-600"
                    />
                    <QuickAction
                        title="Nova Turma"
                        icon={GraduationCap}
                        link="/admin/classes/new"
                        color="bg-purple-50 text-purple-600"
                    />
                </div>
            </div>
        </div>
    );
}
