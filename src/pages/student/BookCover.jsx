import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { useParams, Link, useNavigate } from "react-router-dom";
import { PlayCircle, ArrowLeft, BookOpen, Clock, CheckCircle, ChevronDown, ChevronUp, Lock } from "lucide-react";

export default function BookCover() {
    const { bookId } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedUnit, setExpandedUnit] = useState(null);

    useEffect(() => {
        const fetchBookData = async () => {
            try {
                const bookDoc = await getDoc(doc(db, "books", bookId));
                if (bookDoc.exists()) {
                    setBook({ id: bookDoc.id, ...bookDoc.data() });

                    // Fetch Units & Lessons structure
                    const unitsQuery = query(collection(db, "books", bookId, "units"), orderBy("createdAt", "asc"));
                    const unitsSnap = await getDocs(unitsQuery);

                    const unitsData = await Promise.all(unitsSnap.docs.map(async (unitDoc) => {
                        const lessonsQuery = query(collection(db, "books", bookId, "units", unitDoc.id, "lessons"), orderBy("createdAt", "asc"));
                        const lessonsSnap = await getDocs(lessonsQuery);
                        return {
                            id: unitDoc.id,
                            ...unitDoc.data(),
                            lessons: lessonsSnap.docs.map(l => ({ id: l.id, unitId: unitDoc.id, ...l.data() }))
                        };
                    }));

                    setUnits(unitsData);
                    // Expand first unit by default
                    if (unitsData.length > 0) setExpandedUnit(unitsData[0].id);
                }
            } catch (error) {
                console.error("Error fetching book:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBookData();
    }, [bookId]);

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        </div>
    );

    if (!book) return <div className="flex items-center justify-center h-screen">Livro não encontrado</div>;

    const totalLessons = units.reduce((acc, unit) => acc + unit.lessons.length, 0);

    // Logic to find the first lesson to start/continue
    const firstUnit = units[0];
    const firstLesson = firstUnit?.lessons[0];
    const startLink = firstLesson
        ? `/student/book/${bookId}/player?unitId=${firstUnit.id}&lessonId=${firstLesson.id}`
        : "#";

    return (
        <div className="h-screen bg-slate-50 overflow-y-auto">
            {/* Header / Cover */}
            <div className="bg-shino-blue text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/90 z-10"></div>
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30 blur-sm z-0"
                    style={{ backgroundImage: `url(${book.coverUrl || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1470'})` }}
                ></div>

                <div className="relative z-20 max-w-5xl mx-auto px-6 py-12 md:py-20">
                    <Link to="/student" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
                        <ArrowLeft size={20} className="mr-2" />
                        Voltar para Dashboard
                    </Link>

                    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
                        <div className="w-40 md:w-56 flex-shrink-0 mx-auto md:mx-0">
                            <div className="aspect-[2/3] rounded-lg shadow-2xl overflow-hidden border-4 border-white/10 relative group">
                                {book.coverUrl ? (
                                    <img
                                        src={book.coverUrl}
                                        alt={book.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-shino-blue via-blue-600 to-blue-700 flex flex-col items-center justify-center p-6 text-white">
                                        <div className="text-center space-y-4">
                                            <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                <BookOpen size={32} className="text-white" />
                                            </div>
                                            <h3 className="font-bold text-xl leading-tight line-clamp-3">
                                                {book.title}
                                            </h3>
                                            {book.level && (
                                                <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                                                    {book.level}
                                                </div>
                                            )}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent"></div>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl md:text-5xl font-bold mb-4 font-heading">{book.title}</h1>
                            <p className="text-slate-300 text-lg leading-relaxed mb-6 max-w-2xl">
                                {book.description || "Descrição do curso não disponível."}
                            </p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-sm text-slate-400 mb-8">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={18} />
                                    <span>{units.length} Unidades</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={18} />
                                    <span>{totalLessons} Aulas</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={18} />
                                    <span>Certificado ao concluir</span>
                                </div>
                            </div>

                            <Link
                                to={startLink}
                                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 w-full md:w-auto"
                            >
                                <PlayCircle size={24} />
                                Começar Agora
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Syllabus Content */}
            <div className="max-w-4xl mx-auto px-6 py-12 pb-20">
                <h2 className="text-2xl font-bold text-slate-800 mb-8">Conteúdo do Curso</h2>

                <div className="space-y-4">
                    {units.map((unit) => (
                        <div key={unit.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                            <button
                                onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
                                className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition-colors text-left"
                            >
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{unit.title}</h3>
                                    <p className="text-slate-500 text-sm mt-1">{unit.lessons.length} aulas</p>
                                </div>
                                {expandedUnit === unit.id ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                            </button>

                            {expandedUnit === unit.id && (
                                <div className="border-t border-slate-100 bg-slate-50/50">
                                    {unit.lessons.map((lesson, index) => (
                                        <Link
                                            key={lesson.id}
                                            to={`/student/book/${bookId}/player?unitId=${unit.id}&lessonId=${lesson.id}`}
                                            className="flex items-center gap-3 md:gap-4 p-4 md:pl-8 pl-4 hover:bg-white transition-colors border-b border-slate-100 last:border-0 group"
                                        >
                                            <div className="w-8 h-8 md:w-8 md:h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-medium group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-slate-700 font-medium group-hover:text-primary transition-colors">{lesson.title}</h4>
                                            </div>
                                            <PlayCircle size={18} className="text-slate-400 group-hover:text-primary md:opacity-0 md:group-hover:opacity-100 transition-all flex-shrink-0" />
                                        </Link>
                                    ))}
                                    {unit.lessons.length === 0 && (
                                        <div className="p-6 text-center text-slate-400 text-sm italic">
                                            Nenhuma aula nesta unidade ainda.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {units.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            Conteúdo ainda não disponível.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
