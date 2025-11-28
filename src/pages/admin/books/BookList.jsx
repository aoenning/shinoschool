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
                    <div key={book.id} className="bg-white rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow overflow-hidden">
                        {/* Book Cover */}
                        <div className="h-48 bg-gradient-to-br from-primary to-primary-600 relative overflow-hidden">
                            {book.coverUrl ? (
                                <img
                                    src={book.coverUrl}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Book size={64} className="text-white/30" />
                                </div>
                            )}
                            <div className="absolute top-3 right-3 flex gap-2">
                                <Link
                                    to={`/admin/books/structure/${book.id}`}
                                    className="p-2 bg-white/90 backdrop-blur-sm text-primary hover:bg-white rounded-lg transition-colors shadow-sm"
                                    title="Gerenciar Conteúdo"
                                >
                                    <BookOpen size={18} />
                                </Link>
                                <Link
                                    to={`/admin/books/edit/${book.id}`}
                                    className="p-2 bg-white/90 backdrop-blur-sm text-blue-600 hover:bg-white rounded-lg transition-colors shadow-sm"
                                >
                                    <Pencil size={18} />
                                </Link>
                                <button
                                    onClick={() => handleDelete(book.id)}
                                    className="p-2 bg-white/90 backdrop-blur-sm text-red-600 hover:bg-white rounded-lg transition-colors shadow-sm"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Book Info */}
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-slate-800 mb-1">{book.title}</h3>
                            <p className="text-sm text-slate-500 mb-4">{book.level || "Nível não definido"}</p>

                            <div className="pt-4 border-t border-slate-100 flex justify-between text-sm text-slate-500">
                                <span>{book.unitsCount || 0} Lesson{book.unitsCount !== 1 ? 's' : ''}</span>
                                <span>{book.studentsCount || 0} Aluno{book.studentsCount !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
