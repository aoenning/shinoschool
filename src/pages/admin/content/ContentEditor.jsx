import { useState, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { collection, doc, getDoc, addDoc, getDocs, query, orderBy, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
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
    const [editingVideoId, setEditingVideoId] = useState(null);

    const [savingIds, setSavingIds] = useState(new Set());

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

            // If adding a video, set it to editing mode
            if (type === 'video') {
                setEditingVideoId(docRef.id);
            }
        } catch (error) {
            console.error("Error adding content:", error);
        }
    };

    const handleUpdateContent = async (id, field, value) => {
        const updatedContents = contents.map(c => c.id === id ? { ...c, [field]: value } : c);
        setContents(updatedContents);
    };

    const saveContent = async (contentId) => {
        // Find the latest content from state to ensure we have the most up-to-date data
        const contentToSave = contents.find(c => c.id === contentId);
        if (!contentToSave) return;

        setSavingIds(prev => new Set(prev).add(contentId));
        try {
            await updateDoc(doc(db, "books", bookId, "units", unitId, "lessons", lessonId, "contents", contentId), {
                title: contentToSave.title,
                data: contentToSave.data
            });

            // Optional: Show a toast or temporary success indicator if needed
            // For now, the button state change is enough feedback
        } catch (error) {
            console.error("Error saving content:", error);
            alert("Erro ao salvar. Tente novamente.");
        } finally {
            setSavingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(contentId);
                return newSet;
            });
        }
    };

    const handleFileUpload = async (e, contentId) => {
        const file = e.target.files[0];
        if (!file) {
            console.log("Nenhum arquivo selecionado");
            return;
        }

        console.log("Iniciando upload de arquivo:", {
            name: file.name,
            type: file.type,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            contentId
        });

        setUploadingId(contentId);

        try {
            // Determine folder based on file type
            const isVideo = file.type.startsWith('video/');
            const folder = isVideo ? 'videos' : 'audio';

            console.log(`Fazendo upload para pasta: ${folder}`);

            const storageRef = ref(storage, `books/${bookId}/${folder}/${Date.now()}_${file.name}`);

            console.log("Criando tarefa de upload resumível...");

            // Use uploadBytesResumable instead of uploadBytes
            // This uses a different upload method that may bypass CORS issues
            const uploadTask = uploadBytesResumable(storageRef, file, {
                contentType: file.type
            });

            // Monitor upload progress
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload progress: ${progress.toFixed(2)}%`);
                },
                (error) => {
                    // Handle upload errors
                    console.error("Erro durante upload:", {
                        message: error.message,
                        code: error.code,
                        serverResponse: error.serverResponse
                    });

                    let errorMessage = "Erro ao fazer upload do arquivo.";

                    if (error.code === 'storage/unauthorized') {
                        errorMessage = "Erro de permissão. Verifique as regras do Firebase Storage.";
                    } else if (error.code === 'storage/canceled') {
                        errorMessage = "Upload cancelado.";
                    } else if (error.code === 'storage/unknown') {
                        errorMessage = "Erro desconhecido. Verifique sua conexão com a internet.";
                    } else if (error.message) {
                        errorMessage = `Erro: ${error.message}`;
                    }

                    alert(errorMessage);
                    setUploadingId(null);
                    e.target.value = '';
                },
                async () => {
                    // Upload completed successfully
                    console.log("Upload concluído, obtendo URL de download...");

                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        console.log("URL de download obtida:", downloadURL);

                        // Update local state
                        const updatedContents = contents.map(c => c.id === contentId ? { ...c, data: downloadURL } : c);
                        setContents(updatedContents);

                        console.log("Salvando URL no Firestore...");
                        // Save to Firestore
                        await updateDoc(doc(db, "books", bookId, "units", unitId, "lessons", lessonId, "contents", contentId), {
                            data: downloadURL
                        });

                        console.log("Upload e salvamento concluídos com sucesso!");

                        // Clear editing state for videos
                        if (isVideo && editingVideoId === contentId) {
                            setEditingVideoId(null);
                        }

                        setUploadingId(null);
                        e.target.value = '';
                    } catch (error) {
                        console.error("Erro ao salvar URL:", error);
                        alert("Upload concluído mas erro ao salvar. Tente novamente.");
                        setUploadingId(null);
                        e.target.value = '';
                    }
                }
            );

        } catch (error) {
            console.error("Erro ao iniciar upload:", error);
            alert(`Erro ao iniciar upload: ${error.message}`);
            setUploadingId(null);
            e.target.value = '';
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
                                onBlur={() => saveContent(content.id)}
                                placeholder="Título do bloco (opcional)"
                                className="w-full text-lg font-medium placeholder:text-slate-300 border-none focus:ring-0 p-0"
                            />

                            {content.type === 'text' && (
                                <textarea
                                    value={content.data}
                                    onChange={(e) => handleUpdateContent(content.id, 'data', e.target.value)}
                                    onBlur={() => saveContent(content.id)}
                                    rows={5}
                                    placeholder="Digite o conteúdo do texto aqui..."
                                    className="w-full p-4 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                                />
                            )}

                            {content.type === 'video' && (
                                <div className="space-y-4">
                                    {content.data && editingVideoId !== content.id ? (
                                        <div className="space-y-2">
                                            {/* Show video preview */}
                                            {(() => {
                                                const getYouTubeVideoId = (url) => {
                                                    if (!url) return null;
                                                    if (url.includes('/shorts/')) {
                                                        const parts = url.split('/shorts/');
                                                        return parts[1] ? parts[1].split('?')[0] : null;
                                                    }
                                                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&?]*).*/;
                                                    const match = url.match(regExp);
                                                    return (match && match[2].length === 11) ? match[2] : null;
                                                };

                                                const getVimeoVideoId = (url) => {
                                                    if (!url) return null;
                                                    const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
                                                    const match = url.match(regExp);
                                                    return match ? match[3] : null;
                                                };

                                                const getGoogleDriveVideoId = (url) => {
                                                    if (!url) return null;
                                                    const regExp = /drive\.google\.com\/file\/d\/([^\/]+)/;
                                                    const match = url.match(regExp);
                                                    return match ? match[1] : null;
                                                };

                                                let embedUrl = null;
                                                let useVideoTag = false;

                                                if (content.data.includes('youtube.com') || content.data.includes('youtu.be')) {
                                                    const videoId = getYouTubeVideoId(content.data);
                                                    if (videoId) embedUrl = `https://www.youtube.com/embed/${videoId}`;
                                                } else if (content.data.includes('vimeo.com')) {
                                                    const videoId = getVimeoVideoId(content.data);
                                                    if (videoId) embedUrl = `https://player.vimeo.com/video/${videoId}`;
                                                } else if (content.data.includes('drive.google.com')) {
                                                    const videoId = getGoogleDriveVideoId(content.data);
                                                    if (videoId) embedUrl = `https://drive.google.com/file/d/${videoId}/preview`;
                                                } else if (content.data.includes('firebasestorage.googleapis.com') ||
                                                    content.data.match(/\.(mp4|webm|ogg|mov)(\?|$)/i) ||
                                                    content.data.startsWith('http')) {
                                                    useVideoTag = true;
                                                }

                                                if (embedUrl) {
                                                    return (
                                                        <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                                                            <iframe
                                                                src={embedUrl}
                                                                className="w-full h-full"
                                                                allowFullScreen
                                                                title="Video Preview"
                                                            ></iframe>
                                                        </div>
                                                    );
                                                } else if (useVideoTag) {
                                                    return (
                                                        <video controls className="w-full rounded-lg bg-black">
                                                            <source src={content.data} />
                                                            Seu navegador não suporta vídeo.
                                                        </video>
                                                    );
                                                } else {
                                                    return (
                                                        <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                                                            <div className="text-center">
                                                                <Video size={32} className="mx-auto mb-2 opacity-50" />
                                                                <p className="text-sm">Pré-visualização indisponível</p>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                            })()}
                                            <button
                                                onClick={() => {
                                                    setEditingVideoId(content.id);
                                                }}
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Trocar Vídeo
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {/* URL Input */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Opção 1: Cole a URL do vídeo
                                                </label>
                                                <form
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        if (content.data) {
                                                            saveContent(content.id);
                                                            setEditingVideoId(null);
                                                        }
                                                    }}
                                                    className="flex gap-2"
                                                >
                                                    <input
                                                        type="text"
                                                        value={content.data}
                                                        onChange={(e) => handleUpdateContent(content.id, 'data', e.target.value)}
                                                        placeholder="YouTube, Vimeo, Google Drive ou link direto..."
                                                        className="flex-1 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                    />
                                                    <button
                                                        type="submit"
                                                        disabled={savingIds.has(content.id) || !content.data}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                                                    >
                                                        {savingIds.has(content.id) ? (
                                                            <Loader2 size={16} className="animate-spin" />
                                                        ) : (
                                                            <Save size={16} />
                                                        )}
                                                        {savingIds.has(content.id) ? "Salvando..." : "Salvar"}
                                                    </button>
                                                </form>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    Suporta: YouTube, Vimeo, Google Drive e links diretos de vídeo
                                                </p>
                                            </div>

                                            {/* Divider */}
                                            <div className="relative">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t border-slate-200"></div>
                                                </div>
                                                <div className="relative flex justify-center text-sm">
                                                    <span className="px-2 bg-white text-slate-500">OU</span>
                                                </div>
                                            </div>

                                            {/* File Upload */}
                                            <div>
                                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                                    Opção 2: Envie um arquivo de vídeo
                                                </label>
                                                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        {uploadingId === content.id ? (
                                                            <>
                                                                <Loader2 className="w-8 h-8 mb-3 text-primary animate-spin" />
                                                                <p className="text-sm text-slate-500">Enviando vídeo...</p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Upload className="w-8 h-8 mb-3 text-slate-400" />
                                                                <p className="text-sm text-slate-500"><span className="font-semibold">Clique para enviar</span> ou arraste o arquivo</p>
                                                                <p className="text-xs text-slate-500">MP4, WebM, MOV (Max 100MB)</p>
                                                            </>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="video/*"
                                                        onChange={(e) => handleFileUpload(e, content.id)}
                                                        disabled={uploadingId === content.id}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {content.type === 'audio' && (
                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                                    {content.data ? (
                                        <div className="space-y-3">
                                            <audio controls className="w-full h-10">
                                                <source src={content.data} />
                                                Seu navegador não suporta áudio.
                                            </audio>
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs text-slate-500">Áudio carregado com sucesso</p>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm("Tem certeza que deseja trocar o arquivo de áudio?")) {
                                                            // Clear the data to show upload interface again
                                                            handleUpdateContent(content.id, 'data', '');
                                                            // Save the change to Firestore
                                                            await updateDoc(doc(db, "books", bookId, "units", unitId, "lessons", lessonId, "contents", content.id), {
                                                                data: ''
                                                            });
                                                        }
                                                    }}
                                                    className="text-xs text-red-500 hover:text-red-700 hover:underline font-medium transition-colors"
                                                >
                                                    Trocar Arquivo
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-slate-50 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    {uploadingId === content.id ? (
                                                        <>
                                                            <Loader2 className="w-8 h-8 mb-3 text-blue-600 animate-spin" />
                                                            <p className="text-sm text-slate-600 font-medium">Enviando áudio...</p>
                                                            <p className="text-xs text-slate-500 mt-1">Por favor, aguarde</p>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-8 h-8 mb-3 text-slate-400" />
                                                            <p className="text-sm text-slate-600"><span className="font-semibold">Clique para enviar</span> ou arraste o arquivo</p>
                                                            <p className="text-xs text-slate-500 mt-1">MP3, WAV, OGG (Máx 10MB)</p>
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
