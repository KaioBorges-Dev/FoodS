// ====================================================================
// FoodS — WhatsApp Microservice (Meta Cloud API & Real Baileys Production Engine)
// ====================================================================

import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { StoreDB } from '../../packages/database/store.js';
import { logger, translateOrderStatus, formatBrazilianPhone } from '../../packages/shared/index.js';

let baileysSocket: any = null;
let isInitializing = false;
let qrTimestamp = 0;

export const WhatsAppService = {
  initBaileysSession: async (forceRefresh: boolean = false) => {
    if (isInitializing && !forceRefresh) return;
    isInitializing = true;

    try {
      const sessionDir = path.resolve(process.cwd(), 'storage/whatsapp-sessions');

      if (forceRefresh && fs.existsSync(sessionDir)) {
        logger.info('[Baileys Production] Limpando pasta de sessão para gerar novo QR Code limpo...');
        try {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        } catch (e) {
          logger.warn('[Baileys Session Clear] Não foi possível remover pasta antiga');
        }
      }

      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

      let version: [number, number, number] = [2, 3000, 1015901307];
      try {
        const latest = await fetchLatestBaileysVersion();
        if (latest && latest.version) {
          version = latest.version as [number, number, number];
        }
      } catch (vErr) {
        logger.warn('[Baileys Version Fetch] Usando versão padrão do protocolo WhatsApp Web');
      }

      logger.info(`[Baileys Production] Conectando ao WhatsApp Web v${version.join('.')}...`);

      baileysSocket = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ['Mac OS', 'Chrome', '121.0.6167.160'],
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
      });

      baileysSocket.ev.on('creds.update', saveCreds);

      baileysSocket.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          qrTimestamp = Date.now();
          logger.info('[Baileys Production] Novo QR Code REAL recebido dos servidores do WhatsApp Web!');

          const qrDataUrl = await QRCode.toDataURL(qr, {
            errorCorrectionLevel: 'M',
            margin: 4,
            width: 400,
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          });

          await StoreDB.updateWhatsAppConnection('BAILEYS', 'CONNECTING');
          const currentConn = StoreDB.getWhatsAppConnection();
          currentConn.qr_code = qrDataUrl;
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          logger.warn(`[Baileys Production] Conexão encerrada (Status: ${statusCode}). Reconectar? ${shouldReconnect}`);

          if (shouldReconnect) {
            isInitializing = false;
            setTimeout(() => {
              WhatsAppService.initBaileysSession();
            }, 3000);
          } else {
            await StoreDB.updateWhatsAppConnection('BAILEYS', 'DISCONNECTED');
            isInitializing = false;
          }
        } else if (connection === 'open') {
          // Extrair e descompactar o número REAL do usuário do soquete Baileys (sem número fake)
          const rawUserJid = 
            baileysSocket?.user?.id || 
            (baileysSocket?.user as any)?.jid || 
            state.creds?.me?.id || 
            (state.creds?.me as any)?.jid || 
            '';
          
          const formattedPhone = formatBrazilianPhone(rawUserJid);

          logger.info(`🚀 [Baileys Real] Conectado com sucesso ao número REAL: ${formattedPhone} (JID original: ${rawUserJid})`);

          await StoreDB.updateWhatsAppConnection('BAILEYS', 'CONNECTED', formattedPhone);
          isInitializing = false;
        }
      });

    } catch (err: any) {
      logger.error(`[Baileys Production Error] ${err.message}`);
      isInitializing = false;
    }
  },

  getQrTimestamp: () => qrTimestamp,

  // Disparo de PIN de Recuperação de Senha do Cliente via WhatsApp
  sendPinNotification: async (phone: string, pinCode: string) => {
    const formattedPhone = formatBrazilianPhone(phone);
    const cleanPhone = phone.replace(/\D/g, '');
    const waJid = cleanPhone.length <= 11 ? `55${cleanPhone}@s.whatsapp.net` : `${cleanPhone}@s.whatsapp.net`;

    const conn = StoreDB.getWhatsAppConnection();
    const pinMessage = `🔒 *FoodS Gourmet* — Código de Segurança para Recuperação de Senha\n\nSeu PIN de verificação de 6 dígitos é: *${pinCode}*\n\nEste código expira em 10 minutos. Se você não solicitou a redefinição de senha, ignore esta mensagem.`;

    if (conn.provider === 'META_CLOUD_API' && conn.meta_config?.access_token) {
      try {
        await fetch(`https://graph.facebook.com/v18.0/${conn.meta_config.phone_number_id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${conn.meta_config.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: { body: pinMessage },
          }),
        });
      } catch (e) {}
    } else if (conn.provider === 'BAILEYS' && baileysSocket && conn.status === 'CONNECTED') {
      try {
        await baileysSocket.sendMessage(waJid, { text: pinMessage });
      } catch (e) {}
    }
  },

  // Disparo de notificações do pedido
  sendOrderStatusNotification: async (orderId: string) => {
    const order = StoreDB.getOrderById(orderId);
    if (!order) return;

    const rawPhone = order.customer_phone || (order.customer_id ? StoreDB.getCustomers().find(c => c.id === order.customer_id)?.phone : undefined);
    if (!rawPhone) return;

    const cleanPhone = rawPhone.replace(/\D/g, '');
    const waJid = cleanPhone.length <= 11 ? `55${cleanPhone}@s.whatsapp.net` : `${cleanPhone}@s.whatsapp.net`;

    const conn = StoreDB.getWhatsAppConnection();
    const messageText = `🍔 *FoodS Gourmet* — Atualização do Pedido #${order.order_number}\n\nOlá *${order.customer_name || 'Cliente'}*! Seu pedido está com o status: *${translateOrderStatus(order.status).toUpperCase()}*.\n\nTotal: R$ ${order.total.toFixed(2)}\nTempo estimado: 25 minutos.`;

    if (conn.provider === 'META_CLOUD_API' && conn.meta_config?.access_token) {
      try {
        await fetch(`https://graph.facebook.com/v18.0/${conn.meta_config.phone_number_id}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${conn.meta_config.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: { body: messageText },
          }),
        });
      } catch (err: any) {
        logger.error(`[Meta API Error] ${err.message}`);
      }
    } else if (conn.provider === 'BAILEYS' && baileysSocket && conn.status === 'CONNECTED') {
      try {
        await baileysSocket.sendMessage(waJid, { text: messageText });
      } catch (err: any) {
        logger.error(`[Baileys Error] ${err.message}`);
      }
    }
  },
};
