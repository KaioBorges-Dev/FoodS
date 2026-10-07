import React, { useEffect, useState } from 'react';
import { Order, OrderStatus } from '../../packages/types';
import { formatBRL, translateOrderStatus, translatePaymentStatus, translatePaymentMethod } from '../../packages/shared';
import { apiFetch } from '../lib/supabase';
import { 
  ShoppingBag, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  ChefHat, 
  Eye, 
  RefreshCw,
  Search,
  Phone,
  MapPin,
  MessageSquare,
  X
} from 'lucide-react';

interface OrdersViewProps {
  onOrdersUpdated?: () => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ onOrdersUpdated }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const data = await apiFetch<Order[]>('/orders');
      setOrders(data);
      if (onOrdersUpdated) onOrdersUpdated();
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus, reason?: string) => {
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus, cancel_reason: reason }),
      });
      setCancelModalOrder(null);
      setCancelReason('');
      loadOrders();
    } catch (err: any) {
      alert(`Erro ao atualizar status do pedido: ${err.message}`);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchesSearch = 
      o.order_number.toString().includes(searchQuery) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (o.table_number && o.table_number.includes(searchQuery));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'RECEIVED': return 'bg-amber-100 text-amber-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'PREPARING': return 'bg-purple-100 text-purple-800';
      case 'READY': return 'bg-emerald-100 text-emerald-800';
      case 'OUT_FOR_DELIVERY': return 'bg-indigo-100 text-indigo-800';
      case 'DELIVERED': return 'bg-slate-100 text-slate-700';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-amber-500" />
            <span>Gerenciador de Pedidos em Tempo Real (KDS)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe a preparação, saídas de entrega e baixa de estoque pela Ficha Técnica
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Atualizar Pedidos</span>
        </button>
      </div>

      {/* Filtros e Busca em Flex Wrap sem Scroll Nativo Feio */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto p-1 bg-slate-100 rounded-xl">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'RECEIVED', label: 'Recebidos' },
            { id: 'CONFIRMED', label: 'Confirmados' },
            { id: 'PREPARING', label: 'Em Preparo' },
            { id: 'READY', label: 'Prontos' },
            { id: 'OUT_FOR_DELIVERY', label: 'Em Entrega' },
            { id: 'DELIVERED', label: 'Entregues' },
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                statusFilter === st.id
                  ? 'bg-white text-slate-900 border border-slate-200 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar pedido, cliente, mesa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 font-medium outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Grid KDS de Pedidos */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Nenhum pedido localizado</h3>
          <p className="text-xs text-slate-500 mt-1">Não existem pedidos que correspondam aos filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-amber-400 transition-colors"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-slate-900 font-mono tabular-nums">
                      #{order.order_number}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      · {order.type === 'DELIVERY' ? 'Entrega' : order.type === 'DINE_IN' ? `Mesa ${order.table_number || ''}` : 'Retirada'}
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getStatusBadgeClass(order.status)}`}>
                    {translateOrderStatus(order.status)}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">
                    {order.customer_name || 'Cliente Balcão'}
                  </p>
                  {order.customer_phone && (
                    <p className="flex items-center gap-1 text-slate-500">
                      <Phone className="w-3 h-3" />
                      <span>{order.customer_phone}</span>
                    </p>
                  )}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1 max-h-28 overflow-y-auto">
                  {order.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700 font-medium">
                      <span>{it.quantity}x {it.product_name}</span>
                      <span className="font-mono tabular-nums text-slate-500">{formatBRL(it.subtotal)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="text-slate-500">
                    {translatePaymentMethod(order.payment_method || '')} ({translatePaymentStatus(order.payment_status)})
                  </span>
                  <span className="font-bold text-slate-900 font-mono text-sm tabular-nums">
                    {formatBRL(order.total)}
                  </span>
                </div>
              </div>

              {/* Ações operacionais KDS */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 rounded-b-2xl flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Detalhes</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {order.status === 'RECEIVED' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      Confirmar
                    </button>
                  )}

                  {order.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Cozinha</span>
                    </button>
                  )}

                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'READY')}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                    >
                      Pronto
                    </button>
                  )}

                  {order.status === 'READY' && (
                    <button
                      onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
                    >
                      Entregar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Detalhes do Pedido Modo Claro */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Detalhes do Pedido #{selectedOrder.order_number}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p><span className="font-bold">Cliente:</span> {selectedOrder.customer_name}</p>
              <p><span className="font-bold">Telefone:</span> {selectedOrder.customer_phone}</p>
              <p><span className="font-bold">Tipo:</span> {selectedOrder.type}</p>
              
              <div className="border-t pt-2 space-y-1">
                <p className="font-bold text-slate-800">Itens:</p>
                {selectedOrder.items.map((it, i) => (
                  <div key={i} className="flex justify-between py-1 border-b border-slate-100">
                    <span>{it.quantity}x {it.product_name}</span>
                    <span className="font-mono font-bold">{formatBRL(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm font-black pt-2">
                <span>Total Pedido:</span>
                <span className="text-amber-600 font-mono">{formatBRL(selectedOrder.total)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
