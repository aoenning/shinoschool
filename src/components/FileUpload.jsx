import { useState, useEffect } from "react";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Upload, X, FileIcon, Loader2 } from "lucide-react";

export default function FileUpload({
    accept = "image/*,audio/*,video/*",
    maxSize = 5, // MB
    onUpload,
    storagePath = "uploads",
    currentFile = null,
    label = "Upload File",
    preview = true
}) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(currentFile);
    const [error, setError] = useState("");

    // Sync previewUrl with currentFile prop
    useEffect(() => {
        setPreviewUrl(currentFile);
    }, [currentFile]);

    const validateFile = (file) => {
        console.log("Validating file:", {
            name: file.name,
            type: file.type,
            size: file.size,
            sizeMB: (file.size / (1024 * 1024)).toFixed(2)
        });

        // Check file size
        const sizeMB = file.size / (1024 * 1024);
        if (sizeMB > maxSize) {
            setError(`Arquivo muito grande. Tamanho máximo: ${maxSize}MB`);
            console.error("File too large:", sizeMB, "MB");
            return false;
        }

        // Check file type
        if (accept !== "*") {
            const acceptTypes = accept.split(",").map(t => t.trim());
            const fileType = file.type;
            const fileExt = `.${file.name.split(".").pop()}`;

            console.log("Type validation:", {
                acceptTypes,
                fileType,
                fileExt
            });

            const isValid = acceptTypes.some(type => {
                if (type.includes("*")) {
                    return fileType.startsWith(type.replace("*", ""));
                }
                return type === fileType || type === fileExt;
            });

            if (!isValid) {
                setError(`Tipo de arquivo não permitido. Aceito: ${accept}`);
                console.error("Invalid file type");
                return false;
            }
        }

        console.log("File validation passed");
        setError("");
        return true;
    };

    const handleUpload = async (file) => {
        if (!validateFile(file)) return;

        setUploading(true);
        console.log("Starting upload for file:", file.name);
        try {
            // Create unique filename
            const timestamp = Date.now();
            const filename = `${timestamp}_${file.name}`;
            const storageRef = ref(storage, `${storagePath}/${filename}`);

            // Upload file with timeout
            console.log("Uploading to:", storageRef.fullPath);
            console.log("File object:", file);
            console.log("Storage ref fullPath:", storageRef.fullPath);

            const uploadPromise = uploadBytes(storageRef, file, { contentType: file.type });
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Upload timed out after 30 seconds")), 30000)
            );

            await Promise.race([uploadPromise, timeoutPromise]);
            console.log("Upload successful");

            // Get download URL
            const url = await getDownloadURL(storageRef);
            console.log("Download URL:", url);

            // Set preview for images
            if (file.type.startsWith("image/") && preview) {
                setPreviewUrl(url);
            }

            // Call parent callback
            onUpload(url);
            setError("");
        } catch (err) {
            console.error("Upload error:", err);
            setError(`Erro ao fazer upload: ${err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleUpload(e.target.files[0]);
        }
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        onUpload(null);
    };

    const isImage = accept.includes("image");

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
                {label}
            </label>

            {previewUrl && isImage && preview ? (
                <div className="relative inline-block">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full max-w-xs h-48 object-cover rounded-lg border-2 border-slate-200"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : previewUrl && !isImage ? (
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <FileIcon size={24} className="text-slate-400" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-slate-700">Arquivo anexado</p>
                        <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                        >
                            Ver arquivo
                        </a>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>
            ) : (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-300 hover:border-slate-400"
                        } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                >
                    <input
                        type="file"
                        accept={accept}
                        onChange={handleChange}
                        disabled={uploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />

                    {uploading ? (
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 size={40} className="text-blue-500 animate-spin" />
                            <p className="text-sm text-slate-600">Fazendo upload...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                <Upload size={24} className="text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-700">
                                    Clique para fazer upload ou arraste o arquivo
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Tamanho máximo: {maxSize}MB
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                    <X size={14} />
                    {error}
                </p>
            )}
        </div>
    );
}
