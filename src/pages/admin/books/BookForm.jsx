import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

export default function BookForm() {
    const [formData, setFormData] = useState({
        title: "",
        level: "",
        description: ""
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { id } = useParams();

    useEffect(() => {
        const fetchBook = async () => {
            try {
                const docSnap = await getDoc(doc(db, "books", id));
                if (docSnap.exists()) {
                    setFormData(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching book:", error);
            }
        };

        if (id) {
            fetchBook();
        }
    }, [id]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (id) {
                await updateDoc(doc(db, "books", id), formData);
            } else {
                await addDoc(collection(db, "books"), {
                    ...formData,
                    createdAt: new Date()
                });
            }
            navigate("/admin/books");
        } catch (error) {
            console.error("Error saving book:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <button
                onClick={() => navigate("/admin/books")}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
            >
                <ArrowLeft size={20} />
                Voltar para Livros
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">
                    {id ? "Editar Livro" : "Novo Livro"}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Título do Livro
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Ex: SHINO BOOK 1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Nível (CEFR)
                        </label>
                        <select
                            value={formData.level}
                            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        >
                            <option value="">Selecione um nível...</option>
                            <option value="A1">A1 - Iniciante</option>
                            <option value="A2">A2 - Básico</option>
                            <option value="B1">B1 - Intermediário</option>
                            <option value="B2">B2 - Intermediário Superior</option>
                            <option value="C1">C1 - Avançado</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Descrição
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Breve descrição do conteúdo..."
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save size={20} />
                            {loading ? "Salvando..." : "Salvar Livro"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
