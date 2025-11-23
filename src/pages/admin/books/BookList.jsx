import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Book, BookOpen } from "lucide-react";

export default function BookList() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "books"));
            const booksData = await Promise.all(
                querySnapshot.docs.map(async (bookDoc) => {
                    const bookId = bookDoc.id;

                    // Count units (lessons) for this book
                    const unitsSnapshot = await getDocs(collection(db, "books", bookId, "units"));
                    const unitsCount = unitsSnapshot.size;

                    // Count students assigned to this book (via currentBookId)
                    const studentsQuery = query(
                        collection(db, "students"),
                        where("currentBookId", "==", bookId)
                    );
                    const studentsSnapshot = await getDocs(studentsQuery);
                    const studentsCount = studentsSnapshot.size;

                    // Also count students assigned via class
                    const classesQuery = query(
                        collection(db, "classes"),
                        where("bookId", "==", bookId)
                    );
                    const classesSnapshot = await getDocs(classesQuery);

                    let classStudentsCount = 0;
                    for (const classDoc of classesSnapshot.docs) {
                        const classStudentsQuery = query(
                            collection(db, "students"),
                            where("classId", "==", classDoc.id)
                        );
                        const classStudentsSnapshot = await getDocs(classStudentsQuery);
                        classStudentsCount += classStudentsSnapshot.size;
                    }

                    const totalStudents = studentsCount + classStudentsCount;

                    return {
                        id: bookId,
                        ...bookDoc.data(),
                        unitsCount,
                        studentsCount: totalStudents
                    };
                })
            );
            setBooks(booksData);
        } catch (error) {
            console.error("Error fetching books:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Tem certeza que deseja excluir este livro?")) {
            try {
                await deleteDoc(doc(db, "books", id));
                fetchBooks();
            } catch (error) {
                console.error("Error deleting book:", error);
            }
        }
    };

    if (loading) return <div>Carregando...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Gestão de Livros</h1>
                <Link
                    to="/admin/books/new"
                    className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-600 transition-colors"
                >
                    <Plus size={20} />
                    Novo Livro
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book) => (
                    <div key={book.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-slate-100 rounded-lg text-blue-600">
                                <Book size={24} />
                            </div>
                            <div className="flex gap-2">
                                <Link
                                    to={`/admin/books/structure/${book.id}`}
                                    className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Gerenciar Conteúdo"
                                >
                                    <BookOpen size={18} />
                                </Link>
                                <Link
                                    to={`/admin/books/edit/${book.id}`}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <Pencil size={18} />
                                </Link>
                                <button
                                    onClick={() => handleDelete(book.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-lg font-semibold text-slate-800 mb-1">{book.title}</h3>
                        <p className="text-sm text-slate-500">{book.level || "Nível não definido"}</p>

                        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-sm text-slate-500">
                            <span>{book.unitsCount || 0} Lesson{book.unitsCount !== 1 ? 's' : ''}</span>
                            <span>{book.studentsCount || 0} Aluno{book.studentsCount !== 1 ? 's' : ''}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
