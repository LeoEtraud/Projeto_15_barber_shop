import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, useRef } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { addToast } from "@heroui/react";

import { Header } from "@/components/Header";
import { OptimizedImage } from "@/components/OptimizedImage";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";
import { useLoading } from "@/contexts/LoadingProvider";
import { formatPrice } from "@/utils/format-price";
import { getServiceImageWithFallback, getDefaultServiceImage } from "@/utils/defaultImages";

// ---- helpers de ordenação ----
const KEY_ORDER = [
  "corte de cabelo",
  "barba",
  "pe de cabelo",
  "limpeza de pele",
];

const normalize = (s: string) =>
  (s ?? "")
    .normalize("NFD")
    // remove acentos
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const rankByName = (nome: string) => {
  const n = normalize(nome);
  const idx = KEY_ORDER.findIndex((k) => n.includes(k));

  // não encontrados vão para o fim
  return idx === -1 ? KEY_ORDER.length + 1 : idx;
};

// Função para obter a imagem do serviço baseado no nome
const getServiceImage = (serviceName: string, serviceImage?: string) => {
  const apiUrl = import.meta.env.VITE_API;

  // Se o serviço já tem uma imagem específica da API válida, usa ela
  // O backend salva como "/servicos/imagem/{fileName}" e serve em "/servicos/imagem/"
  if (serviceImage && serviceImage.trim() !== "" && apiUrl) {
    // Se já é uma URL completa, usa diretamente
    if (serviceImage.startsWith("http")) {
      return serviceImage;
    }
    
    // Se começa com "/servicos/imagem/", adiciona apenas a API
    if (serviceImage.startsWith("/servicos/imagem/")) {
      return `${apiUrl}${serviceImage}`;
    }
    
    // Se é apenas o nome do arquivo, constrói o caminho completo
    const imageName = serviceImage.replace("/servicos/imagem/", "");
    return `${apiUrl}/servicos/imagem/${encodeURIComponent(imageName)}`;
  }

  // Se não houver imagem, usa a função utilitária para obter imagem padrão
  return getServiceImageWithFallback(serviceImage, serviceName);
};

export function ChoiceServicePage() {
  const navigate = useNavigate();
  const { fetchServices, services } = useSchedule();
  const { show, hide } = useLoading();
  const location = useLocation() as {
    state?: { barber?: { id: string; nome: string } };
  };
  const barber = location.state?.barber;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const loadedImagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    fetchServices();
  }, []);

  // Ordena no front conforme prioridade desejada
  const sortedServices = useMemo(() => {
    const list = Array.isArray(services) ? [...services] : [];

    return list.sort((a, b) => {
      const ra = rankByName(a.nome);
      const rb = rankByName(b.nome);

      if (ra !== rb) return ra - rb;

      // desempate estável: por nome (sem acento/caixa)
      return normalize(a.nome).localeCompare(normalize(b.nome), "pt-BR", {
        sensitivity: "base",
      });
    });
  }, [services]);

  // Mostra o loading quando os serviços são carregados
  useEffect(() => {
    if (sortedServices.length > 0) {
      // Reset do rastreamento quando os serviços mudam
      loadedImagesRef.current.clear();
      show();
    }
  }, [sortedServices.length, show]);

  // FUNÇÃO DE ESCOLHA DE SERVIÇOS
  function toggleService(id: string, nome: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);

      const nomeNormalizado = normalize(nome);

      const isCorte = nomeNormalizado.includes("corte de cabelo");
      const isPe = nomeNormalizado.includes("pe de cabelo");

      // Se já estava selecionado → remove
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Limitar seleção a no máximo 2 serviços
        if (next.size >= 2) {
          addToast({
            title: "Limite de serviços",
            description: "Você pode selecionar no máximo 2 serviços.",
            color: "warning",
            timeout: 3000,
          });

          return prev; // Não faz alteração
        }

        // Se for Corte, remove Pé antes de adicionar
        if (isCorte) {
          services.forEach((s) => {
            if (normalize(s.nome).includes("pe de cabelo")) {
              next.delete(s.id);
            }
          });
        }

        // Se for Pé, remove Corte antes de adicionar
        if (isPe) {
          services.forEach((s) => {
            if (normalize(s.nome).includes("corte de cabelo")) {
              next.delete(s.id);
            }
          });
        }

        next.add(id);
      }

      return next;
    });
  }

  const selectedServices = sortedServices.filter((s) => selectedIds.has(s.id));

  function handleProceed() {
    navigate("/choice-schedule", {
      state: {
        barber,
        selectedServices, // array de serviços
      },
    });
  }

  return (
    <section className="min-h-screen bg-gray-800">
      <Header />

      <div className="p-4 md:px-8">
        <Helmet title="Selecionar serviço" />

        <div className="mx-auto max-w-2xl">
          <button
            className="text-sm bg-gray-800 hover:bg-gray-900 mb-4 
             w-8 h-8 flex items-center justify-center 
             border border-gray-400 rounded-full"
            type="button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="w-6 h-6 text-yellow-400" />
          </button>

          {/* Banner */}
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 h-40 mb-6">
            <img
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-100"
              src="/image-1.png"
            />
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Selecione o(s) serviço(s)
              </h1>
            </div>
          </div>

          {/* Lista de serviços (multi-seleção) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {sortedServices.map((service) => {
              const isSelected = selectedIds.has(service.id);
              const isDisabled = !isSelected && selectedIds.size >= 2;

              return (
                <button
                  key={service.id}
                  aria-pressed={isSelected}
                  className={[
                    "group rounded-lg shadow-lg transition-all border overflow-hidden flex",
                    isSelected
                      ? "border-green-400 hover:border-green-300 bg-gray-800 ring-2 ring-green-400/50"
                      : isDisabled
                        ? "border-gray-700 opacity-60 cursor-not-allowed bg-gray-900/50"
                        : "border-transparent hover:border-gray-600 hover:shadow-xl bg-gray-900",
                  ].join(" ")}
                  disabled={isDisabled}
                  title={
                    isDisabled
                      ? "Você pode selecionar no máximo 2 serviços"
                      : ""
                  }
                  type="button"
                  onClick={() => toggleService(service.id, service.nome)}
                >
                  {/* Conteúdo do lado esquerdo */}
                  <div className="flex-1 p-2.5 flex flex-col justify-between min-h-0">
                    <div className="min-w-0">
                      <div className="mb-1 text-left">
                        <div className="text-white font-semibold text-sm leading-tight line-clamp-2 text-left">
                          {service.nome}
                        </div>
                      </div>

                      <div className="flex justify-between items-center gap-1.5 mb-1">
                        <span className="text-green-300 font-bold text-sm">
                          {formatPrice(Number(service.preco))}
                        </span>
                        <span className="text-green-200 text-[10px] font-medium bg-gray-800/50 px-1 py-0.5 rounded whitespace-nowrap">
                          {service.duracao} min
                        </span>
                      </div>

                      {isSelected && (
                        <div className="mb-1">
                          <span className="text-[9px] px-1 py-0.5 rounded-full bg-green-600 text-white border border-green-300/50 shadow-lg inline-block">
                            Selecionado
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-[9px] text-gray-400 mt-auto">
                      Toque para {isSelected ? "remover" : "selecionar"}
                    </div>
                  </div>

                  {/* Imagem do lado direito */}
                  <div className="w-24 h-24 relative overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-700 to-gray-800 rounded-r-lg">
                    <OptimizedImage
                      alt={service.nome}
                      className={`w-full h-full object-cover transition-transform duration-300 ${
                        isSelected ? "scale-105" : "group-hover:scale-105"
                      }`}
                      fallback="/barber-3.png"
                      height={96}
                      loading="lazy"
                      priority="low"
                      sizes="96px"
                      src={getServiceImage(service.nome, service.imagem)}
                      width={96}
                      onError={(e) => {
                        // Se a imagem falhar ao carregar, usa a imagem padrão
                        const target = e.currentTarget as HTMLImageElement;
                        const currentSrc = target.src;
                        const apiUrl = import.meta.env.VITE_API || "";
                        const nomeNormalizado = (service.nome ?? "")
                          .normalize("NFD")
                          .replace(/\p{Diacritic}/gu, "")
                          .toLowerCase();
                        
                        target.src = getServiceImageWithFallback(null, service.nome);
                        
                        const imageName = getDefaultServiceImage(service.nome);
                        if (imageName && apiUrl) {
                          // Extrai o nome do arquivo do caminho completo se necessário
                          let fileName = imageName;
                          if (imageName.startsWith("/servicos/imagem/")) {
                            fileName = imageName.replace("/servicos/imagem/", "");
                          }
                          
                          // Tenta diferentes caminhos possíveis (priorizando o caminho correto)
                          const alternativePaths = [
                            `${apiUrl}/servicos/imagem/${encodeURIComponent(fileName)}`,
                            `${apiUrl}${imageName.startsWith("/") ? imageName : `/servicos/imagem/${imageName}`}`,
                            `${apiUrl}/public/servicos/${encodeURIComponent(fileName)}`,
                            `${apiUrl}/servicos/${encodeURIComponent(fileName)}`,
                          ];

                          // Verifica qual caminho já foi tentado
                          const currentPathIndex = alternativePaths.findIndex(
                            (path) =>
                              currentSrc.includes(path.replace(apiUrl, "")) ||
                              currentSrc === path,
                          );

                          // Tenta o próximo caminho disponível
                          if (currentPathIndex < alternativePaths.length - 1) {
                            const nextPath =
                              alternativePaths[currentPathIndex + 1];

                            // eslint-disable-next-line no-console
                            console.log(
                              "Tentando caminho alternativo:",
                              nextPath,
                            );
                            target.src = nextPath;

                            return;
                          }
                        }

                        // Se for pé de cabelo e a primeira imagem falhou, tenta a alternativa
                        if (
                          (nomeNormalizado.includes("pe de cabelo") ||
                            nomeNormalizado.includes("pe-cabelo")) &&
                          apiUrl &&
                          (currentSrc.includes("pe-de-cabelo.jpg") ||
                            currentSrc.includes("pe-de-cabelo"))
                        ) {
                          const alternativeUrls = [
                            `${apiUrl}/public/servicos/pe-cabelo.png`,
                            `${apiUrl}/public/servicos/pe-de-cabelo.jpg`,
                            `${apiUrl}/servicos/pe-cabelo.png`,
                          ];

                          // Tenta a primeira alternativa
                          const alternativeUrl = alternativeUrls[0];

                          // eslint-disable-next-line no-console
                          console.log(
                            "Tentando imagem alternativa:",
                            alternativeUrl,
                          );
                          target.src = alternativeUrl;

                          return;
                        }

                        // Se for limpeza de pele e a primeira imagem falhou, tenta alternativas
                        if (
                          (nomeNormalizado.includes("limpeza de pele") ||
                            nomeNormalizado.includes("limpeza-de-pele")) &&
                          apiUrl &&
                          (currentSrc.includes("limpeza-de-pele") ||
                            currentSrc.includes("limpeza-pele"))
                        ) {
                          const alternativeUrls = [
                            `${apiUrl}/public/servicos/limpeza-de-pele.jpg`,
                            `${apiUrl}/servicos/limpeza-de-pele.jpg`,
                            `${apiUrl}/servicos/imagem/limpeza-de-pele.jpg`,
                          ];

                          // Tenta a primeira alternativa
                          const alternativeUrl = alternativeUrls[0];

                          // eslint-disable-next-line no-console
                          console.log(
                            "Tentando imagem alternativa para limpeza de pele:",
                            alternativeUrl,
                          );
                          target.src = alternativeUrl;

                          return;
                        }

                        // Fallback para uma imagem padrão local se não carregar
                        // eslint-disable-next-line no-console
                        console.log("Usando imagem padrão local");
                        target.src = "/barber-3.png";
                      }}
                      onLoad={() => {
                        // Marca esta imagem como carregada
                        if (!loadedImagesRef.current.has(service.id)) {
                          loadedImagesRef.current.add(service.id);
                          // Verifica se todas as imagens foram carregadas
                          if (
                            loadedImagesRef.current.size ===
                            sortedServices.length
                          ) {
                            hide();
                          }
                        }
                      }}
                    />
                    {/* Overlay gradiente para melhorar legibilidade */}
                    <div
                      className={`absolute inset-0 transition-opacity duration-300 ${
                        isSelected
                          ? "bg-green-500/20"
                          : "bg-black/10 hover:bg-black/20"
                      }`}
                    />
                    {/* Indicador visual quando selecionado */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M5 13l4 4L19 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Botão de prosseguir */}
          {selectedServices.length > 0 && (
            <div className="mt-6">
              <button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                type="button"
                onClick={handleProceed}
              >
                Prosseguir no agendamento
              </button>
              <p className="text-xs text-gray-300 mt-2">
                {selectedServices.length} de 2 serviço(s) selecionado(s).
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
