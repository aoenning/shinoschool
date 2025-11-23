export default function Logo({ className = "", variant = "default" }) {
    const logoSrc = "/shino-logo.png";

    if (variant === "pill") {
        return (
            <div className={`bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-sm border border-white/50 inline-flex ${className}`}>
                <img
                    src={logoSrc}
                    alt="Shino School Logo"
                    className="h-full w-auto object-contain"
                />
            </div>
        );
    }

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <img
                src={logoSrc}
                alt="Shino School Logo"
                className="h-full w-auto object-contain"
            />
        </div>
    );
}
