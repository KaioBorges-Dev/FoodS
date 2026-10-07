import React, { useEffect, useState } from 'react';
import { Product, Category, Customer, TableItem, Order } from '../../packages/types';
import { formatBRL, translatePaymentMethod } from '../../packages/shared';
import { apiFetch } from '../lib/supabase';
import { 
  Calculator, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  User, 
  UtensilsCrossed, 
  CreditCard, 
  CheckCircle2, 
  DollarSign, 
  QrCode,
  Tag
} from 'lucide-react';

export const PosView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Carrinho do POS
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'CARD_POS'>('PIX');
  
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadPosData();
  }, []);

  const loadPosData = async () => {
    setLoading(true);
    try {
      const [prods, cats, custs, tbls] = await Promise.all([
        apiFetch<Product[]>('/catalog/products'),
        apiFetch<Category[]>('/catalog/categories'),
        apiFetch<Customer[]>('/customers'),
        apiFetch<TableItem[]>('/orders/tables/list'),
      ]);

      setProducts(prods.filter(p => p.is_active));
      setCategories(cats.filter(c => c.is_active));
      setCustomers(custs);
      setTables(tbls);
    } catch (err) {
      console.error('Erro ao carregar dados do POS:', err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as { product: Product; quantity: number }[]);
  };

  const clearCart = () => {
    setCartItems([]);
    setSuccessOrder(null);
  };

  const totalCart = cartItems.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);

  const handleFinishOrder = async () => {
    if (cartItems.length === 0) return alert('Selecione ao menos um produto no carrinho do POS!');
    setProcessingOrder(true);

    try {
      const custObj = customers.find(c => c.id === selectedCustomer);
      const newOrderPayload = {
        type: selectedTable ? 'DINE_IN' : 'COUNTER',
        table_number: selectedTable ? tables.find(t => t.id === selectedTable)?.number : undefined,
        customer_id: custObj?.id,
        customer_name: custObj?.name || 'Cliente Balcão POS',
        customer_phone: custObj?.phone || '(11) 90000-0000',
        payment_method: paymentMethod,
        payment_status: 'PAID',
        items: cartItems.map(it => ({
          product_id: it.product.id,
          product_name: it.product.name,
          quantity: it.quantity,
          unit_price: it.product.price,
          subtotal: it.product.price * it.quantity,
        })),
        total: totalCart,
      };

      const created = await apiFetch<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(newOrderPayload),
      });

      setSuccessOrder(created);
      setCartItems([]);
    } catch (err: any) {
      alert(`Erro ao finalizar venda no POS: ${err.message}`);
    } finally {
      setProcessingOrder(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.category_id === selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  if (loading) return <div className="p-8 text-xs font-bold text-slate-500">Carregando Frente de Caixa POS...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans text-slate-900">
      {/* Header POS em Modo Claro sem Sombras */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-white rounded-2xl">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">POS • Atendimento Presencial e Caixa</h1>
            <p className="text-xs text-slate-500">Venda rápida de balcão e comandas sincronizadas em tempo real</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Caixa ABERTO e Operacional
          </span>
        </div>
      </div>

      {/* Grid Principal: Produtos + Carrinho do Caixa */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LADO ESQUERDO: Filtros e Grade de Produtos */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Busca e Categorias com Scroll Ocultado */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Buscar produto por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === 'ALL'
                    ? 'bg-amber-500 text-white shadow-2xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                Todos
              </button>

              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grade de Cards de Produtos Modo Claro */}
          {filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
              <Tag className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-600">Nenhum produto cadastrado nesta categoria</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredProducts.map(p => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-amber-500 text-left transition-all group flex flex-col justify-between"
                >
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-24 object-cover rounded-xl mb-3" />
                  ) : (
                    <div className="w-full h-24 bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-slate-400 font-bold text-lg uppercase">
                      {p.name.substring(0, 2)}
                    </div>
                  )}

                  <div className="space-y-1 w-full">
                    <h3 className="font-bold text-slate-900 text-xs line-clamp-1 group-hover:text-amber-600 transition-colors">
                      {p.name}
                    </h3>
                    <div className="flex items-center justify-between pt-1">
                      <span className="font-extrabold text-amber-600 text-xs">
                        {formatBRL(p.price)}
                      </span>
                      <span className="p-1 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LADO DIREITO: Carrinho do Caixa e Checkout sem sombras */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 flex flex-col justify-between h-fit space-y-5">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>Carrinho de Venda POS</span>
              </h2>

              {cartItems.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Seleção de Cliente e Mesa */}
            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Cliente Balcão</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800"
                >
                  <option value="">Cliente Não Identificado (Balcão)</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mesa / Comanda (Opcional)</label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium text-slate-800"
                >
                  <option value="">Sem Mesa (Venda Balcão)</option>
                  {tables.map(t => (
                    <option key={t.id} value={t.id}>Mesa #{t.number} - {t.capacity} Lugares</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Listagem dos Itens */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {cartItems.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center italic">
                  Selecione produtos na grade ao lado para iniciar o pedido...
                </p>
              ) : (
                cartItems.map((item) => (
                  <div key={item.product.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex-1 pr-2">
                      <p className="font-bold text-slate-900">{item.product.name}</p>
                      <p className="text-[10px] text-amber-600 font-extrabold">{formatBRL(item.product.price * item.quantity)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <span className="font-bold w-4 text-center">{item.quantity}</span>

                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 bg-white text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Rodapé do Carrinho e Forma de Pagamento */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1 text-xs">Forma de Pagamento</label>
              <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('PIX')}
                  className={`p-2 rounded-xl font-bold border transition-colors ${paymentMethod === 'PIX' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  PIX
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                  className={`p-2 rounded-xl font-bold border transition-colors ${paymentMethod === 'CREDIT_CARD' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  Crédito
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('DEBIT_CARD')}
                  className={`p-2 rounded-xl font-bold border transition-colors ${paymentMethod === 'DEBIT_CARD' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  Débito
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-2 rounded-xl font-bold border transition-colors ${paymentMethod === 'CASH' ? 'bg-amber-500 text-white border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  Dinheiro
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
              <span>Total:</span>
              <span className="text-amber-600">{formatBRL(totalCart)}</span>
            </div>

            {successOrder && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Venda #{successOrder.order_number} Registrada!</span>
                </p>
                <p className="text-[10px]">Pedido gravado com sucesso no Supabase e impresso no KDS.</p>
              </div>
            )}

            <button
              onClick={handleFinishOrder}
              disabled={processingOrder || cartItems.length === 0}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl transition-colors text-xs flex items-center justify-center gap-2 shadow-2xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{processingOrder ? 'Gravando Pedido...' : 'Finalizar Venda no Caixa'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
