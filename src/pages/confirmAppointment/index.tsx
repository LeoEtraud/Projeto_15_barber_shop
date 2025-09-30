import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";

import { Header } from "@/components/Header";

type Service = {
  id: string;
  label: string;
  price: string;
  duration: string;
};

export function ConfirmAppointmentPage() {
  const navigate = useNavigate();
  const location = useLocation() as {
    state?: {
      barberId?: string;
      selectedServices?: Service[];
      selectedDate?: string;
      selectedTime?: string;
    };
  };

  const { barberId, selectedServices, selectedDate, selectedTime } =
    location.state || {};

  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

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
      name: "Pix",
      description: "Pagamento instantâneo",
      icon: (
        <img
          alt="Logo do Pix"
          className="w-8 h-8 drop-shadow-md"
          src="/pix.png"
        />
      ),
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

  const handleBackTohome = () => {
    navigate("/home");
  };

  if (isCompleted) {
    return (
      <section className="min-h-screen bg-gray-800">
        {/* COMPONENTE CABEÇALH0 */}
        <Header />
        {/* Conteúdo principal */}
        <div className="px-4 py-8 md:px-8">
          <Helmet title="Agendamento Concluído" />

          <div className="mx-auto max-w-2xl">
            {/* Banner de sucesso */}
            <div className="relative rounded-xl overflow-hidden shadow-lg bg-green-600 h-40 mb-6 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-2">✅</div>
                <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                  Agendamento concluído!
                </h1>
              </div>
            </div>

            {/* Mensagem de sucesso */}
            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <div className="text-left">
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-medium text-white mb-2">
                    Detalhes do Agendamento
                  </h3>
                  {selectedServices?.map((service) => (
                    <div
                      key={service.id}
                      className="text-sm text-yellow-400 space-y-1"
                    >
                      <div>Data: {formatDate(selectedDate)}</div>
                      <div>Horário: {selectedTime}</div>
                      <div>Serviço: {service.label}</div>
                      <div>Duração: {service.duration}</div>
                      <div>Preço: {service.price}</div>
                      {barberId && <div>Barbeiro: #{barberId}</div>}
                    </div>
                  ))}
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
      {/* COMPONENTE CABEÇALH0 */}
      <Header />
      {/* Conteúdo principal */}
      <div className="px-4 py-8 md:px-8">
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

          {/* Banner com imagem de fundo */}
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

          {/* Resumo do agendamento */}
          <div className="bg-gray-900 rounded-lg p-4 mb-6">
            <h3 className="text-white font-medium mb-2">
              Resumo do Agendamento
            </h3>

            {selectedServices?.map((service) => (
              <div key={service.id} className="text-sm text-gray-300 space-y-1">
                <div>Data: {formatDate(selectedDate)}</div>
                <div>Horário: {selectedTime}</div>
                <div>Serviço: {service.label}</div>
                <div>Duração: {service.duration}</div>
                <div>Preço: {service.price}</div>
                {barberId && <div>Barbeiro: #{barberId}</div>}
              </div>
            ))}
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
