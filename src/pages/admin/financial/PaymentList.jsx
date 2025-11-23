import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Search, Filter, CheckCircle, Clock, AlertCircle, MoreVertical } from "lucide-react";
import { Link } from "react-router-dom";

export default function PaymentList() {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, paid, pending, overdue
    const [searchTerm, setSearchTerm] = useState('');

    const currentDate = new Date();
    const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth().toString());
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            const q = query(collection(db, "payments"), orderBy("dueDate", "desc"));
            const snapshot = await getDocs(q);
            const paymentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                dueDate: doc.data().dueDate?.toDate(),
                paidDate: doc.data().paidDate?.toDate()
            }));
            setPayments(paymentsData);
        } catch (error) {
            console.error("Error fetching payments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsPaid = async (paymentId) => {
        if (!confirm("Confirmar pagamento?")) return;

        try {
            const paymentRef = doc(db, "payments", paymentId);
            await updateDoc(paymentRef, {
                status: 'paid',
                paidDate: Timestamp.now()
            });
            fetchPayments(); // Refresh list
        } catch (error) {
            console.error("Error updating payment:", error);
            alert("Erro ao atualizar pagamento.");
        }
    };

    const getStatusColor = (payment) => {
        if (payment.status === 'paid') return 'bg-emerald-100 text-emerald-700';

        const isOverdue = payment.dueDate < new Date();
        if (isOverdue) return 'bg-red-100 text-red-700';

        return 'bg-amber-100 text-amber-700';
    };

    const getStatusLabel = (payment) => {
        if (payment.status === 'paid') return 'Pago';
        const isOverdue = payment.dueDate < new Date();
        if (isOverdue) return 'Vencido';
        return 'Pendente';
    };

    const filteredPayments = payments.filter(payment => {
        // Filter by Month/Year
        if (payment.dueDate) {
            const paymentMonth = payment.dueDate.getMonth().toString();
            const paymentYear = payment.dueDate.getFullYear().toString();

            if (selectedMonth !== 'all' && paymentMonth !== selectedMonth) return false;
            if (selectedYear !== 'all' && paymentYear !== selectedYear) return false;
        }

        const matchesSearch = payment.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.description?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filter === 'all') return true;
        if (filter === 'paid') return payment.status === 'paid';
        if (filter === 'pending') return payment.status === 'pending' && payment.dueDate >= new Date();
        if (filter === 'overdue') return payment.status === 'pending' && payment.dueDate < new Date();

        return true;
    });

    const months = [
        { value: "all", label: "Todos os Meses" },
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

    const years = [
        { value: "all", label: "Todos os Anos" },
        ...Array.from({ length: 5 }, (_, i) => ({
            value: (currentDate.getFullYear() - 2 + i).toString(),
            label: (currentDate.getFullYear() - 2 + i).toString()
        }))
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Pagamentos</h1>
                    <p className="text-slate-500">Gerencie mensalidades e cobranças</p>
                </div>
                <Link
                    to="/admin/financial/payments/new"
                    className="bg-primary text-white px-4 py-2 rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center gap-2 justify-center"
                >
                    <Plus size={20} />
                    Nova Cobrança
                </Link>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por aluno ou descrição..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                        />
                    </div>

                    <div className="flex gap-2">
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
                                <option key={y.value} value={y.value}>{y.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilter('paid')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'paid' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                        Pagos
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                    >
                        Pendentes
                    </button>
                    <button
                        onClick={() => setFilter('overdue')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'overdue' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                    >
                        Vencidos
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Aluno</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Descrição</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Valor</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Vencimento</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                        Nenhum pagamento encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {payment.studentName}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {payment.description}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payment.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {payment.dueDate?.toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(payment)}`}>
                                                {getStatusLabel(payment)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {payment.status === 'pending' && (
                                                <button
                                                    onClick={() => handleMarkAsPaid(payment.id)}
                                                    className="text-emerald-600 hover:text-emerald-700 font-medium text-xs bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors"
                                                >
                                                    Marcar como Pago
                                                </button>
                                            )}
                                            {payment.status === 'paid' && (
                                                <span className="text-slate-400 text-xs flex items-center justify-end gap-1">
                                                    <CheckCircle size={14} />
                                                    Pago em {payment.paidDate?.toLocaleDateString('pt-BR')}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
