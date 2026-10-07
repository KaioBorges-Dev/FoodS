import React, { useEffect, useState } from 'react';
import { Customer, LoyaltyAccount } from '../../packages/types';
import { formatBRL } from '../../packages/shared';
import { apiFetch } from '../lib/supabase';
import { 
  Users, 
  Award, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  ShoppingBag, 
  Calendar,
  X
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<LoyaltyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Novo Cliente
  const [showModal, setShowModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [custs, loys] = await Promise.all([
        apiFetch<Customer[]>('/customers'),
        apiFetch<LoyaltyAccount[]>('/loyalty/accounts'),
      ]);
      setCustomers(custs);
      setLoyaltyAccounts(loys);
    } catch (err) {
      console.error('Erro ao carregar CRM de clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/customers', {
        method: 'POST',
        body: JSON.stringify(newCustomer),
      });
      setShowModal(false);
      setNewCustomer({ name: '', phone: '', email: '', notes: '' });
      loadData();
    } catch (err: any) {
      alert(`Erro ao cadastrar cliente: ${err.message}`);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans text-slate-900">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-500" />
            <span>CRM de Clientes & Programa de Fidelidade</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Histórico completo de compras e pontuação de fidelidade (R$ 1,00 = 1 Ponto)
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-2xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Cliente</span>
        </button>
      </div>

      {/* Busca */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-800 font-medium outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Grid de Clientes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-44 bg-slate-200 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredCustomers.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Nenhum cliente cadastrado</h3>
          <p className="text-xs text-slate-500 mt-1">Nenhum cliente atende aos critérios de busca.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map(cust => {
            const loyalty = loyaltyAccounts.find(l => l.customer_id === cust.id);
            const points = loyalty ? loyalty.points_balance : Math.floor(cust.total_spent || 0);

            return (
              <div
                key={cust.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between hover:border-amber-400 transition-colors space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{cust.name}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{cust.phone}</span>
                      </p>
                    </div>

                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-right">
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pontos</p>
                      <p className="text-sm font-black font-mono leading-none">{points} pts</p>
                    </div>
                  </div>

                  {cust.email && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cust.email}</span>
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Pedidos Reais</span>
                    <span className="font-bold text-slate-800">{cust.total_orders || 0} compras</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Total Consumido</span>
                    <span className="font-black text-amber-600 font-mono">{formatBRL(cust.total_spent || 0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Cadastro de Cliente (Se solicitado) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">Cadastrar Novo Cliente</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: João da Silva"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Telefone Celular *</label>
                <input
                  type="text"
                  required
                  placeholder="(11) 98765-4321"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="joao@email.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 text-white font-bold rounded-xl shadow-2xs"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
