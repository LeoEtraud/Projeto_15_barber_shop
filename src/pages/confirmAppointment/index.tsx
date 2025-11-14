import { Helmet } from "react-helmet-async";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
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
  const { processPayment, checkPaymentStatus } = useMercadoPago();
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
  const [isCompleted, setIsCompleted] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [pixPaymentId, setPixPaymentId] = useState<number | null>(null);
  const [pixStatus, setPixStatus] = useState<string>("pending");
  const [copied, setCopied] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Polling para verificar status do pagamento PIX
  useEffect(() => {
    if (pixPaymentId && pixStatus === "pending") {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const statusResponse = await checkPaymentStatus(pixPaymentId);

          setPixStatus(statusResponse.status);

          if (statusResponse.status === "approved") {
            setIsCompleted(true);
            setIsProcessing(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
          } else if (
            statusResponse.status === "rejected" ||
            statusResponse.status === "cancelled"
          ) {
            setPaymentError("Pagamento PIX foi rejeitado ou cancelado.");
            setIsProcessing(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
          }
        } catch (error) {
          console.error("Erro ao verificar status do PIX:", error);
        }
      }, 3000); // Verifica a cada 3 segundos
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [pixPaymentId, pixStatus, checkPaymentStatus]);

  const handleConfirmAppointment = async () => {
    if (!selectedServices || selectedServices.length === 0) {
      alert("Selecione pelo menos um serviço.");

      return;
    }

    const firstServiceId = selectedServices[0]?.id;

    if (!firstServiceId) {
      setPaymentError("Erro ao preparar dados do serviço para o pagamento.");

      return;
    }

    if (!user?.user?.email) {
      alert("Erro: usuário não autenticado. Faça login novamente.");
      navigate("/");

      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const servicesDescription =
        selectedServices?.map((service) => service.nome).join(", ") || "";

      // Preparar dados do pagamento PIX
      const paymentData = {
        transaction_amount: totalPrice,
        description: `Agendamento - ${barber?.nome || "Barbeiro"}: ${servicesDescription}`,
        payment_method_id: "pix",
        payer: {
          email: user?.user?.email || "",
        },
        metadata: {
          barberId: barber?.id,
          barberName: barber?.nome,
          selectedDate,
          selectedTime,
          totalDuration,
          firstServiceId,
          userId: user?.user?.id,
        },
      };

      const paymentResponse = await processPayment(paymentData);

      // Backend já devolve os campos direto
      const qrCodeBase64 = paymentResponse.qr_code_base64;
      const pixCodeString = paymentResponse.qr_code;

      if (qrCodeBase64) {
        setPixQrCode(qrCodeBase64);
      }

      if (pixCodeString && typeof pixCodeString === "string") {
        setPixCode(pixCodeString);
      }

      if (!qrCodeBase64 && !pixCodeString) {
        throw new Error(
          "QR Code ou código PIX não foi gerado. Tente novamente."
        );
      }

      setPixPaymentId(paymentResponse.id);
      setPixStatus(paymentResponse.status || "pending");
      setIsProcessing(false);
    } catch (error: any) {
      console.error("Erro ao processar pagamento:", error);
      setPaymentError(
        error.message || "Erro ao processar pagamento. Tente novamente."
      );
      setIsProcessing(false);
    }
  };

  const handleBackTohome = () => {
    navigate("/home");
  };

  const handleCopyPixCode = async () => {
    if (pixCode) {
      try {
        await navigator.clipboard.writeText(pixCode);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      } catch (error) {
        console.error("Erro ao copiar código PIX:", error);
        // Fallback para navegadores mais antigos
        const textArea = document.createElement("textarea");

        textArea.value = pixCode;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand("copy");
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        } catch (err) {
          console.error("Erro ao copiar:", err);
        }
        document.body.removeChild(textArea);
      }
    }
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

  // PÁGINA DE CONFIRMAÇÃO DE AGENDAMENTO
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

          {/* QR Code PIX */}
          {(pixQrCode || pixCode) && (
            <div className="bg-gray-900 rounded-lg p-6 mb-6">
              <h3 className="text-white font-medium mb-4 text-center">
                {pixQrCode
                  ? "Escaneie o QR Code para pagar"
                  : pixCode
                    ? "Código PIX gerado"
                    : "Pagamento PIX"}
              </h3>

              {paymentError && (
                <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4">
                  <p className="text-red-200 text-sm">{paymentError}</p>
                </div>
              )}

              <div className="flex flex-col items-center space-y-4">
                {pixQrCode && (
                  <div className="bg-white p-4 rounded-lg">
                    {pixQrCode.startsWith("data:image") ? (
                      <img
                        alt="QR Code PIX"
                        className="w-64 h-64"
                        src={pixQrCode}
                      />
                    ) : (
                      <img
                        alt="QR Code PIX"
                        className="w-64 h-64"
                        src={`data:image/png;base64,${pixQrCode}`}
                      />
                    )}
                  </div>
                )}

                {pixCode && (
                  <div className="w-full space-y-3">
                    <div>
                      <p className="block text-sm text-gray-400 mb-2 text-center">
                        Código PIX (Copie e cole no app do seu banco)
                      </p>
                      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                        <p className="text-white text-sm break-all font-mono">
                          {pixCode}
                        </p>
                      </div>
                    </div>
                    <button
                      className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
                        copied
                          ? "bg-green-600 text-white"
                          : "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                      }`}
                      type="button"
                      onClick={handleCopyPixCode}
                    >
                      {copied ? "✓ Código copiado!" : "📋 Copiar código PIX"}
                    </button>
                  </div>
                )}

                <div className="text-center space-y-2">
                  <p className="text-gray-400 text-sm">
                    Valor:{" "}
                    <span className="text-green-400 font-bold">
                      {formatPrice(totalPrice)}
                    </span>
                  </p>
                  <p className="text-gray-400 text-sm">
                    Status:{" "}
                    <span
                      className={`font-medium ${
                        pixStatus === "approved"
                          ? "text-green-400"
                          : pixStatus === "rejected" ||
                              pixStatus === "cancelled"
                            ? "text-red-400"
                            : "text-yellow-400"
                      }`}
                    >
                      {pixStatus === "approved"
                        ? "Aprovado"
                        : pixStatus === "rejected"
                          ? "Rejeitado"
                          : pixStatus === "cancelled"
                            ? "Cancelado"
                            : "Aguardando pagamento"}
                    </span>
                  </p>
                  {pixStatus === "pending" && (
                    <p className="text-gray-500 text-xs mt-2">
                      Aguardando confirmação do pagamento...
                    </p>
                  )}
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
            disabled={
              isProcessing || (pixQrCode !== null && pixStatus === "pending")
            }
            type="button"
            onClick={handleConfirmAppointment}
          >
            {isProcessing
              ? "Processando..."
              : pixQrCode || pixCode
                ? "Aguardando pagamento PIX..."
                : "Gerar pagamento PIX"}
          </button>
        </div>
      </div>
    </section>
  );
}
