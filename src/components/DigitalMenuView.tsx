import React, { useEffect, useState } from 'react';
import { Product, Category, Order, Customer } from '../../packages/types';
import { formatBRL, translateOrderStatus } from '../../packages/shared';
import { apiFetch } from '../lib/supabase';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  Clock, 
  Phone, 
  CheckCircle2, 
  ArrowLeft,
  X,
  CreditCard,
  QrCode,
  Truck,
  Plus,
  Minus,
  Store,
  ChevronRight,
  Utensils,
  ExternalLink,
  Sparkles,
  User,
  Lock,
  Key,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  LogIn
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}

export const DigitalMenuView: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Carrinho e Modal de Item
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemNotes, setItemNotes] = useState<string>('');
  const [showCartDrawer, setShowCartDrawer] = useState(false);

  // Checkout
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD' | 'CASH'>('PIX');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [complement, setComplement] = useState('');

  // Cliente Autenticado no Cardápio Online
  const [loggedCustomer, setLoggedCustomer] = useState<any | null>(null);
  const [showAuthModal, setShowAuthDrawer] = useState(false);
  const [authStep, setAuthStep] = useState<'PHONE_CHECK' | 'PASSWORD' | 'REGISTER' | 'RECOVERY_REQUEST' | 'RECOVERY_VERIFY'>('PHONE_CHECK');
  
  // States do formulário de autenticação do cliente
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPinCode, setAuthPinCode] = useState('');
  const [authNewPassword, setAuthNewPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Acompanhamento do Pedido
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [pixPayload, setPixPayload] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog();
    // Carregar cliente salvo se houver
    const savedCust = localStorage.getItem('foods_online_customer');
    if (savedCust) {
      try {
        const parsed = JSON.parse(savedCust);
        setLoggedCustomer(parsed);
        setCustomerName(parsed.name || '');
        setCustomerPhone(parsed.phone || '');
      } catch (e) {
        localStorage.removeItem('foods_online_customer');
      }
    }
  }, []);

  const loadCatalog = async () => {
    try {
      const [prods, cats] = await Promise.all([
        apiFetch<Product[]>('/catalog/products'),
        apiFetch<Category[]>('/catalog/categories'),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Erro ao carregar cardápio digital:', err);
    }
  };

  const handleOpenProductModal = (p: Product) => {
    setSelectedProductModal(p);
    setItemQuantity(1);
    setItemNotes('');
  };

  const handleConfirmAddToCart = () => {
    if (!selectedProductModal) return;
    setCart(prev => {
      const existingIdx = prev.findIndex(i => i.product.id === selectedProductModal.id);
      if (existingIdx !== -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += itemQuantity;
        if (itemNotes) copy[existingIdx].notes = itemNotes;
        return copy;
      }
      return [...prev, { product: selectedProductModal, quantity: itemQuantity, notes: itemNotes }];
    });
    setSelectedProductModal(null);
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    try {
      const cust = await apiFetch<any>('/customers', {
        method: 'POST',
        body: JSON.stringify({ name: customerName, phone: customerPhone }),
      });

      const newOrder = await apiFetch<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: cust.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          type: orderType,
          payment_method: paymentMethod,
          items: cart.map(c => ({
            product_id: c.product.id,
            product_name: c.product.name,
            unit_price: c.product.price,
            quantity: c.quantity,
            notes: c.notes,
          })),
          delivery_address: orderType === 'DELIVERY' ? {
            street,
            number,
            neighborhood,
            complement,
            city: 'São Paulo',
            state: 'SP',
            zipcode: '01000-000',
          } : undefined,
        }),
      });

      // Se o método for PIX ou Cartão, chamar o gateway da InfinityPay
      if (paymentMethod === 'PIX' || paymentMethod === 'CREDIT_CARD') {
        const charge = await apiFetch<any>('/payments/charge', {
          method: 'POST',
          body: JSON.stringify({
            orderId: newOrder.id,
            provider: 'infinitypay',
          }),
        });
        setCheckoutUrl(charge.checkoutUrl);
        setPixPayload(charge.qrCodePayload);
      }

      setActiveOrder(newOrder);
      setCart([]);
      setShowCartDrawer(false);
    } catch (err: any) {
      alert(`Erro ao finalizar pedido: ${err.message}`);
    }
  };

  // Fluxos de Autenticação WhatsApp + Google para Clientes
  const handleCheckPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authPhone) return;
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await apiFetch<any>('/customers/auth/check-phone', {
        method: 'POST',
        body: JSON.stringify({ phone: authPhone }),
      });

      if (res.exists && res.has_account) {
        setAuthStep('PASSWORD');
      } else {
        setAuthStep('REGISTER');
        setAuthName(res.customer_name || '');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao consultar telefone.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await apiFetch<any>('/customers/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone: authPhone, password: authPassword }),
      });

      if (res.success && res.customer) {
        setLoggedCustomer(res.customer);
        setCustomerName(res.customer.name || '');
        setCustomerPhone(res.customer.phone || '');
        localStorage.setItem('foods_online_customer', JSON.stringify(res.customer));
        setShowAuthDrawer(false);
      } else {
        setAuthError(res.message || 'Dados inválidos.');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Senha ou telefone inválidos.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await apiFetch<any>('/customers/auth/setup-password', {
        method: 'POST',
        body: JSON.stringify({ phone: authPhone, password: authPassword, name: authName }),
      });

      if (res.success && res.customer) {
        setLoggedCustomer(res.customer);
        setCustomerName(res.customer.name || '');
        setCustomerPhone(res.customer.phone || '');
        localStorage.setItem('foods_online_customer', JSON.stringify(res.customer));
        setShowAuthDrawer(false);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRequestPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const res = await apiFetch<any>('/customers/auth/request-pin', {
        method: 'POST',
        body: JSON.stringify({ phone: authPhone }),
      });

      setAuthSuccess(res.message || 'PIN de 6 dígitos enviado para seu WhatsApp!');
      setAuthStep('RECOVERY_VERIFY');
    } catch (err: any) {
      setAuthError(err.message || 'Falha ao gerar PIN de recuperação.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');

    try {
      const checkPin = await apiFetch<any>('/customers/auth/verify-pin', {
        method: 'POST',
        body: JSON.stringify({ phone: authPhone, pin_code: authPinCode }),
      });

      if (checkPin.verified) {
        await apiFetch<any>('/customers/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ phone: authPhone, new_password: authNewPassword }),
        });

        setAuthSuccess('Sua senha foi redefinida com sucesso!');
        setAuthStep('PASSWORD');
        setAuthPassword('');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao redefinir. PIN inválido ou expirado.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleCustomerLogin = () => {
    setAuthLoading(true);
    setTimeout(() => {
      // Simulação de Google Auth com dados reais de mock
      const googleCustomer = {
        id: `goog_${Date.now()}`,
        name: 'Cliente Google G-Suite',
        phone: '(11) 98888-7777',
        email: 'cliente@kaioborges.com.br',
        points_balance: 150
      };
      setLoggedCustomer(googleCustomer);
      setCustomerName(googleCustomer.name);
      setCustomerPhone(googleCustomer.phone);
      localStorage.setItem('foods_online_customer', JSON.stringify(googleCustomer));
      setShowAuthDrawer(false);
      setAuthLoading(false);
    }, 1200);
  };

  const handleCustomerLogout = () => {
    setLoggedCustomer(null);
    setCustomerName('');
    setCustomerPhone('');
    localStorage.removeItem('foods_online_customer');
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const deliveryFee = orderType === 'DELIVERY' ? 5.00 : 0;
  const cartTotal = cartSubtotal + deliveryFee;

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Header Glassmorphism Premium estilo Delivery */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs transition-all">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onClose && (
              <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-xs px-2 py-0.5 rounded-lg shadow-2xs">
                  FoodS
                </span>
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">Restaurante FoodS</h1>
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-emerald-500" />
                <span>Aberto agora · 25-35 min · Entrega R$ 5,00</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {loggedCustomer ? (
              <div className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-800 transition-colors">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="max-w-[80px] truncate">{loggedCustomer.name}</span>
                <button onClick={handleCustomerLogout} className="text-[10px] text-slate-400 hover:text-red-600 font-extrabold">
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setShowAuthDrawer(true);
                  setAuthStep('PHONE_CHECK');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-slate-500" />
                <span>Entrar / Cadastrar</span>
              </button>
            )}

            <button
              onClick={() => setShowCartDrawer(true)}
              className="relative px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-orange-400" />
              <span className="hidden sm:inline">Carrinho</span>
              {cart.length > 0 && (
                <span className="bg-orange-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-black">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal do Cardápio Online */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-5">
        
        {/* Tela de Acompanhamento Real do Pedido */}
        {activeOrder ? (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-center animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                Pedido Registrado com Sucesso
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">
                Pedido #{activeOrder.order_number}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Acompanhe o andamento da preparação em tempo real
              </p>
            </div>

            {/* Status Stepper */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>Status Atual:</span>
                <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full uppercase font-mono">
                  {translateOrderStatus(activeOrder.status)}
                </span>
              </div>
            </div>

            {/* Link de Pagamento InfinityPay se disponível */}
            {checkoutUrl && (
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200 space-y-3">
                <p className="text-xs font-bold text-orange-900 flex items-center justify-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-orange-600" />
                  <span>Finalize seu pagamento na InfinityPay</span>
                </p>
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <span>Efetuar Pagamento</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            <button
              onClick={() => setActiveOrder(null)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl w-full"
            >
              Voltar ao Cardápio Digital
            </button>
          </div>
        ) : (
          <>
            {/* Barra de Pesquisa */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Busque o hambúrguer, bebida ou sobremesa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:border-orange-500 shadow-2xs font-medium"
              />
            </div>

            {/* Lista de Categorias Rolável Horizontal */}
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-orange-500 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🌭 Todos
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === c.id
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🍔 {c.name}
                </button>
              ))}
            </div>

            {/* Listagem de Produtos Premium */}
            <div className="space-y-4">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleOpenProductModal(p)}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200/80 hover:border-orange-300 shadow-3xs hover:shadow-2xs transition-all flex gap-4 cursor-pointer"
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shrink-0 border border-slate-100"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-slate-100">
                      <Utensils className="w-8 h-8 text-orange-400" />
                    </div>
                  )}

                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm tracking-tight leading-tight">
                        {p.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {p.description || 'Nenhuma descrição disponível para este prato.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="font-mono font-black text-orange-600 text-sm">
                        {formatBRL(p.price)}
                      </span>
                      <button className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-[10px] font-black tracking-wide uppercase transition-colors shadow-3xs flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-200">
                  <p className="text-slate-400 text-xs font-bold">Nenhum produto localizado neste filtro.</p>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* ------------------------------------------------------------- */}
      {/* DRAWER: DETALHES DO ITEM PARA ADICIONAR AO CARRINHO */}
      {/* ------------------------------------------------------------- */}
      {selectedProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-slide-up">
            <div className="relative">
              {selectedProductModal.image_url ? (
                <img
                  src={selectedProductModal.image_url}
                  alt={selectedProductModal.name}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-40 bg-orange-50 flex items-center justify-center">
                  <Utensils className="w-12 h-12 text-orange-400" />
                </div>
              )}
              <button
                onClick={() => setSelectedProductModal(null)}
                className="absolute top-3 right-3 p-2 bg-slate-900/60 text-white hover:bg-slate-900 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
                  {selectedProductModal.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {selectedProductModal.description || 'Ficha técnica e descrição indisponíveis.'}
                </p>
              </div>

              {/* Campo de Notas */}
              <div>
                <label className="font-bold text-slate-700 text-xs block mb-1">Observações do Item</label>
                <textarea
                  placeholder="Ex: sem cebola, ponto da carne, molho à parte..."
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-orange-500 font-medium h-16 resize-none"
                />
              </div>

              {/* Quantidade e Botão Confirmar */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3 bg-slate-100 rounded-xl p-1">
                  <button
                    onClick={() => setItemQuantity(prev => Math.max(1, prev - 1))}
                    className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-bold text-xs text-slate-800 w-5 text-center">
                    {itemQuantity}
                  </span>
                  <button
                    onClick={() => setItemQuantity(prev => prev + 1)}
                    className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleConfirmAddToCart}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Adicionar · {formatBRL(selectedProductModal.price * itemQuantity)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DRAWER: CARRINHO DE COMPRAS E CHECKOUT */}
      {/* ------------------------------------------------------------- */}
      {showCartDrawer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md h-full flex flex-col animate-slide-left shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-orange-500" />
                <span>Carrinho Digital</span>
              </h2>
              <button onClick={() => setShowCartDrawer(false)} className="p-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 && (
                <div className="text-center py-12 space-y-2">
                  <p className="text-slate-400 font-bold text-xs">Seu carrinho está vazio.</p>
                  <p className="text-[11px] text-slate-400">Adicione alguns pratos para iniciar!</p>
                </div>
              )}

              {/* Itens do Carrinho */}
              <div className="space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-slate-800">{item.product.name} x{item.quantity}</p>
                      {item.notes && <p className="text-[10px] text-slate-500 italic">"{item.notes}"</p>}
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      {formatBRL(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Formulário de Entrega e Pagamento */}
              <form id="checkout-form" onSubmit={handleCheckout} className="space-y-3 text-xs pt-2 border-t border-slate-100">
                <div>
                  <label className="font-bold text-slate-700">Seu Nome</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome e Sobrenome"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-2.5 mt-1 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700">Seu WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 99999-8888"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2.5 mt-1 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderType('DELIVERY')}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      orderType === 'DELIVERY' ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Entrega em Casa
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType('PICKUP')}
                    className={`py-2 rounded-xl font-bold border transition-all cursor-pointer ${
                      orderType === 'PICKUP' ? 'bg-orange-500 text-white border-orange-500' : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Retirar na Loja
                  </button>
                </div>

                {orderType === 'DELIVERY' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      required
                      placeholder="Rua / Avenida"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Número"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Bairro"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700">Forma de Pagamento</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 mt-1 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none"
                  >
                    <option value="PIX">PIX Online (InfinityPay / MercadoPago)</option>
                    <option value="CREDIT_CARD">Cartão de Crédito Online (InfinityPay)</option>
                    <option value="CASH">Dinheiro na Entrega</option>
                  </select>
                </div>
              </form>
            </div>

            <div className="pt-4 border-t border-slate-100 p-4 space-y-3 shrink-0">
              <div className="flex justify-between items-center text-sm font-black text-slate-900">
                <span>Total a Pagar:</span>
                <span className="font-mono text-orange-600 text-base tabular-nums">
                  {formatBRL(cartTotal)}
                </span>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={cart.length === 0}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-xs transition-colors cursor-pointer"
              >
                Confirmar e Enviar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DRAWER: LOGIN / CADASTRO DE CLIENTE COM GOOGLE & WHATSAPP */}
      {/* ------------------------------------------------------------- */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-slide-up p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-orange-500" />
                <span>Identificação do Cliente</span>
              </h3>
              <button onClick={() => setShowAuthDrawer(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-1.5">
                <X className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* PASSO 1: DIGITAR CELULAR / WHATSAPP */}
            {authStep === 'PHONE_CHECK' && (
              <form onSubmit={handleCheckPhone} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Seu WhatsApp de Acesso</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 11999999999"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  {authLoading ? 'Verificando...' : 'Continuar com WhatsApp'}
                </button>

                {/* BOTÃO GOOGLE OAUTH EXCLUSIVO PARA O CARDÁPIO ONLINE */}
                <div className="pt-3 border-t border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400 font-bold mb-2">OU REALIZE SEU LOGIN SOCIAL</p>
                  <button
                    type="button"
                    onClick={handleGoogleCustomerLogin}
                    disabled={authLoading}
                    className="w-full py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl flex items-center justify-center gap-2 shadow-3xs cursor-pointer text-xs"
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Continuar com Google</span>
                  </button>
                </div>
              </form>
            )}

            {/* PASSO 2: DIGITAR SENHA DE ACESSO */}
            {authStep === 'PASSWORD' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">Digite sua Senha</label>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthStep('RECOVERY_REQUEST');
                        setAuthError('');
                        setAuthSuccess('');
                      }}
                      className="font-bold text-orange-600 hover:text-orange-700 text-[10px]"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Sua senha de cliente"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  {authLoading ? 'Verificando...' : 'Entrar na Conta'}
                </button>

                <button
                  type="button"
                  onClick={() => setAuthStep('PHONE_CHECK')}
                  className="w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-center"
                >
                  Voltar
                </button>
              </form>
            )}

            {/* PASSO 3: COMPLETAR CADASTRO SE FOR NOVO CLIENTE */}
            {authStep === 'REGISTER' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Seu Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Digite seu nome"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Crie sua Senha de Acesso *</label>
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 4 caracteres"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  {authLoading ? 'Cadastrando...' : 'Finalizar e Salvar Cadastro'}
                </button>

                <button
                  type="button"
                  onClick={() => setAuthStep('PHONE_CHECK')}
                  className="w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-center"
                >
                  Voltar
                </button>
              </form>
            )}

            {/* PASSO 4: RECUPERAÇÃO DE SENHA DO CLIENTE VIA PIN WHATSAPP */}
            {authStep === 'RECOVERY_REQUEST' && (
              <form onSubmit={handleRequestPin} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Confirme seu WhatsApp de Recebimento</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 11999999999"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  {authLoading ? 'Solicitando PIN...' : 'Solicitar PIN por WhatsApp'}
                </button>

                <button
                  type="button"
                  onClick={() => setAuthStep('PASSWORD')}
                  className="w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-center"
                >
                  Voltar
                </button>
              </form>
            )}

            {/* PASSO 5: VERIFICAR PIN E GRAVAR NOVA SENHA DO CLIENTE */}
            {authStep === 'RECOVERY_VERIFY' && (
              <form onSubmit={handleVerifyReset} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Insira o PIN de 6 dígitos recebido no seu WhatsApp</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Ex: 123456"
                    value={authPinCode}
                    onChange={(e) => setAuthPinCode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-center font-black tracking-widest text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Crie sua Nova Senha</label>
                  <input
                    type="password"
                    required
                    placeholder="Digite sua nova senha"
                    value={authNewPassword}
                    onChange={(e) => setAuthNewPassword(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl cursor-pointer"
                >
                  {authLoading ? 'Verificando...' : 'Validar e Alterar Senha'}
                </button>

                <button
                  type="button"
                  onClick={() => setAuthStep('RECOVERY_REQUEST')}
                  className="w-full py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-center"
                >
                  Voltar
                </button>
              </form>
            )}

            <div className="pt-2 text-center text-[10px] text-slate-400">
              Seu acesso é protegido e criptografado com criptografia SHA-256 e RLS.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
