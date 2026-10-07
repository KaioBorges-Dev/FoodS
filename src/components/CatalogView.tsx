import React, { useEffect, useState } from 'react';
import { Product, Category, InventoryItem, TechnicalRecipe } from '../../packages/types';
import { formatBRL } from '../../packages/shared';
import { apiFetch } from '../lib/supabase';
import { ImageUploader } from './ImageUploader';
import { 
  BookOpen, 
  Plus, 
  Search, 
  ArrowLeft,
  Edit2,
  Trash2,
  Save,
  CheckCircle2,
  Tag,
  Boxes,
  FileSpreadsheet
} from 'lucide-react';

export const CatalogView: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Controle de Navegação por Páginas (Zero Popups)
  const [viewMode, setViewMode] = useState<'LIST' | 'NEW_PRODUCT' | 'EDIT_PRODUCT' | 'NEW_CATEGORY' | 'RECIPE'>('LIST');

  // Produto em Edição ou Criação
  const [editingProduct, setEditingProduct] = useState<Partial<Product>>({
    name: '',
    category_id: '',
    price: 0,
    cost_price: 0,
    description: '',
    sku: '',
    image_url: '',
    is_active: true,
    is_available: true,
  });

  // Categoria em Criação
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Ficha Técnica (BOM)
  const [recipeProduct, setRecipeProduct] = useState<Product | null>(null);
  const [currentRecipes, setCurrentRecipes] = useState<TechnicalRecipe[]>([]);
  const [selectedInsumo, setSelectedInsumo] = useState('');
  const [insumoQty, setInsumoQty] = useState(100);

  // Confirmação Inline de Exclusão
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const [prods, cats, invs] = await Promise.all([
        apiFetch<Product[]>('/catalog/products'),
        apiFetch<Category[]>('/catalog/categories'),
        apiFetch<InventoryItem[]>('/inventory/items'),
      ]);
      setProducts(prods);
      setCategories(cats);
      setInventoryItems(invs);
    } catch (err) {
      console.error('Erro ao carregar catálogo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct.id) {
        await apiFetch(`/catalog/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingProduct),
        });
      } else {
        await apiFetch('/catalog/products', {
          method: 'POST',
          body: JSON.stringify(editingProduct),
        });
      }
      setViewMode('LIST');
      loadCatalog();
    } catch (err: any) {
      alert(`Erro ao salvar produto: ${err.message}`);
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await apiFetch('/catalog/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName, description: newCatDesc }),
      });
      setViewMode('LIST');
      setNewCatName('');
      setNewCatDesc('');
      loadCatalog();
    } catch (err: any) {
      alert(`Erro ao criar categoria: ${err.message}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await apiFetch(`/catalog/products/${id}`, { method: 'DELETE' });
      setDeleteConfirmId(null);
      loadCatalog();
    } catch (err: any) {
      alert(`Erro ao excluir produto: ${err.message}`);
    }
  };

  const handleOpenRecipeView = async (prod: Product) => {
    setRecipeProduct(prod);
    setViewMode('RECIPE');
    try {
      const recipes = await apiFetch<TechnicalRecipe[]>(`/catalog/products/${prod.id}/recipe`);
      setCurrentRecipes(recipes);
    } catch (err) {
      console.error('Erro ao carregar ficha técnica:', err);
    }
  };

  const handleAddRecipeIngredient = async () => {
    if (!recipeProduct || !selectedInsumo) return;
    try {
      const updated = await apiFetch<TechnicalRecipe[]>(`/catalog/products/${recipeProduct.id}/recipe`, {
        method: 'POST',
        body: JSON.stringify({
          inventory_item_id: selectedInsumo,
          quantity_required: insumoQty,
        }),
      });
      setCurrentRecipes(updated);
    } catch (err: any) {
      alert(`Erro ao adicionar ingrediente: ${err.message}`);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'ALL' || p.category_id === selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  if (loading) return <div className="p-8 text-xs font-bold text-slate-500">Carregando Cardápio & Produtos...</div>;

  // 1. PÁGINA DE FORMULÁRIO COMPLETO DE PRODUTO
  if (viewMode === 'NEW_PRODUCT' || viewMode === 'EDIT_PRODUCT') {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6 font-sans text-slate-900">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewMode('LIST')}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Produtos</span>
          </button>

          <p className="text-xs text-slate-400 font-bold">
            Cardápio ➔ Produtos ➔ {editingProduct.id ? 'Editar Produto' : 'Novo Produto'}
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {editingProduct.id ? 'Editar Informações do Produto' : 'Cadastrar Novo Produto'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Preencha os campos abaixo e faça o upload da imagem do produto</p>
          </div>

          <form onSubmit={handleSaveProduct} className="space-y-6 text-xs">
            <div className="space-y-4">
              <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] border-b border-slate-100 pb-2">
                1. Informações Principais
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: X-Salada Gourmet Especial"
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoria *</label>
                  <select
                    required
                    value={editingProduct.category_id || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category_id: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="">Selecione uma Categoria...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Descrição Comercial</label>
                <textarea
                  rows={3}
                  placeholder="Detalhamento dos ingredientes e modo de preparo para exibir no cardápio digital..."
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                ></textarea>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] border-b border-slate-100 pb-2">
                2. Preço e Identificação
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="35.00"
                    value={editingProduct.price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Custo Estimado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="12.50"
                    value={editingProduct.cost_price || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, cost_price: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">SKU / Código do Produto</label>
                  <input
                    type="text"
                    placeholder="LANCH-001"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] border-b border-slate-100 pb-2">
                3. Imagem Ilustrativa (Upload Supabase Storage)
              </h3>

              <ImageUploader
                label="Foto do Produto (Drag & Drop)"
                value={editingProduct.image_url || ''}
                onChange={(url) => setEditingProduct({ ...editingProduct, image_url: url })}
                folder="products"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewMode('LIST')}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Produto</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 2. PÁGINA DE NOVA CATEGORIA
  if (viewMode === 'NEW_CATEGORY') {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6 font-sans text-slate-900">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewMode('LIST')}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Produtos</span>
          </button>
          <p className="text-xs text-slate-400 font-bold">Cardápio ➔ Categorias ➔ Nova Categoria</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6">
          <div>
            <h1 className="text-lg font-bold text-slate-900">Cadastrar Nova Categoria</h1>
            <p className="text-xs text-slate-500 mt-0.5">Categorias organizam a exibição dos produtos no cardápio online e no POS</p>
          </div>

          <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Nome da Categoria *</label>
              <input
                type="text"
                required
                placeholder="ex: Pizzas Artesanais, Bebidas Geladas, Sobremesas"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Descrição</label>
              <input
                type="text"
                placeholder="Descrição curta da seção..."
                value={newCatDesc}
                onChange={(e) => setNewCatDesc(e.target.value)}
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
                <span>Salvar Categoria</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 3. PÁGINA DE FICHA TÉCNICA
  if (viewMode === 'RECIPE' && recipeProduct) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-6 font-sans text-slate-900">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewMode('LIST')}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Produtos</span>
          </button>
          <p className="text-xs text-slate-400 font-bold">Estoque ➔ Ficha Técnica ➔ {recipeProduct.name}</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 space-y-6">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              Ficha Técnica do Produto: <span className="text-amber-600">{recipeProduct.name}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Vincule os insumos do estoque necessários para a produção deste item</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
            <h3 className="font-bold text-slate-800">Adicionar Insumo à Ficha Técnica</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={selectedInsumo}
                onChange={(e) => setSelectedInsumo(e.target.value)}
                className="p-2.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-800"
              >
                <option value="">Selecione um Insumo...</option>
                {inventoryItems.map(inv => (
                  <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit_type})</option>
                ))}
              </select>

              <input
                type="number"
                step="0.01"
                placeholder="Quantidade"
                value={insumoQty}
                onChange={(e) => setInsumoQty(parseFloat(e.target.value) || 0)}
                className="p-2.5 bg-white border border-slate-200 rounded-xl font-mono text-slate-800"
              />

              <button
                onClick={handleAddRecipeIngredient}
                className="px-4 py-2.5 bg-amber-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>Vincular Insumo</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Ingredientes da Receita
            </h3>

            {currentRecipes.length === 0 ? (
              <p className="text-slate-400 py-4 text-center italic">Nenhum insumo vinculado a este produto ainda.</p>
            ) : (
              currentRecipes.map(r => (
                <div key={r.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="font-bold text-slate-900">{r.inventory_item_name || 'Insumo'}</span>
                  <span className="font-mono font-bold text-amber-600">{r.quantity_required} unidades</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // 4. LISTAGEM PRINCIPAL
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto font-sans text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-500" />
            <span>Cardápio & Gestão de Produtos</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">Navegação e formulários por páginas completas sem popups flutuantes</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode('NEW_CATEGORY')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Categoria</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct({ name: '', category_id: '', price: 0, cost_price: 0, description: '', sku: '', image_url: '', is_active: true, is_available: true });
              setViewMode('NEW_PRODUCT');
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Buscar produto por nome ou SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'ALL' ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Todos os Produtos
          </button>

          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id ? 'bg-amber-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 space-y-2">
          <Tag className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-xs font-bold text-slate-600">Nenhum produto cadastrado nesta categoria</p>
          <p className="text-[11px]">Clique no botão "+ Novo Produto" para abrir a página de cadastro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map(p => {
            const catObj = categories.find(c => c.id === p.category_id);
            const isDeleting = deleteConfirmId === p.id;

            return (
              <div key={p.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between hover:border-amber-400 transition-colors">
                <div>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-36 object-cover rounded-2xl mb-3 border border-slate-100" />
                  ) : (
                    <div className="w-full h-36 bg-slate-100 rounded-2xl mb-3 flex items-center justify-center text-slate-400 font-bold text-xl uppercase">
                      {p.name.substring(0, 2)}
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 text-[10px] font-bold rounded-full border border-amber-200">
                        {catObj?.name || 'Geral'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{p.name}</h3>
                    </div>
                    <span className="font-black text-amber-600 text-sm font-mono">
                      {formatBRL(p.price)}
                    </span>
                  </div>

                  {p.description && (
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">{p.description}</p>
                  )}
                </div>

                {isDeleting ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-2xl space-y-2 text-xs">
                    <p className="font-bold text-red-800">Confirmar exclusão deste produto?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="flex-1 py-1.5 bg-red-600 text-white font-bold rounded-xl"
                      >
                        Excluir
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-xl"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <button
                      onClick={() => handleOpenRecipeView(p)}
                      className="text-amber-600 hover:text-amber-700 font-bold text-[11px] flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Ficha Técnica</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingProduct(p);
                          setViewMode('EDIT_PRODUCT');
                        }}
                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(p.id)}
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
