import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, getDoc, getDocs, collection } from "firebase/firestore";
import { ArrowLeft, Printer, User, Phone, Mail, MapPin, Book, FileText, Calendar } from "lucide-react";

export default function StudentPrintForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [assignedBooks, setAssignedBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                const studentDoc = await getDoc(doc(db, "students", id));
                if (studentDoc.exists()) {
                    const studentData = { id: studentDoc.id, ...studentDoc.data() };
                    setStudent(studentData);

                    // Fetch assigned books
                    if (studentData.assignedBooks && studentData.assignedBooks.length > 0) {
                        const booksPromises = studentData.assignedBooks.map(async (ab) => {
                            const bookDoc = await getDoc(doc(db, "books", ab.bookId));
                            if (bookDoc.exists()) {
                                return {
                                    ...bookDoc.data(),
                                    isCurrent: ab.isCurrent
                                };
                            }
                            return null;
                        });
                        const books = (await Promise.all(booksPromises)).filter(b => b !== null);
                        setAssignedBooks(books);
                    }
                }
            } catch (error) {
                console.error("Error fetching student:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentData();
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12">
                <p className="text-center text-slate-500">Aluno não encontrado</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Print Header - Hidden on screen, visible on print */}
            <div className="hidden print:block text-center mb-8">
                <img src="/shino-logo.png" alt="Shino School" className="h-16 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-slate-900">Shino School</h1>
                <p className="text-slate-600">Ficha de Cadastro do Aluno</p>
            </div>

            {/* Screen Header - Hidden on print */}
            <div className="print:hidden max-w-4xl mx-auto px-6 py-6">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate("/admin/students")}
                        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        Voltar para Alunos
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
                    >
                        <Printer size={20} />
                        Imprimir Cadastro
                    </button>
                </div>
            </div>

            {/* Print Content */}
            <div className="max-w-4xl mx-auto px-6 py-6 print:px-12 print:py-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 print:shadow-none print:border-2 print:border-slate-300">
                    {/* Student Header */}
                    <div className="flex items-start gap-6 mb-8 pb-6 border-b border-slate-200">
                        <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <User size={48} className="text-slate-400" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-slate-900 mb-2">{student.name}</h2>
                            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <Mail size={16} />
                                    {student.email || "Não informado"}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone size={16} />
                                    {student.phone || "Não informado"}
                                </div>
                            </div>
                            <div className="mt-2">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${student.status === 'active' ? 'bg-green-100 text-green-700' :
                                        student.status === 'inactive' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {student.status === 'active' ? 'Ativo' : student.status === 'inactive' ? 'Inativo' : 'Trancado'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Personal Information */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <User size={20} className="text-primary" />
                            Dados Pessoais
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 font-medium">CPF</p>
                                <p className="text-slate-900">{student.cpf || "Não informado"}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-medium">Modalidade</p>
                                <p className="text-slate-900">{student.modality === 'online' ? 'Online' : 'Presencial'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    {student.address && (
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <MapPin size={20} className="text-primary" />
                                Endereço
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="col-span-2">
                                    <p className="text-slate-500 font-medium">Rua</p>
                                    <p className="text-slate-900">{student.address.street || "Não informado"}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 font-medium">Bairro</p>
                                    <p className="text-slate-900">{student.address.neighborhood || "Não informado"}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 font-medium">Cidade</p>
                                    <p className="text-slate-900">{student.address.city || "Não informado"}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 font-medium">CEP</p>
                                    <p className="text-slate-900">{student.address.zip || "Não informado"}</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 font-medium">Estado</p>
                                    <p className="text-slate-900">{student.address.state || "Não informado"}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-slate-500 font-medium">País</p>
                                    <p className="text-slate-900">{student.address.country || "Brasil"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Assigned Books */}
                    {assignedBooks.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Book size={20} className="text-primary" />
                                Livros Atribuídos
                            </h3>
                            <div className="space-y-2">
                                {assignedBooks.map((book, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                                        <Book size={18} className="text-primary" />
                                        <div className="flex-1">
                                            <p className="font-medium text-slate-900">{book.title}</p>
                                            <p className="text-sm text-slate-500">{book.level}</p>
                                        </div>
                                        {book.isCurrent && (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                                Atual
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contract Information */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-primary" />
                            Informações do Contrato
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-slate-500 font-medium">Início do Contrato</p>
                                <p className="text-slate-900">
                                    {student.contractStart ? new Date(student.contractStart).toLocaleDateString('pt-BR') : "Não informado"}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-medium">Fim do Contrato</p>
                                <p className="text-slate-900">
                                    {student.contractEnd ? new Date(student.contractEnd).toLocaleDateString('pt-BR') : "Não informado"}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-medium">Valor Mensal</p>
                                <p className="text-slate-900">
                                    {student.monthlyValue ? `R$ ${parseFloat(student.monthlyValue).toFixed(2)}` : "Não informado"}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-500 font-medium">Dia do Vencimento</p>
                                <p className="text-slate-900">{student.dueDay || "Não informado"}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-slate-500 font-medium">Contrato</p>
                                {student.contractUrl ? (
                                    <a
                                        href={student.contractUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline print:text-slate-900"
                                    >
                                        Ver contrato anexado
                                    </a>
                                ) : (
                                    <p className="text-slate-900">Não anexado</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-6 border-t border-slate-200 text-center text-sm text-slate-500 print:block">
                        <p>Cadastro gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:block {
                        display: block !important;
                    }
                    .print\\:px-12 {
                        padding-left: 3rem !important;
                        padding-right: 3rem !important;
                    }
                    .print\\:py-8 {
                        padding-top: 2rem !important;
                        padding-bottom: 2rem !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:border-2 {
                        border-width: 2px !important;
                    }
                    .print\\:border-slate-300 {
                        border-color: rgb(203 213 225) !important;
                    }
                    .print\\:text-slate-900 {
                        color: rgb(15 23 42) !important;
                    }
                }
            `}</style>
        </div>
    );
}
