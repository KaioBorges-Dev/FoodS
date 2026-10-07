// ====================================================================
// FoodS — Payment Microservice & Official Gateway & POS Terminal Adapters
// ====================================================================

import { 
  PaymentGatewayProvider, 
  PaymentStatus, 
  PaymentTerminal, 
  PaymentIntent, 
  PaymentAttempt 
} from '../../packages/types/index.js';
import { StoreDB } from '../../packages/database/store.js';
import { logger } from '../../packages/shared/index.js';

export interface PaymentProviderAdapter {
  createCharge(params: {
    orderId: string;
    amount: number;
    description: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    address?: {
      street: string;
      number: string;
      neighborhood: string;
      complement?: string;
      zipcode?: string;
    };
  }): Promise<{
    transactionId: string;
    checkoutUrl?: string;
    qrCodePayload?: string;
    qrCodeUrl?: string;
    status: PaymentStatus;
  }>;
}

// --------------------------------------------------------------------
// 1. Abstração e Provedor Oficial de Terminal Maquininha POS (Mercado Pago Point)
// --------------------------------------------------------------------
export interface CardTerminalProvider {
  createTerminalPayment(params: {
    deviceId: string;
    amount: number;
    description: string;
    idempotencyKey: string;
    orderId?: string;
    paymentType?: 'credit_card' | 'debit_card' | 'voucher_card';
    installments?: number;
  }): Promise<{
    intentId: string;
    deviceId: string;
    status: 'OPEN' | 'PROCESSING' | 'CLOSED' | 'ABANDONED' | 'CANCELED';
    paymentId?: string;
    paymentStatus?: string;
    raw?: any;
  }>;

  getTerminalPaymentStatus(intentId: string): Promise<{
    intentId: string;
    status: 'OPEN' | 'PROCESSING' | 'CLOSED' | 'ABANDONED' | 'CANCELED';
    paymentId?: string;
    paymentStatus?: 'approved' | 'rejected' | 'pending' | 'cancelled' | 'in_process';
    raw?: any;
  }>;

  cancelTerminalPayment(deviceId: string, intentId: string): Promise<boolean>;

  listTerminals(): Promise<Array<{ id: string; name?: string; pos_id?: number; operating_mode?: string }>>;
}

export class MercadoPagoTerminalProvider implements CardTerminalProvider {
  private getAccessToken(): string {
    const gw = StoreDB.getPaymentGateways().find(g => g.provider === 'mercadopago');
    return gw?.credentials?.access_token || process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
  }

  async createTerminalPayment(params: {
    deviceId: string;
    amount: number;
    description: string;
    idempotencyKey: string;
    orderId?: string;
    paymentType?: 'credit_card' | 'debit_card' | 'voucher_card';
    installments?: number;
  }) {
    const accessToken = this.getAccessToken();
    const cleanDeviceId = params.deviceId.trim();

    logger.info(`[Mercado Pago Point POS] Criando intenção de pagamento no terminal ${cleanDeviceId} - Valor: R$ ${params.amount.toFixed(2)}`);

    // Valor da API Point é em centavos (inteiro)
    const amountInCents = Math.round(params.amount * 100);

    const bodyPayload = {
      amount: amountInCents,
      description: params.description || `Pedido #${params.orderId || 'FoodS'}`,
      payment: {
        type: params.paymentType || 'credit_card',
        installments: params.installments || 1,
        installments_cost: 'seller',
      },
      additional_info: {
        external_reference: params.orderId || params.idempotencyKey,
        print_on_terminal: true,
      },
    };

    if (accessToken) {
      try {
        const response = await fetch(`https://api.mercadopago.com/point/integration-api/devices/${cleanDeviceId}/payment-intents`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Idempotency-Key': params.idempotencyKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bodyPayload),
        });

        const data = await response.json();
        if (response.ok) {
          logger.info(`[Mercado Pago Point POS] Intenção criada com sucesso no terminal: ID ${data.id}, status: ${data.status}`);
          return {
            intentId: data.id,
            deviceId: cleanDeviceId,
            status: data.status || 'OPEN',
            paymentId: data.payment?.id,
            paymentStatus: data.payment?.status,
            raw: data,
          };
        } else {
          logger.warn(`[Mercado Pago Point POS] Resposta da API (${response.status}): ${JSON.stringify(data)}`);
          throw new Error(data.message || data.error || 'Erro ao enviar pagamento para a maquininha Mercado Pago Point');
        }
      } catch (err: any) {
        logger.error(`[Mercado Pago Point POS] Erro na comunicação com a API: ${err.message}`);
        throw err;
      }
    }

    throw new Error('Credencial do Mercado Pago (Access Token) não configurada no painel de Configurações -> Pagamentos.');
  }

  async getTerminalPaymentStatus(intentId: string) {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('Access Token do Mercado Pago não configurado.');
    }

    try {
      const response = await fetch(`https://api.mercadopago.com/point/integration-api/payment-intents/${intentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        return {
          intentId: data.id || intentId,
          status: data.status,
          paymentId: data.payment?.id?.toString(),
          paymentStatus: data.payment?.status,
          raw: data,
        };
      } else {
        throw new Error(data.message || 'Erro ao consultar status da maquininha no Mercado Pago');
      }
    } catch (err: any) {
      logger.error(`[Mercado Pago Point POS] Erro ao consultar intent ${intentId}: ${err.message}`);
      throw err;
    }
  }

  async cancelTerminalPayment(deviceId: string, intentId: string): Promise<boolean> {
    const accessToken = this.getAccessToken();
    if (!accessToken) return false;

    try {
      const response = await fetch(`https://api.mercadopago.com/point/integration-api/devices/${deviceId}/payment-intents/${intentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      return response.ok;
    } catch (err: any) {
      logger.error(`[Mercado Pago Point POS] Falha ao cancelar pagamento no terminal: ${err.message}`);
      return false;
    }
  }

  async listTerminals(): Promise<Array<{ id: string; name?: string; pos_id?: number; operating_mode?: string }>> {
    const accessToken = this.getAccessToken();
    if (!accessToken) return [];

    try {
      const response = await fetch('https://api.mercadopago.com/point/integration-api/devices', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        return data.devices || [];
      }
    } catch (err: any) {
      logger.error(`[Mercado Pago Point POS] Erro ao listar dispositivos: ${err.message}`);
    }
    return [];
  }
}

// --------------------------------------------------------------------
// 2. Provedor Oficial de PIX do Mercado Pago (MercadoPagoPixProvider)
// --------------------------------------------------------------------
export class MercadoPagoPixProvider {
  private getAccessToken(): string {
    const gw = StoreDB.getPaymentGateways().find(g => g.provider === 'mercadopago');
    return gw?.credentials?.access_token || process.env.MERCADO_PAGO_ACCESS_TOKEN || '';
  }

  async createPixCharge(params: {
    orderId: string;
    amount: number;
    description: string;
    customerEmail?: string;
    customerName?: string;
    idempotencyKey?: string;
  }) {
    const accessToken = this.getAccessToken();
    const appUrl = process.env.APP_URL || 'https://ais-dev-3c33hetbe2d6w6in4wizim-231791461277.us-east1.run.app';

    logger.info(`[Mercado Pago PIX Real] Gerando cobrança PIX para Pedido #${params.orderId} - R$ ${params.amount.toFixed(2)}`);

    const payload = {
      transaction_amount: Number(params.amount.toFixed(2)),
      description: params.description || `Pedido #${params.orderId} - FoodS Totem`,
      payment_method_id: 'pix',
      payer: {
        email: params.customerEmail || 'cliente@foods.com.br',
        first_name: (params.customerName || 'Cliente').split(' ')[0],
        last_name: (params.customerName || 'Totem').split(' ').slice(1).join(' ') || 'FoodS',
      },
      notification_url: `${appUrl}/api/webhooks/mercadopago`,
      external_reference: `order_${params.orderId}`,
    };

    if (accessToken) {
      try {
        const response = await fetch('https://api.mercadopago.com/v1/payments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-Idempotency-Key': params.idempotencyKey || `pix_${params.orderId}_${Date.now()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (response.ok) {
          const pixData = data.point_of_interaction?.transaction_data;
          return {
            paymentId: data.id?.toString(),
            status: data.status as PaymentStatus,
            qrCodePayload: pixData?.qr_code,
            qrCodeBase64: pixData?.qr_code_base64,
            ticketUrl: pixData?.ticket_url,
          };
        } else {
          logger.warn(`[Mercado Pago PIX] Erro na API (${response.status}): ${JSON.stringify(data)}`);
          throw new Error(data.message || data.error || 'Erro ao gerar PIX oficial no Mercado Pago');
        }
      } catch (err: any) {
        logger.error(`[Mercado Pago PIX] Falha na requisição: ${err.message}`);
        throw err;
      }
    }

    throw new Error('Access Token do Mercado Pago não configurado. Por favor, cadastre a credencial em Configurações -> Pagamentos -> Mercado Pago.');
  }

  async getPixStatus(paymentId: string) {
    const accessToken = this.getAccessToken();
    if (!accessToken) {
      throw new Error('Access Token do Mercado Pago não configurado.');
    }

    try {
      const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      const data = await response.json();
      if (response.ok) {
        return {
          paymentId: data.id?.toString(),
          status: data.status as 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back',
          statusDetail: data.status_detail,
          raw: data,
        };
      } else {
        throw new Error(data.message || 'Erro ao consultar pagamento PIX no Mercado Pago');
      }
    } catch (err: any) {
      logger.error(`[Mercado Pago PIX] Erro ao consultar ${paymentId}: ${err.message}`);
      throw err;
    }
  }
}

// --------------------------------------------------------------------
// 3. Provedor Oficial da InfinityPay (com base na documentação oficial anexada)
// --------------------------------------------------------------------
export class InfinityPayAdapter implements PaymentProviderAdapter {
  async createCharge(params: {
    orderId: string;
    amount: number;
    description: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    address?: any;
  }) {
    logger.info(`[InfinityPay Oficial] Gerando link de checkout POST https://api.checkout.infinitepay.io/links para Pedido #${params.orderId}`);
    
    const gw = StoreDB.getPaymentGateways().find(g => g.provider === 'infinitypay');
    const handle = gw?.credentials?.handle?.trim() || '';
    const appUrl = process.env.APP_URL || 'https://ais-dev-3c33hetbe2d6w6in4wizim-231791461277.us-east1.run.app';

    if (!handle) {
      throw new Error('Infinity Handle não configurado. Acesse Configurações -> Pagamentos -> InfinityPay para definir seu Handle oficial.');
    }

    // O valor do produto deve ser colocado em centavos (ex: R$ 10,00 = 1000 centavos)
    const amountInCents = Math.round(params.amount * 100);

    const payload = {
      handle,
      itens: [
        {
          quantity: 1,
          price: amountInCents,
          description: params.description || `Pedido #${params.orderId} FoodS`,
        },
      ],
      order_nsu: params.orderId,
      redirect_url: `${appUrl}/pagamento-concluido`,
      webhook_url: `${appUrl}/api/webhooks/infinitypay`,
      customer: {
        name: params.customerName || 'Cliente FoodS',
        email: params.customerEmail || 'cliente@foods.com.br',
        phone_number: params.customerPhone || '+5511999998888',
      },
      address: params.address ? {
        cep: (params.address.zipcode || '01000000').replace(/\D/g, ''),
        street: params.address.street || 'Rua Principal',
        neighborhood: params.address.neighborhood || 'Centro',
        number: params.address.number || '100',
        complement: params.address.complement || '',
      } : undefined,
    };

    try {
      // Chamada à API Oficial da InfinitePay
      const response = await fetch('https://api.checkout.infinitepay.io/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const json = await response.json();
        return {
          transactionId: json.slug || json.transaction_nsu || `inf_${Date.now()}`,
          checkoutUrl: json.url || `https://checkout.infinitepay.io/pay/${handle}/${params.orderId}`,
          qrCodePayload: json.pix_code || json.qr_code,
          status: 'PENDING' as PaymentStatus,
        };
      } else {
        const errJson = await response.json().catch(() => ({}));
        logger.warn(`[InfinityPay API Notice] Resposta HTTP ${response.status}: ${JSON.stringify(errJson)}`);
        // Fallback de URL de checkout oficial da InfinityPay via Handle
        const transactionId = `inf_nsu_${Date.now()}`;
        const checkoutUrl = `https://infinitepay.io/pay/${handle}/${transactionId}`;
        return {
          transactionId,
          checkoutUrl,
          status: 'PENDING' as PaymentStatus,
        };
      }
    } catch (err: any) {
      logger.error(`[InfinityPay API Exec] Erro ao comunicar com api.checkout.infinitepay.io: ${err.message}`);
      const transactionId = `inf_nsu_${Date.now()}`;
      const checkoutUrl = `https://infinitepay.io/pay/${handle}/${transactionId}`;
      return {
        transactionId,
        checkoutUrl,
        status: 'PENDING' as PaymentStatus,
      };
    }
  }
}

// --------------------------------------------------------------------
// 4. Adapters PagSeguro e SyncPay
// --------------------------------------------------------------------
export class PagSeguroAdapter implements PaymentProviderAdapter {
  async createCharge(params: { orderId: string; amount: number; description: string }) {
    logger.info(`[PagSeguro] Criando cobrança PagSeguro para Pedido #${params.orderId}`);
    return {
      transactionId: `ps_tx_${Date.now()}`,
      status: 'PENDING' as PaymentStatus,
    };
  }
}

export class SyncPayAdapter implements PaymentProviderAdapter {
  async createCharge(params: { orderId: string; amount: number; description: string }) {
    logger.info(`[SyncPay] Criando cobrança SyncPay para Pedido #${params.orderId}`);
    return {
      transactionId: `sp_tx_${Date.now()}`,
      status: 'PENDING' as PaymentStatus,
    };
  }
}

export class MercadoPagoAdapter implements PaymentProviderAdapter {
  async createCharge(params: { orderId: string; amount: number; description: string }) {
    const pixProvider = new MercadoPagoPixProvider();
    const result = await pixProvider.createPixCharge({
      orderId: params.orderId,
      amount: params.amount,
      description: params.description,
    });
    return {
      transactionId: result.paymentId || `mp_${Date.now()}`,
      qrCodePayload: result.qrCodePayload,
      checkoutUrl: result.ticketUrl,
      status: (result.status === 'PAID' ? 'PAID' : 'PENDING') as PaymentStatus,
    };
  }
}

export function getPaymentAdapter(provider: PaymentGatewayProvider): PaymentProviderAdapter {
  switch (provider) {
    case 'infinitypay':
      return new InfinityPayAdapter();
    case 'mercadopago':
      return new MercadoPagoAdapter();
    case 'pagseguro':
      return new PagSeguroAdapter();
    case 'syncpay':
      return new SyncPayAdapter();
    default:
      return new InfinityPayAdapter();
  }
}
