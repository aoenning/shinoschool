import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { Search, User, Users, ArrowRight, Clock, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";

export default function LessonSelector() {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState("all"); // all, students, classes
    const [loading, setLoading] = useState(true);
    const [lastLessons, setLastLessons] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch students
            const studentsSnapshot = await getDocs(collection(db, "students"));
            const studentsData = studentsSnapshot.docs.map(doc => ({
                id: doc.id,
                type: 'student',
                ...doc.data()
            }));
            setStudents(studentsData);

            // Fetch classes
            const classesQuery = query(
                collection(db, "classes"),
                where("status", "==", "active")
            );
            const classesSnapshot = await getDocs(classesQuery);
            const classesData = classesSnapshot.docs.map(doc => ({
                id: doc.id,
                type: 'class',
                ...doc.data()
            }));
            setClasses(classesData);

            // Fetch last lessons for each student
            const lastLessonsData = {};
            for (const student of studentsData) {
                const lastLessonQuery = query(
                    collection(db, "class_sessions"),
                    where("studentId", "==", student.id),
                    orderBy("date", "desc"),
                    limit(1)
                );
                const lastLessonSnapshot = await getDocs(lastLessonQuery);
                if (!lastLessonSnapshot.empty) {
                    const lessonData = lastLessonSnapshot.docs[0].data();
                    lastLessonsData[student.id] = {
                        ...lessonData,
                        date: lessonData.date?.toDate()
                    };
                }
            }
            setLastLessons(lastLessonsData);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStudent = (student) => {
        navigate('/teacher/lessons/new', {
            state: {
                studentId: student.id,
                studentName: student.name,
                lastLesson: lastLessons[student.id]
            }
        });
    };

    const handleSelectClass = (classData) => {
        navigate('/teacher/lessons/new', {
            state: {
                classId: classData.id,
                className: classData.name,
                isClass: true
            }
        });
    };

    const filteredStudents = students.filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredClasses = classes.filter(cls =>
        cls.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const showStudents = filterType === 'all' || filterType === 'students';
    const showClasses = filterType === 'all' || filterType === 'classes';

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Registrar Aula</h1>
                <p className="text-slate-500 mt-1">Selecione um aluno ou turma para começar</p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-lg"
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterType('students')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filterType === 'students' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                    >
                        <User size={16} />
                        Alunos ({students.length})
                    </button>
                    <button
                        onClick={() => setFilterType('classes')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${filterType === 'classes' ? 'bg-purple-500 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                            }`}
                    >
                        <Users size={16} />
                        Turmas ({classes.length})
                    </button>
                </div>
            </div>

            {/* Students List */}
            {showStudents && filteredStudents.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <User size={20} className="text-blue-600" />
                        Alunos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredStudents.map((student) => {
                            const lastLesson = lastLessons[student.id];
                            return (
                                <button
                                    key={student.id}
                                    onClick={() => handleSelectStudent(student)}
                                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-primary hover:shadow-lg transition-all text-left group"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                                                {student.name}
                                            </h3>
                                            {student.email && (
                                                <p className="text-xs text-slate-500 mt-1">{student.email}</p>
                                            )}
                                        </div>
                                        <ArrowRight size={20} className="text-slate-400 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>

                                    {lastLesson ? (
                                        <div className="pt-3 border-t border-slate-100 space-y-1">
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Clock size={12} />
                                                Última aula: {lastLesson.date?.toLocaleDateString('pt-BR')}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                                <BookOpen size={12} />
                                                {lastLesson.bookTitle} - {lastLesson.lesson}
                                            </div>
                                            {lastLesson.nextHomework && (
                                                <p className="text-xs text-primary mt-1">
                                                    HW pendente: {lastLesson.nextHomework}
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="pt-3 border-t border-slate-100">
                                            <p className="text-xs text-slate-400">Primeira aula</p>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Classes List */}
            {showClasses && filteredClasses.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Users size={20} className="text-purple-600" />
                        Turmas
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredClasses.map((classData) => (
                            <button
                                key={classData.id}
                                onClick={() => handleSelectClass(classData)}
                                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-purple-500 hover:shadow-lg transition-all text-left group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                                            {classData.name}
                                        </h3>
                                        {classData.teacher && (
                                            <p className="text-xs text-slate-500 mt-1">Prof: {classData.teacher}</p>
                                        )}
                                    </div>
                                    <ArrowRight size={20} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                                </div>

                                <div className="pt-3 border-t border-slate-100 space-y-1">
                                    {classData.schedule && (
                                        <p className="text-xs text-slate-600">{classData.schedule}</p>
                                    )}
                                    {classData.bookId && (
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <BookOpen size={12} />
                                            Livro vinculado
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {((showStudents && filteredStudents.length === 0) && (showClasses && filteredClasses.length === 0)) && (
                <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                    <Search size={48} className="mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">Nenhum resultado encontrado</h3>
                    <p className="text-slate-500">Tente ajustar sua busca ou filtros</p>
                </div>
            )}
        </div>
    );
}
