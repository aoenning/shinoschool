import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DollarSign, Clock, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function FinancialDashboard() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        pendingCount: 0,
        pendingValue: 0,
        overdueCount: 0,
        overdueValue: 0
    });
    const [recentPayments, setRecentPayments] = useState([]);
    const [loading, setLoading] = useState(true);

    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

    useEffect(() => {
        fetchFinancialData();
    }, [selectedMonth, selectedYear]);

    const fetchFinancialData = async () => {
        setLoading(true);
        try {
            const paymentsRef = collection(db, "payments");
            const snapshot = await getDocs(query(paymentsRef, orderBy("dueDate", "desc")));

            let totalRevenue = 0;
            let pendingCount = 0;
            let pendingValue = 0;
            let overdueCount = 0;
            let overdueValue = 0;
            const recent = [];

            snapshot.forEach(doc => {
                const data = doc.data();
                const payment = { id: doc.id, ...data };
                const dueDate = data.dueDate?.toDate();

                if (dueDate) {
                    const paymentMonth = dueDate.getMonth();
                    const paymentYear = dueDate.getFullYear();

                    // Filter logic
                    if (paymentMonth.toString() === selectedMonth && paymentYear.toString() === selectedYear) {
                        if (data.status === 'paid') {
                            totalRevenue += Number(data.amount);
                        } else if (data.status === 'pending') {
                            const now = new Date();
                            if (dueDate < now) {
                                overdueCount++;
                                overdueValue += Number(data.amount);
                            } else {
                                pendingCount++;
                                pendingValue += Number(data.amount);
                            }
                        }

                        // Add to recent list if it matches the filter
                        if (data.status === 'paid') {
                            recent.push(payment);
                        }
                    }
                }
            });

            setStats({
                totalRevenue,
                pendingCount,
                pendingValue,
                overdueCount,
                overdueValue
            });
            setRecentPayments(recent.slice(0, 5));

        } catch (error) {
            console.error("Error fetching financial data:", error);
        } finally {
            setLoading(false);
        }
    };

    const months = [
        { value: "0", label: "Janeiro" },
        { value: "1", label: "Fevereiro" },
        { value: "2", label: "Março" },
        { value: "3", label: "Abril" },
        { value: "4", label: "Maio" },
        { value: "5", label: "Junho" },
        { value: "6", label: "Julho" },
        { value: "7", label: "Agosto" },
        { value: "8", label: "Setembro" },
        { value: "9", label: "Outubro" },
        { value: "10", label: "Novembro" },
        { value: "11", label: "Dezembro" },
    ];

    const years = Array.from({ length: 5 }, (_, i) => (currentDate.getFullYear() - 2 + i).toString());

    const StatCard = ({ title, value, subtext, icon: Icon, color, trend }) => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon size={24} />
                </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
            <div className="text-2xl font-bold text-slate-900">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
            </div>
            {subtext && <p className="text-slate-400 text-xs mt-2">{subtext}</p>}
        </div>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard Financeiro</h1>
                    <p className="text-slate-500">Visão geral de pagamentos e receitas</p>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2.5"
                    >
                        {months.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-slate-900 focus:border-slate-900 block p-2.5"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                    <Link
                        to="/admin/financial/payments/new"
                        className="bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center gap-2 ml-2"
                    >
                        <DollarSign size={20} />
                        <span className="hidden md:inline">Nova Cobrança</span>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Receita Total"
                    value={stats.totalRevenue}
                    icon={TrendingUp}
                    color="bg-emerald-50 text-emerald-600"
                    subtext={`Em ${months[selectedMonth].label}`}
                />
                <StatCard
                    title="A Receber (Pendente)"
                    value={stats.pendingValue}
                    icon={Clock}
                    color="bg-amber-50 text-amber-600"
                    subtext={`${stats.pendingCount} pagamentos`}
                />
                <StatCard
                    title="Em Atraso (Vencido)"
                    value={stats.overdueValue}
                    icon={AlertCircle}
                    color="bg-red-50 text-red-600"
                    subtext={`${stats.overdueCount} pagamentos`}
                />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-900">Pagamentos Recentes ({months[selectedMonth].label}/{selectedYear})</h2>
                    <Link to="/admin/financial/payments" className="text-sm text-slate-600 hover:text-slate-900 font-medium">
                        Ver todos
                    </Link>
                </div>
                <div className="divide-y divide-slate-100">
                    {recentPayments.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            Nenhum pagamento encontrado neste período.
                        </div>
                    ) : (
                        recentPayments.map(payment => (
                            <div key={payment.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <DollarSign size={20} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{payment.studentName}</p>
                                        <p className="text-sm text-slate-500">{payment.description}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-900">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {payment.paidDate?.toDate().toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
