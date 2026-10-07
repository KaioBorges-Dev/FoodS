import React, { useEffect, useState } from 'react';
import { InventoryItem } from '../../packages/types';
import { formatBRL } from '../../packages/shared';
import { apiFetch } from '../lib/supabase';
import { 
  Package, 
  Plus, 
  Search, 
  ArrowLeft, 
  Edit2, 
  Trash2, 
  Save, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Boxes
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Navegação por Páginas Próprias (Zero Popups)
  const [viewMode, setViewMode] = useState<'LIST' | 'NEW_ITEM' | 'EDIT_ITEM' | 'MOVEMENT'>('LIST');

  // Item em Criação / Edição
  const [editingItem, setEditingItem] = useState<Partial<InventoryItem>>({
    name: '',
    unit_type: 'kg',
    current_stock: 0,
    min_stock: 0,
    unit_cost: 0,
    supplier_name: '',
  });

  // Movimentação de Estoque
  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [movementType, setMovementType] = useState<'ENTRY' | 'EXIT' | 'ADJUSTMENT' | 'LOSS'>('ENTRY');
  const [movementQty, setMovementQty] = useState<number>(0);
  const [movementNotes, setMovementNotes] = useState('');

  // Confirmação Inline de Exclusão (Sem Popup)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<InventoryItem[]>('/inventory/items');
      setItems(data);
    } catch (err) {
      console.error('Erro ao carregar estoque:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem.id) {
        await apiFetch(`/inventory/items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingItem),
        });
      } else {
        await apiFetch('/inventory/items', {
          method: 'POST',
          body: JSON.stringify(editingItem),
        });
      }
      setViewMode('LIST');
      loadInventory();
    } catch (err: any) {
      alert(`Erro ao salvar insumo: ${err.message}`);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await apiFetch(`/inventory/items/${id}`, { method: 'DELETE' });
      setDeleteConfirmId(null);
      loadInventory();
    } catch (err: any) {
      alert(`Erro ao excluir insumo: ${err.message}`);
    }
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementItem) return;
    try {
      await apiFetch('/inventory/movements', {
        method: 'POST',
        body: JSON.stringify({
          inventory_item_id: movementItem.id,
          type: movementType,
          quantity: movementQty,
          notes: movementNotes,
        }),
      });
      setViewMode('LIST');
      setMovementItem(null);
      setMovementQty(0);
      setMovementNotes('');
      loadInventory();
    } catch (err: any) {
      alert(`Erro ao registrar movimentação: ${err.message}`);
    }
  };

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.supplier_name && i.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div className="p-8 text-xs font-bold text-slate-500">Carregando Estoque & Ficha Técnica...</div>;

  // 1. FORMULÁRIO COMPLETO DE INSUMO
  if (viewMode === 'NEW_ITEM' || viewMode === 'EDIT_ITEM') {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6 font-sans text-slate-900">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewMode('LIST')}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Estoque</span>
          </button>
          <p className="text-xs text-slate-400 font-bold">
            Estoque ➔ Insumos ➔ {editingItem.id ? 'Editar Insumo' : 'Novo Insumo'}
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {editingItem.id ? 'Editar Insumo de Estoque' : 'Cadastrar Novo Insumo'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Insumos são utilizados na Ficha Técnica de Produtos para baixa automática no KDS</p>
          </div>

          <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nome do Insumo *</label>
              <input
                type="text"
                required
                placeholder="ex: Queijo Muçarela Fatiado, Carne Bovina Moída"
                value={editingItem.name || ''}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Unidade de Medida *</label>
                <select
                  value={editingItem.unit_type || 'kg'}
                  onChange={(e) => setEditingItem({ ...editingItem, unit_type: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="kg">Quilograma (kg)</option>
                  <option value="g">Grama (g)</option>
                  <option value="l">Litro (l)</option>
                  <option value="ml">Mililitro (ml)</option>
                  <option value="un">Unidade (un)</option>
                  <option value="cx">Caixa (cx)</option>
                  <option value="pct">Pacote (pct)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fornecedor Principal</label>
                <input
                  type="text"
                  placeholder="ex: Distribuidora de Laticínios Silva"
                  value={editingItem.supplier_name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, supplier_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Estoque Atual *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="10.00"
                  value={editingItem.current_stock ?? ''}
                  onChange={(e) => setEditingItem({ ...editingItem, current_stock: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Estoque Mínimo (Alerta)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="2.00"
                  value={editingItem.min_stock ?? ''}
                  onChange={(e) => setEditingItem({ ...editingItem, min_stock: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Custo Unitário (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="28.50"
                  value={editingItem.unit_cost ?? ''}
                  onChange={(e) => setEditingItem({ ...editingItem, unit_cost: parseFloat(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl shadow-2xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Insumo</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. PÁGINA DE MOVIMENTAÇÃO DE ESTOQUE
  if (viewMode === 'MOVEMENT' && movementItem) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6 font-sans text-slate-900">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewMode('LIST')}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Estoque</span>
          </button>
          <p className="text-xs text-slate-400 font-bold">Estoque ➔ Movimentação ➔ {movementItem.name}</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Movimentar Estoque: <span className="text-amber-600">{movementItem.name}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Estoque Atual: {movementItem.current_stock} {movementItem.unit_type}</p>
          </div>

          <form onSubmit={handleSaveMovement} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Tipo de Movimentação *</label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value as any)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              >
                <option value="ENTRY">Entrada (Compra / Compra de Fornecedor)</option>
                <option value="EXIT">Saída (Ajuste Manual / Baixa)</option>
                <option value="LOSS">Perda / Desperdício / Validade</option>
                <option value="ADJUSTMENT">Ajuste de Inventário</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Quantidade ({movementItem.unit_type}) *</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="ex: 5.00"
                value={movementQty || ''}
                onChange={(e) => setMovementQty(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Observações / Motivo</label>
              <input
                type="text"
                placeholder="ex: Nota Fiscal 1234, Desperdício por perda de refrigeração..."
                value={movementNotes}
                onChange={(e) => setMovementNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl shadow-2xs flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Registrar Movimentação</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 3. LISTAGEM PRINCIPAL
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto font-sans text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            <span>Estoque & Ficha Técnica de Insumos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestão de insumos, entradas, saídas e controle de estoque mínimo</p>
        </div>

        <button
          onClick={() => {
            setEditingItem({ name: '', unit_type: 'kg', current_stock: 0, min_stock: 0, unit_cost: 0, supplier_name: '' });
            setViewMode('NEW_ITEM');
          }}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Insumo</span>
        </button>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Buscar insumo por nome ou fornecedor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-amber-500"
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
          <Boxes className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-xs font-bold text-slate-600">Nenhum insumo de estoque cadastrado</p>
          <p className="text-[11px]">Clique em "+ Novo Insumo" para registrar matéria-prima e alimentos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map(item => {
            const isCritical = item.current_stock <= item.min_stock;
            const isDeleting = deleteConfirmId === item.id;

            return (
              <div key={item.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3 flex flex-col justify-between hover:border-amber-400 transition-colors">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.supplier_name || 'Sem fornecedor'}</p>
                    </div>

                    {isCritical && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold rounded-full text-[10px] flex items-center gap-1 border border-red-200 shrink-0">
                        <AlertTriangle className="w-3 h-3 text-red-600" />
                        <span>Estoque Baixo</span>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Estoque Atual</span>
                      <span className="font-black text-slate-900 font-mono text-sm">{item.current_stock} {item.unit_type}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Custo Unitário</span>
                      <span className="font-bold text-slate-800 font-mono">{formatBRL(item.unit_cost || 0)}</span>
                    </div>
                  </div>
                </div>

                {isDeleting ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl space-y-2 text-xs">
                    <p className="font-bold text-red-800">Excluir este insumo do estoque?</p>
                    <div className="flex gap-2">
                      <button onClick={() => handleDeleteItem(item.id)} className="flex-1 py-1.5 bg-red-600 text-white font-bold rounded-xl">Excluir</button>
                      <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-xl">Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => {
                        setMovementItem(item);
                        setViewMode('MOVEMENT');
                      }}
                      className="text-amber-600 hover:text-amber-700 font-bold text-[11px] flex items-center gap-1"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Movimentar</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setViewMode('EDIT_ITEM');
                        }}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
