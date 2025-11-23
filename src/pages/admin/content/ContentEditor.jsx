import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, doc, getDoc, addDoc, getDocs, query, orderBy, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Type, Video, Music, Save, GripVertical, Eye, Upload, Loader2 } from "lucide-react";

export default function ContentEditor() {
    const { bookId, unitId, lessonId } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState(null);
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddMenu, setShowAddMenu] = useState(false);
    const [uploadingId, setUploadingId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const lessonDoc = await getDoc(doc(db, "books", bookId, "units", unitId, "lessons", lessonId));
                if (lessonDoc.exists()) {
                    setLesson({ id: lessonDoc.id, ...lessonDoc.data() });

                    const q = query(collection(db, "books", bookId, "units", unitId, "lessons", lessonId, "contents"), orderBy("order", "asc"));
                    const snapshot = await getDocs(q);
                    setContents(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [bookId, unitId, lessonId]);

    const handleAddContent = async (type) => {
        const newContent = {
            type,
            title: "",
            data: "", // text content or url
            order: contents.length,
            createdAt: new Date()
        };

        try {
            const docRef = await addDoc(collection(db, "books", bookId, "units", unitId, "lessons", lessonId, "contents"), newContent);
            setContents([...contents, { id: docRef.id, ...newContent }]);
            setShowAddMenu(false);
        } catch (error) {
            console.error("Error adding content:", error);
        }
    };

    const handleUpdateContent = async (id, field, value) => {
        const updatedContents = contents.map(c => c.id === id ? { ...c, [field]: value } : c);
        setContents(updatedContents);
    };

    const saveContent = async (content) => {
        try {
            await updateDoc(doc(db, "books", bookId, "units", unitId, "lessons", lessonId, "contents", content.id), {
                title: content.title,
                data: content.data
            });
        } catch (error) {
            console.error("Error saving content:", error);
        }
    };

    const handleFileUpload = async (e, contentId) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingId(contentId);
        try {
            const storageRef = ref(storage, `books/${bookId}/audio/${Date.now()}_${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            // Update local state
            const updatedContents = contents.map(c => c.id === contentId ? { ...c, data: downloadURL } : c);
            setContents(updatedContents);

            // Save to Firestore
            await updateDoc(doc(db, "books", bookId, "units", unitId, "lessons", lessonId, "contents", contentId), {
                data: downloadURL
            });

        } catch (error) {
            console.error("Error uploading file:", error);
            alert(`Erro ao fazer upload: ${error.message}`);
        } finally {
            setUploadingId(null);
        }
    };

    const handleDeleteContent = async (id) => {
        if (!window.confirm("Remover este conteúdo?")) return;
        try {
            await deleteDoc(doc(db, "books", bookId, "units", unitId, "lessons", lessonId, "contents", id));
            setContents(contents.filter(c => c.id !== id));
        } catch (error) {
            console.error("Error deleting content:", error);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando...</div>;
    if (!lesson) return <div className="p-8 text-center">Lição não encontrada</div>;

    return (
        <div className="max-w-3xl mx-auto pb-20">
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={() => navigate(`/admin/books/structure/${bookId}`)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} className="text-slate-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{lesson.title}</h1>
                    <p className="text-slate-500">Editor de Conteúdo</p>
                </div>
            </div>

            <div className="absolute top-8 right-8">
                <button
                    onClick={() => window.open(`/student/book/${bookId}?unitId=${unitId}&lessonId=${lessonId}`, '_blank')}
                    className="flex items-center gap-2 text-slate-600 hover:text-primary bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all"
                >
                    <Eye size={20} />
                    Visualizar Lição
                </button>
            </div>

            <div className="space-y-6">
                {contents.map((content) => (
                    <div key={content.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative group">
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                            <button
                                onClick={() => handleDeleteContent(content.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-4 text-slate-500">
                            {content.type === 'text' && <Type size={20} />}
                            {content.type === 'video' && <Video size={20} />}
                            {content.type === 'audio' && <Music size={20} />}
                            <span className="text-sm font-medium uppercase tracking-wider">{content.type}</span>
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={content.title}
                                onChange={(e) => handleUpdateContent(content.id, 'title', e.target.value)}
                                onBlur={() => saveContent(content)}
                                placeholder="Título do bloco (opcional)"
                                className="w-full text-lg font-medium placeholder:text-slate-300 border-none focus:ring-0 p-0"
                            />

                            {content.type === 'text' && (
                                <textarea
                                    value={content.data}
                                    onChange={(e) => handleUpdateContent(content.id, 'data', e.target.value)}
                                    onBlur={() => saveContent(content)}
                                    rows={5}
                                    placeholder="Digite o conteúdo do texto aqui..."
                                    className="w-full p-4 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                                />
                            )}

                            {content.type === 'video' && (
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={content.data}
                                        onChange={(e) => handleUpdateContent(content.id, 'data', e.target.value)}
                                        onBlur={() => saveContent(content)}
                                        placeholder="Cole a URL do vídeo (YouTube/Vimeo)"
                                        className="flex-1 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            )}

                            {content.type === 'audio' && (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    {content.data ? (
                                        <div className="flex items-center gap-4">
                                            <audio controls className="flex-1 h-10">
                                                <source src={content.data} />
                                                Seu navegador não suporta áudio.
                                            </audio>
                                            <button
                                                onClick={() => handleUpdateContent(content.id, 'data', '')}
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Trocar Arquivo
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    {uploadingId === content.id ? (
                                                        <>
                                                            <Loader2 className="w-8 h-8 mb-3 text-primary animate-spin" />
                                                            <p className="text-sm text-slate-500">Enviando áudio...</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-8 h-8 mb-3 text-slate-400" />
                                                            <p className="text-sm text-slate-500"><span className="font-semibold">Clique para enviar</span> ou arraste o arquivo</p>
                                                            <p className="text-xs text-slate-500">MP3, WAV (Max 10MB)</p>
                                                        </>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    accept="audio/*"
                                                    onChange={(e) => handleFileUpload(e, content.id)}
                                                    disabled={uploadingId === content.id}
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-8 right-8 flex flex-col items-end gap-4">
                {showAddMenu && (
                    <div className="bg-white rounded-xl shadow-xl border border-slate-100 p-2 flex flex-col gap-1 mb-2 animate-in slide-in-from-bottom-4">
                        <button
                            onClick={() => handleAddContent('text')}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg text-slate-700 w-48"
                        >
                            <Type size={18} /> Texto
                        </button>
                        <button
                            onClick={() => handleAddContent('video')}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg text-slate-700 w-48"
                        >
                            <Video size={18} /> Vídeo
                        </button>
                        <button
                            onClick={() => handleAddContent('audio')}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 rounded-lg text-slate-700 w-48"
                        >
                            <Music size={18} /> Áudio
                        </button>
                    </div>
                )}
                <button
                    onClick={() => setShowAddMenu(!showAddMenu)}
                    className="bg-slate-900 text-white p-4 rounded-full shadow-lg hover:bg-slate-800 transition-all hover:scale-105"
                >
                    <Plus size={24} className={`transition-transform ${showAddMenu ? 'rotate-45' : ''}`} />
                </button>
            </div>
        </div>
    );
}
