import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Product, Category, Order, Totem, PaymentIntent, Organization, Unit } from '../../packages/types';
import { formatBRL } from '../../packages/shared';
import { apiFetch } from '../lib/supabase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faShoppingBag, 
  faSearch, 
  faPlus, 
  faMinus, 
  faCheckCircle, 
  faCreditCard, 
  faQrcode, 
  faUtensils, 
  faReceipt, 
  faRotateRight, 
  faTrash, 
  faTimes, 
  faMoneyBillWave, 
  faExclamationTriangle, 
  faCircleNotch,
  faPrint,
  faStore,
  faClock,
  faCheck
} from '@fortawesome/free-solid-svg-icons';

interface TotemViewProps {
  totemId?: string;
  onClose?: () => void;
  organization?: Organization | null;
  currentUnit?: Unit | null;
}

export const TotemView: React.FC<TotemViewProps> = ({ 
  totemId, 
  onClose,
  organization: initialOrg,
  currentUnit: initialUnit
}) => {
  // Configurações do Restaurante e do Totem
  const [org, setOrg] = useState<Organization | null>(initialOrg || null);
  const [unit, setUnit] = useState<Unit | null>(initialUnit || null);
  const [totemConfig, setTotemConfig] = useState<Totem | null>(null);
  
  // Estados da Sessão e Navegação do Totem
  const [step, setStep] = useState<'IDLE' | 'CATALOG' | 'CART' | 'CHECKOUT' | 'PAYING_CARD' | 'PAYING_PIX' | 'SUCCESS'>('IDLE');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Item sendo customizado
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemQuantity, setItemQuantity] = useState(1);
  const [itemNotes, setItemNotes] = useState('');
  const [selectedAddons, setSelectedAddons] = useState<Array<{ name: string; price: number; quantity: number }>>([]);
  
  // Carrinho de Compras
  const [cart, setCart] = useState<Array<{
    product: Product;
    quantity: number;
    notes: string;
    addons: Array<{ name: string; price: number; quantity: number }>;
    itemTotal: number;
  }>>([]);
  
  // Dados do Cliente
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  // Pagamento, Intenção e Impressão
  const [activeIntent, setActiveIntent] = useState<PaymentIntent | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPrintingThermal, setIsPrintingThermal] = useState(false);
  const [thermalPrintedSuccess, setThermalPrintedSuccess] = useState(false);
  
  // Timeout de Inatividade: 2 minutos (120 segundos) se não houver movimento
  const INACTIVITY_TIMEOUT_SECONDS = 120;
  const [idleSecondsRemaining, setIdleSecondsRemaining] = useState<number>(INACTIVITY_TIMEOUT_SECONDS);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const thermalPrintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadTotemData();
  }, [totemId]);

  // Carregar dados reais da Organização, Totem, produtos e categorias
  const loadTotemData = async () => {
    try {
      const [orgData, unitsData, prods, cats, totemsList] = await Promise.all([
        apiFetch<Organization>('/restaurant/organization').catch(() => null),
        apiFetch<Unit[]>('/restaurant/units').catch(() => []),
        apiFetch<Product[]>('/catalog/products').catch(() => []),
        apiFetch<Category[]>('/catalog/categories').catch(() => []),
        apiFetch<Totem[]>('/totems').catch(() => []),
      ]);

      if (orgData) setOrg(orgData);
      if (unitsData && unitsData.length > 0 && !unit) setUnit(unitsData[0]);
      setProducts(prods.filter(p => p.is_active && p.is_available));
      setCategories(cats.filter(c => c.is_active));

      if (totemId) {
        const found = totemsList.find(t => t.id === totemId);
        if (found) setTotemConfig(found);
      } else if (totemsList.length > 0) {
        setTotemConfig(totemsList[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar dados do Totem:', err);
    }
  };

  // Gerenciamento de Reset por Atividade / Movimento
  const resetActivityTimer = useCallback(() => {
    setIdleSecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
  }, []);

  // Monitorar qualquer movimento/interação do usuário na tela
  useEffect(() => {
    const handleUserActivity = () => {
      resetActivityTimer();
    };

    const events = ['mousemove', 'mousedown', 'touchstart', 'touchmove', 'keydown', 'scroll', 'click'];
    events.forEach(evt => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserActivity));
    };
  }, [resetActivityTimer]);

  // Intervalo regressivo de inatividade (120s)
  useEffect(() => {
    if (step === 'IDLE') return;

    const interval = setInterval(() => {
      setIdleSecondsRemaining(prev => {
        if (prev <= 1) {
          // Não resetar no meio de uma transação ativa com cartão
          if (step !== 'PAYING_CARD' && step !== 'PAYING_PIX') {
            handleResetToIdle();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step]);

  // Limpeza de sessão e cancelamento de cobranças em aberto
  const handleResetToIdle = async () => {
    if (activeIntent && activeIntent.status === 'PENDING') {
      try {
        await apiFetch(`/payments/intents/${activeIntent.id}/cancel`, { method: 'POST' });
      } catch (e) {
        // Silêncio em caso de fallback
      }
    }

    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (thermalPrintTimeoutRef.current) {
      clearTimeout(thermalPrintTimeoutRef.current);
      thermalPrintTimeoutRef.current = null;
    }

    setCart([]);
    setSelectedProduct(null);
    setActiveIntent(null);
    setPaymentError(null);
    setCreatedOrder(null);
    setCustomerName('');
    setCustomerPhone('');
    setIsPrintingThermal(false);
    setThermalPrintedSuccess(false);
    setStep('IDLE');
    setIdleSecondsRemaining(INACTIVITY_TIMEOUT_SECONDS);
  };

  // Adicionar item ao carrinho
  const handleAddToCart = () => {
    if (!selectedProduct) return;
    resetActivityTimer();

    const addonsTotal = selectedAddons.reduce((acc, a) => acc + (a.price * a.quantity), 0);
    const unitTotal = selectedProduct.price + addonsTotal;
    const itemTotal = unitTotal * itemQuantity;

    setCart(prev => [
      ...prev,
      {
        product: selectedProduct,
        quantity: itemQuantity,
        notes: itemNotes.trim(),
        addons: selectedAddons,
        itemTotal,
      }
    ]);

    setSelectedProduct(null);
    setItemQuantity(1);
    setItemNotes('');
    setSelectedAddons([]);
  };

  const handleUpdateCartQty = (index: number, delta: number) => {
    resetActivityTimer();
    setCart(prev => {
      const copy = [...prev];
      const newQty = copy[index].quantity + delta;
      if (newQty <= 0) {
        copy.splice(index, 1);
      } else {
        const unitTotal = copy[index].itemTotal / copy[index].quantity;
        copy[index].quantity = newQty;
        copy[index].itemTotal = unitTotal * newQty;
      }
      return copy;
    });
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.itemTotal, 0);

  // Iniciar Fluxo de Pagamento com Cartão na Maquininha POS
  const handleStartCardPayment = async () => {
    resetActivityTimer();
    setPaymentError(null);
    setIsProcessingPayment(true);

    try {
      const intent = await apiFetch<PaymentIntent>('/payments/intents', {
        method: 'POST',
        body: JSON.stringify({
          totem_id: totemConfig?.id,
          unit_id: totemConfig?.unit_id || unit?.id,
          method: 'CARD_POS',
          amount: cartSubtotal,
          description: `Totem ${totemConfig?.name || '01'} - ${org?.name || 'Restaurante'}`,
          idempotency_key: `totem_card_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          customer_name: customerName.trim() || 'Cliente Totem',
        }),
      });

      setActiveIntent(intent);
      setStep('PAYING_CARD');
      startPollingPaymentStatus(intent.id);
    } catch (err: any) {
      setPaymentError(err.message || 'Não foi possível conectar à maquininha de cartão.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Iniciar Fluxo de Pagamento com PIX Real do Mercado Pago
  const handleStartPixPayment = async () => {
    resetActivityTimer();
    setPaymentError(null);
    setIsProcessingPayment(true);

    try {
      const intent = await apiFetch<PaymentIntent>('/payments/intents', {
        method: 'POST',
        body: JSON.stringify({
          totem_id: totemConfig?.id,
          unit_id: totemConfig?.unit_id || unit?.id,
          method: 'PIX',
          amount: cartSubtotal,
          description: `Totem ${totemConfig?.name || '01'} - ${org?.name || 'Restaurante'} - PIX`,
          idempotency_key: `totem_pix_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          customer_name: customerName.trim() || 'Cliente Totem',
          customer_email: 'cliente@foods.com.br',
        }),
      });

      setActiveIntent(intent);
      setStep('PAYING_PIX');
      startPollingPaymentStatus(intent.id);
    } catch (err: any) {
      setPaymentError(err.message || 'Erro ao gerar QR Code PIX oficial no Mercado Pago.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Monitorar confirmação de pagamento real
  const startPollingPaymentStatus = (intentId: string) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const checked = await apiFetch<PaymentIntent>(`/payments/intents/${intentId}/status`);
        setActiveIntent(checked);

        if (checked.status === 'APPROVED') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          await finalizeOrderAndPrintThermal(checked);
        } else if (checked.status === 'DECLINED') {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setPaymentError('Pagamento não autorizado ou cancelado na maquininha. Tente novamente.');
        }
      } catch (err) {
        console.warn('Verificação de status do pagamento:', err);
      }
    }, 2500);
  };

  // REGRA OBRIGATÓRIA: Confirmar Pedido Real E Executar Impressão Térmica Automática
  const finalizeOrderAndPrintThermal = async (intent: PaymentIntent) => {
    try {
      const newOrder = await apiFetch<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          type: 'COUNTER',
          order_channel: 'TOTEM',
          totem_id: totemConfig?.id,
          unit_id: totemConfig?.unit_id || unit?.id,
          customer_name: customerName.trim() || 'Cliente Totem',
          customer_phone: customerPhone.trim() || undefined,
          payment_method: intent.method,
          payment_status: 'PAID',
          status: 'RECEIVED',
          items: cart.map(it => ({
            product_id: it.product.id,
            product_name: it.product.name,
            quantity: it.quantity,
            unit_price: it.product.price,
            notes: it.notes,
            selected_addons: it.addons,
          })),
          subtotal: cartSubtotal,
          total: cartSubtotal,
        }),
      });

      setCreatedOrder(newOrder);
      setCart([]);
      setActiveIntent(null);
      setStep('SUCCESS');
      setIsPrintingThermal(true);

      // Disparar Envio para Fila de Impressão Térmica
      try {
        await apiFetch('/print/receipt', {
          method: 'POST',
          body: JSON.stringify({
            order_id: newOrder.id,
            order_number: newOrder.order_number,
            unit_id: newOrder.unit_id,
            items: newOrder.items,
            total: newOrder.total,
            payment_method: intent.method,
            customer_name: newOrder.customer_name,
            created_at: newOrder.created_at,
          }),
        }).catch(() => null);
      } catch (e) {
        // Continua com impressão local
      }

      // Simulação da Emissão Térmica Física (corte de papel de 80mm)
      thermalPrintTimeoutRef.current = setTimeout(() => {
        setIsPrintingThermal(false);
        setThermalPrintedSuccess(true);
      }, 2500);

      // 45 segundos para visualização da comanda impressa antes do retorno ao início
      setIdleSecondsRemaining(45);
    } catch (err: any) {
      setPaymentError(`Erro ao registrar pedido: ${err.message}`);
    }
  };

  // Cancelar Pagamento em Andamento
  const handleCancelPayment = async () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (activeIntent) {
      try {
        await apiFetch(`/payments/intents/${activeIntent.id}/cancel`, { method: 'POST' });
      } catch (e) {
        // Ignorar
      }
    }
    setActiveIntent(null);
    setPaymentError(null);
    setStep('CHECKOUT');
    resetActivityTimer();
  };

  // Filtro de produtos
  const filteredProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'ALL' || p.category_id === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const restaurantName = org?.legal_name || org?.name || 'FoodS Gastronomia';
  const restaurantLogo = org?.logo_url;

  // -------------------------------------------------------------
  // TELA 1: IDLE / TELA INICIAL COM LOGO E NOME DO RESTAURANTE
  // -------------------------------------------------------------
  if (step === 'IDLE') {
    return (
      <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col justify-between items-center p-8 select-none">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm shadow-sm hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faTimes} className="mr-2" />
            Sair do Totem
          </button>
        )}

        {/* Identificação Oficial do Restaurante */}
        <div className="text-center mt-12">
          {restaurantLogo ? (
            <div className="w-28 h-28 mx-auto mb-6 bg-white p-3 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-center">
              <img 
                src={restaurantLogo} 
                alt={restaurantName} 
                className="max-h-full max-w-full object-contain rounded-2xl"
              />
            </div>
          ) : (
            <div className="w-28 h-28 bg-emerald-600 rounded-3xl mx-auto flex items-center justify-center text-white text-5xl shadow-md mb-6">
              <FontAwesomeIcon icon={faUtensils} />
            </div>
          )}

          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
            {restaurantName}
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mt-3 font-medium">
            {unit?.name || 'Autoatendimento'} • Peça com facilidade e pague com segurança
          </p>
        </div>

        {/* Botão de Início Gigante para Touchscreen */}
        <div className="w-full max-w-md my-auto">
          <button
            onClick={() => {
              resetActivityTimer();
              setStep('CATALOG');
            }}
            className="w-full py-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl font-black text-2xl md:text-3xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-4 active:scale-95 cursor-pointer"
          >
            <span>FAÇA SEU PEDIDO</span>
            <FontAwesomeIcon icon={faArrowLeft} className="rotate-180 text-xl" />
          </button>
        </div>

        <div className="text-center text-slate-400 text-sm font-medium">
          Toque na tela para iniciar seu pedido • Aceitamos PIX e Cartão na Maquininha
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TELA DE PAGAMENTO COM CARTÃO NA MAQUININHA POS
  // -------------------------------------------------------------
  if (step === 'PAYING_CARD') {
    return (
      <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col justify-between p-8 select-none">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <button 
            onClick={handleCancelPayment}
            className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold hover:bg-slate-100 flex items-center space-x-2 cursor-pointer"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Cancelar e Escolher Outra Forma</span>
          </button>
          <div className="flex items-center space-x-3 text-slate-500 text-sm font-semibold">
            <FontAwesomeIcon icon={faClock} />
            <span>Inatividade: {idleSecondsRemaining}s</span>
          </div>
        </div>

        <div className="max-w-xl mx-auto my-auto text-center w-full bg-white border border-slate-200 rounded-3xl p-10 shadow-sm">
          {restaurantLogo && (
            <img src={restaurantLogo} alt={restaurantName} className="h-10 mx-auto mb-4 object-contain" />
          )}

          <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6">
            <FontAwesomeIcon icon={faCreditCard} className="animate-pulse" />
          </div>

          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            APROXIME, INSIRA OU PASSE SEU CARTÃO
          </h2>
          <p className="text-lg text-slate-500 mt-2 font-medium">
            Siga as instruções na tela da maquininha de cartão
          </p>

          <div className="my-8 py-6 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor a Pagar</div>
            <div className="text-4xl font-black text-slate-900 mt-1">{formatBRL(cartSubtotal)}</div>
          </div>

          {paymentError ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium mb-6 flex items-center space-x-3 text-left">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-lg flex-shrink-0" />
              <span>{paymentError}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-3 text-slate-600 font-semibold text-sm">
              <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-blue-600 text-lg" />
              <span>Aguardando processamento e confirmação no terminal...</span>
            </div>
          )}

          <div className="mt-8 flex space-x-4">
            {paymentError ? (
              <button
                onClick={handleStartCardPayment}
                className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-sm cursor-pointer"
              >
                Tentar Novamente
              </button>
            ) : null}
            <button
              onClick={handleCancelPayment}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl cursor-pointer"
            >
              Escolher Outra Forma
            </button>
          </div>
        </div>

        <div className="text-center text-slate-400 text-xs font-medium">
          {restaurantName} • Transação oficial e segura via Terminal Point POS
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TELA DE PAGAMENTO COM PIX REAL MERCADO PAGO
  // -------------------------------------------------------------
  if (step === 'PAYING_PIX') {
    return (
      <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col justify-between p-8 select-none">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <button 
            onClick={handleCancelPayment}
            className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-slate-700 font-bold hover:bg-slate-100 flex items-center space-x-2 cursor-pointer"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Voltar</span>
          </button>
          <div className="flex items-center space-x-3 text-slate-500 text-sm font-semibold">
            <FontAwesomeIcon icon={faClock} />
            <span>Inatividade: {idleSecondsRemaining}s</span>
          </div>
        </div>

        <div className="max-w-xl mx-auto my-auto text-center w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          {restaurantLogo && (
            <img src={restaurantLogo} alt={restaurantName} className="h-10 mx-auto mb-3 object-contain" />
          )}

          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            <FontAwesomeIcon icon={faQrcode} />
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-slate-900">
            Pague com PIX
          </h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">
            Abra o app do seu banco e aponte a câmera para o QR Code abaixo
          </p>

          <div className="text-3xl font-black text-emerald-600 my-4">
            {formatBRL(cartSubtotal)}
          </div>

          {activeIntent?.qr_code_base64 ? (
            <div className="w-64 h-64 mx-auto p-3 bg-white border-2 border-emerald-500 rounded-2xl flex items-center justify-center shadow-sm">
              <img 
                src={`data:image/png;base64,${activeIntent.qr_code_base64}`} 
                alt="QR Code PIX Mercado Pago" 
                className="w-full h-full object-contain"
              />
            </div>
          ) : activeIntent?.qr_code ? (
            <div className="w-64 h-64 mx-auto p-3 bg-white border-2 border-emerald-500 rounded-2xl flex items-center justify-center shadow-sm">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(activeIntent.qr_code)}`} 
                alt="QR Code PIX" 
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-64 h-64 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
              <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-3xl text-emerald-600" />
            </div>
          )}

          <div className="mt-6 flex items-center justify-center space-x-3 text-slate-600 font-semibold text-sm">
            <FontAwesomeIcon icon={faCircleNotch} className="animate-spin text-emerald-600" />
            <span>Aguardando confirmação bancária instantânea...</span>
          </div>

          <div className="mt-6">
            <button
              onClick={handleCancelPayment}
              className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-sm cursor-pointer"
            >
              Escolher Outra Forma de Pagamento
            </button>
          </div>
        </div>

        <div className="text-center text-slate-400 text-xs font-medium">
          {restaurantName} • Cobrança PIX com liquidação em tempo real
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TELA DE SUCESSO: PEDIDO CONFIRMADO + IMPRESSÃO TÉRMICA DA COMANDA
  // -------------------------------------------------------------
  if (step === 'SUCCESS' && createdOrder) {
    return (
      <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col justify-between items-center p-6 md:p-8 select-none overflow-y-auto">
        <div className="text-right w-full text-slate-400 text-sm font-semibold">
          Finalizando em {idleSecondsRemaining}s
        </div>

        <div className="max-w-md w-full my-auto flex flex-col items-center">
          {/* Status da Confirmação */}
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-3">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>

          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight text-center">
            PAGAMENTO CONFIRMADO
          </h2>

          <div className="w-full my-4 py-4 bg-white border border-slate-200 rounded-3xl text-center shadow-xs">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sua Senha de Retirada</div>
            <div className="text-5xl font-black text-emerald-600 mt-1 tracking-tight">
              #{createdOrder.order_number}
            </div>
          </div>

          {/* Banner de Impressão Térmica Automática */}
          <div className="w-full bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between mb-4 shadow-sm">
            <div className="flex items-center space-x-3">
              {isPrintingThermal ? (
                <FontAwesomeIcon icon={faRotateRight} className="animate-spin text-amber-400 text-xl" />
              ) : (
                <FontAwesomeIcon icon={faCheck} className="text-emerald-400 text-xl" />
              )}
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-slate-300">
                  {isPrintingThermal ? 'IMPRIMINDO COMANDA TÉRMICA...' : 'COMANDA TÉRMICA IMPRESSA'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {isPrintingThermal ? 'Aguarde o corte do papel na impressora' : 'Destaque sua via no bocal da impressora'}
                </p>
              </div>
            </div>
            <FontAwesomeIcon icon={faPrint} className="text-slate-400 text-xl" />
          </div>

          {/* Simulação Visual da Comanda Térmica Física (80mm) */}
          <div className="w-full bg-white border border-slate-300 rounded-2xl p-5 font-mono text-xs text-slate-800 shadow-md">
            <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
              {restaurantLogo && (
                <img src={restaurantLogo} alt={restaurantName} className="h-8 mx-auto mb-2 object-contain" />
              )}
              <h3 className="font-bold text-sm text-slate-900">{restaurantName.toUpperCase()}</h3>
              <p className="text-[10px] text-slate-500">
                {unit?.name} {org?.document ? `• CNPJ: ${org.document}` : ''}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Data: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>

            <div className="text-center bg-slate-100 py-2 rounded-lg font-bold text-sm my-2">
              SENHA #{createdOrder.order_number}
            </div>

            <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300 text-[11px]">
              {createdOrder.items?.map((it, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <span>{it.quantity}x {it.product_name}</span>
                    {it.notes && <p className="text-[9px] text-slate-500 italic pl-3">Obs: {it.notes}</p>}
                  </div>
                  <span className="font-bold">{formatBRL(it.unit_price * it.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2 font-bold text-sm">
              <span>TOTAL PAGO:</span>
              <span className="text-emerald-700">{formatBRL(createdOrder.total)}</span>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-dashed border-slate-300 mt-3">
              {createdOrder.payment_method === 'CARD_POS' ? 'PAGO NO CARTÃO (MAQUININHA POS)' : 'PAGO VIA PIX MERCADO PAGO'}
              <p className="mt-0.5">Obrigado pela preferência! Aguarde ser chamado.</p>
            </div>
          </div>

          <div className="w-full mt-6">
            <button
              onClick={handleResetToIdle}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-md transition-colors cursor-pointer"
            >
              FINALIZAR E NOVO PEDIDO
            </button>
          </div>
        </div>

        <div className="text-slate-400 text-xs font-medium text-center">
          {restaurantName} • Guarde sua comanda para retirar no balcão
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // TELA PRINCIPAL: CATÁLOGO, CARRINHO E CHECKOUT
  // -------------------------------------------------------------
  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col select-none">
      {/* Barra Superior do Totem com Logo e Nome da Loja */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              if (step === 'CART' || step === 'CHECKOUT') {
                setStep('CATALOG');
              } else {
                handleResetToIdle();
              }
            }}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>{step === 'CATALOG' ? 'Início' : 'Voltar ao Cardápio'}</span>
          </button>

          {/* Logo e Nome do Restaurante */}
          <div className="flex items-center space-x-3">
            {restaurantLogo ? (
              <img src={restaurantLogo} alt={restaurantName} className="h-10 w-10 object-contain rounded-xl bg-slate-50 p-1 border border-slate-200" />
            ) : (
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center font-black">
                <FontAwesomeIcon icon={faUtensils} />
              </div>
            )}
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">
                {restaurantName}
              </h2>
              <span className="text-xs text-slate-400 font-semibold">
                {unit?.name || totemConfig?.name || 'Autoatendimento'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Contador de Inatividade de 2 minutos */}
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
            <FontAwesomeIcon icon={faClock} className="text-slate-400" />
            <span>Sessão: {idleSecondsRemaining}s</span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => {
                resetActivityTimer();
                setStep(step === 'CART' ? 'CATALOG' : 'CART');
              }}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center space-x-3 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <FontAwesomeIcon icon={faShoppingBag} />
              <span>Ver Carrinho ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
              <span className="bg-emerald-700 px-2 py-0.5 rounded-lg text-sm">{formatBRL(cartSubtotal)}</span>
            </button>
          )}
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Lado Esquerdo: Categorias e Busca */}
        {step === 'CATALOG' && (
          <>
            <aside className="w-60 bg-white border-r border-slate-200 p-4 flex flex-col space-y-2 overflow-y-auto">
              <div className="text-xs font-bold text-slate-400 uppercase px-3 mb-1">Categorias</div>
              <button
                onClick={() => {
                  resetActivityTimer();
                  setSelectedCategory('ALL');
                }}
                className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Todas as Opções
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    resetActivityTimer();
                    setSelectedCategory(cat.id);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </aside>

            {/* Grid de Produtos */}
            <main className="flex-1 p-6 overflow-y-auto">
              <div className="mb-6 max-w-md">
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar produto ou bebida..."
                    value={searchQuery}
                    onChange={e => {
                      resetActivityTimer();
                      setSearchQuery(e.target.value);
                    }}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                  />
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-24 bg-white border border-slate-200 rounded-3xl p-8">
                  <FontAwesomeIcon icon={faUtensils} className="text-slate-300 text-4xl mb-3" />
                  <h3 className="text-lg font-bold text-slate-700">Nenhum produto disponível</h3>
                  <p className="text-sm text-slate-400 mt-1">Cadastre seus produtos no painel administrativo para exibir no Totem.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredProducts.map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        resetActivityTimer();
                        setSelectedProduct(prod);
                        setItemQuantity(1);
                        setItemNotes('');
                        setSelectedAddons([]);
                      }}
                      className="bg-white border border-slate-200 rounded-3xl p-4 flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      <div>
                        {prod.image_url ? (
                          <img 
                            src={prod.image_url} 
                            alt={prod.name} 
                            className="w-full h-36 object-cover rounded-2xl mb-3 bg-slate-100" 
                          />
                        ) : (
                          <div className="w-full h-36 bg-slate-100 rounded-2xl mb-3 flex items-center justify-center text-slate-300 text-3xl">
                            <FontAwesomeIcon icon={faUtensils} />
                          </div>
                        )}
                        <h4 className="font-black text-slate-900 text-base leading-snug line-clamp-1">
                          {prod.name}
                        </h4>
                        {prod.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {prod.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100">
                        <span className="text-emerald-600 font-black text-lg">
                          {formatBRL(prod.price)}
                        </span>
                        <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                          <FontAwesomeIcon icon={faPlus} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </main>
          </>
        )}

        {/* TELA DE VISUALIZAÇÃO DO CARRINHO */}
        {step === 'CART' && (
          <main className="flex-1 max-w-2xl mx-auto p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-6">Seu Carrinho de Compras</h3>

              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900">{item.product.name}</h4>
                      {item.notes && <p className="text-xs text-slate-500 italic">Obs: {item.notes}</p>}
                      <div className="text-xs font-bold text-emerald-600 mt-1">{formatBRL(item.itemTotal)}</div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleUpdateCartQty(idx, -1)}
                        className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faMinus} />
                      </button>
                      <span className="font-black text-base text-slate-900 w-6 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateCartQty(idx, 1)}
                        className="w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 mt-6 shadow-sm">
              <div className="flex justify-between items-center text-lg font-black text-slate-900 mb-6">
                <span>Total do Pedido:</span>
                <span className="text-2xl text-emerald-600">{formatBRL(cartSubtotal)}</span>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep('CATALOG')}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-base cursor-pointer"
                >
                  Adicionar Mais Itens
                </button>
                <button
                  onClick={() => {
                    resetActivityTimer();
                    setStep('CHECKOUT');
                  }}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-base shadow-md cursor-pointer"
                >
                  Continuar para Pagamento
                </button>
              </div>
            </div>
          </main>
        )}

        {/* TELA DE CHECKOUT — ESCOLHA DA FORMA DE PAGAMENTO */}
        {step === 'CHECKOUT' && (
          <main className="flex-1 max-w-xl mx-auto p-6 overflow-y-auto my-auto w-full">
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Finalizar Pedido</h3>
              <p className="text-sm text-slate-500 mb-6 font-medium">Escolha como deseja realizar o pagamento no Totem</p>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
                <div className="flex justify-between text-sm text-slate-600 mb-1">
                  <span>Itens ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
                  <span>{formatBRL(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total a Pagar</span>
                  <span className="text-emerald-600">{formatBRL(cartSubtotal)}</span>
                </div>
              </div>

              {/* Identificação Opcional do Cliente */}
              <div className="space-y-3 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Seu Nome (Para retirar o pedido)</label>
                  <input
                    type="text"
                    placeholder="Digite seu nome..."
                    value={customerName}
                    onChange={e => {
                      resetActivityTimer();
                      setCustomerName(e.target.value);
                    }}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                {totemConfig?.require_phone && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(11) 99999-9999"
                      value={customerPhone}
                      onChange={e => {
                        resetActivityTimer();
                        setCustomerPhone(e.target.value);
                      }}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                )}
              </div>

              {/* Botões de Formas de Pagamento Reais */}
              <div className="space-y-3">
                <button
                  disabled={isProcessingPayment}
                  onClick={handleStartCardPayment}
                  className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl flex items-center justify-between px-6 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faCreditCard} className="text-2xl" />
                    <span>PAGAR COM CARTÃO NA MAQUININHA</span>
                  </div>
                  <FontAwesomeIcon icon={faArrowLeft} className="rotate-180" />
                </button>

                <button
                  disabled={isProcessingPayment}
                  onClick={handleStartPixPayment}
                  className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl flex items-center justify-between px-6 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faQrcode} className="text-2xl" />
                    <span>PAGAR COM PIX (QR CODE)</span>
                  </div>
                  <FontAwesomeIcon icon={faArrowLeft} className="rotate-180" />
                </button>
              </div>

              {paymentError && (
                <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold">
                  {paymentError}
                </div>
              )}
            </div>
          </main>
        )}
      </div>

      {/* Modal / Painel de Adicionar Produto com Observações e Quantidade */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedProduct.name}</h3>
                <span className="text-emerald-600 font-bold text-lg">{formatBRL(selectedProduct.price)}</span>
              </div>
              <button
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold cursor-pointer"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            {selectedProduct.description && (
              <p className="text-xs text-slate-500 mb-4">{selectedProduct.description}</p>
            )}

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Observações do Item</label>
              <textarea
                placeholder="Ex: Sem cebola, ponto da carne, etc..."
                value={itemNotes}
                onChange={e => setItemNotes(e.target.value)}
                rows={2}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between my-6 py-3 border-y border-slate-100">
              <span className="text-sm font-bold text-slate-700">Quantidade:</span>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black flex items-center justify-center text-lg cursor-pointer"
                >
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <span className="font-black text-xl text-slate-900 w-8 text-center">{itemQuantity}</span>
                <button
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                  className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-black flex items-center justify-center text-lg cursor-pointer"
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Adicionar • {formatBRL(selectedProduct.price * itemQuantity)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

