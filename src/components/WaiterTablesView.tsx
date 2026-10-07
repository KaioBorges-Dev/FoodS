import React, { useEffect, useState } from 'react';
import { TableItem, Product, Order, Profile } from '../../packages/types';
import { formatBRL } from '../../packages/shared';
import { apiFetch } from '../lib/supabase';
import { 
  UtensilsCrossed, 
  Users, 
  Plus, 
  CheckCircle, 
  DollarSign, 
  Search,
  ShoppingCart,
  Receipt,
  X,
  Trash2,
  UserCheck
} from 'lucide-react';

export const WaiterTablesView: React.FC = () => {
  const [tables, setTables] = useState<TableItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [waiters, setWaiters] = useState<Profile[]>([]);
  const [selectedTable, setSelectedTable] = useState<TableItem | null>(null);
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<Array<{ product: Product; quantity: number; notes: string }>>([]);

  // Estados do Popup de Criar Nova Mesa (único popup permitido no sistema conforme especificado)
  const [showCreateTableModal, setShowCreateTableModal] = useState<boolean>(false);
  const [newTableNumber, setNewTableNumber] = useState<string>('');
  const [newTableName, setNewTableName] = useState<string>('');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);
  const [selectedWaiterForNewTable, setSelectedWaiterForNewTable] = useState<string>('');

  useEffect(() => {
    loadTables();
    loadProducts();
    loadWaiters();
  }, []);

  const loadTables = async () => {
    try {
      const data = await apiFetch<TableItem[]>('/orders/tables/list');
      setTables(data);
    } catch (err) {
      console.error('Erro ao carregar mesas:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const data = await apiFetch<Product[]>('/catalog/products');
      setProducts(data);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
    }
  };

  const loadWaiters = async () => {
    try {
      const profiles = await apiFetch<Profile[]>('/users/profiles');
      setWaiters(profiles.filter(p => p.role === 'waiter' || p.role === 'admin' || p.role === 'owner'));
    } catch (err) {
      console.error('Erro ao carregar garçons:', err);
    }
  };

  const loadOrdersForTable = async (tableNumber: string) => {
    try {
      const allOrders = await apiFetch<Order[]>('/orders');
      const filtered = allOrders.filter(o => o.table_number === tableNumber && o.status !== 'DELIVERED' && o.status !== 'CANCELLED');
      setTableOrders(filtered);
    } catch (err) {
      console.error('Erro ao carregar pedidos da mesa:', err);
    }
  };

  const handleOpenTable = (table: TableItem) => {
    setSelectedTable(table);
    setCartItems([]);
    loadOrdersForTable(table.number);
  };

  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNumber) return;

    try {
      await apiFetch('/orders/tables', {
        method: 'POST',
        body: JSON.stringify({
          number: newTableNumber,
          name: newTableName || `Mesa ${newTableNumber}`,
          capacity: Number(newTableCapacity) || 4,
        }),
      });

      setNewTableNumber('');
      setNewTableName('');
      setNewTableCapacity(4);
      setShowCreateTableModal(false);
      loadTables();
    } catch (err: any) {
      console.error('Erro ao criar mesa:', err);
    }
  };

  const handleDeleteTable = async (e: React.MouseEvent, tableId: string) => {
    e.stopPropagation();

    try {
      await apiFetch(`/orders/tables/${tableId}`, {
        method: 'DELETE',
      });
      if (selectedTable?.id === tableId) {
        setSelectedTable(null);
      }
      loadTables();
    } catch (err: any) {
      console.error('Erro ao remover mesa:', err);
    }
  };

  const handleAddToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, notes: '' }];
    });
  };

  const handleSendOrderToKitchen = async () => {
    if (!selectedTable || cartItems.length === 0) return;

    try {
      await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          table_id: selectedTable.id,
          table_number: selectedTable.number,
          type: 'DINE_IN',
          payment_method: 'CASH',
          items: cartItems.map(c => ({
            product_id: c.product.id,
            product_name: c.product.name,
            unit_price: c.product.price,
            quantity: c.quantity,
            notes: c.notes,
          })),
        }),
      });

      setCartItems([]);
      loadTables();
      loadOrdersForTable(selectedTable.number);
    } catch (err: any) {
      console.error('Erro ao enviar pedido:', err);
    }
  };

  const handleUpdateTableStatus = async (tableId: string, status: 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED' | 'CLOSED', waiterId?: string) => {
    try {
      await apiFetch(`/orders/tables/${tableId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, waiter_id: waiterId }),
      });
      loadTables();
      if (selectedTable && selectedTable.id === tableId) {
        setSelectedTable(prev => prev ? { ...prev, status, current_waiter_id: waiterId || prev.current_waiter_id } : null);
      }
    } catch (err: any) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'FREE': return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300';
      case 'OCCUPIED': return 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-300';
      case 'BILL_REQUESTED': return 'bg-purple-50 text-purple-800 border-purple-200 hover:border-purple-300';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentTableTotal = tableOrders.reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Cabeçalho com Ação de Criar Mesa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-amber-500" />
            <span>Gestão de Mesas e Atendimento de Garçons</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre mesas, atribua garçons responsávei e acompanhe comandas em tempo real
          </p>
        </div>

        <button
          onClick={() => setShowCreateTableModal(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Nova Mesa</span>
        </button>
      </div>

      {/* Grid de Mesas Real */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {tables.map(table => {
          const waiterObj = waiters.find(w => w.id === table.current_waiter_id);
          const waiterName = waiterObj ? `${waiterObj.first_name} ${waiterObj.last_name || ''}`.trim() : 'Sem Garçom';
          return (
            <div
              key={table.id}
              onClick={() => handleOpenTable(table)}
              className={`p-5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all hover:scale-[1.02] shadow-2xs cursor-pointer relative group ${getTableStatusColor(table.status)}`}
            >
              {/* Botão de Excluir Mesa */}
              <button
                onClick={(e) => handleDeleteTable(e, table.id)}
                title="Excluir Mesa"
                className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-base shadow-2xs mb-2 text-slate-900">
                {table.number}
              </div>

              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-900">
                  {table.name || `Mesa ${table.number}`}
                </p>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90">
                  {table.status === 'FREE' ? 'Livre' : table.status === 'OCCUPIED' ? 'Ocupada' : 'Pediu Conta'}
                </span>
              </div>

              <div className="mt-3 flex flex-col items-center gap-1 text-[11px] text-slate-600 w-full pt-2 border-t border-slate-200/50">
                <div className="flex items-center gap-1 text-slate-500">
                  <Users className="w-3 h-3" />
                  <span>Capacidade: {table.capacity}</span>
                </div>
                {table.status !== 'FREE' && (
                  <div className="flex items-center gap-1 font-semibold text-amber-700 truncate max-w-full">
                    <UserCheck className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{waiterName}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visão de Comanda da Mesa Selecionada */}
      {selectedTable && (
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-md space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Comanda da Mesa #{selectedTable.number}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                  {selectedTable.status === 'FREE' ? 'Livre' : selectedTable.status === 'OCCUPIED' ? 'Ocupada' : 'Aguardando Pagamento'}
                </span>
              </h2>
              <p className="text-xs text-slate-500">Adicione itens ao pedido ou atribua o garçom responsável</p>
            </div>

            <button
              onClick={() => setSelectedTable(null)}
              className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-xl font-bold text-xs flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              <span>Fechar Comanda</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* Lado Esquerdo: Adicionar Produtos */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Adicionar Produtos à Mesa</h3>
              
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar produto por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {filteredProducts.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handleAddToCart(p)}
                    className="p-3 bg-slate-50 hover:bg-amber-50 rounded-xl border border-slate-200 text-left transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-amber-600 font-extrabold">{formatBRL(p.price)}</p>
                    </div>
                    <Plus className="w-4 h-4 text-amber-500" />
                  </button>
                ))}
              </div>

              {/* Carrinho em Preparação */}
              {cartItems.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
                  <h4 className="font-bold text-amber-900">Novos Itens a Enviar para a Cozinha</h4>
                  {cartItems.map(item => (
                    <div key={item.product.id} className="flex items-center justify-between font-medium">
                      <span>{item.quantity}x {item.product.name}</span>
                      <span className="font-bold text-amber-700">{formatBRL(item.product.price * item.quantity)}</span>
                    </div>
                  ))}

                  <button
                    onClick={handleSendOrderToKitchen}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-2xs"
                  >
                    Enviar Pedido para a Cozinha (KDS)
                  </button>
                </div>
              )}
            </div>

            {/* Lado Direito: Atribuição de Garçom e Fechamento */}
            <div className="space-y-4">
              {/* Garçom Responsável */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-700 text-xs flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-500" />
                  <span>Garçom Responsável pela Mesa:</span>
                </label>
                <select
                  value={selectedTable.current_waiter_id || ''}
                  onChange={(e) => handleUpdateTableStatus(selectedTable.id, selectedTable.status, e.target.value)}
                  className="w-full p-2.5 bg-white border rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="">Selecione um Garçom...</option>
                  {waiters.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.first_name} {w.last_name || ''} ({w.email})
                    </option>
                  ))}
                </select>
              </div>

              <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Consumo Lançado na Mesa</h3>

              <div className="space-y-2 max-h-52 overflow-y-auto">
                {tableOrders.length === 0 ? (
                  <p className="text-slate-400 py-6 text-center italic">Nenhum pedido ativo lançado para esta mesa ainda.</p>
                ) : (
                  tableOrders.map(o => (
                    <div key={o.id} className="p-3 bg-slate-50 rounded-xl border space-y-1">
                      <div className="flex justify-between font-bold">
                        <span>Pedido #{o.order_number}</span>
                        <span className="text-amber-600">{formatBRL(o.total)}</span>
                      </div>
                      {o.items.map(it => (
                        <p key={it.product_name} className="text-[11px] text-slate-600">
                          {it.quantity}x {it.product_name}
                        </p>
                      ))}
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 bg-slate-100 rounded-2xl flex items-center justify-between font-black text-sm text-slate-900">
                <span>Total Consumido:</span>
                <span className="text-amber-600 text-base">{formatBRL(currentTableTotal)}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateTableStatus(selectedTable.id, 'OCCUPIED', selectedTable.current_waiter_id)}
                  className="flex-1 py-2.5 bg-slate-200 text-slate-800 font-bold rounded-xl hover:bg-slate-300"
                >
                  Mesa Ocupada
                </button>
                <button
                  onClick={() => handleUpdateTableStatus(selectedTable.id, 'BILL_REQUESTED', selectedTable.current_waiter_id)}
                  className="flex-1 py-2.5 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700"
                >
                  Pedir Conta
                </button>
                <button
                  onClick={() => handleUpdateTableStatus(selectedTable.id, 'FREE', undefined)}
                  className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700"
                >
                  Liberar Mesa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP DE CADASTRO DE MESA (Permitido conforme diretriz 10) */}
      {showCreateTableModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-amber-500" />
                <span>Cadastrar Nova Mesa</span>
              </h3>
              <button
                onClick={() => setShowCreateTableModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTable} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Número da Mesa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 01, 12, 10A"
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nome / Identificação (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Varanda, Salão Principal, Reservada"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Capacidade de Pessoas</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateTableModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-2xs"
                >
                  Salvar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
