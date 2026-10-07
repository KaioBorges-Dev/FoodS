// ====================================================================
// FoodS — Utilitários Compartilhados (Shared Package)
// ====================================================================

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
}

export function formatBrazilianPhone(rawPhone: string): string {
  if (!rawPhone) return '';

  // 1. Descompacta o JID do WhatsApp (ex: "5511987654321:12@s.whatsapp.net" ou "551187654321:3@s.whatsapp.net")
  let clean = rawPhone.split(':')[0].split('@')[0].trim();

  // 2. Remove todos os caracteres não numéricos
  let digits = clean.replace(/\D/g, '');
  if (!digits) return '';

  // 3. Se não tiver DDI 55 (ex: "11987654321" ou "1187654321"), adiciona 55 se for DDD brasileiro (11 a 99)
  if (!digits.startsWith('55') && digits.length >= 10 && digits.length <= 11) {
    const ddd = parseInt(digits.substring(0, 2), 10);
    if (ddd >= 11 && ddd <= 99) {
      digits = '55' + digits;
    }
  }

  // 4. Formatação de números brasileiros (DDI 55)
  if (digits.startsWith('55')) {
    const ddd = digits.substring(2, 4);
    let number = digits.substring(4); // O resto após 55 + DDD

    // Compatibilidade com o 9º dígito brasileiro:
    // Celulares no Brasil começam com 6, 7, 8 ou 9.
    // Se o número tiver 8 dígitos e for celular (iniciando em 6, 7, 8, 9), adiciona o '9' na frente.
    if (number.length === 8 && ['6', '7', '8', '9'].includes(number[0])) {
      number = '9' + number;
    }

    if (number.length === 9) {
      return `+55 (${ddd}) ${number.substring(0, 5)}-${number.substring(5)}`;
    } else if (number.length === 8) {
      return `+55 (${ddd}) ${number.substring(0, 4)}-${number.substring(4)}`;
    } else {
      return `+55 (${ddd}) ${number}`;
    }
  }

  // Internacional
  return `+${digits}`;
}

export function translateOrderStatus(status: string): string {
  const map: Record<string, string> = {
    RECEIVED: 'Recebido',
    CONFIRMED: 'Confirmado',
    PREPARING: 'Em Preparação',
    READY: 'Pronto',
    OUT_FOR_DELIVERY: 'Saiu para Entrega',
    DELIVERED: 'Entregue',
    CANCELLED: 'Cancelado',
  };
  return map[status] || status;
}

export function translatePaymentStatus(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'Pendente',
    AUTHORIZED: 'Autorizado',
    PAID: 'Pago',
    FAILED: 'Falhou',
    REFUNDED: 'Reembolsado',
    CANCELLED: 'Cancelado',
  };
  return map[status] || status;
}

export function translatePaymentMethod(method: string): string {
  const map: Record<string, string> = {
    PIX: 'PIX Online',
    CREDIT_CARD: 'Cartão de Crédito',
    DEBIT_CARD: 'Cartão de Débito',
    CASH: 'Dinheiro',
    CARD_POS: 'Maquininha POS',
    PIX_PRESENTIAL: 'PIX Presencial',
    VOUCHER: 'Vale Refeição',
  };
  return map[method] || method;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export function successResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data,
  };
}

export function errorResponse(code: string, message: string, details?: any): ApiResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
}

export const logger = {
  info: (msg: string, meta?: any) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${msg}`, meta ? JSON.stringify(meta) : '');
  },
  warn: (msg: string, meta?: any) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${msg}`, meta ? JSON.stringify(meta) : '');
  },
  error: (msg: string, meta?: any) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${msg}`, meta ? JSON.stringify(meta) : '');
  },
};
