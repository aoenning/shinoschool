import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, orderBy } from "firebase/firestore";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Menu, CheckCircle, ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import ContentRenderer from "@/components/player/ContentRenderer";

export default function BookPlayer() {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [units, setUnits] = useState([]);
    const [activeLesson, setActiveLesson] = useState(null);
    const [lessonContents, setLessonContents] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
    const [loading, setLoading] = useState(true);
    const [completedLessons, setCompletedLessons] = useState([]);

    const loadLesson = useCallback(async (unitId, lessonId) => {
        try {
            const lessonDoc = await getDoc(doc(db, "books", bookId, "units", unitId, "lessons", lessonId));
            if (lessonDoc.exists()) {
                setActiveLesson({ id: lessonDoc.id, unitId, ...lessonDoc.data() });
                const contentQuery = query(
                    collection(db, "books", bookId, "units", unitId, "lessons", lessonId, "contents"),
                    orderBy("order", "asc")
                );
                const contentSnap = await getDocs(contentQuery);
                setLessonContents(contentSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                navigate(`/student/book/${bookId}/player?unitId=${unitId}&lessonId=${lessonId}`, { replace: true });
            }
        } catch (error) {
            console.error("Error loading lesson:", error);
        }
    }, [bookId, navigate]);

    const handleMarkCompleted = () => {
        if (activeLesson) {
            setCompletedLessons(prev =>
                prev.includes(activeLesson.id)
                    ? prev.filter(id => id !== activeLesson.id)
                    : [...prev, activeLesson.id]
            );
        }
    };

    const handleNextLesson = () => {
        if (!activeLesson) return;
        const allLessons = units.flatMap(u => u.lessons);
        const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);
        if (currentIndex < allLessons.length - 1) {
            const nextLesson = allLessons[currentIndex + 1];
            loadLesson(nextLesson.unitId, nextLesson.id);
        }
    };

    const handlePrevLesson = () => {
        if (!activeLesson) return;
        const allLessons = units.flatMap(u => u.lessons);
        const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);
        if (currentIndex > 0) {
            const prevLesson = allLessons[currentIndex - 1];
            loadLesson(prevLesson.unitId, prevLesson.id);
        }
    };

    const [searchParams] = useSearchParams();
    const initialUnitId = searchParams.get("unitId");
    const initialLessonId = searchParams.get("lessonId");

    useEffect(() => {
        const fetchBookData = async () => {
            try {
                const bookDoc = await getDoc(doc(db, "books", bookId));
                if (bookDoc.exists()) {
                    setBook({ id: bookDoc.id, ...bookDoc.data() });
                    const unitsQuery = query(collection(db, "books", bookId, "units"), orderBy("createdAt", "asc"));
                    const unitsSnap = await getDocs(unitsQuery);
                    const unitsData = await Promise.all(
                        unitsSnap.docs.map(async (unitDoc) => {
                            const lessonsQuery = query(
                                collection(db, "books", bookId, "units", unitDoc.id, "lessons"),
                                orderBy("createdAt", "asc")
                            );
                            const lessonsSnap = await getDocs(lessonsQuery);
                            return {
                                id: unitDoc.id,
                                ...unitDoc.data(),
                                lessons: lessonsSnap.docs.map(l => ({ id: l.id, unitId: unitDoc.id, ...l.data() }))
                            };
                        })
                    );
                    setUnits(unitsData);
                    if (initialUnitId && initialLessonId) {
                        loadLesson(initialUnitId, initialLessonId);
                    } else if (unitsData.length > 0 && unitsData[0].lessons.length > 0) {
                        loadLesson(unitsData[0].id, unitsData[0].lessons[0].id);
                    }
                }
            } catch (error) {
                console.error("Error fetching book:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookData();
    }, [bookId, initialUnitId, initialLessonId, loadLesson]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
    }

    if (!book) {
        return <div className="flex items-center justify-center h-screen">Livro não encontrado</div>;
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden relative">
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className={`${sidebarOpen ? 'w-80' : 'w-0'} fixed md:relative h-full bg-white border-r border-slate-200 transition-all duration-300 flex flex-col shadow-xl z-30 overflow-hidden`}>
                <div className="w-80 flex flex-col h-full">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <div className="flex-1 min-w-0">
                            <h2 className="font-bold text-slate-800 truncate text-lg">{book.title}</h2>
                            <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Seu Progresso</p>
                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                                    {Math.round((completedLessons.length / (units.reduce((acc, u) => acc + u.lessons.length, 0) || 1)) * 100)}%
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden p-2 text-slate-400 hover:text-slate-600"
                        >
                            <ChevronLeft size={20} />
                        </button>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 mt-0 overflow-hidden">
                        <div
                            className="bg-primary h-full rounded-full transition-all duration-500"
                            style={{ width: `${(completedLessons.length / (units.reduce((acc, u) => acc + u.lessons.length, 0) || 1)) * 100}%` }}
                        ></div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {units.map((unit) => (
                            <div key={unit.id}>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">{unit.title}</h3>
                                <div className="space-y-1">
                                    {unit.lessons.map((lesson) => {
                                        const isActive = activeLesson?.id === lesson.id;
                                        const isCompleted = completedLessons.includes(lesson.id);

                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => {
                                                    loadLesson(unit.id, lesson.id);
                                                    if (window.innerWidth < 768) setSidebarOpen(false);
                                                }}
                                                className={`w-full text-left px-2 py-2 md:px-3 md:py-3 rounded-lg text-sm transition-all flex items-center gap-3 group ${isActive
                                                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                                    }`}
                                            >
                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isCompleted
                                                    ? (isActive ? 'bg-white/20 text-white' : 'bg-green-100 text-green-600')
                                                    : (isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-400')
                                                    }`}>
                                                    {isCompleted ? <CheckCircle size={12} /> : <PlayCircle size={10} className={isActive ? "fill-white" : ""} />}
                                                </div>
                                                <span className={`line-clamp-2 ${isCompleted && !isActive ? 'line-through opacity-70' : ''}`}>
                                                    {lesson.title}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={`flex-1 flex flex-col h-full relative bg-white w-full ${sidebarOpen ? 'ml-80 md:ml-0' : ''}`}>
                <div className="h-16 border-b border-slate-100 flex items-center justify-between px-4 md:px-8 bg-white z-10">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                            title={sidebarOpen ? "Fechar Menu" : "Abrir Menu"}
                        >
                            <Menu size={20} />
                        </button>
                        <button
                            onClick={() => navigate(`/student/book/${bookId}`)}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 hover:text-slate-900 font-medium text-sm transition-colors"
                        >
                            <ChevronLeft size={16} />
                            <span>Voltar para Capa</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevLesson}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                            title="Aula Anterior"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={handleNextLesson}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
                            title="Próxima Aula"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 scroll-smooth">
                    <div className="w-full max-w-none">
                        {activeLesson ? (
                            <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
                                <div className="mb-4 pb-3 border-b border-slate-100">
                                    <h1 className="text-2xl md:text-4xl font-bold text-slate-900 mb-2">{activeLesson.title}</h1>
                                    <p className="text-sm md:text-base text-slate-500">
                                        Unidade: {units.find(u => u.id === activeLesson.unitId)?.title}
                                    </p>
                                </div>

                                <div className="space-y-3 mb-20">
                                    {lessonContents.map((content) => (
                                        <ContentRenderer key={content.id} content={content} />
                                    ))}

                                    {lessonContents.length === 0 && (
                                        <div className="text-slate-400 italic text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                            Esta lição ainda não tem conteúdo disponível.
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col-reverse md:flex-row items-center justify-between pt-8 border-t border-slate-100 pb-20 gap-4">
                                    <button
                                        onClick={handlePrevLesson}
                                        className="w-full md:w-auto px-3 py-2 md:px-6 md:py-3 rounded-xl font-medium text-sm md:text-base text-slate-500 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <ChevronLeft size={20} />
                                        Anterior
                                    </button>

                                    <button
                                        onClick={handleMarkCompleted}
                                        className={`w-full md:w-auto px-4 py-2 md:px-8 md:py-4 rounded-xl font-bold text-sm md:text-base transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 ${completedLessons.includes(activeLesson.id)
                                            ? 'bg-green-500 text-white shadow-green-500/20'
                                            : 'bg-primary text-white shadow-primary/20 hover:bg-blue-700'
                                            }`}
                                    >
                                        {completedLessons.includes(activeLesson.id) ? (
                                            <>
                                                <CheckCircle size={20} />
                                                Concluída
                                            </>
                                        ) : (
                                            <>
                                                <span>Marcar como Concluída</span>
                                                <ChevronRight size={20} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-32 text-slate-400">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <PlayCircle size={32} className="text-slate-300" />
                                </div>
                                <p>Selecione uma lição para começar.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
