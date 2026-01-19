/**
 * Funções utilitárias para obter imagens padrão de serviços e barbeiros
 * Usa imagens minimalistas/ilustrativas (não fotos reais)
 */

/**
 * Retorna a imagem padrão para os serviços a partir da pasta public/servicos do backend
 * Mapeia pelo nome do serviço (normalizado)
 * Retorna string vazia se o serviço não corresponder a nenhum tipo específico
 */
export const getDefaultServiceImage = (serviceName: string): string | null => {
  const apiUrl = import.meta.env.VITE_API || "";
  const normalized = (serviceName ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  let imageName: string | null = null;

  // Apenas os tipos específicos têm imagens padrão
  if (normalized.includes("barba")) {
    imageName = "barba.jpg";
  } else if (
    normalized.includes("limpeza de pele") ||
    normalized.includes("limpeza-pele") ||
    normalized.includes("limpeza pele")
  ) {
    imageName = "limpeza-pele.jpg";
  } else if (
    normalized.includes("pe de cabelo") ||
    normalized.includes("pe cabelo") ||
    normalized.includes("pé de cabelo") ||
    normalized.includes("pé cabelo")
  ) {
    imageName = "pe-cabelo.png";
  } else if (normalized.includes("cabelo") || normalized.includes("corte")) {
    imageName = "cabelo.jpg";
  }

  // Se não corresponder a nenhum tipo específico, retorna null (sem imagem padrão)
  if (!imageName) {
    return null;
  }

  // O backend serve as imagens padrão em /servicos/imagem/ (mesma rota que as imagens customizadas)
  // As imagens padrão estão em public/servicos/ e são servidas pela mesma rota estática
  if (apiUrl) {
    return `${apiUrl}/servicos/imagem/${imageName}`;
  }

  // Fallback para desenvolvimento local se não houver API configurada
  return `/servicos/imagem/${imageName}`;
};

/**
 * Retorna a imagem padrão para todos os barbeiros
 * Uma única imagem padrão ilustrativa para todos os barbeiros
 */
export const getDefaultBarberImage = (_barberName?: string): string => {
  // Imagem padrão única ilustrativa para todos os barbeiros
  // A imagem está na pasta public/barbeiros/avatar do backend
  const apiUrl = import.meta.env.VITE_API || "";
  if (apiUrl) {
    return `${apiUrl}/barbeiros/avatar/barber.png`;
  }
  // Fallback para desenvolvimento local se não houver API configurada
  return "/barbeiros/avatar/barber.png";
};

/**
 * Verifica se uma URL de imagem é válida e retorna a imagem padrão em caso de erro
 * Retorna string vazia se não houver imagem padrão para o tipo de serviço
 */
export const getServiceImageWithFallback = (
  serviceImage: string | null | undefined,
  serviceName: string
): string | null => {
  // Se houver imagem definida, retorna ela
  if (serviceImage && serviceImage.trim() !== "") {
    return serviceImage;
  }

  // Caso contrário, retorna a imagem padrão baseada no nome (pode ser null)
  return getDefaultServiceImage(serviceName);
};

/**
 * Verifica se uma URL de imagem de barbeiro é válida e retorna a imagem padrão em caso de erro
 */
export const getBarberImageWithFallback = (
  barberImage: string | null | undefined,
  barberName?: string
): string => {
  // Se não houver imagem ou estiver vazia, retorna a imagem padrão
  if (!barberImage || barberImage.trim() === "") {
    return getDefaultBarberImage(barberName);
  }

  // Se for base64, retorna diretamente
  if (barberImage.startsWith("data:image")) {
    return barberImage;
  }

  // Se for uma URL válida, retorna ela
  return barberImage;
};

