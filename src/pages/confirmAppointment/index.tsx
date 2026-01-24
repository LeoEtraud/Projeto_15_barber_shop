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

  // ===========================
  // POLLING DO PAGAMENTO PIX
  // ===========================
  useEffect(() => {
    if (pixPaymentId && pixStatus === "pending") {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const statusResponse = await checkPaymentStatus(pixPaymentId);

          setPixStatus(statusResponse.status);

          // Quando está aprovado
          if (statusResponse.status === "approved") {
            if ((statusResponse as any).agendamentoId) {
              // Fluxo correto: aprovado e agendamento criado
              setIsCompleted(true);
              setIsProcessing(false);
            } else {
              // Caso raro: aprovado mas o back não criou o agendamento
              setPaymentError(
                "Pagamento aprovado, porém o agendamento não foi criado. Tente novamente."
              );
              setIsProcessing(false);
            }

            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
          }

          if (
            statusResponse.status === "rejected" ||
            statusResponse.status === "cancelled"
          ) {
            setPaymentError("Pagamento PIX foi rejeitado ou cancelado.");
            setIsProcessing(false);

            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
          }
        } catch (error: any) {
          console.error("Erro ao verificar status do PIX:", error);
          setPaymentError(
            error?.message || "Erro ao verificar status do pagamento."
          );
          setIsProcessing(false);

          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
        }
      }, 3000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [pixPaymentId, pixStatus, checkPaymentStatus]);

  // ===========================
  // INICIAR PAGAMENTO PIX
  // ===========================
  const handleConfirmAppointment = async () => {
    if (!selectedServices || selectedServices.length === 0) {
      alert("Selecione pelo menos um serviço.");

      return;
    }

    if (!barber?.id) {
      setPaymentError("Erro: barbeiro não encontrado.");

      return;
    }

    if (!selectedDate || !selectedTime || !totalDuration) {
      setPaymentError(
        "Data, horário ou duração total do agendamento não foram definidos."
      );

      return;
    }

    if (!user?.user?.email || !user?.user?.id) {
      alert("Erro: usuário não autenticado. Faça login novamente.");
      navigate("/");

      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      const servicesDescription =
        selectedServices.map((service) => service.nome).join(", ") || "";

      // 👇 MONTA O ARRAY QUE O BACK-END ESPERA
      const servicesPayload = selectedServices.map((service) => ({
        id: service.id,
        // pode ser string ou number, o back faz Number(...)
        preco: service.preco,
        duracao: service.duracao,
      }));

      const paymentData = {
        transaction_amount: totalPrice,
        description: `Agendamento - ${barber?.nome || "Barbeiro"}: ${servicesDescription}`,
        payment_method_id: "pix",
        payer: {
          email: user.user.email,
        },
        metadata: {
          barberId: barber.id,
          userId: user.user.id,
          selectedDate,
          selectedTime,
          totalDuration,
          services: servicesPayload,
          // se quiser pode manter extras, o back ignora:
          barberName: barber.nome,
        },
      };

      const paymentResponse = await processPayment(paymentData);

      const qrCodeBase64 = paymentResponse.qr_code_base64;
      const pixCodeString = paymentResponse.qr_code;

      if (qrCodeBase64) setPixQrCode(qrCodeBase64);
      if (pixCodeString) setPixCode(pixCodeString);

      if (!qrCodeBase64 && !pixCodeString) {
        throw new Error("QR Code PIX não foi gerado. Tente novamente.");
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

  // ===========================
  // COPIAR CÓDIGO PIX
  // ===========================
  const handleCopyPixCode = async () => {
    if (!pixCode) return;

    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");

      textarea.value = pixCode;
      textarea.style.position = "fixed";
      textarea.style.left = "-999999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBackTohome = () => navigate("/home");

  // ===========================
  // TELA DE AGENDAMENTO CONCLUÍDO
  // ===========================
  if (isCompleted) {
    return (
      <section className="min-h-screen transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)" }}>
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

            <div className="rounded-lg p-6 mb-6 transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
              <div className="text-left">
                <div className="rounded-lg p-4 mb-4 transition-colors duration-300" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                      Detalhes do Agendamento
                    </h3>
                    <span className="bg-green-600 text-white text-center text-xs px-2 py-1 rounded-full">
                      Pagamento Confirmado
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 pb-4 border-b transition-colors duration-300" style={{ borderColor: "var(--border-primary)" }}>
                    {barber && (
                      <div className="flex justify-between">
                        <span className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Barbeiro:</span>
                        <span className="font-medium transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                          {barber.nome}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Data:</span>
                      <span className="font-medium transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                        {formatDate(selectedDate)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Horário:</span>
                      <span className="font-medium transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                        {selectedTime}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-3 transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
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
                          <span className="transition-colors duration-300" style={{ color: "var(--text-primary)" }}>{service.nome}</span>
                          <span className="text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                            ({service.duracao} min)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t transition-colors duration-300" style={{ borderColor: "var(--border-primary)" }}>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Duração total:</span>
                      <span className="font-medium transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                        {totalDuration} minutos
                      </span>
                    </div>
                  </div>
                </div>

                <p className="my-4 text-sm mb-10 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
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

  // ===========================
  // TELA PRINCIPAL
  // ===========================
  return (
    <section className="min-h-screen transition-colors duration-300" style={{ backgroundColor: "var(--bg-primary)" }}>
      <Header />

      <div className="p-4 pb-10 md:px-8">
        <Helmet title="Confirmar Agendamento" />

        <div className="mx-auto max-w-2xl">
          <button
            className="text-sm mb-4 w-8 h-8 flex items-center justify-center border rounded-full transition-colors duration-300 hover:bg-[var(--bg-hover)]"
            style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}
            type="button"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon className="w-6 h-6 text-yellow-400" />
          </button>

          <div className="relative rounded-xl overflow-hidden shadow-lg h-40 mb-6 transition-colors duration-300" style={{ backgroundColor: "var(--bg-secondary)" }}>
            <img
              alt="Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-100"
              src="/image-1.png"
            />
            <div className="absolute bottom-0 left-0 p-4">
              <h1 className="text-2xl font-bold drop-shadow-lg transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                Confirmar Agendamento
              </h1>
            </div>
          </div>

          {/* ================================ */}
          {/*   RESUMO DO AGENDAMENTO          */}
          {/* ================================ */}
          {selectedServices && selectedServices.length > 0 && (
            <div className="rounded-lg p-4 mb-6 transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
              <h3 className="font-medium mb-4 transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                Resumo do Agendamento
              </h3>

              <div className="space-y-2 mb-4 pb-4 border-b text-sm transition-colors duration-300" style={{ borderColor: "var(--border-primary)" }}>
                {barber && (
                  <div className="flex justify-between">
                    <span className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Barbeiro:</span>
                    <span className="font-medium transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                      {barber.nome}
                    </span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Data:</span>
                  <span className="font-medium transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                    {formatDate(selectedDate)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Horário:</span>
                  <span className="font-medium transition-colors duration-300" style={{ color: "var(--text-primary)" }}>{selectedTime}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-xs font-medium mb-3 uppercase transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                  {selectedServices.length > 1
                    ? "Serviços Contratados:"
                    : "Serviço Contratado:"}
                </h4>

                <div className="space-y-2">
                  {selectedServices.map((service, index) => (
                    <div
                      key={service.id}
                      className="rounded-lg p-3 transition-colors duration-300"
                      style={{ backgroundColor: "var(--bg-secondary)" }}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-yellow-400 text-sm font-medium">
                          {index + 1}. {service.nome}
                        </span>
                        <span className="text-green-400 font-semibold text-sm">
                          {formatPrice(Number(service.preco))}
                        </span>
                      </div>

                      <div className="text-xs transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                        Duração: {service.duracao} min
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t transition-colors duration-300" style={{ borderColor: "var(--border-primary)" }}>
                <div className="flex justify-between text-sm">
                  <span className="transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>Tempo total:</span>
                  <span className="font-medium transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                    {totalDuration} min
                  </span>
                </div>

                <div className="flex justify-between text-base">
                  <span className="font-semibold transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                    Total a pagar:
                  </span>
                  <span className="text-green-400 font-bold">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================================ */}
          {/*   QR CODE PIX GERADO             */}
          {/* ================================ */}
          {(pixQrCode || pixCode) && (
            <div className="rounded-lg p-6 mb-6 transition-colors duration-300" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>
              <h3 className="font-medium mb-4 text-center transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
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
                {/* QR CODE */}
                {pixQrCode && (
                  <div className="bg-white p-4 rounded-lg">
                    <img
                      alt="QR Code PIX"
                      className="w-64 h-64"
                      src={
                        pixQrCode.startsWith("data:image")
                          ? pixQrCode
                          : `data:image/png;base64,${pixQrCode}`
                      }
                    />
                  </div>
                )}

                {/* CHAVE PIX */}
                {pixCode && (
                  <div className="w-full space-y-3">
                    <p className="block text-sm mb-2 text-center transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                      Código PIX (copie e cole no app do banco)
                    </p>

                    <div className="rounded-lg p-4 border transition-colors duration-300" style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border-primary)" }}>
                      <p className="text-sm break-all font-mono transition-colors duration-300" style={{ color: "var(--text-primary)" }}>
                        {pixCode}
                      </p>
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
                  <p className="text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
                    Valor:{" "}
                    <span className="text-green-400 font-bold">
                      {formatPrice(totalPrice)}
                    </span>
                  </p>

                  <p className="text-sm transition-colors duration-300" style={{ color: "var(--text-secondary)" }}>
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
                </div>
              </div>
            </div>
          )}

          {/* ================================ */}
          {/*   BOTÃO PRINCIPAL                */}
          {/* ================================ */}
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
