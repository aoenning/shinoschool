import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, doc, getDoc, query, where, orderBy, Timestamp, limit } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Save, User, Zap, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function LessonForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState([]);
    const [books, setBooks] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentHistory, setStudentHistory] = useState([]);
    const [lastLesson, setLastLesson] = useState(null);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const [formData, setFormData] = useState({
        date: "",
        time: "",
        studentId: "",
        bookId: "",
        lesson: "",
        warmer: "",
        hwCorrection: "",
        notes: "",
        nextHomework: "",
        teacher: user?.displayName || user?.email || ""
    });

    useEffect(() => {
        fetchStudents();
        fetchBooks();

        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toTimeString().slice(0, 5);
        setFormData(prev => ({ ...prev, date: today, time: now }));

        if (location.state?.studentId && location.state?.lastLesson) {
            const lastLessonData = location.state.lastLesson;
            setFormData(prev => ({
                ...prev,
                studentId: location.state.studentId,
                bookId: lastLessonData.bookId || "",
                lesson: lastLessonData.lesson || "",
            }));
        } else if (location.state?.studentId) {
            setFormData(prev => ({
                ...prev,
                studentId: location.state.studentId
            }));
        }
    }, [location.state]);

    useEffect(() => {
        if (formData.studentId) {
            fetchStudentData(formData.studentId);
        }
    }, [formData.studentId]);

    const fetchStudents = async () => {
        try {
            const snapshot = await getDocs(collection(db, "students"));
            const studentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setStudents(studentsData);
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };

    const fetchBooks = async () => {
        try {
            const snapshot = await getDocs(collection(db, "books"));
            const booksData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBooks(booksData);
        } catch (error) {
            console.error("Error fetching books:", error);
        }
    };

    const fetchStudentData = async (studentId) => {
        setLoadingHistory(true);
        try {
            const studentDoc = await getDoc(doc(db, "students", studentId));
            if (studentDoc.exists()) {
                setSelectedStudent({ id: studentDoc.id, ...studentDoc.data() });
            }

            const historyQuery = query(
                collection(db, "class_sessions"),
                where("studentId", "==", studentId),
                orderBy("date", "desc"),
                limit(5)
            );
            const historySnapshot = await getDocs(historyQuery);
            const history = historySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate()
            }));
            setStudentHistory(history);

            if (history.length > 0) {
                setLastLesson(history[0]);
            }
        } catch (error) {
            console.error("Error fetching student data:", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleCopyFromLast = () => {
        if (!lastLesson) return;

        setFormData(prev => ({
            ...prev,
            bookId: lastLesson.bookId || "",
            lesson: lastLesson.lesson || "",
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const selectedStudentData = students.find(s => s.id === formData.studentId);
            const selectedBook = books.find(b => b.id === formData.bookId);

            const [hours, minutes] = formData.time.split(':');
            const [year, month, day] = formData.date.split('-');
            const lessonDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0, 0);

            await addDoc(collection(db, "class_sessions"), {
                date: Timestamp.fromDate(lessonDate),
                studentId: formData.studentId,
                studentName: selectedStudentData?.name || "",
                bookId: formData.bookId,
                bookTitle: selectedBook?.title || "",
                lesson: formData.lesson,
                warmer: formData.warmer,
                hwCorrection: formData.hwCorrection,
                notes: formData.notes,
                nextHomework: formData.nextHomework,
                teacher: formData.teacher,
                teacherId: user.uid,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            });

            navigate("/teacher/lessons");
        } catch (error) {
            console.error("Error creating lesson:", error);
            alert("Erro ao registrar aula.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link to="/teacher/lessons/select" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-slate-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Registrar Aula</h1>
                    <p className="text-slate-500">Preencha as informações da aula</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                        {/* Date, Time and Student */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Time *
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Student's *
                                </label>
                                <select
                                    required
                                    value={formData.studentId}
                                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                >
                                    <option value="">Select student...</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {lastLesson && (
                            <div>
                                <button
                                    type="button"
                                    onClick={handleCopyFromLast}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                                >
                                    <Zap size={18} />
                                    Copiar da Última Aula
                                </button>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Book *
                            </label>
                            <select
                                required
                                value={formData.bookId}
                                onChange={(e) => setFormData({ ...formData, bookId: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option value="">Select book...</option>
                                {books.map(book => (
                                    <option key={book.id} value={book.id}>
                                        {book.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Lesson *
                            </label>
                            <input
                                type="text"
                                required
                                placeholder="Ex: Lesson 5, Unit 2 - Lesson 3"
                                value={formData.lesson}
                                onChange={(e) => setFormData({ ...formData, lesson: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Warmer
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Warm-up activity..."
                                value={formData.warmer}
                                onChange={(e) => setFormData({ ...formData, warmer: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                HW CORRECTION
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Homework correction notes..."
                                value={formData.hwCorrection}
                                onChange={(e) => setFormData({ ...formData, hwCorrection: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Notes
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Class notes, observations..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Nxt (Next Homework)
                            </label>
                            <textarea
                                rows={2}
                                placeholder="Next homework assignment..."
                                value={formData.nextHomework}
                                onChange={(e) => setFormData({ ...formData, nextHomework: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Teacher *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.teacher}
                                onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-primary text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
                            >
                                <Save size={24} />
                                {loading ? "Salvando..." : "Salvar Registro"}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {selectedStudent && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <User size={20} className="text-primary" />
                                Student Info
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-slate-500">Name</p>
                                    <p className="font-medium text-slate-900">{selectedStudent.name}</p>
                                </div>
                                {selectedStudent.email && (
                                    <div>
                                        <p className="text-slate-500">Email</p>
                                        <p className="font-medium text-slate-900 text-xs">{selectedStudent.email}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {loadingHistory ? (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
                            <div className="w-6 h-6 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                        </div>
                    ) : studentHistory.length > 0 && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Clock size={20} className="text-primary" />
                                Recent History
                            </h3>
                            <div className="space-y-3">
                                {studentHistory.map((lesson) => (
                                    <div key={lesson.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <p className="text-xs text-slate-500 mb-1">
                                            {lesson.date?.toLocaleDateString('pt-BR')} - {lesson.date?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                        <p className="text-sm font-medium text-slate-900">{lesson.lesson}</p>
                                        <p className="text-xs text-slate-500">{lesson.bookTitle}</p>
                                        {lesson.nextHomework && (
                                            <p className="text-xs text-primary mt-1">HW: {lesson.nextHomework}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
