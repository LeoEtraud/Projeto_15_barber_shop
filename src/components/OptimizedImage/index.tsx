import { useState, useEffect, useRef } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallback?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  priority?: "high" | "low" | "auto";
  sizes?: string;
  loading?: "lazy" | "eager";
}

/**
 * Componente de imagem otimizado com:
 * - Lazy loading
 * - Placeholder/blur enquanto carrega
 * - Compressão automática via query params
 * - Fallback em caso de erro
 * - Prevenção de layout shift
 */
export function OptimizedImage({
  src,
  alt,
  className = "",
  width,
  height,
  fallback = "/barber-3.png",
  onError,
  priority = "auto",
  sizes,
  loading = "lazy",
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Função para otimizar URL da imagem
  // Por enquanto, não adiciona parâmetros de compressão pois a API pode não suportar
  // As otimizações são feitas via lazy loading, placeholder e dimensões fixas
  const optimizeImageUrl = (url: string): string => {
    // Retorna a URL original sem modificações
    // Se no futuro a API suportar parâmetros de compressão, pode adicionar aqui
    return url;
  };

  useEffect(() => {
    setImageSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  // Se houver onError customizado, usa o src diretamente da prop para não interferir
  const finalSrc = onError ? src : optimizeImageUrl(imageSrc);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setIsLoading(false);
    
    // Chama o handler de erro customizado primeiro (pode tentar caminhos alternativos)
    if (onError) {
      onError(e);
      // Não marca como erro ainda, deixa o onError tentar resolver
      // Se o onError mudar o src, o useEffect vai detectar e resetar o estado
    } else {
      // Se não houver handler customizado, tenta o fallback diretamente
      if (imageSrc !== fallback && fallback) {
        setImageSrc(fallback);
        setHasError(false);
        setIsLoading(true);
      } else {
        setHasError(true);
      }
    }
  };

  // Determina fetchpriority baseado na prop priority
  const fetchPriority = priority === "high" ? "high" : priority === "low" ? "low" : undefined;

  return (
    <div className="relative" style={{ width, height }}>
      {/* Placeholder enquanto carrega */}
      {isLoading && !hasError && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse"
          aria-hidden="true"
        />
      )}

      {/* Imagem otimizada */}
      <img
        ref={imgRef}
        alt={alt}
        src={finalSrc}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          objectFit: "cover",
        }}
      />

      {/* Indicador de erro */}
      {hasError && imageSrc === fallback && (
        <div
          className="absolute inset-0 bg-gray-800 flex items-center justify-center"
          aria-hidden="true"
        >
          <svg
            className="w-8 h-8 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

