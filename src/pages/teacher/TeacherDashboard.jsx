import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Calendar, Users, BookOpen, Plus, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function TeacherDashboard() {
    const [stats, setStats] = useState({
        todayLessons: 0,
        weekLessons: 0,
        totalStudents: 0,
        activeClasses: 0
    });
    const [upcomingLessons, setUpcomingLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
        try {
            const allLessonsQuery = query(
                collection(db, "class_sessions"),
                orderBy("date", "desc")
            );
            const allLessonsSnapshot = await getDocs(allLessonsQuery);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const allLessons = allLessonsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate()
            }));

            const todayLessons = allLessons
                .filter(lesson => {
                    if (!lesson.date) return false;
                    const lessonDate = new Date(lesson.date);
                    lessonDate.setHours(0, 0, 0, 0);
                    return lessonDate.getTime() === today.getTime();
                })
                .sort((a, b) => a.date - b.date);

            setStats(prev => ({ ...prev, todayLessons: todayLessons.length }));
            setUpcomingLessons(todayLessons.slice(0, 5));

            const studentsSnapshot = await getDocs(collection(db, "students"));
            setStats(prev => ({ ...prev, totalStudents: studentsSnapshot.size }));

            const classesQuery = query(
                collection(db, "classes"),
                where("status", "==", "active")
            );
            const classesSnapshot = await getDocs(classesQuery);
            setStats(prev => ({ ...prev, activeClasses: classesSnapshot.size }));

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Painel do Professor</h1>
                    <p className="text-slate-500">Gerencie suas aulas e acompanhe o progresso dos alunos</p>
                </div>
                <Link
                    to="/teacher/lessons/select"
                    className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center gap-2 justify-center"
                >
                    <Plus size={20} />
                    Registrar Aula
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-blue-50 rounded-xl text-primary">
                            <Calendar size={24} />
                        </div>
                    </div>
                    <h3 className="text-slate-500 text-sm font-medium mb-1">Aulas Hoje</h3>
                    <div className="text-3xl font-bold text-slate-900">{stats.todayLessons}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-green-50 rounded-xl text-green-600">
                            <Users size={24} />
                        </div>
                    </div>
                    <h3 className="text-slate-500 text-sm font-medium mb-1">Total de Alunos</h3>
                    <div className="text-3xl font-bold text-slate-900">{stats.totalStudents}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                            <BookOpen size={24} />
                        </div>
                    </div>
                    <h3 className="text-slate-500 text-sm font-medium mb-1">Turmas Ativas</h3>
                    <div className="text-3xl font-bold text-slate-900">{stats.activeClasses}</div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                    <h3 className="text-slate-500 text-sm font-medium mb-1">Aulas Semana</h3>
                    <div className="text-3xl font-bold text-slate-900">{stats.weekLessons}</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Clock size={24} className="text-primary" />
                        Aulas de Hoje
                    </h2>
                    <Link to="/teacher/lessons" className="text-sm text-primary hover:text-primary-600 font-medium">
                        Ver todas
                    </Link>
                </div>
                <div className="divide-y divide-slate-100">
                    {upcomingLessons.length > 0 ? (
                        upcomingLessons.map((lesson) => (
                            <Link
                                key={lesson.id}
                                to={`/teacher/lessons/${lesson.id}`}
                                className="p-6 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                            >
                                <div className="w-16 h-16 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary">
                                    <div className="text-xs font-medium">
                                        {lesson.date?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900">{lesson.studentName}</h3>
                                    <p className="text-sm text-slate-500">
                                        {lesson.bookTitle} - {lesson.lesson}
                                    </p>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="p-12 text-center text-slate-500">
                            <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                            <p>Nenhuma aula registrada para hoje</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
