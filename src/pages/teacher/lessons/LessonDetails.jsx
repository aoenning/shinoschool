import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, deleteDoc } from "firebase/firestore";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Trash2, Calendar, User, BookOpen, FileText, Edit } from "lucide-react";

export default function LessonDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchLesson();
    }, [id]);

    const fetchLesson = async () => {
        try {
            const docRef = doc(db, "class_sessions", id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setLesson({
                    id: docSnap.id,
                    ...docSnap.data(),
                    date: docSnap.data().date?.toDate()
                });
            } else {
                alert("Aula não encontrada");
                navigate("/teacher/lessons");
            }
        } catch (error) {
            console.error("Error fetching lesson:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Tem certeza que deseja deletar este registro de aula?")) {
            return;
        }

        setDeleting(true);
        try {
            await deleteDoc(doc(db, "class_sessions", id));
            navigate("/teacher/lessons");
        } catch (error) {
            console.error("Error deleting lesson:", error);
            alert("Erro ao deletar aula");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!lesson) {
        return null;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/teacher/lessons" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={24} className="text-slate-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Detalhes da Aula</h1>
                        <p className="text-slate-500">{lesson.date?.toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-4 py-2 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <Trash2 size={18} />
                    {deleting ? "Deletando..." : "Deletar"}
                </button>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Student & Date Info */}
                <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-slate-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-start gap-3">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                <User size={24} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Aluno</p>
                                <p className="text-lg font-bold text-slate-900">{lesson.studentName}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="p-3 bg-white rounded-xl shadow-sm">
                                <Calendar size={24} className="text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 mb-1">Data</p>
                                <p className="text-lg font-bold text-slate-900">
                                    {lesson.date?.toLocaleDateString('pt-BR', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lesson Content */}
                <div className="p-6 space-y-6">
                    {/* Book & Lesson */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                                <BookOpen size={16} />
                                Livro
                            </label>
                            <p className="text-slate-900 font-medium">{lesson.bookTitle || "—"}</p>
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
                                <FileText size={16} />
                                Lição
                            </label>
                            <p className="text-slate-900 font-medium">{lesson.lesson || "—"}</p>
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Detalhes da Aula</h3>

                        <div className="space-y-4">
                            {/* Warmer */}
                            {lesson.warmer && (
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Warmer</label>
                                    <p className="text-slate-900 whitespace-pre-wrap">{lesson.warmer}</p>
                                </div>
                            )}

                            {/* HW Correction */}
                            {lesson.hwCorrection && (
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">HW Correction</label>
                                    <p className="text-slate-900 whitespace-pre-wrap">{lesson.hwCorrection}</p>
                                </div>
                            )}

                            {/* Notes */}
                            {lesson.notes && (
                                <div className="bg-slate-50 p-4 rounded-xl">
                                    <label className="text-sm font-medium text-slate-700 mb-2 block">Notes</label>
                                    <p className="text-slate-900 whitespace-pre-wrap">{lesson.notes}</p>
                                </div>
                            )}

                            {/* Next Homework */}
                            {lesson.nextHomework && (
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <label className="text-sm font-medium text-blue-900 mb-2 block">Next Homework</label>
                                    <p className="text-blue-900 whitespace-pre-wrap">{lesson.nextHomework}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Teacher */}
                    <div className="border-t border-slate-100 pt-6">
                        <label className="text-sm font-medium text-slate-500 mb-2 block">Professor</label>
                        <p className="text-slate-900 font-medium">{lesson.teacher}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
