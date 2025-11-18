import { useEffect } from "react";
import { initMercadoPago } from "@mercadopago/sdk-react";

import { apiBarber } from "@/services/apiServer";

interface PaymentData {
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  token?: string;
  card?: {
    cardNumber: string;
    cardholderName: string;
    cardExpirationMonth: string;
    cardExpirationYear: string;
    securityCode: string;
  };
  installments?: number;
  payer: {
    email: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  metadata?: Record<string, any>;
}

/**
 * Resposta da rota POST /mercado-pago/pix
 * (aquela que você montou no back)
 */
interface PixPaymentResponse {
  id: number;
  status: string;
  qr_code?: string;
  qr_code_base64?: string;
}

/**
 * Resposta da rota GET /mercado-pago/pix/:id/status
 */
interface PixStatusResponse {
  status: string;
  agendamentoId?: string;
}

const useMercadoPago = () => {
  useEffect(() => {
    const publicKey = import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY;

    if (!publicKey) {
      console.warn(
        "VITE_MERCADO_PAGO_PUBLIC_KEY não está configurada. Configure a variável de ambiente."
      );

      return;
    }

    initMercadoPago(publicKey);
  }, []);

  async function processPayment(
    paymentData: PaymentData
  ): Promise<PixPaymentResponse> {
    try {
      const response = await apiBarber.post<PixPaymentResponse>(
        // 👇 agora bate na rota correta do back:
        "/mercado-pago/pix",
        paymentData
      );

      return response.data;
    } catch (error: any) {
      console.error("Erro ao processar pagamento do Mercado Pago:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Erro ao processar pagamento. Tente novamente.";

      throw new Error(errorMessage);
    }
  }

  async function checkPaymentStatus(
    paymentId: number
  ): Promise<PixStatusResponse> {
    try {
      const response = await apiBarber.get<PixStatusResponse>(
        // 👇 mesma rota que você definiu nas rotas:
        `/mercado-pago/pix/${paymentId}/status`
      );

      return response.data;
    } catch (error: any) {
      console.error("Erro ao verificar status do pagamento:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Erro ao verificar status do pagamento.";

      throw new Error(errorMessage);
    }
  }

  return { processPayment, checkPaymentStatus };
};

export default useMercadoPago;
