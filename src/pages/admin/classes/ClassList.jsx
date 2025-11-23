import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, GraduationCap, Users } from "lucide-react";

export default function ClassList() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "classes"));
            const classesData = await Promise.all(querySnapshot.docs.map(async (classDoc) => {
                const data = classDoc.data();
                let bookTitle = "Livro não definido";

                if (data.bookId) {
                    const bookSnap = await getDoc(doc(db, "books", data.bookId));
                    if (bookSnap.exists()) {
                        bookTitle = bookSnap.data().title;
                    }
                }

                return {
                    id: classDoc.id,
                    ...data,
                    bookTitle
                };
            }));
            setClasses(classesData);
        } catch (error) {
            console.error("Error fetching classes:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir esta turma?")) {
            try {
                await deleteDoc(doc(db, "classes", id));
                fetchClasses();
            } catch (error) {
                console.error("Error deleting class:", error);
            }
        }
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Gestão de Turmas</h1>
                <Link
                    to="/admin/classes/new"
                    className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-600 transition-colors"
                >
                    <Plus size={20} />
                    Nova Turma
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                    <div key={cls.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-50 rounded-lg text-green-600">
                                <GraduationCap size={24} />
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    to={`/admin/classes/edit/${cls.id}`}
                                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <Pencil size={18} />
                                </Link>
                                <button
                                    onClick={() => handleDelete(cls.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-1">{cls.name}</h3>
                        <p className="text-sm text-slate-500 mb-2">{cls.bookTitle}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Users size={14} />
                            {cls.schedule || "Horário não definido"}
                        </p>

                        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                {cls.status === 'active' ? 'Ativa' : 'Encerrada'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
