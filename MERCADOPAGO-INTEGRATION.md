# 💳 Integração com Mercado Pago

Este documento descreve como a página de Confirmar Agendamento foi preparada para integração com o gateway de pagamento do Mercado Pago.

## 📁 Arquivos Criados/Modificados

### Novos Arquivos

1. **`src/types/payment.ts`**

   - Tipos TypeScript para todas as interfaces de pagamento
   - Tipos para requisições e respostas do Mercado Pago
   - Status de pagamento e métodos de pagamento suportados

2. **`src/services/mercadopago.ts`**
   - Funções para comunicação com o backend
   - `createPayment()` - Cria pagamento no Mercado Pago
   - `checkPaymentStatus()` - Verifica status do pagamento
   - `handlePaymentWebhook()` - Processa webhooks do Mercado Pago

### Arquivos Modificados

1. **`src/pages/confirmAppointment/index.tsx`**
   - Integrado com os novos tipos e serviços
   - Adicionado suporte para diferentes métodos de pagamento
   - Interface para exibir QR Code do PIX
   - Campo de parcelas para cartão de crédito
   - Fluxo de processamento de pagamento

## 🔧 Estrutura Implementada

### Tipos de Pagamento Suportados

- ✅ **PIX** - Pagamento instantâneo com QR Code
- ✅ **Cartão de Crédito** - Com suporte a parcelamento (1-12x)
- ✅ **Cartão de Débito** - Débito em conta

### Fluxo de Pagamento

1. Usuário seleciona método de pagamento
2. Se cartão de crédito: seleciona número de parcelas
3. Usuário clica em "Confirmar Agendamento"
4. Sistema chama `createPayment()` que comunica com o backend
5. Backend cria pagamento no Mercado Pago
6. Dependendo do método:
   - **PIX**: Retorna QR Code para exibição
   - **Cartão**: Processa e retorna status (aprovado/pendente)
7. Sistema exibe resultado e atualiza status do agendamento

## 🚀 Próximos Passos para Implementação Completa

### Backend (Necessário Implementar)

1. **Endpoint POST `/payment/create`**

   - Recebe: `CreatePaymentPayload`
   - Cria pagamento no Mercado Pago usando SDK
   - Retorna: `MercadoPagoPaymentResponse`

2. **Endpoint GET `/payment/status/:paymentId`**

   - Consulta status do pagamento no Mercado Pago
   - Retorna: Status atual do pagamento

3. **Endpoint POST `/payment/webhook`**
   - Recebe notificações do Mercado Pago
   - Atualiza status do pagamento no banco de dados
   - Notifica frontend se necessário

### Frontend (Ajustes Finais)

1. **SDK do Mercado Pago**

   ```bash
   npm install @mercadopago/sdk-react
   ```

2. **Para Cartão de Crédito/Débito:**

   - Implementar formulário de cartão usando Mercado Pago SDK
   - Obter token do cartão antes de criar pagamento
   - Adicionar validação de dados do cartão

3. **Para PIX:**

   - ✅ QR Code já está preparado para exibição
   - Implementar polling para verificar status do pagamento
   - Mostrar notificação quando pagamento for confirmado

4. **Polling de Status:**
   - Implementar verificação periódica do status do pagamento
   - Atualizar UI quando status mudar de "pending" para "approved"

## 📝 Exemplo de Uso

### Criando um Pagamento PIX

```typescript
const paymentPayload = {
  barberId: "123",
  services: [...],
  selectedDate: "2024-01-15",
  selectedTime: "10:00",
  totalPrice: 50.00,
  paymentMethod: "pix",
};

const result = await createPayment(paymentPayload);

if (result.success && result.qrCode) {
  // Exibir QR Code para o usuário
  console.log("QR Code:", result.qrCode);
}
```

### Criando um Pagamento com Cartão

```typescript
const paymentPayload = {
  barberId: "123",
  services: [...],
  selectedDate: "2024-01-15",
  selectedTime: "10:00",
  totalPrice: 100.00,
  paymentMethod: "credit",
  paymentData: {
    installments: 3,
    cardToken: "card_token_from_mercadopago_sdk",
  },
};

const result = await createPayment(paymentPayload);
```

## 🔐 Segurança

- ⚠️ **NUNCA** exponha suas chaves do Mercado Pago no frontend
- ✅ Toda comunicação com Mercado Pago deve ser feita pelo backend
- ✅ Use variáveis de ambiente para armazenar credenciais
- ✅ Valide todos os dados no backend antes de processar pagamento

## 📚 Documentação do Mercado Pago

- [SDK React](https://www.mercadopago.com.br/developers/pt/docs/sdks-library/client-side/sdk-js-react)
- [API de Pagamentos](https://www.mercadopago.com.br/developers/pt/docs/checkout-api/payment-methods)
- [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks)
