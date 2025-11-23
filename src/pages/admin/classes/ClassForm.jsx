import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, updateDoc, getDocs } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

export default function ClassForm() {
    const [formData, setFormData] = useState({
        name: "",
        bookId: "",
        teacher: "",
        schedule: "",
        status: "active"
    });
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const fetchBooks = async () => {
            const querySnapshot = await getDocs(collection(db, "books"));
            setBooks(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };

        const fetchClass = async () => {
            try {
                const docSnap = await getDoc(doc(db, "classes", id));
                if (docSnap.exists()) {
                    setFormData(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching class:", error);
            }
        };

        fetchBooks();
        if (id) {
            fetchClass();
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (id) {
                await updateDoc(doc(db, "classes", id), formData);
            } else {
                await addDoc(collection(db, "classes"), {
                    ...formData,
                    createdAt: new Date()
                });
            }
            navigate("/admin/classes");
        } catch (error) {
            console.error("Error saving class:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <button
                onClick={() => navigate("/admin/classes")}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Voltar para Turmas
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">
                    {id ? "Editar Turma" : "Nova Turma"}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nome da Turma
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Ex: A1 - Noite - Seg/Qua"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Livro Atual
                        </label>
                        <select
                            required
                            value={formData.bookId}
                            onChange={(e) => setFormData({ ...formData, bookId: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                            <option value="">Selecione um livro...</option>
                            {books.map(book => (
                                <option key={book.id} value={book.id}>{book.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Professor Responsável
                        </label>
                        <input
                            type="text"
                            value={formData.teacher}
                            onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Nome do professor"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Dias e Horários
                        </label>
                        <input
                            type="text"
                            value={formData.schedule}
                            onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Ex: Segundas e Quartas, 19h"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Status
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                            <option value="active">Ativa</option>
                            <option value="finished">Encerrada</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save size={20} />
                            {loading ? "Salvando..." : "Salvar Turma"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
