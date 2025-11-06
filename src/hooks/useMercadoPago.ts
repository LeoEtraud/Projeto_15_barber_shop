// src/hooks/useMercadoPago.ts
import { useEffect } from "react";
import { initMercadoPago } from "@mercadopago/sdk-react";

import { apiBarber } from "@/services/apiServer";

interface CheckoutData {
  title: string;
  quantity: number;
  unit_price: number;
  description?: string;
  payer?: {
    email: string;
    name?: string;
    surname?: string;
  };
  metadata?: Record<string, any>;
}

interface CheckoutResponse {
  id: string;
  init_point: string;
  sandbox_init_point?: string;
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

  async function createMercadoPagoCheckout(
    checkoutData: CheckoutData
  ): Promise<void> {
    try {
      const response = await apiBarber.post<CheckoutResponse>(
        "/mercado-pago/create-checkout", // ou "/api/mercado-pago/create-checkout", dependendo do seu back
        checkoutData
      );

      const data = response.data;

      if (data.init_point) {
        window.location.href = data.init_point;
      } else if (data.sandbox_init_point) {
        window.location.href = data.sandbox_init_point;
      } else {
        throw new Error("URL de checkout não encontrada na resposta");
      }
    } catch (error: any) {
      console.error("Erro ao criar checkout do Mercado Pago:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Erro ao processar pagamento. Tente novamente.";

      alert(errorMessage);
      throw error;
    }
  }

  return { createMercadoPagoCheckout };
};

export default useMercadoPago;
