// src/pages/ConfirmAppointmentPage.tsx
import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

import { Header } from "@/components/Header";
import { formatPrice } from "@/utils/format-price";
import { IServices } from "@/contexts/ScheduleProvider/types";
import useMercadoPago from "@/hooks/useMercadoPago";
import { useAuth } from "@/contexts/AuthProvider/useAuth";

interface LocationState {
  barber?: { id: string; nome: string };
  selectedServices?: IServices[];
  selectedDate?: string;
  selectedTime?: string;
  totalDuration?: number;
}

export function ConfirmAppointmentPage() {
  const { createMercadoPagoCheckout } = useMercadoPago();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: LocationState };

  const {
    barber,
    selectedServices,
    selectedDate,
    selectedTime,
    totalDuration,
  } = location.state || {};

  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted] = useState(false); // você pode ligar isso a uma página de resultado depois

  const totalPrice =
    selectedServices?.reduce(
      (sum, service) => sum + Number(service.preco),
      0
    ) || 0;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleConfirmAppointment = async () => {
    if (!selectedServices || selectedServices.length === 0) {
      alert("Selecione pelo menos um serviço.");

      return;
    }

    if (!user?.user?.email) {
      alert("Erro: usuário não autenticado. Faça login novamente.");
      navigate("/");

      return;
    }

    setIsProcessing(true);

    try {
      const servicesDescription = selectedServices
        .map((service) => service.nome)
        .join(", ");

      // Esse shape bate com o seu hook + controller
      const checkoutData = {
        title: `Agendamento - ${barber?.nome || "Barbeiro"}`,
        quantity: 1,
        unit_price: totalPrice,
        description: `Serviços: ${servicesDescription} | Data: ${formatDate(
          selectedDate
        )} | Horário: ${selectedTime}`,
        payer: {
          email: user.user.email,
          name: user.user.nome?.split(" ")[0] || "",
          surname: user.user.nome?.split(" ").slice(1).join(" ") || "",
        },
        metadata: {
          barberId: barber?.id,
          barberName: barber?.nome,
          selectedDate,
          selectedTime,
          totalDuration,
          services: selectedServices.map((s) => ({
            id: s.id,
            nome: s.nome,
            preco: s.preco,
            duracao: s.duracao,
          })),
          userId: user.user.id, // se quiser usar depois no webhook
        },
      };

      await createMercadoPagoCheckout(checkoutData);
      // usuário será redirecionado para o Checkout Pro
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      setIsProcessing(false);
    }
  };

  const handleBackTohome = () => {
    navigate("/home");
  };

  if (isCompleted) {
    return (
      <section className="min-h-screen bg-gray-800">
        <Header />
        <div className="px-4 py-8 md:px-8">
          <Helmet title="Agendamento Concluído" />
          <div className="mx-auto max-w-2xl">
            <div className="relative rounded-xl overflow-hidden shadow-lg bg-green-700 h-40 mb-6 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-2">✅</div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  Agendamento concluído!
                </h1>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <div className="text-left">
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">
                      Detalhes do Agendamento
                    </h3>
                    <span className="bg-green-600 text-white text-center text-xs px-2 py-1 rounded-full">
                      Pagamento Confirmado
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 pb-4 border-b border-gray-700">
                    {barber && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Barbeiro:</span>
                        <span className="text-white font-medium">
                          {barber.nome}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Data:</span>
                      <span className="text-white font-medium">
                        {formatDate(selectedDate)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Horário:</span>
                      <span className="text-white font-medium">
                        {selectedTime}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-3">
                      {selectedServices && selectedServices.length > 1
                        ? "Serviços Contratados:"
                        : "Serviço Contratado:"}
                    </h4>
                    <div className="space-y-2">
                      {selectedServices?.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center gap-2"
                        >
                          <span className="text-yellow-400">✓</span>
                          <span className="text-white">{service.nome}</span>
                          <span className="text-gray-400 text-sm">
                            ({service.duracao} min)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-700">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-400">Duração total:</span>
                      <span className="text-white font-medium">
                        {totalDuration} minutos
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-white my-4 text-sm mb-10">
                  Pedimos que chegue com antecedência no horário agendado.
                  Obrigado pela preferência! 😉
                </p>
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  type="button"
                  onClick={handleBackTohome}
                >
                  Voltar à página inicial
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
      <Header />
      <div className="p-4 pb-10 md:px-8">
        <Helmet title="Confirmar Agendamento" />

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

          <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-800 h-40 mb-6">
            <img
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-100"
              src="/image-1.png"
            />
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                Confirmar Agendamento
              </h1>
            </div>
          </div>

          {selectedServices && selectedServices.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4 mb-6">
              <h3 className="text-white font-medium mb-4">
                Resumo do Agendamento
              </h3>

              <div className="space-y-2 mb-4 pb-4 border-b border-gray-700 text-sm">
                {barber && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Barbeiro:</span>
                    <span className="text-white font-medium">
                      {barber.nome}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-400">Data:</span>
                  <span className="text-white font-medium">
                    {formatDate(selectedDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Horário:</span>
                  <span className="text-white font-medium">{selectedTime}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-400 mb-3 uppercase">
                  {selectedServices.length > 1
                    ? "Serviços Contratados:"
                    : "Serviço Contratado:"}
                </h4>
                <div className="space-y-2">
                  {selectedServices.map((service, index) => (
                    <div
                      key={service.id}
                      className="bg-gray-800 rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-yellow-400 text-sm font-medium">
                          {index + 1}. {service.nome}
                        </span>
                        <span className="text-green-400 font-semibold text-sm">
                          {formatPrice(Number(service.preco))}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Duração: {service.duracao} min
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Tempo total:</span>
                  <span className="text-white font-medium">
                    {totalDuration} min
                  </span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-white font-semibold">
                    Total a pagar:
                  </span>
                  <span className="text-green-400 font-bold">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}

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
            {isProcessing ? "Processando pagamento..." : "Realizar pagamento "}
          </button>
        </div>
      </div>
    </section>
  );
}
