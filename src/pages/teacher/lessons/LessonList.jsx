import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, getDocs, where, Timestamp } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Plus, Search, Calendar, Filter, CheckCircle, Clock, XCircle } from "lucide-react";

export default function LessonList() {
    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, scheduled, completed, cancelled
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

    useEffect(() => {
        fetchLessons();
    }, []);

    const fetchLessons = async () => {
        try {
            const q = query(
                collection(db, "class_sessions"),
                orderBy("date", "desc")
            );
            const snapshot = await getDocs(q);
            const lessonsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate()
            }));
            setLessons(lessonsData);
        } catch (error) {
            console.error("Error fetching lessons:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredLessons = lessons.filter(lesson => {
        // Search filter
        const matchesSearch = lesson.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lesson.bookTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lesson.lesson?.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        // Date filter
        if (dateFilter !== 'all') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const lessonDate = new Date(lesson.date);
            lessonDate.setHours(0, 0, 0, 0);

            if (dateFilter === 'today' && lessonDate.getTime() !== today.getTime()) return false;

            if (dateFilter === 'week') {
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 7);
                if (lessonDate < weekStart || lessonDate >= weekEnd) return false;
            }

            if (dateFilter === 'month') {
                if (lessonDate.getMonth() !== today.getMonth() ||
                    lessonDate.getFullYear() !== today.getFullYear()) return false;
            }
        }

        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Diário de Aulas</h1>
                    <p className="text-slate-500">Gerencie e acompanhe todas as suas aulas</p>
                </div>
                <Link
                    to="/teacher/lessons/select"
                    className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors flex items-center gap-2 justify-center"
                >
                    <Plus size={20} />
                    Registrar Aula
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por aluno, livro ou lição..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                    </div>

                    {/* Date Filter */}
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                        <option value="all">Todas as datas</option>
                        <option value="today">Hoje</option>
                        <option value="week">Esta semana</option>
                        <option value="month">Este mês</option>
                    </select>
                </div>
            </div>

            {/* Lessons Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700">Data</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Aluno</th>
                                <th className="px-6 py-4 font-semibold text-slate-700">Livro/Lição</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLessons.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        <Calendar size={48} className="mx-auto text-slate-300 mb-4" />
                                        Nenhuma aula encontrada.
                                    </td>
                                </tr>
                            ) : (
                                filteredLessons.map((lesson) => (
                                    <tr key={lesson.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-slate-400" />
                                                <div>
                                                    <div className="font-medium text-slate-900">
                                                        {lesson.date?.toLocaleDateString('pt-BR')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {lesson.studentName}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div>{lesson.bookTitle}</div>
                                            <div className="text-xs text-slate-500">{lesson.lesson}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                to={`/teacher/lessons/${lesson.id}`}
                                                className="text-primary hover:text-primary-600 font-medium text-xs"
                                            >
                                                Ver detalhes →
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
