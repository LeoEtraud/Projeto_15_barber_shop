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
  Switch,
} from "@heroui/react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { UserPlus, User } from "phosphor-react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useNavigate } from "react-router-dom";

import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionGate } from "@/components/PermissionGate";
import { useSchedule } from "@/contexts/ScheduleProvider/useSchedule";
import { useAuth } from "@/contexts/AuthProvider/useAuth";
import {
  CreateProfessional,
  UpdateProfessional,
  DeleteProfessional,
} from "@/contexts/ScheduleProvider/util";
import { getDefaultBarberImage } from "@/utils/defaultImages";
import { getNomeSobrenome } from "@/utils/format-nome";
import { formatPhone, formatDate, normalizeName } from "@/utils/format-Cpf-Phone";
import { IBarbers, IProfessionals } from "@/contexts/ScheduleProvider/types";

interface BarberFormData {
  nome: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  funcao: FuncaoType | "";
}

const FUNCOES = [
  {
    value: "Barbeiros",
    label: "Barbeiros",
    selectLabel: "Barbeiro",
    apiValue: "Barbeiro",
  },
  {
    value: "Atendentes",
    label: "Atendentes",
    selectLabel: "Atendente",
    apiValue: "Atendente",
  },
  {
    value: "Gestores",
    label: "Gestores",
    selectLabel: "Gestor",
    apiValue: "Gestor",
  },
] as const;

type FuncaoType = (typeof FUNCOES)[number]["value"];

// Função para mapear valor da aba para valor da API
function getApiValue(tabValue: FuncaoType): string {
  const funcao = FUNCOES.find((f) => f.value === tabValue);

  return funcao?.apiValue || tabValue;
}

// Função para verificar se a funcao corresponde à aba selecionada
function matchesFuncao(
  funcao: string | undefined,
  tabValue: FuncaoType
): boolean {
  if (!funcao) return false;

  const apiValue = getApiValue(tabValue);

  // Aceita tanto o valor da API quanto o valor da aba
  return funcao === apiValue || funcao === tabValue;
}

// Função para converter data de DD/MM/AAAA para YYYY-MM-DD
function convertDateToAPI(dateStr: string): string {
  if (!dateStr) return "";

  const digits = dateStr.replace(/\D/g, "");

  if (digits.length !== 8) return dateStr;

  const day = digits.substring(0, 2);
  const month = digits.substring(2, 4);
  const year = digits.substring(4, 8);

  return `${year}-${month}-${day}`;
}

// Função para converter data de YYYY-MM-DD para DD/MM/AAAA
function convertDateFromAPI(dateStr: string): string {
  if (!dateStr) return "";

  if (dateStr.includes("/")) return dateStr; // Já está formatado

  const parts = dateStr.split("-");

  if (parts.length !== 3) return dateStr;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

const schema = yup.object().shape({
  nome: yup
    .string()
    .trim()
    .min(3, "Nome completo deve ter no mínimo 3 caracteres")
    .max(100, "Nome completo deve ter no máximo 100 caracteres")
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, "Nome deve conter apenas letras e espaços")
    .test(
      "nome-completo",
      "Nome deve conter pelo menos nome e sobrenome",
      (value) => {
        if (!value) return false;

        const parts = value.trim().split(/\s+/);

        return parts.length >= 2;
      }
    )
    .required("Nome completo é obrigatório"),
  email: yup
    .string()
    .trim()
    .email("Email inválido")
    .max(60, "Email deve ter no máximo 60 caracteres")
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Email inválido"
    )
    .required("Email é obrigatório")
    .test(
      "email-unico",
      "Já existe uma conta cadastrada com este E-mail.",
      function (value) {
        if (!value) return true;
        const { professionals, selectedBarberId } = this.options.context as { 
          professionals: (IBarbers | IProfessionals)[]; 
          selectedBarberId?: string;
        };
        const normalizedEmail = value.trim().toLowerCase();
        const emailExists = professionals.some(
          (p) => p.email?.toLowerCase() === normalizedEmail && p.id !== selectedBarberId
        );
        return !emailExists;
      }
    ),
  telefone: yup
    .string()
    .required("Telefone é obrigatório")
    .test(
      "telefone-valido",
      "Telefone deve conter exatamente 11 dígitos",
      (value) => {
        const digits = (value || "").replace(/\D/g, "");

        return digits.length === 11;
      }
    )
    .test("telefone-formato", "Telefone inválido", (value) => {
      const digits = (value || "").replace(/\D/g, "");

      if (digits.length !== 11) return false;

      // Valida DDD (deve ser entre 11 e 99)
      const ddd = parseInt(digits.substring(0, 2), 10);

      return ddd >= 11 && ddd <= 99;
    })
    .test(
      "telefone-unico",
      "Já existe um profissional cadastrado com este número de contato.",
      function (value) {
        if (!value) return true;
        const { professionals, selectedBarberId } = this.options.context as { 
          professionals: (IBarbers | IProfessionals)[]; 
          selectedBarberId?: string;
        };
        const cleanedPhone = value.replace(/\D/g, "");
        const phoneExists = professionals.some(
          (p) => {
            const pPhone = (p.telefone || "").replace(/\D/g, "");
            return pPhone === cleanedPhone && p.id !== selectedBarberId;
          }
        );
        return !phoneExists;
      }
    ),
  data_nascimento: yup
    .string()
    .required("Data de nascimento é obrigatória")
    .test("data-valida", "Data de nascimento inválida", (value) => {
      if (!value) return false;

      const digits = value.replace(/\D/g, "");

      if (digits.length !== 8) return false;

      const day = parseInt(digits.substring(0, 2), 10);
      const month = parseInt(digits.substring(2, 4), 10);
      const year = parseInt(digits.substring(4, 8), 10);

      if (day < 1 || day > 31) return false;
      if (month < 1 || month > 12) return false;

      const currentYear = new Date().getFullYear();

      if (year < 1900 || year > currentYear) return false;

      const date = new Date(year, month - 1, day);

      return (
        date.getDate() === day &&
        date.getMonth() === month - 1 &&
        date.getFullYear() === year
      );
    })
    .test("idade-minima", "Idade mínima de 18 anos é necessária", (value) => {
      if (!value) return false;

      const digits = value.replace(/\D/g, "");

      if (digits.length !== 8) return false;

      const year = parseInt(digits.substring(4, 8), 10);
      const month = parseInt(digits.substring(2, 4), 10) - 1;
      const day = parseInt(digits.substring(0, 2), 10);
      const birthDate = new Date(year, month, day);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age >= 18;
    }),
  funcao: yup
    .string()
    .oneOf([...FUNCOES.map((f) => f.value), ""], "Função inválida")
    .required("Função é obrigatória"),
});



/**
 * Página de Gerenciamento de Profissionais - Apenas para Gestores
 *
 * Funcionalidades:
 * - Listar profissionais (Barbeiros, Atendentes e Gestores)
 * - Adicionar novo profissional
 * - Editar profissional
 * - Excluir profissional
 * - Ativar/Desativar profissional
 */
export function GestorBarbeirosPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isGestor } = usePermissions();
  const { professionals, fetchProfessionals } = useSchedule();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [selectedBarber, setSelectedBarber] = useState<
    IBarbers | IProfessionals | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTab, setSelectedTab] = useState<FuncaoType>("Barbeiros");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState<boolean>(false);
  const [isActive, setIsActive] = useState(true);

  // Memoiza o contexto para atualizar quando professionals ou selectedBarber mudarem
  const formContext = useMemo(() => ({
    professionals,
    selectedBarberId: selectedBarber?.id,
  }), [professionals, selectedBarber?.id]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BarberFormData>({
    resolver: yupResolver(schema),
    context: formContext,
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
      fetchProfessionals();
    }
  }, [isGestor]);

  // Atualiza selectedBarber quando a lista de profissionais é atualizada
  useEffect(() => {
    if (selectedBarber && professionals.length > 0) {
      const updatedBarber = professionals.find(p => p.id === selectedBarber.id);
      if (updatedBarber) {
        // Só atualiza se os dados realmente mudaram
        const avatarChanged = updatedBarber.avatar !== selectedBarber.avatar;
        
        if (avatarChanged || updatedBarber.nome !== selectedBarber.nome || updatedBarber.status !== selectedBarber.status) {
          setSelectedBarber(updatedBarber);
          
          // Atualiza o preview da imagem apenas se não houver nova imagem selecionada
          if (!imageFile && !imageRemoved) {
            if (updatedBarber.avatar && updatedBarber.avatar.trim() !== "") {
              const avatarUrl = getAvatarUrl(updatedBarber.avatar);
              setImagePreview(avatarUrl);
            } else {
              setImagePreview(null);
            }
          }
        }
      }
    }
  }, [professionals, selectedBarber?.id]);

  // FUNÇÃO PARA COMPRIMIR IMAGEM
  const compressImage = (file: File, maxWidth: number = 800, maxHeight: number = 800, quality: number = 0.7): Promise<File> => {
    return new Promise((resolve, reject) => {
      // Se a imagem já for pequena (< 200KB), não comprime
      if (file.size < 200 * 1024) {
        console.log("[Frontend] Imagem já é pequena, pulando compressão");
        resolve(file);
        return;
      }

      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          // Calcula novas dimensões mantendo proporção
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = Math.round((width * maxHeight) / height);
                height = maxHeight;
              }
            }
          } else {
            // Se a imagem já é menor que o máximo, não redimensiona
            // Mas ainda pode comprimir pela qualidade
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Erro ao criar contexto do canvas"));
            return;
          }

          // Melhora a qualidade de renderização
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          ctx.drawImage(img, 0, 0, width, height);

          // Tenta diferentes formatos para melhor compressão
          const mimeType = file.type === "image/png" ? "image/jpeg" : file.type || "image/jpeg";
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error("Erro ao comprimir imagem"));
                return;
              }
              
              // Se a imagem comprimida for maior que a original, usa a original
              if (blob.size > file.size) {
                console.log("[Frontend] Imagem comprimida ficou maior, usando original");
                resolve(file);
                return;
              }

              const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + (mimeType === "image/jpeg" ? ".jpg" : ".png"), {
                type: mimeType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            mimeType,
            quality
          );
        };

        img.onerror = () => {
          reject(new Error("Erro ao carregar imagem"));
        };

        if (typeof e.target?.result === "string") {
          img.src = e.target.result;
        } else {
          reject(new Error("Erro ao ler arquivo"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Erro ao ler arquivo"));
      };

      reader.readAsDataURL(file);
    });
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

  // FUNÇÃO PARA OBTER URL DO AVATAR
  const getAvatarUrl = (avatar: string | undefined | null): string | null => {
    if (!avatar || avatar.trim() === "") return null;

    // Se o avatar já é base64, retorna diretamente
    if (avatar.startsWith("data:image")) {
      return avatar;
    }

    // Se já é uma URL completa, retorna diretamente
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      return avatar;
    }

    const apiUrl = import.meta.env.VITE_API;

    if (!apiUrl) {
      console.warn("[Frontend] VITE_API não configurado, não é possível construir URL do avatar");
      return null;
    }

    // Remove barras iniciais se houver
    const cleanAvatar = avatar.replace(/^\/+/, "");
    
    return `${apiUrl}/barbeiros/avatar/${encodeURIComponent(cleanAvatar)}`;
  };

  // FUNÇÃO PARA ABRIR O MODAL DE CADASTRO/ATUALIZAÇÃO DE PROFISSIONAL
  const handleOpenModal = (barber?: IBarbers | IProfessionals) => {
    if (barber) {
      setSelectedBarber(barber as IBarbers);

      // Mapeia o valor da API para o valor da UI
      let funcaoValue: FuncaoType | "" = "";

      if (barber.funcao) {
        const funcao = FUNCOES.find((f) => f.apiValue === barber.funcao);

        funcaoValue = funcao?.value || (barber.funcao as FuncaoType) || "";
      }

      reset({
        nome: barber.nome || "",
        email: barber.email || "",
        telefone: barber.telefone || "",
        data_nascimento: convertDateFromAPI(barber.data_nascimento || ""),
        funcao: funcaoValue || "",
      });

      // Define preview da imagem existente
      if (barber.avatar && barber.avatar.trim() !== "") {
        const avatarUrl = getAvatarUrl(barber.avatar);
        setImagePreview(avatarUrl);
        setImageRemoved(false);
      } else {
        // Se não houver imagem, não define preview (será mostrado o ícone no modal)
        setImagePreview(null);
        setImageRemoved(false);
      }

      // Define o status
      const statusActive =
        barber.status === "ATIVO" || barber.status === "ativo";

      setIsActive(statusActive);
    } else {
      setSelectedBarber(null);
      reset({
        nome: "",
        email: "",
        telefone: "",
        data_nascimento: "",
        funcao: "" as "",
      });
      setImagePreview(null);
      setImageRemoved(false);
      setIsActive(true); // Por padrão, novo profissional é ativo
    }
    setImageFile(null);
    setImageRemoved(false);
    onOpen();
  };

  const handleCloseModal = () => {
    setSelectedBarber(null);
    setImagePreview(null);
    setImageFile(null);
    setImageRemoved(false);
    setIsActive(true);
    reset();
    onClose();
  };

  // FUNÇÃO PARA HANDLEAR O UPLOAD DE IMAGEM
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

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
          const preview = event.target.result as string;
          setImagePreview(preview);
          setImageRemoved(false);
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
      const apiFuncaoValue = getApiValue(funcaoValue);

      // Converte imagem para base64 se houver arquivo selecionado
      // Se a imagem foi removida intencionalmente, envia null para remover
      // Se não houver nova imagem e não foi removida, não envia o campo (mantém a existente)
      let avatarBase64: string | null | undefined = undefined;

      if (imageFile) {
        try {
          // Nova imagem selecionada - comprime antes de converter
          console.log("[Frontend] Comprimindo imagem, tamanho original:", imageFile.size, "bytes");
          const compressedFile = await compressImage(imageFile);
          console.log("[Frontend] Imagem comprimida, tamanho:", compressedFile.size, "bytes");
          
          console.log("[Frontend] Convertendo imagem para base64");
          avatarBase64 = await convertFileToBase64(compressedFile);
          console.log("[Frontend] Imagem convertida, tamanho base64:", avatarBase64?.length, "caracteres");
          setImageRemoved(false); // Reset do flag de remoção
        } catch (error) {
          console.error("[Frontend] Erro ao processar imagem:", error);
          addToast({
            title: "Erro",
            description: "Erro ao processar a imagem. Tente novamente.",
            color: "danger",
            timeout: 3000,
          });
          setIsSubmitting(false);
          return;
        }
      } else if (imageRemoved) {
        // Imagem foi removida intencionalmente pelo usuário
        avatarBase64 = null;
        console.log("[Frontend] Imagem removida pelo usuário");
      }
      // Se imageFile for null e imageRemoved for false, não envia nada (mantém a existente)

      if (selectedBarber) {
        // Editar profissional
        const updateData: {
          nome: string;
          email: string;
          telefone: string;
          data_nascimento: string;
          funcao: string;
          avatar?: string | null;
          status: string;
        } = {
          nome: normalizeName(data.nome.trim()),
          email: data.email,
          telefone: data.telefone.replace(/\D/g, ""),
          data_nascimento: data.data_nascimento,
          funcao: apiFuncaoValue,
          status: isActive ? "ATIVO" : "INATIVO",
        };

        // Adiciona avatar se houver nova imagem ou se foi removida (null)
        if (avatarBase64 !== undefined) {
          updateData.avatar = avatarBase64;
        }

        console.log("[Frontend] Enviando dados para atualizar profissional:", {
          ...updateData,
          avatar: updateData.avatar ? (typeof updateData.avatar === 'string' && updateData.avatar.startsWith('data:image') ? `base64 (${updateData.avatar.length} chars)` : updateData.avatar) : "não enviado",
        });

        await UpdateProfessional(selectedBarber.id, updateData);

        addToast({
          title: "Sucesso",
          description: "Profissional atualizado com sucesso!",
          color: "success",
          timeout: 3000,
        });
      } else {
        // Criar profissional
        const barbeariaId = user?.user?.barbeariaId;

        if (!barbeariaId) {
          setIsSubmitting(false);
          addToast({
            title: "Erro",
            description:
              "ID da barbearia não encontrado. Verifique seu perfil.",
            color: "danger",
            timeout: 3000,
          });

          return;
        }

        const createData: {
          nome: string;
          email: string;
          telefone: string;
          data_nascimento: string;
          funcao: string;
          avatar?: string;
          barbeariaId: string;
        } = {
          nome: normalizeName(data.nome.trim()),
          email: data.email,
          telefone: data.telefone.replace(/\D/g, ""),
          data_nascimento: convertDateToAPI(data.data_nascimento),
          funcao: apiFuncaoValue,
          barbeariaId: barbeariaId,
        };

        // Adiciona avatar se houver
        if (avatarBase64) {
          createData.avatar = avatarBase64;
        }

        console.log("[Frontend] Enviando dados para criar profissional:", {
          ...createData,
          avatar: avatarBase64 ? `base64 (${avatarBase64.length} chars)` : "não enviado",
        });
        
        await CreateProfessional(createData);

        addToast({
          title: "Sucesso",
          description: "Profissional cadastrado com sucesso!",
          color: "success",
          timeout: 3000,
        });
      }

      // Busca os profissionais atualizados
      await fetchProfessionals();
      
      // Se a imagem foi removida, limpa o preview para garantir que será mostrado o ícone
      if (imageRemoved) {
        setImagePreview(null);
        setImageFile(null);
      } else if (imageFile) {
        // Se uma nova imagem foi selecionada, mantém o preview
        // O useEffect vai atualizar quando os profissionais forem carregados
      }
      
      handleCloseModal();
    } catch (error: any) {
      console.error("Erro ao salvar profissional:", error);
      
      // Extrai a mensagem de erro do backend
      let errorMessage = selectedBarber
        ? "Falha ao atualizar profissional. Tente novamente."
        : "Falha ao cadastrar profissional. Tente novamente.";
      
      // Verifica se há uma mensagem de erro específica do backend
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      addToast({
        title: "Erro",
        description: errorMessage,
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // FUNÇÃO PARA EXCLUIR UM PROFISSIONAL
  const handleDelete = async () => {
    if (!selectedBarber) return;

    try {
      setIsSubmitting(true);
      await DeleteProfessional(selectedBarber.id);

      addToast({
        title: "Sucesso",
        description: "Profissional excluído com sucesso!",
        color: "success",
        timeout: 3000,
      });

      await fetchProfessionals();
      onDeleteClose();
      setSelectedBarber(null);
    } catch (error) {
      console.error("Erro ao excluir profissional:", error);
      addToast({
        title: "Erro",
        description: "Falha ao excluir profissional. Tente novamente.",
        color: "danger",
        timeout: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isGestor) {
    return (
      <section className="min-h-screen flex flex-col items-center justify-center transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <h1 className="text-2xl font-bold mb-4 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>Acesso Negado</h1>
        <p className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
          Apenas gestores podem acessar esta página.
        </p>
      </section>
    );
  }

  return (
    <section className="min-h-screen flex flex-col transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Header />

      <div className="px-4 py-8 md:px-8 flex-1">
        <Helmet title="Gerenciar Barbeiros - Gestor" />

        <div className="mx-auto max-w-6xl">
          {/* Botão Voltar */}
          <button
            className="text-sm mb-4 w-8 h-8 flex items-center justify-center border rounded-full transition-colors duration-300 hover:bg-[var(--bg-hover)]"
            style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
            type="button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="w-6 h-6 text-yellow-400" />
          </button>

          {/* Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 rounded-lg mb-6 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0">
              <img
                alt="Barbeiro"
                className="w-full h-full object-cover object-right-center opacity-15"
                src="/image-1.png"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-blue-700/90 to-blue-800/90" />
            </div>

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
                    className="bg-white text-black font-normal hover:bg-gray-50 shadow-sm hover:shadow transition-all duration-200 whitespace-nowrap"
                    color="primary"
                    size="sm"
                    startContent={<UserPlus size={18} />}
                    onPress={() => handleOpenModal()}
                  >
                    Adicionar Profissional
                  </Button>
                </PermissionGate>
              </div>
            </div>
          </div>

          {/* Abas de Filtro */}
          <div className="rounded-lg p-2 mb-6 border transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
            <div className="flex flex-wrap gap-2">
              {FUNCOES.map((funcao) => (
                <button
                  key={funcao.value}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedTab === funcao.value
                      ? "bg-teal-500 text-white shadow-md"
                      : "hover:bg-[var(--bg-hover)] transition-colors duration-300"
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
            const filteredBarbers = professionals.filter((barber) =>
              matchesFuncao(barber.funcao, selectedTab)
            );

            if (filteredBarbers.length === 0) {
              return (
                <div className="rounded-lg p-12 text-center border transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
                  <p className="text-lg mb-4 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                    {`Nenhum ${selectedTab.toLowerCase()} cadastrado`},
                  </p>
                  <PermissionGate requiredPermissions={["manage_barbers"]}>
                    <Button
                      className="text-black"
                      color="primary"
                      startContent={<UserPlus size={20} />}
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
                  <h2 className="text-xl font-semibold transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                    {FUNCOES.find((f) => f.value === selectedTab)?.label ||
                      selectedTab}
                  </h2>
                  <p className="text-sm mt-1 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
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
                        className="border hover:border-teal-500 transition-all duration-300 shadow-md hover:shadow-lg relative"
                        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}
                      >
                        {/* Badge de Status */}
                        <div
                          className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                            isActive
                              ? "text-white border"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                          style={isActive ? {
                            backgroundColor: "#2563eb",
                            borderColor: "#1d4ed8",
                          } : undefined}
                        >
                          {isActive ? "Ativo" : "Inativo"}
                        </div>

                        <CardBody className="p-3">
                          <div className="flex items-start gap-3 mb-3">
                            {/* Avatar */}
                            {(() => {
                              const avatarUrl = getAvatarUrl(barber.avatar);
                              
                              return avatarUrl ? (
                                <img
                                  alt={barber.nome}
                                  className="w-16 h-16 rounded-full object-cover border-2 flex-shrink-0 transition-colors duration-300"
                                  style={{ borderColor: "var(--border-primary)" }}
                                  src={avatarUrl}
                                  onError={(e) => {
                                    // Se a imagem falhar, mostra o ícone de usuário
                                    const target = e.currentTarget;
                                    target.style.display = "none";
                                    const fallback = target.nextElementSibling as HTMLElement;
                                    if (fallback) {
                                      fallback.classList.remove("hidden");
                                    }
                                  }}
                                />
                              ) : null;
                            })()}
                            {(() => {
                              const hasAvatar = barber.avatar && barber.avatar.trim() !== "";
                              if (hasAvatar) return null;
                              
                              return (
                                <img
                                  alt={barber.nome}
                                  className="w-16 h-16 rounded-full object-cover border-2 flex-shrink-0 transition-colors duration-300"
                                  style={{ borderColor: "var(--border-primary)" }}
                                  src={getDefaultBarberImage(barber.nome)}
                                  onError={(e) => {
                                    // Se a imagem padrão falhar, esconde o elemento
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              );
                            })()}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-base font-semibold truncate transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                                    {getNomeSobrenome(barber.nome)}
                                  </h3>
                                  {barber.funcao && (
                                    <p className="text-xs mt-0.5 transition-colors duration-300" style={{ color: "var(--text-tertiary)" }}>
                                      {barber.funcao}
                                    </p>
                                  )}
                                  <p className="text-xs truncate mt-0.5 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                                    {barber.email}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-3">
                            <PermissionGate
                              requiredPermissions={["manage_barbers"]}
                            >
                              <Button
                                className="transition-colors duration-300 font-semibold min-w-[50px]"
                                style={{ 
                                  backgroundColor: "#4ade80",
                                  color: "#000000",
                                }}
                                size="sm"
                                isIconOnly
                                aria-label="Editar"
                                variant="solid"
                                onPress={() => handleOpenModal(barber)}
                              >
                                <PencilIcon className="w-4 h-4" style={{ color: "#000000" }} />
                              </Button>
                            </PermissionGate>
                            <PermissionGate
                              requiredPermissions={["manage_barbers"]}
                            >
                              <Button
                                className="transition-colors duration-300 font-semibold min-w-[50px]"
                                style={{ 
                                  backgroundColor: "#f87171",
                                  color: "#000000",
                                }}
                                size="sm"
                                isIconOnly
                                aria-label="Excluir"
                                variant="solid"
                                onPress={() => {
                                  setSelectedBarber(barber);
                                  onDeleteOpen();
                                }}
                              >
                                <TrashIcon className="w-4 h-4" style={{ color: "#000000" }} />
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
          base: "border transition-colors duration-300 max-h-[95vh] my-2 rounded-t-lg",
          header:
            "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 border-b border-blue-500/30 rounded-t-lg",
          body: "py-6 transition-colors duration-300 overflow-y-auto max-h-[calc(95vh-200px)]",
          footer: "border-t transition-colors duration-300",
          closeButton:
            "text-white hover:bg-white/20 hover:text-white focus:bg-white/20",
          wrapper: "items-start md:items-center justify-center overflow-y-auto p-2 md:p-4",
        }}
        isOpen={isOpen}
        placement="center"
        size="2xl"
        onClose={handleCloseModal}
        scrollBehavior="inside"
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
            exit: {
              y: -20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeIn",
              },
            },
          },
        }}
      >
        <ModalContent className="transition-colors duration-300 mx-2 md:mx-0" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
              {selectedBarber
                ? "Editar Profissional"
                : "Adicionar Profissional"}
            </h2>
          </ModalHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <ModalBody>
              {/* Upload de Imagem */}
              <div className="mb-6">
                <div className="flex flex-col items-center gap-4">
                  {/* Preview da Imagem - Padrão circular como nos cards */}
                  <div className="relative">
                    {/* Mostra preview da nova imagem selecionada */}
                    {imagePreview && (
                      <>
                        <img
                          alt="Preview do avatar"
                          className="w-32 h-32 rounded-full object-cover border-2 border-gray-700"
                          src={imagePreview}
                        />
                        <button
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors shadow-lg z-10"
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                            setImageRemoved(true);
                            const fileInput = document.getElementById(
                              "avatar-upload"
                            ) as HTMLInputElement;
                            if (fileInput) {
                              fileInput.value = "";
                            }
                          }}
                        >
                          ×
                        </button>
                      </>
                    )}

                    {/* Mostra avatar existente (modo edição) */}
                    {!imagePreview && selectedBarber && selectedBarber.avatar && selectedBarber.avatar.trim() !== "" && !imageRemoved && (
                      <>
                        <img
                          alt="Avatar atual"
                          className="w-32 h-32 rounded-full object-cover border-2 border-gray-700"
                          src={
                            selectedBarber.avatar.startsWith("data:image")
                              ? selectedBarber.avatar
                              : `${import.meta.env.VITE_API}/barbeiros/avatar/${encodeURIComponent(selectedBarber.avatar)}`
                          }
                        />
                        <button
                          className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold transition-colors shadow-lg z-10"
                          type="button"
                          onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                            setImageRemoved(true);
                            const fileInput = document.getElementById(
                              "avatar-upload"
                            ) as HTMLInputElement;
                            if (fileInput) {
                              fileInput.value = "";
                            }
                          }}
                        >
                          ×
                        </button>
                      </>
                    )}

                    {/* Mostra imagem padrão do barbeiro (modo edição sem avatar ou removido) */}
                    {!imagePreview && selectedBarber && (!selectedBarber.avatar || selectedBarber.avatar.trim() === "" || imageRemoved) && (
                      <img
                        alt="Imagem padrão do barbeiro"
                        className="w-32 h-32 rounded-full object-cover border-2 border-gray-700"
                        src={getDefaultBarberImage(selectedBarber?.nome)}
                      />
                    )}

                    {/* Mostra imagem padrão (modo criação) */}
                    {!imagePreview && !selectedBarber && (
                      <img
                        alt="Imagem padrão de perfil"
                        className="w-32 h-32 rounded-full object-cover border-2 border-gray-700"
                        src="/barbeiros/icons-perfil.png"
                        onError={(e) => {
                          e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'/%3E%3C/svg%3E";
                        }}
                      />
                    )}
                  </div>

                  {/* Botão de Upload */}
                  <label
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    htmlFor="avatar-upload"
                  >
                    <User size={20} weight="bold" />
                    {selectedBarber ? "Alterar imagem" : "Adicionar imagem"}
                  </label>
                  <input
                    accept="image/*"
                    className="hidden"
                    id="avatar-upload"
                    type="file"
                    onChange={handleImageChange}
                  />
                  <p className="text-xs text-gray-400 text-center">
                    Formatos: PNG, JPG ou JPEG (máx. 5MB)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Controller
                  control={control}
                  name="nome"
                  render={({ field }) => (
                    <Input
                      {...field}
                      isRequired
                      classNames={{
                        base: "w-full",
                        input: "transition-colors duration-300",
                        label: "transition-colors duration-300",
                        inputWrapper: "transition-colors duration-300",
                      }}
                      style={{
                        ["--input-bg" as string]: "var(--input-bg)",
                        ["--input-border" as string]: "var(--input-border)",
                        ["--input-text" as string]: "var(--input-text)",
                      }}
                      errorMessage={errors.nome?.message}
                      isInvalid={!!errors.nome}
                      label="Nome Completo"
                      maxLength={100}
                      placeholder="Digite o nome completo"
                      onFocus={(e) => {
                        // No mobile, faz scroll para o campo quando focado
                        if (window.innerWidth <= 768) {
                          setTimeout(() => {
                            e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 300);
                        }
                      }}
                      onChange={(e) => {
                        const value = e.target.value;

                        // Permite apenas letras, espaços e caracteres acentuados
                        const sanitized = value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");

                        // Limita a 100 caracteres
                        const limited = sanitized.substring(0, 100);

                        field.onChange(limited);
                      }}
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
                        input: "transition-colors duration-300",
                        label: "transition-colors duration-300",
                        inputWrapper: "transition-colors duration-300",
                      }}
                      style={{
                        ["--input-bg" as string]: "var(--input-bg)",
                        ["--input-border" as string]: "var(--input-border)",
                        ["--input-text" as string]: "var(--input-text)",
                      }}
                      errorMessage={errors.email?.message}
                      isInvalid={!!errors.email}
                      label="Email"
                      maxLength={60}
                      placeholder="Digite o email"
                      type="email"
                      onFocus={(e) => {
                        // No mobile, faz scroll para o campo quando focado
                        if (window.innerWidth <= 768) {
                          setTimeout(() => {
                            e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 300);
                        }
                      }}
                      onChange={(e) => {
                        const value = e.target.value;

                        // Remove espaços e limita a 60 caracteres
                        const sanitized = value
                          .replace(/\s/g, "")
                          .substring(0, 60);

                        field.onChange(sanitized);
                      }}
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
                        input: "transition-colors duration-300",
                        label: "transition-colors duration-300",
                        inputWrapper: "transition-colors duration-300",
                      }}
                      style={{
                        ["--input-bg" as string]: "var(--input-bg)",
                        ["--input-border" as string]: "var(--input-border)",
                        ["--input-text" as string]: "var(--input-text)",
                      }}
                      errorMessage={errors.telefone?.message}
                      isInvalid={!!errors.telefone}
                      inputMode="numeric"
                      label="Telefone"
                      maxLength={15}
                      placeholder="(00) 00000-0000"
                      type="tel"
                      onFocus={(e) => {
                        // No mobile, faz scroll para o campo quando focado
                        if (window.innerWidth <= 768) {
                          setTimeout(() => {
                            e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 300);
                        }
                      }}
                      value={formatPhone(field.value || "")}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);

                        // Limita a 15 caracteres (formato: (00) 00000-0000)
                        const limited = formatted.substring(0, 15);

                        field.onChange(limited);
                      }}
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
                        input: "transition-colors duration-300",
                        label: "transition-colors duration-300",
                        inputWrapper: "transition-colors duration-300",
                      }}
                      style={{
                        ["--input-bg" as string]: "var(--input-bg)",
                        ["--input-border" as string]: "var(--input-border)",
                        ["--input-text" as string]: "var(--input-text)",
                      }}
                      errorMessage={errors.data_nascimento?.message}
                      isInvalid={!!errors.data_nascimento}
                      label="Data de Nascimento"
                      maxLength={10}
                      placeholder="DD/MM/AAAA"
                      onFocus={(e) => {
                        // No mobile, faz scroll para o campo quando focado
                        if (window.innerWidth <= 768) {
                          setTimeout(() => {
                            e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                          }, 300);
                        }
                      }}
                      value={field.value ? formatDate(field.value) : ""}
                      onChange={(e) => {
                        // Remove tudo que não é número
                        const digitsOnly = e.target.value.replace(/\D/g, "");

                        // Limita a 8 dígitos
                        const limited = digitsOnly.substring(0, 8);

                        // Formata como DD/MM/AAAA
                        const formatted = formatDate(limited);

                        field.onChange(formatted);
                      }}
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
                        className="w-full p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors duration-300"
                        style={{
                          backgroundColor: "var(--input-bg)",
                          borderColor: "var(--input-border)",
                          color: "var(--input-text)",
                        }}
                        id="funcao-select"
                        onFocus={(e) => {
                          // No mobile, faz scroll para o campo quando focado
                          if (window.innerWidth <= 768) {
                            setTimeout(() => {
                              e.target.scrollIntoView({ behavior: "smooth", block: "center" });
                            }, 300);
                          }
                        }}
                      >
                        <option value="">Selecione uma função</option>
                        {FUNCOES.map((funcao) => (
                          <option key={funcao.value} value={funcao.value}>
                            {funcao.selectLabel}
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
            <ModalFooter className="justify-between items-center">
              {selectedBarber ? (
                <div className="flex items-center gap-3">
                  <Switch
                    color={isActive ? "primary" : "danger"}
                    isSelected={isActive}
                    size="sm"
                    onValueChange={setIsActive}
                  >
                    <span
                      className={`text-sm font-medium ${
                        isActive ? "text-blue-400" : "text-red-400"
                      }`}
                    >
                      {isActive ? "Ativo" : "Inativo"}
                    </span>
                  </Switch>
                </div>
              ) : (
                <div />
              )}
              <div className="flex gap-2">
                <Button
                  color="danger"
                  isDisabled={isSubmitting}
                  variant="solid"
                  onPress={handleCloseModal}
                >
                  Cancelar
                </Button>
                <Button color="primary" isLoading={isSubmitting} type="submit">
                  {selectedBarber ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <Modal
        classNames={{
          base: "border transition-colors duration-300",
          header:
            "bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 border-b border-blue-500/30",
          body: "transition-colors duration-300",
          footer: "border-t transition-colors duration-300",
          closeButton:
            "text-white hover:bg-white/20 hover:text-white focus:bg-white/20",
        }}
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
      >
        <ModalContent className="transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
          <ModalHeader>
            <h2 className="text-xl font-bold text-white">Confirmar Exclusão</h2>
          </ModalHeader>
          <ModalBody style={{ backgroundColor: "var(--bg-card)" }}>
            <p className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
              Tem certeza que deseja excluir o profissional{" "}
              <span className="font-semibold transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                {selectedBarber?.nome}
              </span>
              ? Esta ação não pode ser desfeita.
            </p>
          </ModalBody>
          <ModalFooter style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
            <Button
              color="danger"
              isDisabled={isSubmitting}
              variant="solid"
              onPress={onDeleteClose}
            >
              Não
            </Button>
            <Button
              color="primary"
              isLoading={isSubmitting}
              variant="solid"
              onPress={handleDelete}
            >
              Sim
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Footer />
    </section>
  );
}
