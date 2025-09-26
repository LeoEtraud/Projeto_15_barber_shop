import { Helmet } from "react-helmet-async";
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

import { useAuth } from "@/contexts/AuthProvider/useAuth";

export function ConfirmAppointmentPage() {
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: {
      barberId?: string;
      serviceId?: string;
      serviceName?: string;
      servicePrice?: string;
      serviceDuration?: string;
      selectedDate?: string;
      selectedTime?: string;
    };
  };

  const {
    barberId,
    serviceName,
    servicePrice,
    serviceDuration,
    selectedDate,
    selectedTime,
  } = location.state || {};

  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { user, logout } = useAuth();

  function getUserInitials(name?: string) {
    if (!name) return "U";
    const parts = name.trim().split(" ").filter(Boolean);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";

    return (first + last).toUpperCase() || "U";
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    // Criar a data no fuso horário local para evitar problemas de UTC
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day); // month - 1 porque Date usa 0-11 para meses

    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const paymentMethods = [
    {
      id: "pix",
      name: "PIX",
      description: "Pagamento instantâneo",
      icon: "💳",
    },
    {
      id: "credit",
      name: "Cartão de Crédito",
      description: "Parcelamento disponível",
      icon: "💳",
    },
    {
      id: "debit",
      name: "Cartão de Débito",
      description: "Débito em conta",
      icon: "💳",
    },
  ];

  const handleConfirmAppointment = async () => {
    if (!selectedPayment) return;

    setIsProcessing(true);

    // Simular processamento do pagamento
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsProcessing(false);
    setIsCompleted(true);
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  if (isCompleted) {
    return (
      <section className="min-h-screen bg-gray-800">
        {/* Header fixo */}
        <header className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button
              aria-label="Ir para inicial"
              className="flex items-center gap-2 focus:outline-none"
              type="button"
              onClick={() => navigate("/dashboard")}
            >
              <img
                alt="Logo da Barbearia"
                className="h-8 w-auto select-none"
                src="/img-barber-icon.png"
              />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button className="rounded-full focus:outline-none">
                  <Avatar
                    isBordered
                    className="w-7 h-7 text-sm"
                    color="default"
                    name={user?.user?.nome}
                  >
                    {getUserInitials(user?.user?.nome)}
                  </Avatar>
                </button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Menu do usuário"
                onAction={(key) => {
                  if (key === "profile") navigate("/about");
                  if (key === "logout") logout();
                }}
              >
                <DropdownItem key="profile">Perfil</DropdownItem>
                <DropdownItem
                  key="logout"
                  className="text-danger"
                  color="danger"
                >
                  Sair
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </header>

        {/* Conteúdo principal */}
        <div className="px-4 py-8 md:px-8">
          <Helmet title="Agendamento Concluído" />

          <div className="mx-auto max-w-2xl">
            {/* Banner de sucesso */}
            <div className="relative rounded-xl overflow-hidden shadow-lg bg-green-600 h-40 mb-6 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-2">✅</div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  Agendamento Concluído!
                </h1>
              </div>
            </div>

            {/* Mensagem de sucesso */}
            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Seu agendamento foi confirmado com sucesso!
                </h2>
                <p className="text-gray-300 mb-4">
                  Chegue com antecedência no local, obrigado pela preferência.
                </p>
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-medium text-white mb-2">
                    Detalhes do Agendamento
                  </h3>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div>Serviço: {serviceName}</div>
                    <div>Preço: {servicePrice}</div>
                    <div>Duração: {serviceDuration}</div>
                    <div>Data: {formatDate(selectedDate)}</div>
                    <div>Horário: {selectedTime}</div>
                    {barberId && <div>Barbeiro: #{barberId}</div>}
                  </div>
                </div>
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  type="button"
                  onClick={handleBackToDashboard}
                >
                  Voltar ao Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-gray-800">
      {/* Header fixo */}
      <header className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button
            aria-label="Ir para inicial"
            className="flex items-center gap-2 focus:outline-none"
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            <img
              alt="Logo da Barbearia"
              className="h-8 w-auto select-none"
              src="/img-barber-icon.png"
            />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <button className="rounded-full focus:outline-none">
                <Avatar
                  isBordered
                  className="w-7 h-7 text-sm"
                  color="default"
                  name={user?.user?.nome}
                >
                  {getUserInitials(user?.user?.nome)}
                </Avatar>
              </button>
            </DropdownTrigger>
            <DropdownMenu
              aria-label="Menu do usuário"
              onAction={(key) => {
                if (key === "profile") navigate("/about");
                if (key === "logout") logout();
              }}
            >
              <DropdownItem key="profile">Perfil</DropdownItem>
              <DropdownItem key="logout" className="text-danger" color="danger">
                Sair
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="px-4 py-8 md:px-8">
        <Helmet title="Confirmar Agendamento" />

        <div className="mx-auto max-w-2xl">
          <button
            className="text-sm text-gray-300 hover:text-white mb-4"
            type="button"
            onClick={() => navigate(-1)}
          >
            Voltar
          </button>

          {/* Banner com imagem de fundo */}
          <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 h-32 mb-6">
            <img
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              src="/image-1.png"
            />
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Confirmar Agendamento
              </h1>
            </div>
          </div>

          {/* Resumo do agendamento */}
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <h3 className="text-white font-medium mb-2">
              Resumo do Agendamento
            </h3>
            <div className="text-sm text-gray-300 space-y-1">
              <div>Serviço: {serviceName}</div>
              <div>Preço: {servicePrice}</div>
              <div>Duração: {serviceDuration}</div>
              <div>Data: {formatDate(selectedDate)}</div>
              <div>Horário: {selectedTime}</div>
              {barberId && <div>Barbeiro: #{barberId}</div>}
            </div>
          </div>

          {/* Seleção de forma de pagamento */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">
              Selecione a forma de pagamento
            </h2>
            <div className="grid grid-cols-1 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  className={`p-4 rounded-lg text-left transition-colors ${
                    selectedPayment === method.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-900 text-gray-300 hover:bg-gray-700"
                  }`}
                  type="button"
                  onClick={() => setSelectedPayment(method.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className="text-sm opacity-75">
                        {method.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Botão de confirmação */}
          {selectedPayment && (
            <button
              className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors ${
                isProcessing
                  ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
              disabled={isProcessing}
              type="button"
              onClick={handleConfirmAppointment}
            >
              {isProcessing
                ? "Processando pagamento..."
                : "Confirmar Agendamento"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
