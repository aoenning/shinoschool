import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, updateDoc, getDocs, Timestamp } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Calendar, DollarSign, Book, Users } from "lucide-react";

export default function StudentForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        classId: "",
        status: "active",
        modality: "online", // 'online' | 'presencial'
        currentBookId: "",
        contractStart: "",
        contractEnd: "",
        monthlyValue: "",
        dueDay: "10",
        generatePayments: false
    });
    const [classes, setClasses] = useState([]);
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [classesSnap, booksSnap] = await Promise.all([
                    getDocs(collection(db, "classes")),
                    getDocs(collection(db, "books"))
                ]);

                setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                setBooks(booksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

                if (id) {
                    const docSnap = await getDoc(doc(db, "students", id));
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setFormData({
                            ...data,
                            modality: data.modality || "online",
                            currentBookId: data.currentBookId || "",
                            contractStart: data.contractStart || "",
                            contractEnd: data.contractEnd || "",
                            monthlyValue: data.monthlyValue || "",
                            dueDay: data.dueDay || "10",
                            generatePayments: false
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, [id]);

    const generateContractPayments = async (studentId, studentName) => {
        if (!formData.generatePayments || !formData.contractStart || !formData.contractEnd || !formData.monthlyValue) return;

        const start = new Date(formData.contractStart);
        const end = new Date(formData.contractEnd);
        const day = parseInt(formData.dueDay);
        const value = parseFloat(formData.monthlyValue);

        // Adjust start date to the correct due day
        let current = new Date(start.getFullYear(), start.getMonth(), day);

        // If the calculated first due date is before the contract start (e.g. start 15th, due day 10th), move to next month
        if (current < start) {
            current.setMonth(current.getMonth() + 1);
        }

        const payments = [];

        while (current <= end) {
            payments.push({
                studentId,
                studentName,
                amount: value,
                dueDate: Timestamp.fromDate(new Date(current)),
                status: 'pending',
                description: `Mensalidade ${current.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
                createdAt: Timestamp.now()
            });

            // Move to next month
            current.setMonth(current.getMonth() + 1);
        }

        // Batch create payments
        const paymentsRef = collection(db, "payments");
        await Promise.all(payments.map(payment => addDoc(paymentsRef, payment)));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let studentId = id;

            if (id) {
                await updateDoc(doc(db, "students", id), formData);
            } else {
                const docRef = await addDoc(collection(db, "students"), {
                    ...formData,
                    createdAt: new Date()
                });
                studentId = docRef.id;
            }

            if (formData.generatePayments) {
                await generateContractPayments(studentId, formData.name);
            }

            navigate("/admin/students");
        } catch (error) {
            console.error("Error saving student:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <button
                onClick={() => navigate("/admin/students")}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Voltar para Alunos
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">
                    {id ? "Editar Aluno" : "Novo Aluno"}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dados Pessoais */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">
                            Dados Pessoais
                        </h2>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Nome Completo
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                placeholder="Nome do aluno"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                    placeholder="email@exemplo.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Telefone / WhatsApp
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Turma
                                </label>
                                <select
                                    value={formData.classId}
                                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                >
                                    <option value="">Selecione uma turma...</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                >
                                    <option value="active">Ativo</option>
                                    <option value="inactive">Inativo</option>
                                    <option value="paused">Trancado</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Dados Acadêmicos */}
                    <div className="space-y-6 pt-4">
                        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <Book size={20} />
                            Dados Acadêmicos
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Modalidade
                                </label>
                                <select
                                    value={formData.modality}
                                    onChange={(e) => setFormData({ ...formData, modality: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                >
                                    <option value="online">Online</option>
                                    <option value="presencial">Presencial</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Livro Atual
                                </label>
                                <select
                                    value={formData.currentBookId}
                                    onChange={(e) => setFormData({ ...formData, currentBookId: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                >
                                    <option value="">Selecione o livro...</option>
                                    {books.map(book => (
                                        <option key={book.id} value={book.id}>{book.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Dados do Contrato */}
                    <div className="space-y-6 pt-4">
                        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <DollarSign size={20} />
                            Dados do Contrato
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Início do Contrato
                                </label>
                                <input
                                    type="date"
                                    value={formData.contractStart}
                                    onChange={(e) => setFormData({ ...formData, contractStart: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Fim do Contrato
                                </label>
                                <input
                                    type="date"
                                    value={formData.contractEnd}
                                    onChange={(e) => setFormData({ ...formData, contractEnd: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Valor Mensal (R$)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.monthlyValue}
                                    onChange={(e) => setFormData({ ...formData, monthlyValue: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                    placeholder="0,00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Dia do Vencimento
                                </label>
                                <select
                                    value={formData.dueDay}
                                    onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                >
                                    {[...Array(31)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                            <input
                                type="checkbox"
                                id="generatePayments"
                                checked={formData.generatePayments}
                                onChange={(e) => setFormData({ ...formData, generatePayments: e.target.checked })}
                                className="w-5 h-5 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                            />
                            <label htmlFor="generatePayments" className="text-sm text-slate-700 font-medium cursor-pointer">
                                Gerar cobranças automaticamente para todo o período do contrato
                            </label>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save size={20} />
                            {loading ? "Salvando..." : "Salvar Aluno"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
