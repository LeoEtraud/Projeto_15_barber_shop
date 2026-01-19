import { Helmet } from "react-helmet-async";
import { useEffect, useState, useMemo } from "react";
import {
  Button,
  Card,
  CardBody,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  addToast,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { PencilIcon, TrashIcon, PlusIcon } from "@heroicons/react/24/outline";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";
import { Resolver } from "react-hook-form";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";
import {
  CreateService,
  UpdateService,
  DeleteService,
} from "@/contexts/ScheduleProvider/util";
import { formatPrice } from "@/utils/format-price";
import { IServices } from "@/contexts/ScheduleProvider/types";
import { getServiceImageWithFallback } from "@/utils/defaultImages";

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
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

const rankByName = (nome: string) => {
  const n = normalize(nome);
  const idx = KEY_ORDER.findIndex((k) => n.includes(k));

  // não encontrados vão para o fim
  return idx === -1 ? KEY_ORDER.length + 1 : idx;
};

interface ServiceFormData {
  nome: string;
  preco: string;
  duracao: number;
}

const schema = yup.object().shape({
  nome: yup
    .string()
    .min(2, "Nome deve ter no mínimo 2 caracteres")
    .required("Nome é obrigatório"),
  preco: yup.string().required("Preço é obrigatório"),
  duracao: yup
    .number()
    .min(1, "Duração deve ser no mínimo 1 minuto")
    .required("Duração é obrigatória"),
});

/**
 * Página de Gerenciamento de Serviços - Apenas para Gestores
 *
 * Funcionalidades:
 * - Listar serviços
 * - Adicionar novo serviço
 * - Editar serviço
 * - Excluir serviço
 * - Ativar/Desativar serviço
 */
export function GestorServicosPage() {
  const navigate = useNavigate();
  const { isGestor } = usePermissions();
  const { services, fetchServices } = useSchedule();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [selectedService, setSelectedService] = useState<IServices | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState<boolean>(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ServiceFormData>({
    resolver: yupResolver(schema) as unknown as Resolver<ServiceFormData>,
    defaultValues: {
      nome: "",
      preco: "",
      duracao: 30,
    },
  });

  useEffect(() => {
    if (isGestor) {
      fetchServices();
    }
  }, [isGestor]);

  // Ordena os serviços conforme prioridade desejada
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

  const handleOpenModal = (service?: IServices) => {
    if (service) {
      setSelectedService(service);
      reset({
        nome: service.nome || "",
        preco: service.preco || "",
        duracao: service.duracao || 30,
      });
      // Define preview da imagem existente se houver
      if (service.imagem && service.imagem.trim() !== "") {
        const apiUrl = import.meta.env.VITE_API || "";

        // Se a imagem já é uma URL completa, usa diretamente
        if (service.imagem.startsWith("http")) {
          setImagePreview(service.imagem);
        } else if (service.imagem.startsWith("/servicos/imagem/")) {
          // Se já tem o caminho completo relativo, adiciona apenas a API
          setImagePreview(`${apiUrl}${service.imagem}`);
        } else {
          // Se é apenas o nome do arquivo, constrói o caminho completo
          // Tenta diferentes caminhos possíveis (mesmo padrão da página do cliente)
          const imageName = service.imagem.replace("/servicos/imagem/", "");
          const possiblePaths = [
            `${apiUrl}/servicos/imagem/${encodeURIComponent(imageName)}`,
            `${apiUrl}/public/servicos/${encodeURIComponent(imageName)}`,
            `${apiUrl}${service.imagem}`,
          ];
          setImagePreview(possiblePaths[0]); // Usa o primeiro caminho (padrão do backend)
        }
      } else {
        // Se não houver imagem, não define preview (será mostrada a padrão no modal)
        setImagePreview(null);
        setImageRemoved(false); // Não foi removida, apenas não existe
      }
      setImageFile(null);
      setImageRemoved(false);
    } else {
      // Modo de criação - limpa tudo
      setSelectedService(null);
      reset({
        nome: "",
        preco: "",
        duracao: 30,
      });
      setImagePreview(null);
      setImageFile(null);
      setImageRemoved(false);
    }
    onOpen();
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    setImagePreview(null);
    setImageFile(null);
    setImageRemoved(false);
    reset();
    onClose();
  };

  // FUNÇÃO PARA CONVERTER ARQUIVO EM BASE64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Erro ao converter arquivo"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Erro ao ler arquivo"));
      };

      reader.readAsDataURL(file);
    });
  };

  // FUNÇÃO PARA HANDLEAR O UPLOAD DE IMAGEM
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // Valida tipo de arquivo
    if (!file.type.startsWith("image/")) {
      addToast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        color: "danger",
        timeout: 3000,
      });

      return;
    }

    // Valida tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        color: "danger",
        timeout: 3000,
      });

      return;
    }

    try {
      // Cria preview
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
          setImageRemoved(false); // Reset do flag quando nova imagem é selecionada
        }
      };

      reader.readAsDataURL(file);
      setImageFile(file);
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      addToast({
        title: "Erro",
        description: "Erro ao processar a imagem. Tente novamente.",
        color: "danger",
        timeout: 3000,
      });
    }
  };

  const onSubmit = async (data: ServiceFormData) => {
    try {
      setIsSubmitting(true);

      // Remove caracteres não numéricos do preço, exceto vírgula e ponto
      const precoClean = data.preco.replace(/[^\d,.]/g, "").replace(",", ".");

      // Converte imagem para base64 se houver arquivo selecionado
      // Se a imagem foi removida intencionalmente, envia null para remover
      // Se não houver nova imagem e não foi removida, não envia o campo (mantém a existente)
      let imagemBase64: string | null | undefined = undefined;

      if (imageFile) {
        // Nova imagem selecionada
        imagemBase64 = await convertFileToBase64(imageFile);
        setImageRemoved(false); // Reset do flag de remoção
      } else if (imageRemoved) {
        // Imagem foi removida intencionalmente pelo usuário
        imagemBase64 = null;
      }
      // Se imageFile for null e imageRemoved for false, não envia nada (mantém a existente)

      if (selectedService) {
        // Editar serviço
        const updateData: {
          nome: string;
          preco: string;
          duracao: number;
          imagem?: string | null;
        } = {
          nome: data.nome.trim(),
          preco: precoClean,
          duracao: data.duracao,
        };

        // Adiciona imagem se houver nova imagem ou se foi removida (null)
        if (imagemBase64 !== undefined) {
          updateData.imagem = imagemBase64 ?? null;
        }

        await UpdateService(selectedService.id, updateData);

        addToast({
          title: "Sucesso",
          description: "Serviço atualizado com sucesso!",
          color: "success",
          timeout: 3000,
        });
      } else {
        // Criar serviço
        await CreateService({
          nome: data.nome.trim(),
          preco: precoClean,
          duracao: data.duracao,
          imagem: imagemBase64 ?? undefined,
        });

        addToast({
          title: "Sucesso",
          description: "Serviço cadastrado com sucesso!",
          color: "success",
          timeout: 3000,
        });
      }

      await fetchServices();
      handleCloseModal();
    } catch (error: any) {
      console.error("Erro ao salvar serviço:", error);
      
      // Verifica se é erro de autenticação
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        const errorMessage = error?.response?.data?.error || "Erro de autenticação";
        addToast({
          title: "Erro de Autenticação",
          description: errorMessage,
          color: "danger",
          timeout: 5000,
        });
      } else {
        addToast({
          title: "Erro",
          description: selectedService
            ? "Falha ao atualizar serviço. Tente novamente."
            : "Falha ao cadastrar serviço. Tente novamente.",
          color: "danger",
          timeout: 5000,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedService) return;

    try {
      setIsSubmitting(true);
      await DeleteService(selectedService.id);

      addToast({
        title: "Sucesso",
        description: "Serviço excluído com sucesso!",
        color: "success",
        timeout: 3000,
      });

      await fetchServices();
      onDeleteClose();
      setSelectedService(null);
    } catch (error) {
      console.error("Erro ao excluir serviço:", error);
      addToast({
        title: "Erro",
        description: "Falha ao excluir serviço. Tente novamente.",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isGestor) {
    return (
      <section className="min-h-screen bg-gray-800 flex flex-col text-white items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
        <p className="text-gray-400">
          Apenas gestores podem acessar esta página.
        </p>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-800 flex flex-col text-white">
      <Header />

      <div className="px-4 py-8 md:px-8 flex-1">
        <Helmet title="Gerenciar Serviços - Gestor" />

        <div className="mx-auto max-w-6xl">
          {/* Botão Voltar */}
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
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-lg mb-6 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0">
              <img
                alt="Serviços"
                className="w-full h-full object-cover object-right-center opacity-15"
                src="/image-1.png"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-rose-500/90" />
            </div>

            <div className="relative z-10 p-4 md:p-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-medium text-white mb-1">
                    Gerenciar Serviços
                  </h1>
                  <p className="text-white/80 text-xs md:text-sm font-light">
                    Gerencie os serviços oferecidos pela sua barbearia
                  </p>
                </div>
                <PermissionGate requiredPermissions={["manage_services"]}>
                  <Button
                    className="bg-white text-orange-600 font-normal hover:bg-gray-50 shadow-sm hover:shadow transition-all duration-200 whitespace-nowrap"
                    color="primary"
                    size="sm"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={() => handleOpenModal()}
                  >
                    Adicionar Serviço
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </div>

          {/* Lista de Serviços */}
          {sortedServices && sortedServices.length > 0 ? (
            <>
              {/* Título da Categoria */}
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">Serviços</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {sortedServices.length}{" "}
                  {sortedServices.length === 1
                    ? "serviço encontrado"
                    : "serviços encontrados"}
                </p>
              </div>

              {/* Grid de Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedServices.map((service) => {
                  const precoNum = parseFloat(
                    service.preco?.replace(",", ".") || "0"
                  );
                  const defaultImage = getServiceImageWithFallback(
                    null,
                    service.nome
                  );
                  const serviceImageSrc =
                    service.imagem && service.imagem.trim() !== ""
                      ? service.imagem.startsWith("http")
                        ? service.imagem
                        : (() => {
                            const apiUrl = import.meta.env.VITE_API || "";
                            const imageName = service.imagem.replace(
                              "/servicos/imagem/",
                              ""
                            );
                            // Usa o mesmo padrão da página do cliente
                            return `${apiUrl}/servicos/imagem/${encodeURIComponent(imageName)}`;
                          })()
                      : defaultImage || undefined;

                  return (
                    <Card
                      key={service.id}
                      className="bg-gray-900 border border-gray-700 hover:border-orange-500 transition-all duration-300 shadow-md hover:shadow-lg relative"
                    >
                      <CardBody className="p-3">
                        <div className="flex items-start gap-3 mb-3">
                          {/* Imagem do Serviço */}
                          {serviceImageSrc ? (
                            <img
                              alt={service.nome}
                              className="w-16 h-16 rounded-lg object-cover border-2 border-gray-700 flex-shrink-0"
                              src={serviceImageSrc}
                              onError={(e) => {
                                // Se a imagem falhar ao carregar, esconde a imagem
                                const target = e.currentTarget;
                                if (target.dataset.fallbackApplied === "true") return;
                                target.dataset.fallbackApplied = "true";
                                // Se houver imagem padrão, tenta usar ela
                                if (defaultImage) {
                                  target.src = defaultImage;
                                } else {
                                  // Se não houver imagem padrão, esconde a imagem
                                  target.style.display = "none";
                                }
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-600 bg-gray-800 flex items-center justify-center flex-shrink-0">
                              <svg
                                className="w-8 h-8 text-gray-500"
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

                          <div className="flex-1 min-w-0">
                            <h3 className="text-base font-semibold text-white mb-1.5 truncate">
                              {service.nome}
                            </h3>
                            <div className="flex items-center gap-3 text-xs">
                              <div>
                                <span className="text-gray-400">Preço: </span>
                                <span className="text-green-400 font-semibold">
                                  {formatPrice(precoNum)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Duração: </span>
                                <span className="text-blue-400 font-semibold">
                                  {service.duracao} min
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <PermissionGate
                            requiredPermissions={["manage_services"]}
                          >
                            <Button
                              fullWidth
                              className="text-white"
                              color="primary"
                              size="sm"
                              startContent={
                                <PencilIcon className="w-4 h-4 text-white" />
                              }
                              variant="flat"
                              onPress={() => handleOpenModal(service)}
                            >
                              Editar
                            </Button>
                          </PermissionGate>
                          <PermissionGate
                            requiredPermissions={["manage_services"]}
                          >
                            <Button
                              fullWidth
                              className="text-white"
                              color="danger"
                              size="sm"
                              startContent={<TrashIcon className="w-4 h-4" />}
                              variant="flat"
                              onPress={() => {
                                setSelectedService(service);
                                onDeleteOpen();
                              }}
                            >
                              Excluir
                            </Button>
                          </PermissionGate>
                        </div>
                      </CardBody>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-700">
              <p className="text-gray-400 text-lg mb-4">
                Nenhum serviço cadastrado
              </p>
              <PermissionGate requiredPermissions={["manage_services"]}>
                <Button
                  color="primary"
                  startContent={<PlusIcon className="w-5 h-5" />}
                  onPress={() => handleOpenModal()}
                >
                  Adicionar Primeiro Serviço
                </Button>
              </PermissionGate>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro/Edição */}
      <Modal
        classNames={{
          base: "bg-gray-900 border border-gray-700",
          header:
            "bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 border-b border-orange-500/30",
          body: "bg-gray-900 py-6",
          footer: "bg-gray-900 border-t border-gray-700",
          closeButton:
            "text-white hover:bg-white/20 hover:text-white focus:bg-white/20",
        }}
        isOpen={isOpen}
        size="2xl"
        onClose={handleCloseModal}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white">
              {selectedService ? "Editar Serviço" : "Adicionar Serviço"}
            </h2>
          </ModalHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload de Imagem - PRIMEIRO CAMPO */}
                <div className="w-full md:col-span-2">
                  <label
                    className="block text-sm font-medium text-gray-300 mb-2"
                    htmlFor="image-upload"
                  >
                    Imagem do Serviço (opcional)
                  </label>
                  <div className="flex flex-col items-center gap-4">
                    {/* Preview da Imagem - Padrão retangular como nos cards */}
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative">
                        {(() => {
                          // Se não há serviço selecionado (modo criação), não mostra imagem
                          if (!selectedService && !imagePreview) {
                            return (
                              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-600 bg-gray-800 flex items-center justify-center">
                                <svg
                                  className="w-12 h-12 text-gray-500"
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
                            );
                          }

                          const defaultPreview = getServiceImageWithFallback(
                            null,
                            selectedService?.nome || ""
                          );
                          const previewSrc =
                            imagePreview ||
                            (selectedService && defaultPreview ? defaultPreview : null);
                          const isDefaultImage = !imagePreview && selectedService && (!selectedService.imagem || selectedService.imagem.trim() === "") && defaultPreview !== null;

                          // Se não houver imagem e não for um tipo com imagem padrão, mostra placeholder
                          if (!previewSrc && !selectedService) {
                            return (
                              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-600 bg-gray-800 flex items-center justify-center">
                                <svg
                                  className="w-12 h-12 text-gray-500"
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
                            );
                          }

                          // Se não houver imagem padrão para o tipo de serviço, mostra placeholder
                          if (!previewSrc) {
                            return (
                              <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-600 bg-gray-800 flex items-center justify-center">
                                <svg
                                  className="w-12 h-12 text-gray-500"
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
                            );
                          }

                          return (
                            <>
                              <img
                                alt="Preview da imagem do serviço"
                                className="w-32 h-32 rounded-lg object-cover border-2 border-gray-700"
                                src={previewSrc}
                                onError={(e) => {
                                  // Se a imagem falhar ao carregar, esconde ou usa fallback
                                  const target = e.currentTarget as HTMLImageElement;
                                  if (target.dataset.fallbackApplied === "true") return;
                                  target.dataset.fallbackApplied = "true";
                                  
                                  const serviceName = selectedService?.nome || "";
                                  const fallbackImage = getServiceImageWithFallback(null, serviceName);
                                  
                                  if (fallbackImage) {
                                    target.src = fallbackImage;
                                  } else {
                                    // Se não houver imagem padrão, esconde a imagem
                                    target.style.display = "none";
                                  }
                                }}
                              />
                              {/* Botão de remover imagem - aparece quando há imagem customizada ou preview */}
                              {(imagePreview || (selectedService && selectedService.imagem && selectedService.imagem.trim() !== "" && !isDefaultImage)) && (
                                <button
                                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors shadow-lg z-10"
                                  type="button"
                                  onClick={() => {
                                    setImagePreview(null);
                                    setImageFile(null);
                                    setImageRemoved(true); // Marca que a imagem foi removida intencionalmente
                                    // Limpa o input file
                                    const fileInput = document.getElementById(
                                      "image-upload"
                                    ) as HTMLInputElement;
                                    if (fileInput) {
                                      fileInput.value = "";
                                    }
                                  }}
                                >
                                  ×
                                </button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      {/* Badge indicando imagem padrão abaixo da imagem - só aparece quando editando serviço com imagem padrão */}
                      {(() => {
                        const defaultPreview = getServiceImageWithFallback(
                          null,
                          selectedService?.nome || ""
                        );
                        const isDefaultImage = !imagePreview && selectedService && (!selectedService.imagem || selectedService.imagem.trim() === "") && defaultPreview !== null;
                        return isDefaultImage ? (
                          <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-md border border-blue-600 shadow-sm">
                            Imagem Padrão
                          </span>
                        ) : null;
                      })()}
                    </div>

                    {/* Botão de Upload */}
                    <label
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      htmlFor="image-upload"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                        />
                      </svg>
                      Alterar imagem
                    </label>
                    <input
                      accept="image/*"
                      className="hidden"
                      id="image-upload"
                      type="file"
                      onChange={handleImageChange}
                    />
                    <p className="text-xs text-gray-400 text-center">
                      Formatos: PNG, JPG ou JPEG (máx. 5MB)
                    </p>
                  </div>
                </div>

                <Controller
                  control={control}
                  name="nome"
                  render={({ field }) => (
                    <Input
                      {...field}
                      isRequired
                      classNames={{
                        base: "w-full md:col-span-2",
                        input: "text-gray-900",
                        label: "text-gray-700",
                        inputWrapper: "bg-white border-gray-300",
                      }}
                      errorMessage={errors.nome?.message}
                      isInvalid={!!errors.nome}
                      label="Nome do Serviço"
                      placeholder="Ex: Corte masculino, Barba, etc."
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="preco"
                  render={({ field }) => (
                    <Input
                      {...field}
                      isRequired
                      classNames={{
                        base: "w-full",
                        input: "text-gray-900",
                        label: "text-gray-700",
                        inputWrapper: "bg-white border-gray-300",
                      }}
                      errorMessage={errors.preco?.message}
                      isInvalid={!!errors.preco}
                      label="Preço"
                      placeholder="0,00"
                      startContent={<span className="text-gray-400">R$</span>}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="duracao"
                  render={({ field }) => (
                    <Input
                      {...field}
                      isRequired
                      classNames={{
                        base: "w-full",
                        input: "text-gray-900",
                        label: "text-gray-700",
                        inputWrapper: "bg-white border-gray-300",
                      }}
                      endContent={<span className="text-gray-400">min</span>}
                      errorMessage={errors.duracao?.message}
                      isInvalid={!!errors.duracao}
                      label="Duração (minutos)"
                      placeholder="30"
                      type="number"
                      value={field.value?.toString() || ""}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  )}
                />
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="danger"
                isDisabled={isSubmitting}
                variant="light"
                onPress={handleCloseModal}
              >
                Cancelar
              </Button>
              <Button color="primary" isLoading={isSubmitting} type="submit">
                {selectedService ? "Atualizar" : "Cadastrar"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        classNames={{
          base: "bg-gray-900 border border-gray-700",
          header:
            "bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 border-b border-orange-500/30",
          body: "bg-gray-900",
          footer: "bg-gray-900 border-t border-gray-700",
          closeButton:
            "text-white hover:bg-white/20 hover:text-white focus:bg-white/20",
        }}
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
      >
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-bold text-white">Confirmar Exclusão</h2>
          </ModalHeader>
          <ModalBody>
            <p className="text-gray-300">
              Tem certeza que deseja excluir o serviço{" "}
              <span className="font-semibold text-white">
                {selectedService?.nome}
              </span>
              ? Esta ação não pode ser desfeita.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              color="default"
              isDisabled={isSubmitting}
              variant="light"
              onPress={onDeleteClose}
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              isLoading={isSubmitting}
              onPress={handleDelete}
            >
              Excluir
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Footer />
    </section>
  );
}
