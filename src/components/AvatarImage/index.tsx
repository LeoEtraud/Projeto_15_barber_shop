import { useMemo } from "react";

import { OptimizedImage } from "@/components/OptimizedImage";
import { getDefaultBarberImage } from "@/utils/defaultImages";

type Priority = "high" | "low" | "auto";
type Loading = "lazy" | "eager";

interface AvatarImageProps {
  avatar?: string | null;
  name: string;
  width: number;
  height: number;
  className?: string;
  containerClassName?: string;
  priority?: Priority;
  loading?: Loading;
}

function looksLikeBase64(value: string) {
  // Base64 "puro" (sem data:image)
  return value.length > 100 && /^[A-Za-z0-9+/=]+$/.test(value);
}

export function AvatarImage({
  avatar,
  name,
  width,
  height,
  className = "",
  containerClassName = "",
  priority = "low",
  loading = "lazy",
}: AvatarImageProps) {
  const fallbackSrc = useMemo(() => getDefaultBarberImage(name), [name]);

  const src = useMemo(() => {
    const raw = (avatar ?? "").trim();
    if (!raw) return fallbackSrc;

    // Já vem como data:image (Render/Vercel/DB)
    if (raw.startsWith("data:image")) return raw;

    // URLs completas (caso exista)
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;

    // Base64 sem prefixo
    if (looksLikeBase64(raw)) return `data:image/jpeg;base64,${raw}`;

    // Considera como filename armazenado (backend serve em /barbeiros/avatar/)
    const apiUrl = import.meta.env.VITE_API || "";
    if (!apiUrl) return fallbackSrc;

    return `${apiUrl}/barbeiros/avatar/${encodeURIComponent(raw)}`;
  }, [avatar, fallbackSrc]);

  return (
    <OptimizedImage
      src={src}
      alt={`Avatar de ${name}`}
      width={width}
      height={height}
      containerClassName={containerClassName}
      className={className}
      fallback={fallbackSrc}
      priority={priority}
      loading={loading}
      sizes={`${width}px`}
    />
  );
}

