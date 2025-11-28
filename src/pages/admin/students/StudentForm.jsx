import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, updateDoc, getDocs, Timestamp } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Calendar, DollarSign, Book, Users, MapPin, FileText, X } from "lucide-react";
import FileUpload from "@/components/FileUpload";

export default function StudentForm() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        address: {
            street: "",
            neighborhood: "",
            city: "",
            zip: "",
            state: "",
            country: "Brasil"
        },
        classId: "",
        status: "active",
        modality: "online",
        assignedBooks: [],
        currentBookId: "",
        contractStart: "",
        contractEnd: "",
        contractUrl: "",
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
                            cpf: data.cpf || "",
                            address: data.address || {
                                street: "",
                                neighborhood: "",
                                city: "",
                                zip: "",
                                state: "",
                                country: "Brasil"
                            },
                            modality: data.modality || "online",
                            assignedBooks: data.assignedBooks || [],
                            currentBookId: data.currentBookId || "",
                            contractStart: data.contractStart || "",
                            contractEnd: data.contractEnd || "",
                            contractUrl: data.contractUrl || "",
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

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                CPF
                            </label>
                            <input
                                type="text"
                                value={formData.cpf}
                                onChange={(e) => {
                                    let value = e.target.value.replace(/\D/g, '');
                                    if (value.length <= 11) {
                                        value = value.replace(/(\d{3})(\d)/, '$1.$2');
                                        value = value.replace(/(\d{3})(\d)/, '$1.$2');
                                        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                                        setFormData({ ...formData, cpf: value });
                                    }
                                }}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                placeholder="000.000.000-00"
                                maxLength={14}
                            />
                        </div>

                        {/* Address Section */}
                        <div className="space-y-4 pt-4">
                            <h3 className="text-md font-semibold text-slate-900 flex items-center gap-2">
                                <MapPin size={18} />
                                Endereço
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Rua
                                </label>
                                <input
                                    type="text"
                                    value={formData.address.street}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        address: { ...formData.address, street: e.target.value }
                                    })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                    placeholder="Nome da rua, número"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Bairro
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address.neighborhood}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            address: { ...formData.address, neighborhood: e.target.value }
                                        })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                        placeholder="Bairro"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Cidade
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address.city}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            address: { ...formData.address, city: e.target.value }
                                        })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                        placeholder="Cidade"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        CEP
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address.zip}
                                        onChange={(e) => {
                                            let value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 8) {
                                                value = value.replace(/(\d{5})(\d)/, '$1-$2');
                                                setFormData({
                                                    ...formData,
                                                    address: { ...formData.address, zip: value }
                                                });
                                            }
                                        }}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                        placeholder="00000-000"
                                        maxLength={9}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Estado
                                    </label>
                                    <select
                                        value={formData.address.state}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            address: { ...formData.address, state: e.target.value }
                                        })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="AC">Acre</option>
                                        <option value="AL">Alagoas</option>
                                        <option value="AP">Amapá</option>
                                        <option value="AM">Amazonas</option>
                                        <option value="BA">Bahia</option>
                                        <option value="CE">Ceará</option>
                                        <option value="DF">Distrito Federal</option>
                                        <option value="ES">Espírito Santo</option>
                                        <option value="GO">Goiás</option>
                                        <option value="MA">Maranhão</option>
                                        <option value="MT">Mato Grosso</option>
                                        <option value="MS">Mato Grosso do Sul</option>
                                        <option value="MG">Minas Gerais</option>
                                        <option value="PA">Pará</option>
                                        <option value="PB">Paraíba</option>
                                        <option value="PR">Paraná</option>
                                        <option value="PE">Pernambuco</option>
                                        <option value="PI">Piauí</option>
                                        <option value="RJ">Rio de Janeiro</option>
                                        <option value="RN">Rio Grande do Norte</option>
                                        <option value="RS">Rio Grande do Sul</option>
                                        <option value="RO">Rondônia</option>
                                        <option value="RR">Roraima</option>
                                        <option value="SC">Santa Catarina</option>
                                        <option value="SP">São Paulo</option>
                                        <option value="SE">Sergipe</option>
                                        <option value="TO">Tocantins</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        País
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.address.country}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            address: { ...formData.address, country: e.target.value }
                                        })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                        placeholder="País"
                                    />
                                </div>
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
                        </div>

                        {/* Multiple Books Assignment */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-medium text-slate-700">
                                    Livros Atribuídos
                                </label>
                            </div>

                            <div className="space-y-3">
                                {formData.assignedBooks.map((assignedBook, index) => {
                                    const book = books.find(b => b.id === assignedBook.bookId);
                                    return (
                                        <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                            <Book size={20} className="text-primary" />
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{book?.title || 'Livro não encontrado'}</p>
                                                {assignedBook.isCurrent && (
                                                    <span className="text-xs text-green-600 font-medium">Livro Atual</span>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = [...formData.assignedBooks];
                                                    updated.forEach(b => b.isCurrent = false);
                                                    updated[index].isCurrent = true;
                                                    setFormData({ ...formData, assignedBooks: updated, currentBookId: assignedBook.bookId });
                                                }}
                                                className={`px-3 py-1 text-xs rounded-lg transition-colors ${assignedBook.isCurrent
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                                    }`}
                                            >
                                                {assignedBook.isCurrent ? 'Atual' : 'Definir como Atual'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = formData.assignedBooks.filter((_, i) => i !== index);
                                                    // If removed book was current, set first book as current
                                                    if (assignedBook.isCurrent && updated.length > 0) {
                                                        updated[0].isCurrent = true;
                                                        setFormData({ ...formData, assignedBooks: updated, currentBookId: updated[0].bookId });
                                                    } else {
                                                        setFormData({ ...formData, assignedBooks: updated });
                                                    }
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    );
                                })}

                                <div className="flex gap-3">
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                const bookId = e.target.value;
                                                // Check if book is already assigned
                                                if (!formData.assignedBooks.find(b => b.bookId === bookId)) {
                                                    const newBook = {
                                                        bookId,
                                                        assignedAt: Timestamp.now(),
                                                        isCurrent: formData.assignedBooks.length === 0
                                                    };
                                                    const updated = [...formData.assignedBooks, newBook];
                                                    setFormData({
                                                        ...formData,
                                                        assignedBooks: updated,
                                                        currentBookId: newBook.isCurrent ? bookId : formData.currentBookId
                                                    });
                                                }
                                                e.target.value = "";
                                            }
                                        }}
                                        className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 transition-all"
                                    >
                                        <option value="">+ Adicionar Livro</option>
                                        {books.filter(book => !formData.assignedBooks.find(ab => ab.bookId === book.id)).map(book => (
                                            <option key={book.id} value={book.id}>{book.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dados do Contrato */}
                    <div className="space-y-6 pt-4">
                        <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <FileText size={20} />
                            Contrato
                        </h2>

                        <div>
                            <FileUpload
                                accept=".pdf,application/pdf"
                                maxSize={10}
                                onUpload={(url) => setFormData({ ...formData, contractUrl: url })}
                                storagePath="contracts"
                                currentFile={formData.contractUrl}
                                label="Upload do Contrato (PDF)"
                                preview={false}
                            />
                        </div>
                    </div>

                    {/* Dados Financeiros */}
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
