import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, getDoc, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { PlayCircle, BookOpen, Clock, Star, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentDashboard() {
    const [studentBook, setStudentBook] = useState(null);
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [studentData, setStudentData] = useState(null);

    const { user } = useAuth();

    useEffect(() => {
        const fetchStudentData = async () => {
            try {
                if (!user || !user.id) {
                    setLoading(false);
                    return;
                }

                // Fetch student data from Firestore
                const studentDoc = await getDoc(doc(db, "students", user.id));

                if (!studentDoc.exists()) {
                    console.log("Student document not found");
                    setLoading(false);
                    return;
                }

                const studentInfo = studentDoc.data();
                setStudentData(studentInfo);

                let targetBookId = studentInfo.currentBookId;

                // Fallback: Check Class Book if no direct book assigned
                if (!targetBookId && studentInfo.classId) {
                    const classDoc = await getDoc(doc(db, "classes", studentInfo.classId));
                    if (classDoc.exists()) {
                        targetBookId = classDoc.data().bookId;
                    }
                }

                // Check if student has a book assigned (either direct or via class)
                if (!targetBookId) {
                    console.log("No book assigned to student or class");
                    setLoading(false);
                    return;
                }

                // Fetch the student's assigned book
                const bookDoc = await getDoc(doc(db, "books", targetBookId));

                if (!bookDoc.exists()) {
                    console.log("Book not found");
                    setLoading(false);
                    return;
                }

                const bookData = { id: bookDoc.id, ...bookDoc.data() };
                setStudentBook(bookData);

                // Fetch units for this book
                const unitsQuery = query(
                    collection(db, "units"),
                    where("bookId", "==", targetBookId),
                    orderBy("order", "asc")
                );
                const unitsSnapshot = await getDocs(unitsQuery);

                const unitsWithLessons = await Promise.all(
                    unitsSnapshot.docs.map(async (unitDoc) => {
                        const unitData = { id: unitDoc.id, ...unitDoc.data() };

                        // Fetch lessons for each unit
                        const lessonsQuery = query(
                            collection(db, "lessons"),
                            where("unitId", "==", unitDoc.id),
                            orderBy("order", "asc")
                        );
                        const lessonsSnapshot = await getDocs(lessonsQuery);
                        const lessons = lessonsSnapshot.docs.map(lessonDoc => ({
                            id: lessonDoc.id,
                            ...lessonDoc.data()
                        }));

                        return {
                            ...unitData,
                            lessons
                        };
                    })
                );

                setUnits(unitsWithLessons);

            } catch (error) {
                console.error("Error fetching student data:", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchStudentData();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!studentBook) {
        return (
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900">Nenhum livro atribuído</h3>
                    <p className="text-slate-500">Entre em contato com a administração para ter um livro atribuído.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Hero Section - Student's Book */}
            <div className={`relative bg-primary text-white overflow-hidden ${units.length === 0 ? 'flex-1 flex items-center' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-10"></div>

                {/* Background Image Pattern or Cover */}
                <div
                    className="absolute inset-0 opacity-20 bg-cover bg-center z-0"
                    style={{ backgroundImage: `url(${studentBook.coverUrl || 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1470'})` }}
                ></div>

                <div className="relative z-20 max-w-7xl mx-auto px-6 py-12 md:py-24 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    <div className="flex-1 space-y-6 text-center md:text-left">
                        {studentData && (
                            <div className="mb-2">
                                <p className="text-blue-200 text-sm">Olá,</p>
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                                    {studentData.name || user?.email?.split('@')[0] || 'Aluno'}! 👋
                                </h2>
                            </div>
                        )}
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-medium border border-blue-500/30">
                            <Star size={12} />
                            Seu Livro Atual
                        </div>
                        <h1 className="text-3xl md:text-5xl font-bold leading-tight font-heading">
                            {studentBook.title}
                        </h1>
                        <p className="text-lg text-slate-300">
                            <span className="font-semibold">Nível:</span> {studentBook.level || "Não definido"}
                        </p>
                        <p className="text-slate-300 text-lg max-w-2xl line-clamp-3">
                            {studentBook.description || "Comece sua jornada de aprendizado agora. Este curso foi preparado especialmente para você evoluir."}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 justify-center md:justify-start">
                            <Link
                                to={`/student/book/${studentBook.id}/player`}
                                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-3 shadow-lg shadow-white/10"
                            >
                                <PlayCircle size={24} className="fill-slate-900" />
                                Continuar Estudando
                            </Link>
                            <Link
                                to={`/student/book/${studentBook.id}`}
                                className="w-full sm:w-auto px-8 py-4 bg-slate-800/50 text-white rounded-xl font-medium hover:bg-slate-800 transition-all border border-slate-700 flex items-center justify-center gap-3 backdrop-blur-sm"
                            >
                                <BookOpen size={20} />
                                Ver Detalhes
                            </Link>
                        </div>
                    </div>

                    {/* Book Cover Art */}
                    <div className="w-48 md:w-64 flex-shrink-0 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                        <div className="aspect-[2/3] rounded-lg shadow-2xl overflow-hidden border-4 border-white/10 relative group">
                            {studentBook.coverUrl ? (
                                <img
                                    src={studentBook.coverUrl}
                                    alt={studentBook.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-primary via-primary-600 to-primary-700 flex flex-col items-center justify-center p-6 text-white">
                                    <div className="text-center space-y-4">
                                        <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                            <BookOpen size={32} className="text-white" />
                                        </div>
                                        <h3 className="font-bold text-xl leading-tight line-clamp-3">
                                            {studentBook.title}
                                        </h3>
                                        {studentBook.level && (
                                            <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
                                                {studentBook.level}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/30 to-transparent"></div>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Units and Lessons Section */}
            {units.length > 0 && (
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BookOpen size={28} className="text-primary" />
                        Conteúdo do Livro
                    </h2>

                    <div className="space-y-6">
                        {units.map((unit, index) => (
                            <div key={unit.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-gradient-to-r from-primary to-primary-600 text-white p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold backdrop-blur-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold">{unit.title}</h3>
                                            {unit.description && (
                                                <p className="text-blue-100 text-sm mt-1">{unit.description}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {unit.lessons && unit.lessons.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {unit.lessons.map((lesson, lessonIndex) => (
                                            <Link
                                                key={lesson.id}
                                                to={`/student/book/${studentBook.id}/unit/${unit.id}/lesson/${lesson.id}`}
                                                className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group"
                                            >
                                                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-semibold group-hover:bg-primary group-hover:text-white transition-colors">
                                                    {lessonIndex + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-slate-900 group-hover:text-primary transition-colors">
                                                        {lesson.title}
                                                    </h4>
                                                    {lesson.description && (
                                                        <p className="text-sm text-slate-500 line-clamp-1">{lesson.description}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Clock size={16} />
                                                    <PlayCircle size={20} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-slate-500">
                                        <p>Nenhuma lição disponível nesta unidade.</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
