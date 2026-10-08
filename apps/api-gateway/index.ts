// ====================================================================
// FoodS — API Gateway (Express Router de Microsserviços SaaS)
// ====================================================================

import { Router } from 'express';
import { StoreDB } from '../../packages/database/store.js';
import { SupabaseService } from '../../packages/database/supabaseService.js';
import { successResponse, errorResponse, logger, formatBrazilianPhone } from '../../packages/shared/index.js';
import { 
  getPaymentAdapter, 
  MercadoPagoTerminalProvider, 
  MercadoPagoPixProvider 
} from '../payment-service/index.js';
import { WhatsAppService } from '../whatsapp-service/index.js';

export const apiGateway = Router();

apiGateway.use((req, res, next) => {
  logger.info(`[API Gateway] ${req.method} ${req.originalUrl}`);
  next();
});

// -------------------------------------------------------------
// 0. STATUS DO SISTEMA E SUPABASE CLOUD / LOCAL
// -------------------------------------------------------------
apiGateway.get('/system/status', (req, res) => {
  const status = SupabaseService.getStatus();
  res.json(successResponse({
    supabase: status,
    database: {
      provider: status.configured ? 'Supabase PostgreSQL (Cloud)' : 'Armazenamento Seguro Local (Contingência)',
      status: 'HEALTHY',
    },
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  }));
});

// -------------------------------------------------------------
// 1. AUTENTICAÇÃO ADMINISTRATIVA E PERFIS
// -------------------------------------------------------------
apiGateway.get('/auth/settings', (req, res) => {
  const settings = StoreDB.getAuthSettings();
  res.json(successResponse({
    ...settings,
    supabase_configured: SupabaseService.isConfigured(),
    supabase_status: SupabaseService.getStatus(),
  }));
});

apiGateway.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email) {
      return res.status(400).json(errorResponse('BAD_REQUEST', 'Informe o e-mail de acesso.'));
    }

    const authResult = await StoreDB.verifyAdminLogin(email, password);
    res.json(successResponse(authResult));
  } catch (err: any) {
    logger.warn(`[Auth Login] Falha na tentativa de login: ${err.message}`);
    res.status(401).json(errorResponse('UNAUTHORIZED', err.message || 'Falha na autenticação.'));
  }
});

apiGateway.post('/auth/admin/recover-request', async (req, res) => {
  try {
    const { emailOrPhone, targetPhone } = req.body;
    if (!emailOrPhone) {
      return res.status(400).json(errorResponse('BAD_REQUEST', 'Informe o e-mail ou telefone do administrador.'));
    }

    // Buscar perfil correspondente
    const profs = await StoreDB.getProfiles();
    const user = profs.find(
      p => p.email.toLowerCase() === emailOrPhone.trim().toLowerCase() || 
           (p.phone && p.phone.replace(/\D/g, '') === emailOrPhone.replace(/\D/g, ''))
    );

    if (!user) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Nenhum administrador cadastrado localizado com este e-mail ou telefone.'));
    }

    const phoneToSend = targetPhone || user.phone;
    if (!phoneToSend) {
      return res.status(400).json(errorResponse('NO_PHONE', 'Este usuário não possui telefone cadastrado. Por favor, digite o número do seu WhatsApp de recebimento.'));
    }

    // Gerar PIN de 6 dígitos
    const pin_code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const pinObj = {
      id: `pin_adm_${Date.now()}`,
      phone: formatBrazilianPhone(phoneToSend),
      pin_code,
      expires_at,
      used: false,
      attempts: 0,
    };

    StoreDB.addAdminRecoveryPin(pinObj);

    // Enviar mensagem de PIN de WhatsApp real via WhatsAppService
    await WhatsAppService.sendPinNotification(phoneToSend, pin_code);

    res.json(successResponse({ message: `PIN de segurança de 6 dígitos enviado com sucesso para o WhatsApp ${formatBrazilianPhone(phoneToSend)}!` }));
  } catch (err: any) {
    res.status(400).json(errorResponse('BAD_REQUEST', err.message));
  }
});

apiGateway.post('/auth/admin/recover-confirm', async (req, res) => {
  try {
    const { emailOrPhone, pin_code, new_password, targetPhone } = req.body;
    if (!emailOrPhone || !pin_code || !new_password) {
      return res.status(400).json(errorResponse('BAD_REQUEST', 'Preencha todos os campos obrigatórios.'));
    }

    // Buscar perfil correspondente primeiro para obter o telefone cadastrado caso targetPhone não tenha sido enviado
    const profs = await StoreDB.getProfiles();
    const user = profs.find(
      p => p.email.toLowerCase() === emailOrPhone.trim().toLowerCase() || 
           (p.phone && p.phone.replace(/\D/g, '') === emailOrPhone.replace(/\D/g, ''))
    );

    if (!user) {
      return res.status(404).json(errorResponse('NOT_FOUND', 'Administrador não localizado para redefinição de senha.'));
    }

    const phoneToVerify = targetPhone || user.phone || emailOrPhone;
    const isPinValid = StoreDB.verifyAdminRecoveryPin(phoneToVerify, pin_code);

    if (!isPinValid.success) {
      return res.status(400).json(errorResponse('INVALID_PIN', isPinValid.message));
    }

    // Atualizar senha administrativa
    await StoreDB.updateProfile(user.id, { password: new_password });

    res.json(successResponse({ message: 'Senha administrativa redefinida com sucesso! Você já pode efetuar o login.' }));
  } catch (err: any) {
    res.status(400).json(errorResponse('BAD_REQUEST', err.message));
  }
});

apiGateway.post('/auth/settings', (req, res) => {
  res.json(successResponse(StoreDB.updateAuthSettings(req.body)));
});

apiGateway.get('/auth/profiles', async (req, res) => {
  try {
    const profs = await StoreDB.getProfiles();
    res.json(successResponse(profs));
  } catch (err: any) {
    res.status(500).json(errorResponse('SERVER_ERROR', err.message));
  }
});

// -------------------------------------------------------------
// 2. CONFIGURAÇÕES GERAIS E MULTI-TENANT
// -------------------------------------------------------------
apiGateway.get(['/settings/organization', '/restaurant/organization'], (req, res) => {
  res.json(successResponse(StoreDB.getOrganization()));
});
apiGateway.put(['/settings/organization', '/restaurant/organization'], (req, res) => {
  res.json(successResponse(StoreDB.updateOrganization(req.body)));
});

apiGateway.get(['/settings/units', '/restaurant/units'], (req, res) => {
  res.json(successResponse(StoreDB.getUnits()));
});
apiGateway.post(['/settings/units', '/restaurant/units'], (req, res) => {
  res.json(successResponse(StoreDB.createUnit(req.body)));
});
apiGateway.put(['/settings/units/:id', '/restaurant/units/:id'], (req, res) => {
  res.json(successResponse(StoreDB.updateUnit(req.params.id, req.body)));
});
apiGateway.delete(['/settings/units/:id', '/restaurant/units/:id'], (req, res) => {
  StoreDB.deleteUnit(req.params.id);
  res.json(successResponse({ success: true }));
});

apiGateway.get('/settings/store', (req, res) => {
  res.json(successResponse(StoreDB.getStoreSettings()));
});
apiGateway.put('/settings/store', (req, res) => {
  res.json(successResponse(StoreDB.updateStoreSettings(req.body)));
});

apiGateway.get('/settings/delivery', (req, res) => {
  res.json(successResponse(StoreDB.getDeliverySettings()));
});
apiGateway.put('/settings/delivery', (req, res) => {
  res.json(successResponse(StoreDB.updateDeliverySettings(req.body)));
});

apiGateway.post('/settings/delivery/cities', (req, res) => {
  res.json(successResponse(StoreDB.addDeliveryCity(req.body)));
});
apiGateway.delete('/settings/delivery/cities/:id', (req, res) => {
  res.json(successResponse(StoreDB.deleteDeliveryCity(req.params.id)));
});

apiGateway.post('/settings/delivery/areas', (req, res) => {
  res.json(successResponse(StoreDB.addDeliveryArea(req.body)));
});
apiGateway.delete('/settings/delivery/areas/:id', (req, res) => {
  res.json(successResponse(StoreDB.deleteDeliveryArea(req.params.id)));
});

apiGateway.get('/settings/menu', (req, res) => {
  res.json(successResponse(StoreDB.getMenuSettings()));
});
apiGateway.put('/settings/menu', (req, res) => {
  res.json(successResponse(StoreDB.updateMenuSettings(req.body)));
});

apiGateway.get('/settings/inventory', (req, res) => {
  res.json(successResponse(StoreDB.getInventorySettings()));
});
apiGateway.put('/settings/inventory', (req, res) => {
  res.json(successResponse(StoreDB.updateInventorySettings(req.body)));
});

apiGateway.get('/settings/loyalty', (req, res) => {
  res.json(successResponse(StoreDB.getLoyaltySettings()));
});
apiGateway.put('/settings/loyalty', (req, res) => {
  res.json(successResponse(StoreDB.updateLoyaltySettings(req.body)));
});

apiGateway.get('/settings/print', (req, res) => {
  res.json(successResponse(StoreDB.getPrintSettings()));
});
apiGateway.put('/settings/print', (req, res) => {
  res.json(successResponse(StoreDB.updatePrintSettings(req.body)));
});
apiGateway.post('/settings/print/printers', (req, res) => {
  res.json(successResponse(StoreDB.addPrinter(req.body)));
});
apiGateway.delete('/settings/print/printers/:id', (req, res) => {
  res.json(successResponse(StoreDB.deletePrinter(req.params.id)));
});

apiGateway.get('/settings/appearance', (req, res) => {
  res.json(successResponse(StoreDB.getAppearanceSettings()));
});
apiGateway.put('/settings/appearance', (req, res) => {
  res.json(successResponse(StoreDB.updateAppearanceSettings(req.body)));
});

apiGateway.get('/settings/notifications', (req, res) => {
  res.json(successResponse(StoreDB.getNotificationSettings()));
});
apiGateway.put('/settings/notifications', (req, res) => {
  res.json(successResponse(StoreDB.updateNotificationSettings(req.body)));
});

apiGateway.get('/settings/security', (req, res) => {
  res.json(successResponse(StoreDB.getSecuritySettings()));
});
apiGateway.put('/settings/security', (req, res) => {
  res.json(successResponse(StoreDB.updateSecuritySettings(req.body)));
});

apiGateway.get('/settings/permissions', (req, res) => {
  res.json(successResponse(StoreDB.getPermissionMatrix()));
});
apiGateway.put('/settings/permissions', (req, res) => {
  res.json(successResponse(StoreDB.updatePermissionMatrix(req.body)));
});

apiGateway.get('/users/profiles', async (req, res) => {
  try {
    const profs = await StoreDB.getProfiles();
    res.json(successResponse(profs));
  } catch (err: any) {
    res.status(500).json(errorResponse('SERVER_ERROR', err.message));
  }
});
apiGateway.post('/users/profiles', async (req, res) => {
  try {
    const newProf = await StoreDB.createProfile(req.body);
    res.json(successResponse(newProf));
  } catch (err: any) {
    res.status(400).json(errorResponse('BAD_REQUEST', err.message));
  }
});
apiGateway.put('/users/profiles/:id', async (req, res) => {
  try {
    const updated = await StoreDB.updateProfile(req.params.id, req.body);
    res.json(successResponse(updated));
  } catch (err: any) {
    res.status(400).json(errorResponse('BAD_REQUEST', err.message));
  }
});
apiGateway.delete('/users/profiles/:id', async (req, res) => {
  try {
    await StoreDB.deleteProfile(req.params.id);
    res.json(successResponse({ success: true }));
  } catch (err: any) {
    res.status(400).json(errorResponse('BAD_REQUEST', err.message));
  }
});
apiGateway.put('/users/profiles/:id/toggle', async (req, res) => {
  try {
    const toggled = await StoreDB.toggleProfileStatus(req.params.id);
    res.json(successResponse(toggled));
  } catch (err: any) {
    res.status(400).json(errorResponse('BAD_REQUEST', err.message));
  }
});

// -------------------------------------------------------------
// 3. TOTENS — GERENCIAMENTO E CANAL TOTEM
// -------------------------------------------------------------
apiGateway.get('/totems', (req, res) => {
  res.json(successResponse(StoreDB.getTotems()));
});

apiGateway.get('/totems/:id', (req, res) => {
  const totem = StoreDB.getTotemById(req.params.id);
  if (!totem) return res.status(404).json(errorResponse('NOT_FOUND', 'Totem não encontrado'));
  res.json(successResponse(totem));
});

apiGateway.post('/totems', (req, res) => {
  const newTotem = StoreDB.createTotem(req.body);
  res.json(successResponse(newTotem));
});

apiGateway.put('/totems/:id', (req, res) => {
  const updated = StoreDB.updateTotem(req.params.id, req.body);
  if (!updated) return res.status(404).json(errorResponse('NOT_FOUND', 'Totem não encontrado'));
  res.json(successResponse(updated));
});

apiGateway.delete('/totems/:id', (req, res) => {
  const ok = StoreDB.deleteTotem(req.params.id);
  res.json(successResponse({ success: ok }));
});

// -------------------------------------------------------------
// 4. TERMINAIS DE CARTÃO / MAQUININHAS POS (MERCADO PAGO POINT)
// -------------------------------------------------------------
apiGateway.get('/terminals', (req, res) => {
  res.json(successResponse(StoreDB.getPaymentTerminals()));
});

apiGateway.get('/terminals/:id', (req, res) => {
  const term = StoreDB.getPaymentTerminalById(req.params.id);
  if (!term) return res.status(404).json(errorResponse('NOT_FOUND', 'Terminal não encontrado'));
  res.json(successResponse(term));
});

apiGateway.post('/terminals', (req, res) => {
  const newTerm = StoreDB.createPaymentTerminal(req.body);
  res.json(successResponse(newTerm));
});

apiGateway.put('/terminals/:id', (req, res) => {
  const updated = StoreDB.updatePaymentTerminal(req.params.id, req.body);
  if (!updated) return res.status(404).json(errorResponse('NOT_FOUND', 'Terminal não encontrado'));
  res.json(successResponse(updated));
});

apiGateway.delete('/terminals/:id', (req, res) => {
  const ok = StoreDB.deletePaymentTerminal(req.params.id);
  res.json(successResponse({ success: ok }));
});

// Escanear dispositivos Mercado Pago Point disponíveis na conta oficial
apiGateway.get('/terminals/mercadopago/scan', async (req, res) => {
  try {
    const mpTerminalProvider = new MercadoPagoTerminalProvider();
    const devices = await mpTerminalProvider.listTerminals();
    res.json(successResponse(devices));
  } catch (err: any) {
    res.status(500).json(errorResponse('SCAN_FAILED', err.message));
  }
});

// -------------------------------------------------------------
// 5. CARDÁPIO & PRODUTOS
// -------------------------------------------------------------
apiGateway.get('/catalog/categories', (req, res) => {
  res.json(successResponse(StoreDB.getCategories()));
});
apiGateway.post('/catalog/categories', (req, res) => {
  res.json(successResponse(StoreDB.createCategory(req.body)));
});
apiGateway.put('/catalog/categories/:id', (req, res) => {
  res.json(successResponse(StoreDB.updateCategory(req.params.id, req.body)));
});
apiGateway.delete('/catalog/categories/:id', (req, res) => {
  StoreDB.deleteCategory(req.params.id);
  res.json(successResponse({ success: true }));
});

apiGateway.get('/catalog/products', (req, res) => {
  res.json(successResponse(StoreDB.getProducts()));
});
apiGateway.post('/catalog/products', (req, res) => {
  res.json(successResponse(StoreDB.createProduct(req.body)));
});
apiGateway.put('/catalog/products/:id', (req, res) => {
  res.json(successResponse(StoreDB.updateProduct(req.params.id, req.body)));
});
apiGateway.delete('/catalog/products/:id', (req, res) => {
  StoreDB.deleteProduct(req.params.id);
  res.json(successResponse({ success: true }));
});

// -------------------------------------------------------------
// 6. PEDIDOS & MESAS
// -------------------------------------------------------------
apiGateway.get('/orders', (req, res) => {
  res.json(successResponse(StoreDB.getOrders()));
});

apiGateway.post('/orders', (req, res) => {
  try {
    const newOrder = StoreDB.createOrder(req.body);
    res.json(successResponse(newOrder));
  } catch (err: any) {
    res.status(400).json(errorResponse('BAD_REQUEST', err.message));
  }
});

apiGateway.put('/orders/:id/status', (req, res) => {
  const { status, payment_status } = req.body;
  if (status) StoreDB.updateOrderStatus(req.params.id, status);
  if (payment_status) StoreDB.updateOrderPaymentStatus(req.params.id, payment_status);
  res.json(successResponse(StoreDB.getOrderById(req.params.id)));
});

apiGateway.get('/orders/tables/list', (req, res) => {
  res.json(successResponse(StoreDB.getTables()));
});

apiGateway.post('/orders/tables', (req, res) => {
  const newTable = StoreDB.createTable(req.body);
  res.json(successResponse(newTable));
});

apiGateway.delete('/orders/tables/:id', (req, res) => {
  StoreDB.deleteTable(req.params.id);
  res.json(successResponse({ success: true }));
});

apiGateway.put('/orders/tables/:id/status', (req, res) => {
  const { status, waiter_id } = req.body;
  res.json(successResponse(StoreDB.updateTableStatus(req.params.id, status, waiter_id)));
});

// -------------------------------------------------------------
// 7. ESTOQUE E FICHA TÉCNICA
// -------------------------------------------------------------
apiGateway.get('/inventory/items', (req, res) => {
  res.json(successResponse(StoreDB.getInventoryItems()));
});
apiGateway.post('/inventory/items', (req, res) => {
  res.json(successResponse(StoreDB.createInventoryItem(req.body)));
});
apiGateway.post('/inventory/movements', (req, res) => {
  try {
    res.json(successResponse(StoreDB.addInventoryMovement(req.body)));
  } catch (err: any) {
    res.status(400).json(errorResponse('BAD_REQUEST', err.message));
  }
});
apiGateway.get('/inventory/recipes/:productId', (req, res) => {
  res.json(successResponse(StoreDB.getTechnicalRecipes(req.params.productId)));
});
apiGateway.post('/inventory/recipes/:productId', (req, res) => {
  res.json(successResponse(StoreDB.saveTechnicalRecipe(req.params.productId, req.body.ingredients)));
});

// -------------------------------------------------------------
// 8. PAGAMENTOS CENTRALIZADOS, GATEWAYS & PAYMENT INTENTS
// -------------------------------------------------------------
apiGateway.get('/payments/gateways', (req, res) => {
  res.json(successResponse(StoreDB.getPaymentGateways()));
});

apiGateway.put('/payments/gateways/:provider', (req, res) => {
  const { is_active, credentials } = req.body;
  res.json(successResponse(StoreDB.updatePaymentGateway(req.params.provider, is_active, credentials)));
});

// Criar Intenção de Pagamento com Idempotência (Totem / POS / Online)
apiGateway.post('/payments/intents', async (req, res) => {
  try {
    const { 
      totem_id, 
      unit_id, 
      method, 
      amount, 
      description, 
      idempotency_key, 
      customer_email, 
      customer_name, 
      items 
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json(errorResponse('BAD_REQUEST', 'Valor do pagamento inválido.'));
    }

    const key = idempotency_key || `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Verificar se já existe uma intenção com a mesma chave de idempotência
    const existingIntent = StoreDB.getPaymentIntentByIdempotency(key);
    if (existingIntent) {
      return res.json(successResponse(existingIntent));
    }

    const org = StoreDB.getOrganization();
    const unitId = unit_id || StoreDB.getUnits()[0]?.id || '';

    let externalId: string | undefined;
    let qrCode: string | undefined;
    let qrCodeBase64: string | undefined;
    let ticketUrl: string | undefined;
    let deviceId: string | undefined;

    // Se o método for PIX (utilizando Mercado Pago PIX oficial)
    if (method === 'PIX') {
      const pixProvider = new MercadoPagoPixProvider();
      const pixResult = await pixProvider.createPixCharge({
        orderId: `totem_${Date.now()}`,
        amount,
        description: description || 'Pedido Totem FoodS',
        customerEmail: customer_email,
        customerName: customer_name,
        idempotencyKey: key,
      });

      externalId = pixResult.paymentId;
      qrCode = pixResult.qrCodePayload;
      qrCodeBase64 = pixResult.qrCodeBase64;
      ticketUrl = pixResult.ticketUrl;
    } 
    // Se o método for CARTÃO NO TERMINAL (Mercado Pago Point POS)
    else if (method === 'CARD_POS' || method === 'CREDIT_CARD' || method === 'DEBIT_CARD') {
      const totem = totem_id ? StoreDB.getTotemById(totem_id) : null;
      let targetTerminalId = totem?.terminal_id;
      
      let terminal = targetTerminalId ? StoreDB.getPaymentTerminalById(targetTerminalId) : null;
      if (!terminal) {
        // Obter primeiro terminal ativo da unidade
        terminal = StoreDB.getPaymentTerminals().find(t => t.unit_id === unitId) || null;
      }

      if (!terminal || !terminal.external_terminal_id) {
        return res.status(400).json(errorResponse(
          'NO_TERMINAL_CONFIGURED', 
          'Nenhuma maquininha de cartão cadastrada ou vinculada a este Totem. Acesse Configurações -> Totens ou Configurações -> Pagamentos -> Presencial -> Maquininhas.'
        ));
      }

      deviceId = terminal.external_terminal_id;
      const mpTerminalProvider = new MercadoPagoTerminalProvider();
      
      const termResult = await mpTerminalProvider.createTerminalPayment({
        deviceId: terminal.external_terminal_id,
        amount,
        description: description || 'Pedido Totem FoodS',
        idempotencyKey: key,
        paymentType: method === 'DEBIT_CARD' ? 'debit_card' : 'credit_card',
      });

      externalId = termResult.intentId;
      
      // Atualizar status do terminal no banco
      StoreDB.updatePaymentTerminal(terminal.id, {
        status: 'PROCESSING',
        last_seen_at: new Date().toISOString(),
      });
    }

    // Criar registro da intenção no banco
    const newIntent = StoreDB.createPaymentIntent({
      organization_id: org.id,
      unit_id: unitId,
      totem_id,
      provider: 'mercadopago',
      method: method as any,
      amount,
      currency: 'BRL',
      status: 'PENDING',
      external_id: externalId,
      device_id: deviceId,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      ticket_url: ticketUrl,
      idempotency_key: key,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    });

    // Registrar tentativa inicial de auditoria
    StoreDB.createPaymentAttempt({
      payment_intent_id: newIntent.id,
      attempt_number: 1,
      method: method as any,
      status: 'PROCESSING',
    });

    res.json(successResponse(newIntent));
  } catch (err: any) {
    logger.error(`[Payment Intent Error] ${err.message}`);
    res.status(500).json(errorResponse('PAYMENT_INTENT_FAILED', err.message));
  }
});

// Consultar Status Real da Intenção de Pagamento
apiGateway.get('/payments/intents/:id/status', async (req, res) => {
  try {
    const intent = StoreDB.getPaymentIntentById(req.params.id);
    if (!intent) return res.status(404).json(errorResponse('NOT_FOUND', 'Intenção de pagamento não encontrada'));

    // Se já foi aprovada ou cancelada, retornar estado
    if (intent.status === 'APPROVED' || intent.status === 'DECLINED' || intent.status === 'CANCELLED') {
      return res.json(successResponse(intent));
    }

    // Se for PIX, consultar a API oficial do Mercado Pago
    if (intent.method === 'PIX' && intent.external_id) {
      const pixProvider = new MercadoPagoPixProvider();
      try {
        const pixStatus = await pixProvider.getPixStatus(intent.external_id);
        if (pixStatus.status === 'approved') {
          StoreDB.updatePaymentIntent(intent.id, { status: 'APPROVED' });
          intent.status = 'APPROVED';
        } else if (pixStatus.status === 'cancelled' || pixStatus.status === 'rejected') {
          StoreDB.updatePaymentIntent(intent.id, { status: 'DECLINED' });
          intent.status = 'DECLINED';
        }
      } catch (err: any) {
        logger.warn(`[Pix Status Check] Aviso: ${err.message}`);
      }
    } 
    // Se for Cartão em Maquininha, consultar a Point API do Mercado Pago
    else if (intent.device_id && intent.external_id) {
      const mpTerminalProvider = new MercadoPagoTerminalProvider();
      try {
        const termStatus = await mpTerminalProvider.getTerminalPaymentStatus(intent.external_id);
        if (termStatus.status === 'CLOSED' && termStatus.paymentStatus === 'approved') {
          StoreDB.updatePaymentIntent(intent.id, { status: 'APPROVED' });
          intent.status = 'APPROVED';
        } else if (termStatus.status === 'CANCELED' || termStatus.status === 'ABANDONED' || termStatus.paymentStatus === 'rejected') {
          StoreDB.updatePaymentIntent(intent.id, { status: 'DECLINED' });
          intent.status = 'DECLINED';
        }
      } catch (err: any) {
        logger.warn(`[Terminal Status Check] Aviso: ${err.message}`);
      }
    }

    res.json(successResponse(intent));
  } catch (err: any) {
    res.status(500).json(errorResponse('CHECK_FAILED', err.message));
  }
});

// Cancelar Intenção de Pagamento no Terminal
apiGateway.post('/payments/intents/:id/cancel', async (req, res) => {
  try {
    const intent = StoreDB.getPaymentIntentById(req.params.id);
    if (!intent) return res.status(404).json(errorResponse('NOT_FOUND', 'Intenção não encontrada'));

    if (intent.device_id && intent.external_id) {
      const mpTerminalProvider = new MercadoPagoTerminalProvider();
      await mpTerminalProvider.cancelTerminalPayment(intent.device_id, intent.external_id);
    }

    StoreDB.updatePaymentIntent(intent.id, { status: 'CANCELLED' });
    res.json(successResponse({ success: true, status: 'CANCELLED' }));
  } catch (err: any) {
    res.status(500).json(errorResponse('CANCEL_FAILED', err.message));
  }
});

// Cobrança Online Tradicional
apiGateway.post('/payments/charge', async (req, res) => {
  try {
    const { orderId, provider } = req.body;
    const order = StoreDB.getOrderById(orderId);
    if (!order) return res.status(404).json(errorResponse('NOT_FOUND', 'Pedido não encontrado'));

    const adapter = getPaymentAdapter(provider);
    const charge = await adapter.createCharge({
      orderId: order.id,
      amount: order.total,
      description: `Pedido #${order.order_number} FoodS`,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      address: order.delivery_address,
    });

    res.json(successResponse(charge));
  } catch (err: any) {
    res.status(500).json(errorResponse('PAYMENT_ERROR', err.message));
  }
});

// -------------------------------------------------------------
// 9. CLIENTES & RECUPERAÇÃO VIA WHATSAPP COM PIN REAL
// -------------------------------------------------------------
apiGateway.get('/customers', (req, res) => {
  res.json(successResponse(StoreDB.getCustomers()));
});

apiGateway.post('/customers', (req, res) => {
  res.json(successResponse(StoreDB.createCustomer(req.body)));
});

apiGateway.post('/customers/auth/check-phone', (req, res) => {
  const { phone } = req.body;
  const formattedPhone = formatBrazilianPhone(phone);
  const customer = StoreDB.findCustomerByPhone(formattedPhone);

  if (customer) {
    res.json(successResponse({
      exists: true,
      has_account: customer.has_account,
      customer_name: customer.name,
      phone: customer.phone,
    }));
  } else {
    res.json(successResponse({ exists: false }));
  }
});

apiGateway.post('/customers/auth/setup-password', (req, res) => {
  try {
    const { phone, password, name } = req.body;
    const cust = StoreDB.createOrUpdateCustomerAccount(phone, password, name);
    res.json(successResponse({ success: true, customer: cust }));
  } catch (err: any) {
    res.status(400).json(errorResponse('BAD_REQUEST', err.message));
  }
});

apiGateway.post('/customers/auth/login', (req, res) => {
  const { phone, password } = req.body;
  const cust = StoreDB.verifyCustomerPassword(phone, password);
  if (cust) {
    res.json(successResponse({ success: true, customer: cust }));
  } else {
    res.status(401).json(errorResponse('UNAUTHORIZED', 'Telefone ou senha incorretos.'));
  }
});

apiGateway.post('/customers/auth/request-pin', async (req, res) => {
  try {
    const { phone } = req.body;
    const pin = StoreDB.generateRecoveryPin(phone);
    await WhatsAppService.sendPinNotification(phone, pin.pinObj.pin_code);
    res.json(successResponse({ message: 'PIN de 6 dígitos enviado para seu WhatsApp com sucesso!' }));
  } catch (err: any) {
    res.status(400).json(errorResponse('BAD_REQUEST', err.message));
  }
});

apiGateway.post('/customers/auth/verify-pin', (req, res) => {
  const { phone, pin_code } = req.body;
  const result = StoreDB.verifyRecoveryPin(phone, pin_code);

  if (result.success) {
    res.json(successResponse({ verified: true }));
  } else {
    res.status(400).json(errorResponse('INVALID_PIN', result.message));
  }
});

apiGateway.post('/customers/auth/reset-password', (req, res) => {
  try {
    const { phone, new_password } = req.body;
    const cust = StoreDB.setCustomerPassword(phone, new_password);
    res.json(successResponse({ success: true, message: 'Senha redefinida com sucesso!' }));
  } catch (err: any) {
    res.status(400).json(errorResponse('BAD_REQUEST', err.message));
  }
});

apiGateway.get('/loyalty/accounts', (req, res) => {
  res.json(successResponse(StoreDB.getLoyaltyAccounts()));
});

// -------------------------------------------------------------
// 10. WHATSAPP & REALTIME
// -------------------------------------------------------------
apiGateway.get('/whatsapp/connection', (req, res) => {
  res.json(successResponse(StoreDB.getWhatsAppConnection()));
});

apiGateway.post('/whatsapp/connect', async (req, res) => {
  const { provider, status, forceRefresh, meta_config } = req.body;

  if (provider === 'BAILEYS' && (status === 'CONNECTING' || status === 'DISCONNECTED' || forceRefresh)) {
    WhatsAppService.initBaileysSession(forceRefresh);
  }

  const conn = await StoreDB.updateWhatsAppConnection(provider, status);
  if (meta_config) conn.meta_config = meta_config;

  res.json(successResponse(conn));
});

// -------------------------------------------------------------
// 11. RELATÓRIOS & MÉTRICAS
// -------------------------------------------------------------
apiGateway.get('/reporting/summary', (req, res) => {
  const { period } = req.query;
  res.json(successResponse(StoreDB.getReportingSummary(period as string)));
});

// -------------------------------------------------------------
// 12. WEBHOOKS OFICIAIS
// -------------------------------------------------------------
apiGateway.get('/webhooks/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const conn = StoreDB.getWhatsAppConnection();
  const verifyToken = conn.meta_config?.verify_token || 'foods_wa_verify_token_secure';

  if (mode === 'subscribe' && token === verifyToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

apiGateway.post('/webhooks/whatsapp', (req, res) => {
  res.status(200).send('EVENT_RECEIVED');
});

apiGateway.post('/webhooks/mercadopago', async (req, res) => {
  const { type, data, action } = req.body;
  logger.info(`[Webhook Mercado Pago] Recebido evento: type=${type || action}, id=${data?.id}`);

  if (data?.id && (type === 'payment' || action === 'payment.created' || action === 'payment.updated')) {
    try {
      const pixProvider = new MercadoPagoPixProvider();
      const pixStatus = await pixProvider.getPixStatus(data.id);
      if (pixStatus.status === 'approved') {
        // Encontrar intent associado
        const intents = StoreDB.getPaymentIntents();
        const matchingIntent = intents.find(i => i.external_id === data.id.toString());
        if (matchingIntent) {
          StoreDB.updatePaymentIntent(matchingIntent.id, { status: 'APPROVED' });
          if (matchingIntent.order_id) {
            StoreDB.updateOrderPaymentStatus(matchingIntent.order_id, 'PAID');
          }
        }
      }
    } catch (err: any) {
      logger.error(`[Webhook MP Process Error] ${err.message}`);
    }
  }

  res.status(200).json(successResponse({ received: true }));
});

apiGateway.post('/webhooks/:provider', (req, res) => {
  const { provider } = req.params;
  const order_nsu = req.body.order_nsu || req.body.order_id;
  if (order_nsu) {
    StoreDB.updateOrderPaymentStatus(order_nsu, 'PAID');
  }
  res.status(200).json(successResponse({ received: true }));
});
