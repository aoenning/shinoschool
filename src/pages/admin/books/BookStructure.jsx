import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, addDoc, getDocs, query, orderBy, deleteDoc } from "firebase/firestore";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, BookOpen, FileText } from "lucide-react";

export default function BookStructure() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUnitForm, setShowUnitForm] = useState(false);
    const [newUnitTitle, setNewUnitTitle] = useState("");

    // For Lesson creation
    const [activeUnitId, setActiveUnitId] = useState(null);
    const [newLessonTitle, setNewLessonTitle] = useState("");

    const fetchBookAndUnits = useCallback(async () => {
        try {
            const bookDoc = await getDoc(doc(db, "books", id));
            if (bookDoc.exists()) {
                setBook({ id: bookDoc.id, ...bookDoc.data() });

                // Fetch Units
                const unitsQuery = query(collection(db, "books", id, "units"), orderBy("createdAt", "asc"));
                const unitsSnap = await getDocs(unitsQuery);

                const unitsData = await Promise.all(unitsSnap.docs.map(async (unitDoc) => {
                    // Fetch Lessons for each unit
                    const lessonsQuery = query(collection(db, "books", id, "units", unitDoc.id, "lessons"), orderBy("createdAt", "asc"));
                    const lessonsSnap = await getDocs(lessonsQuery);
                    const lessons = lessonsSnap.docs.map(l => ({ id: l.id, ...l.data() }));

                    return {
                        id: unitDoc.id,
                        ...unitDoc.data(),
                        lessons
                    };
                }));

                setUnits(unitsData);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchBookAndUnits();
    }, [fetchBookAndUnits]);

    const handleAddUnit = async (e) => {
        e.preventDefault();
        if (!newUnitTitle.trim()) return;

        try {
            await addDoc(collection(db, "books", id, "units"), {
                title: newUnitTitle,
                createdAt: new Date()
            });
            setNewUnitTitle("");
            setShowUnitForm(false);
            fetchBookAndUnits();
        } catch (error) {
            console.error("Error adding unit:", error);
        }
    };

    const handleAddLesson = async (unitId) => {
        if (!newLessonTitle.trim()) return;

        try {
            await addDoc(collection(db, "books", id, "units", unitId, "lessons"), {
                title: newLessonTitle,
                createdAt: new Date()
            });
            setNewLessonTitle("");
            setActiveUnitId(null);
            fetchBookAndUnits();
        } catch (error) {
            console.error("Error adding lesson:", error);
        }
    };

    const handleDeleteUnit = async (unitId) => {
        if (!window.confirm("Tem certeza? Isso apagará todas as lições desta unidade.")) return;
        try {
            await deleteDoc(doc(db, "books", id, "units", unitId));
            fetchBookAndUnits();
        } catch (error) {
            console.error("Error deleting unit:", error);
        }
    };

    const handleDeleteLesson = async (unitId, lessonId) => {
        if (!window.confirm("Tem certeza?")) return;
        try {
            await deleteDoc(doc(db, "books", id, "units", unitId, "lessons", lessonId));
            fetchBookAndUnits();
        } catch (error) {
            console.error("Error deleting lesson:", error);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando...</div>;
    if (!book) return <div className="p-8 text-center">Livro não encontrado</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/admin/books")}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} className="text-slate-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{book.title}</h1>
                        <p className="text-slate-500">Estrutura do Conteúdo</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowUnitForm(true)}
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                >
                    <Plus size={20} />
                    Nova Lesson
                </button>
            </div>

            {showUnitForm && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 animate-in fade-in slide-in-from-top-2">
                    <form onSubmit={handleAddUnit} className="flex gap-4">
                        <input
                            type="text"
                            value={newUnitTitle}
                            onChange={(e) => setNewUnitTitle(e.target.value)}
                            placeholder="Título da Lesson (ex: Lesson 1: Introduction)"
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900"
                        >
                            Adicionar
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowUnitForm(false)}
                            className="text-slate-500 px-4 py-2 hover:text-slate-700"
                        >
                            Cancelar
                        </button>
                    </form>
                </div>
            )}

            <div className="space-y-6">
                {units.map((unit) => (
                    <div key={unit.id} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <BookOpen size={20} className="text-primary" />
                                <h3 className="font-semibold text-slate-800">{unit.title}</h3>
                            </div>
                            <button
                                onClick={() => handleDeleteUnit(unit.id)}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="space-y-2">
                                {unit.lessons.map((lesson) => (
                                    <div key={lesson.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg group border border-transparent hover:border-slate-100 transition-all">
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className="text-slate-400" />
                                            <span className="text-slate-700">{lesson.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => navigate(`/admin/books/${id}/units/${unit.id}/lessons/${lesson.id}`)}
                                                className="text-sm text-primary hover:underline px-2"
                                            >
                                                Editar Conteúdo
                                            </button>
                                            <button
                                                onClick={() => handleDeleteLesson(unit.id, lesson.id)}
                                                className="text-slate-400 hover:text-red-500 p-1"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {activeUnitId === unit.id ? (
                                <div className="mt-4 flex gap-2">
                                    <input
                                        type="text"
                                        value={newLessonTitle}
                                        onChange={(e) => setNewLessonTitle(e.target.value)}
                                        placeholder="Título da Lição"
                                        className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddLesson(unit.id)}
                                    />
                                    <button
                                        onClick={() => handleAddLesson(unit.id)}
                                        className="bg-slate-900 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                                    >
                                        Salvar
                                    </button>
                                    <button
                                        onClick={() => setActiveUnitId(null)}
                                        className="text-slate-500 px-3 py-2 text-sm hover:text-slate-700"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setActiveUnitId(unit.id)}
                                    className="mt-4 w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2 text-sm font-medium"
                                >
                                    <Plus size={16} />
                                    Adicionar Lição
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {units.length === 0 && !showUnitForm && (
                    <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-500">Nenhuma lesson criada ainda.</p>
                        <button
                            onClick={() => setShowUnitForm(true)}
                            className="text-primary font-medium hover:underline mt-2"
                        >
                            Criar primeira lesson
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
