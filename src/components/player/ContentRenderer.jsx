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
        const isUrl = content.data.startsWith('http');
        return (
            <ContentWrapper
                title={content.title || "Vídeo Aula"}
                icon={Video}
                colorClass="text-red-600"
                bgClass="bg-red-50"
            >
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                    {isUrl ? (
                        <iframe
                            src={content.data.replace('watch?v=', 'embed/')}
                            className="w-full h-full"
                            allowFullScreen
                            title={content.title}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-white">
                            Video Placeholder
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
