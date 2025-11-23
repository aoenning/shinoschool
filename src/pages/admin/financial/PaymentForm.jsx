import { useState, useEffect } from "react";
import { collection, addDoc, getDocs, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

export default function PaymentForm() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);

    const [formData, setFormData] = useState({
        studentId: "",
        amount: "",
        dueDate: "",
        description: "",
        status: "pending"
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const snapshot = await getDocs(collection(db, "students"));
            const studentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setStudents(studentsData);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const selectedStudent = students.find(s => s.id === formData.studentId);

            await addDoc(collection(db, "payments"), {
                ...formData,
                studentName: selectedStudent?.name || "Aluno Desconhecido",
                amount: Number(formData.amount),
                dueDate: Timestamp.fromDate(new Date(formData.dueDate)),
                createdAt: Timestamp.now(),
                // Future proofing fields
                gateway: 'manual',
                paymentMethod: 'manual'
            });

            navigate("/admin/financial/payments");
        } catch (error) {
            console.error("Error creating payment:", error);
            alert("Erro ao criar cobrança.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/admin/financial/payments" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Nova Cobrança</h1>
                    <p className="text-slate-500">Registre uma nova mensalidade ou taxa</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Aluno</label>
                    <select
                        required
                        value={formData.studentId}
                        onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                    >
                        <option value="">Selecione um aluno...</option>
                        {students.map(student => (
                            <option key={student.id} value={student.id}>
                                {student.name} ({student.email})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Descrição</label>
                    <input
                        type="text"
                        required
                        placeholder="Ex: Mensalidade Março/2025"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Valor (R$)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="number"
                                required
                                step="0.01"
                                min="0"
                                placeholder="0,00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Data de Vencimento</label>
                        <input
                            type="date"
                            required
                            value={formData.dueDate}
                            onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                        />
                    </div>
                </div>
            </form>
        </div>
    );
}
