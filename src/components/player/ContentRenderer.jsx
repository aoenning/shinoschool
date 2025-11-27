import { Type, Video, Music, ExternalLink, FileText } from "lucide-react";

export default function ContentRenderer({ content }) {
    const ContentWrapper = ({ children, title, icon: Icon, colorClass, bgClass }) => (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
            <div className="px-4 py-3 md:px-6 md:py-4 border-b border-slate-50 flex items-center gap-3 bg-slate-50/30">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgClass} ${colorClass}`}>
                    <Icon size={18} />
                </div>
                <h3 className="font-bold text-slate-800 text-base md:text-lg">{title}</h3>
            </div>
            <div className="p-4 md:p-6">
                {children}
            </div>
        </div>
    );

    if (content.type === 'text') {
        return (
            <ContentWrapper
                title={content.title || "Texto de Apoio"}
                icon={FileText}
                colorClass="text-blue-600"
                bgClass="bg-blue-50"
            >
                <div className="prose max-w-none text-slate-600 text-base leading-7 whitespace-pre-wrap font-sans">
                    {content.data}
                </div>
            </ContentWrapper>
        );
    }

    if (content.type === 'video') {
        // Helper function to get YouTube video ID
        const getYouTubeVideoId = (url) => {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = url.match(regExp);
            return (match && match[2].length === 11) ? match[2] : null;
        };

        // Helper function to get Vimeo video ID
        const getVimeoVideoId = (url) => {
            const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
            const match = url.match(regExp);
            return match ? match[3] : null;
        };

        // Determine video source type and get embed URL
        let embedUrl = null;
        let useVideoTag = false;

        if (content.data) {
            // Check for YouTube
            if (content.data.includes('youtube.com') || content.data.includes('youtu.be')) {
                const videoId = getYouTubeVideoId(content.data);
                if (videoId) {
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                }
            }
            // Check for Vimeo
            else if (content.data.includes('vimeo.com')) {
                const videoId = getVimeoVideoId(content.data);
                if (videoId) {
                    embedUrl = `https://player.vimeo.com/video/${videoId}`;
                }
            }
            // Check for Firebase Storage or other direct video URLs
            else if (content.data.includes('firebasestorage.googleapis.com') ||
                content.data.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) {
                useVideoTag = true;
            }
            // Fallback for other URLs
            else if (content.data.startsWith('http')) {
                useVideoTag = true;
            }
        }

        return (
            <ContentWrapper
                title={content.title || "Vídeo Aula"}
                icon={Video}
                colorClass="text-red-600"
                bgClass="bg-red-50"
            >
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                    {embedUrl ? (
                        <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            title={content.title || "Vídeo"}
                        />
                    ) : useVideoTag && content.data ? (
                        <video
                            controls
                            className="w-full h-full"
                            controlsList="nodownload"
                        >
                            <source src={content.data} type="video/mp4" />
                            <source src={content.data} type="video/webm" />
                            <source src={content.data} type="video/ogg" />
                            Seu navegador não suporta a reprodução de vídeo.
                        </video>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-white gap-3">
                            <Video size={48} className="text-slate-400" />
                            <p className="text-slate-400 text-sm">
                                {content.data ? 'URL de vídeo inválida' : 'Nenhum vídeo configurado'}
                            </p>
                        </div>
                    )}
                </div>
            </ContentWrapper>
        );
    }

    if (content.type === 'audio') {
        return (
            <ContentWrapper
                title={content.title || "Áudio da Lição"}
                icon={Music}
                colorClass="text-amber-600"
                bgClass="bg-amber-50"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 flex-shrink-0">
                        <Music size={24} />
                    </div>
                    <div className="flex-1">
                        <audio controls className="w-full h-10">
                            <source src={content.data} />
                            Seu navegador não suporta áudio.
                        </audio>
                    </div>
                </div>
            </ContentWrapper>
        );
    }

    return null;
}
