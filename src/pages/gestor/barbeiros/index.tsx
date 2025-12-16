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

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";
import {
  CreateBarber,
  UpdateBarber,
  DeleteBarber,
} from "@/contexts/ScheduleProvider/util";
import { formatPhone } from "@/utils/format-Cpf-Phone";
import { IBarbers } from "@/contexts/ScheduleProvider/types";

interface BarberFormData {
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  funcao: FuncaoType | "";
}

const FUNCOES = [
  { value: "Barbeiro", label: "Barbeiro" },
  { value: "Atendente", label: "Atendente" },
  {
    value: "Auxiliar de Serviços Gerais",
    label: "Auxiliar de Serviços",
  },
] as const;

type FuncaoType = (typeof FUNCOES)[number]["value"];

const schema = yup.object().shape({
  nome: yup
    .string()
    .min(3, "Nome completo deve ter no mínimo 3 caracteres")
    .required("Nome completo é obrigatório"),
  email: yup.string().email("Email inválido").required("Email é obrigatório"),
  telefone: yup.string().required("Telefone é obrigatório"),
  data_nascimento: yup.string().required("Data de nascimento é obrigatória"),
  funcao: yup
    .string()
    .oneOf([...FUNCOES.map((f) => f.value), ""], "Função inválida")
    .required("Função é obrigatória"),
});

// FUNÇÃO PARA OBTER AS INICIAIS DO PROFISSIONAL
function getInitials(nomeCompleto: string) {
  const parts = nomeCompleto?.trim().split(" ") || [];

  if (parts.length === 0) return "";

  const first = parts[0]?.charAt(0)?.toUpperCase() || "";
  const last =
    parts.length > 1
      ? parts[parts.length - 1]?.charAt(0)?.toUpperCase() || ""
      : "";

  return `${first}${last}`;
}

/**
 * Página de Gerenciamento de Barbeiros - Apenas para Gestores
 *
 * Funcionalidades:
 * - Listar barbeiros
 * - Adicionar novo barbeiro
 * - Editar barbeiro
 * - Excluir barbeiro
 * - Ativar/Desativar barbeiro
 */
export function GestorBarbeirosPage() {
  const navigate = useNavigate();
  const { isGestor } = usePermissions();
  const { barbers, fetchBarbers } = useSchedule();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [selectedBarber, setSelectedBarber] = useState<IBarbers | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTab, setSelectedTab] = useState<FuncaoType>("Barbeiro");

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BarberFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      data_nascimento: "",
      funcao: "",
    },
  });

  // FUNÇÃO PARA FETCHAR OS BARBEIROS
  useEffect(() => {
    if (isGestor) {
      fetchBarbers();
    }
  }, [isGestor]);

  // FUNÇÃO PARA ABRIR O MODAL DE CADASTRO/ATUALIZAÇÃO DE PROFISSIONAL
  const handleOpenModal = (barber?: IBarbers) => {
    if (barber) {
      setSelectedBarber(barber);

      const funcaoValue = barber.especialidade as FuncaoType | "";

      reset({
        nome: barber.nome || "",
        email: barber.email || "",
        telefone: barber.telefone || "",
        data_nascimento: barber.data_nascimento || "",
        funcao: funcaoValue || "",
      });
    } else {
      setSelectedBarber(null);
      reset({
        nome: "",
        email: "",
        telefone: "",
        data_nascimento: "",
        funcao: "" as "",
      });
    }
    onOpen();
  };

  const handleCloseModal = () => {
    setSelectedBarber(null);
    reset();
    onClose();
  };

  // FUNÇÃO PARA SUBMETER O FORMULÁRIO DE CADASTRO/ATUALIZAÇÃO DE PROFISSIONAL
  const onSubmit = async (data: BarberFormData) => {
    if (!data.funcao || (data.funcao as string) === "") {
      addToast({
        title: "Erro",
        description: "Por favor, selecione uma função.",
        color: "danger",
        timeout: 3000,
      });

      return;
    }

    try {
      setIsSubmitting(true);

      const funcaoValue = data.funcao as FuncaoType;

      if (selectedBarber) {
        // Editar profissional
        await UpdateBarber(selectedBarber.id, {
          nome: data.nome.trim(),
          email: data.email,
          telefone: data.telefone.replace(/\D/g, ""),
          data_nascimento: data.data_nascimento,
          especialidade: funcaoValue,
        });

        addToast({
          title: "Sucesso",
          description: "Profissional atualizado com sucesso!",
          color: "success",
          timeout: 3000,
        });
      } else {
        // Criar profissional
        await CreateBarber({
          nome: data.nome.trim(),
          email: data.email,
          telefone: data.telefone.replace(/\D/g, ""),
          data_nascimento: data.data_nascimento,
          especialidade: funcaoValue,
        });

        addToast({
          title: "Sucesso",
          description: "Profissional cadastrado com sucesso!",
          color: "success",
          timeout: 3000,
        });
      }

      await fetchBarbers();
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao salvar profissional:", error);
      addToast({
        title: "Erro",
        description: selectedBarber
          ? "Falha ao atualizar profissional. Tente novamente."
          : "Falha ao cadastrar profissional. Tente novamente.",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // FUNÇÃO PARA EXCLUIR UM BARBEIRO
  const handleDelete = async () => {
    if (!selectedBarber) return;

    try {
      setIsSubmitting(true);
      await DeleteBarber(selectedBarber.id);

      addToast({
        title: "Sucesso",
        description: "Barbeiro excluído com sucesso!",
        color: "success",
        timeout: 3000,
      });

      await fetchBarbers();
      onDeleteClose();
      setSelectedBarber(null);
    } catch (error) {
      console.error("Erro ao excluir barbeiro:", error);
      addToast({
        title: "Erro",
        description: "Falha ao excluir barbeiro. Tente novamente.",
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
        <Helmet title="Gerenciar Barbeiros - Gestor" />

        <div className="mx-auto max-w-4xl">
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
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 rounded-lg mb-6 shadow-sm relative overflow-hidden">
            {/* Imagem de fundo */}
            <div className="absolute inset-0">
              <img
                alt="Barbeiro"
                className="w-full h-full object-cover object-right-center opacity-15"
                src="/image-1.png"
              />
              {/* Overlay sutil */}
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500/90 via-emerald-500/90 to-cyan-500/90" />
            </div>

            {/* Conteúdo */}
            <div className="relative z-10 p-4 md:p-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex-1">
                  <h1 className="text-xl md:text-2xl font-medium text-white mb-1">
                    Gerenciar Profissionais
                  </h1>
                  <p className="text-white/80 text-xs md:text-sm font-light">
                    Gerencie os profissionais da sua barbearia
                  </p>
                </div>
                <PermissionGate requiredPermissions={["manage_barbers"]}>
                  <Button
                    className="bg-white text-teal-600 font-normal hover:bg-gray-50 shadow-sm hover:shadow transition-all duration-200 whitespace-nowrap"
                    color="primary"
                    size="sm"
                    startContent={<PlusIcon className="w-4 h-4" />}
                    onPress={() => handleOpenModal()}
                  >
                    Adicionar Profissional
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </div>

          {/* Abas de Filtro */}
          <div className="bg-gray-900 rounded-lg p-2 mb-6 border border-gray-700">
            <div className="flex flex-wrap gap-2">
              {FUNCOES.map((funcao) => (
                <button
                  key={funcao.value}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedTab === funcao.value
                      ? "bg-teal-500 text-white shadow-md"
                      : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                  }`}
                  type="button"
                  onClick={() => setSelectedTab(funcao.value)}
                >
                  {funcao.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de Profissionais Filtrados */}
          {(() => {
            const filteredBarbers = barbers.filter(
              (barber) => barber.especialidade === selectedTab
            );

            if (filteredBarbers.length === 0) {
              return (
                <div className="bg-gray-900 rounded-lg p-12 text-center border border-gray-700">
                  <p className="text-gray-400 text-lg mb-4">
                    {`Nenhum ${selectedTab.toLowerCase()} cadastrado`}
                  </p>
                  <PermissionGate requiredPermissions={["manage_barbers"]}>
                    <Button
                      color="primary"
                      startContent={<PlusIcon className="w-5 h-5" />}
                      onPress={() => handleOpenModal()}
                    >
                      Adicionar Primeiro Profissional
                    </Button>
                  </PermissionGate>
                </div>
              );
            }

            return (
              <>
                {/* Título da Categoria */}
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    {FUNCOES.find((f) => f.value === selectedTab)?.label ||
                      selectedTab}
                  </h2>
                  <p className="text-gray-400 text-sm mt-1">
                    {filteredBarbers.length}{" "}
                    {filteredBarbers.length === 1
                      ? "profissional encontrado"
                      : "profissionais encontrados"}
                  </p>
                </div>

                {/* Grid de Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredBarbers.map((barber) => {
                    const isActive =
                      barber.status === "ATIVO" || barber.status === "ativo";

                    return (
                      <Card
                        key={barber.id}
                        className="bg-gray-900 border border-gray-700 hover:border-teal-500 transition-all duration-300 shadow-md hover:shadow-lg"
                      >
                        <CardBody className="p-3">
                          <div className="flex items-start gap-3 mb-3">
                            {/* Avatar */}
                            {barber.avatar ? (
                              <img
                                alt={barber.nome}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-700 flex-shrink-0"
                                src={`${import.meta.env.VITE_API}/barbeiros/avatar/${encodeURIComponent(barber.avatar || "")}`}
                                onError={(e) => {
                                  e.currentTarget.src = "/img-barber-icon.png";
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold border-2 border-gray-700 flex-shrink-0">
                                {getInitials(barber.nome)}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base font-semibold text-white mb-0.5 truncate">
                                    {barber.nome}
                                  </h3>
                                  <p className="text-gray-400 text-xs truncate">
                                    {barber.email}
                                  </p>
                                </div>
                                {/* Status Indicator */}
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  <div
                                    className={`w-2 h-2 rounded-full ${
                                      isActive ? "bg-green-500" : "bg-red-500"
                                    }`}
                                  />
                                  <span
                                    className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                                      isActive
                                        ? "bg-green-500/20 text-green-400"
                                        : "bg-red-500/20 text-red-400"
                                    }`}
                                  >
                                    {isActive ? "Ativo" : "Inativo"}
                                  </span>
                                </div>
                              </div>

                              {barber.especialidade && (
                                <p className="text-gray-500 text-xs mb-2">
                                  {barber.especialidade}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <PermissionGate
                              requiredPermissions={["manage_barbers"]}
                            >
                              <Button
                                fullWidth
                                className="text-white"
                                color="success"
                                size="sm"
                                startContent={
                                  <PencilIcon className="w-4 h-4 text-white" />
                                }
                                variant="flat"
                                onPress={() => handleOpenModal(barber)}
                              >
                                Editar
                              </Button>
                            </PermissionGate>
                            <PermissionGate
                              requiredPermissions={["manage_barbers"]}
                            >
                              <Button
                                fullWidth
                                className="text-white"
                                color="danger"
                                size="sm"
                                startContent={<TrashIcon className="w-4 h-4" />}
                                variant="flat"
                                onPress={() => {
                                  setSelectedBarber(barber);
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
            );
          })()}
        </div>
      </div>

      {/* MODAL DE CADASTRO/ATUALIZAÇÃO DE PROFISSIONAL */}
      <Modal
        classNames={{
          base: "bg-gray-900 border border-gray-700",
          header: "bg-gray-900 border-b border-gray-700",
          body: "bg-gray-900",
          footer: "bg-gray-900 border-t border-gray-700",
        }}
        isOpen={isOpen}
        size="2xl"
        onClose={handleCloseModal}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white">
              {selectedBarber
                ? "Editar Profissional"
                : "Adicionar Profissional"}
            </h2>
          </ModalHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  control={control}
                  name="nome"
                  render={({ field }) => (
                    <Input
                      {...field}
                      isRequired
                      classNames={{
                        base: "w-full md:col-span-2",
                        input: "text-white",
                        label: "text-gray-300",
                        inputWrapper: "bg-gray-800 border-gray-700",
                      }}
                      errorMessage={errors.nome?.message}
                      isInvalid={!!errors.nome}
                      label="Nome Completo"
                      placeholder="Digite o nome completo"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <Input
                      {...field}
                      isRequired
                      classNames={{
                        base: "w-full",
                        input: "text-white",
                        label: "text-gray-300",
                        inputWrapper: "bg-gray-800 border-gray-700",
                      }}
                      errorMessage={errors.email?.message}
                      isInvalid={!!errors.email}
                      label="Email"
                      placeholder="Digite o email"
                      type="email"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="telefone"
                  render={({ field }) => (
                    <Input
                      {...field}
                      isRequired
                      classNames={{
                        base: "w-full",
                        input: "text-white",
                        label: "text-gray-300",
                        inputWrapper: "bg-gray-800 border-gray-700",
                      }}
                      errorMessage={errors.telefone?.message}
                      isInvalid={!!errors.telefone}
                      label="Telefone"
                      placeholder="(00) 00000-0000"
                      value={formatPhone(field.value || "")}
                      onChange={(e) =>
                        field.onChange(formatPhone(e.target.value))
                      }
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="data_nascimento"
                  render={({ field }) => (
                    <Input
                      {...field}
                      isRequired
                      classNames={{
                        base: "w-full",
                        input: "text-white",
                        label: "text-gray-300",
                        inputWrapper: "bg-gray-800 border-gray-700",
                      }}
                      errorMessage={errors.data_nascimento?.message}
                      isInvalid={!!errors.data_nascimento}
                      label="Data de Nascimento"
                      type="date"
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="funcao"
                  render={({ field }) => (
                    <div className="w-full">
                      <select
                        {...field}
                        required
                        className="w-full p-4 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                        id="funcao-select"
                      >
                        <option value="">Selecione uma função</option>
                        {FUNCOES.map((funcao) => (
                          <option key={funcao.value} value={funcao.value}>
                            {funcao.label}
                          </option>
                        ))}
                      </select>
                      {errors.funcao && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.funcao.message}
                        </p>
                      )}
                    </div>
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
                {selectedBarber ? "Atualizar" : "Cadastrar"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal
        classNames={{
          base: "bg-gray-900 border border-gray-700",
          header: "bg-gray-900 border-b border-gray-700",
          body: "bg-gray-900",
          footer: "bg-gray-900 border-t border-gray-700",
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
              Tem certeza que deseja excluir o barbeiro{" "}
              <span className="font-semibold text-white">
                {selectedBarber?.nome}
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
