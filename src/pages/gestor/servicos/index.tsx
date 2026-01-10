import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
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

interface ServiceFormData {
  nome: string;
  preco: string;
  duracao: number;
  imagem: string;
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
  imagem: yup.string().url("URL inválida").optional(),
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
      imagem: "",
    },
  });

  useEffect(() => {
    if (isGestor) {
      fetchServices();
    }
  }, [isGestor]);

  const handleOpenModal = (service?: IServices) => {
    if (service) {
      setSelectedService(service);
      reset({
        nome: service.nome || "",
        preco: service.preco || "",
        duracao: service.duracao || 30,
        imagem: service.imagem || "",
      });
    } else {
      setSelectedService(null);
      reset({
        nome: "",
        preco: "",
        duracao: 30,
        imagem: "",
      });
    }
    onOpen();
  };

  const handleCloseModal = () => {
    setSelectedService(null);
    reset();
    onClose();
  };

  const onSubmit = async (data: ServiceFormData) => {
    try {
      setIsSubmitting(true);

      // Remove caracteres não numéricos do preço, exceto vírgula e ponto
      const precoClean = data.preco.replace(/[^\d,.]/g, "").replace(",", ".");

      if (selectedService) {
        // Editar serviço
        await UpdateService(selectedService.id, {
          nome: data.nome,
          preco: precoClean,
          duracao: data.duracao,
          imagem: data.imagem || undefined,
        });

        addToast({
          title: "Sucesso",
          description: "Serviço atualizado com sucesso!",
          color: "success",
          timeout: 3000,
        });
      } else {
        // Criar serviço
        await CreateService({
          nome: data.nome,
          preco: precoClean,
          duracao: data.duracao,
          imagem: data.imagem || undefined,
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
    } catch (error) {
      console.error("Erro ao salvar serviço:", error);
      addToast({
        title: "Erro",
        description: selectedService
          ? "Falha ao atualizar serviço. Tente novamente."
          : "Falha ao cadastrar serviço. Tente novamente.",
        color: "danger",
        timeout: 5000,
      });
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
          {services && services.length > 0 ? (
            <>
              {/* Título da Categoria */}
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-white">Serviços</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {services.length}{" "}
                  {services.length === 1
                    ? "serviço encontrado"
                    : "serviços encontrados"}
                </p>
              </div>

              {/* Grid de Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {services.map((service) => {
                  const precoNum = parseFloat(
                    service.preco?.replace(",", ".") || "0"
                  );

                  return (
                    <Card
                      key={service.id}
                      className="bg-gray-900 border border-gray-700 hover:border-orange-500 transition-all duration-300 shadow-md hover:shadow-lg relative"
                    >
                      <CardBody className="p-3">
                        <div className="flex items-start gap-3 mb-3">
                          {/* Imagem do Serviço */}
                          {service.imagem ? (
                            <img
                              alt={service.nome}
                              className="w-12 h-12 rounded-lg object-cover border-2 border-gray-700 flex-shrink-0"
                              src={service.imagem}
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-lg font-bold border-2 border-gray-700 flex-shrink-0">
                              ✂️
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

                <Controller
                  control={control}
                  name="imagem"
                  render={({ field }) => (
                    <Input
                      {...field}
                      classNames={{
                        base: "w-full md:col-span-2",
                        input: "text-gray-900",
                        label: "text-gray-700",
                        inputWrapper: "bg-white border-gray-300",
                      }}
                      errorMessage={errors.imagem?.message}
                      isInvalid={!!errors.imagem}
                      label="URL da Imagem (opcional)"
                      placeholder="https://exemplo.com/imagem.jpg"
                      type="url"
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
