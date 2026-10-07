import React, { useState, useEffect } from 'react';
import { Unit, Organization, Profile } from '../../packages/types';
import { Store, LogOut, Building2, Bell, Database, CloudCheck, AlertCircle } from 'lucide-react';
import { NotificationCenter, AppNotification } from './NotificationCenter';
import { apiFetch } from '../lib/supabase';

interface TopBarProps {
  organization: Organization;
  units: Unit[];
  currentUnit: Unit;
  onSelectUnit: (unit: Unit) => void;
  currentUser: Profile;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  openPublicMenu: () => void;
  openTotem?: () => void;
  onLogout?: () => void;
  notifications?: AppNotification[];
  onMarkNotificationRead?: (id: string) => void;
  onClearNotifications?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  organization,
  units,
  currentUnit,
  onSelectUnit,
  currentUser,
  activeTab,
  onSelectTab,
  openPublicMenu,
  openTotem,
  onLogout,
  notifications = [],
  onMarkNotificationRead = () => {},
  onClearNotifications = () => {},
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [supabaseConfigured, setSupabaseConfigured] = useState<boolean | null>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    apiFetch<any>('/system/status')
      .then((data) => setSupabaseConfigured(data?.supabase?.configured || false))
      .catch(() => setSupabaseConfigured(false));
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-4 sm:px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 font-sans shadow-2xs">
      {/* Zone 1: Marca e Unidade Ativa */}
      <div className="flex items-center gap-3">
        <a 
          href="#" 
          onClick={(e) => { e.preventDefault(); onSelectTab('dashboard'); }} 
          className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2"
        >
          <span className="bg-amber-500 text-white px-2 py-1 rounded-lg text-sm font-black tracking-wider">FoodS</span>
          <span className="hidden sm:inline font-semibold text-slate-800 text-base">SaaS</span>
        </a>
        <span className="text-slate-300">|</span>
        <span className="text-xs font-semibold text-slate-600 truncate max-w-[150px] sm:max-w-[220px]">
          {organization.name}
        </span>

        {/* Indicador de Status do Supabase */}
        {supabaseConfigured !== null && (
          <div
            title={supabaseConfigured ? 'Supabase PostgreSQL Conectado' : 'Supabase Desconectado — Operando em Contingência com admin@admin'}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
              supabaseConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${supabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500 animate-ping'}`} />
            <span>{supabaseConfigured ? 'Supabase Nuvem' : 'Contingência Local (admin@admin)'}</span>
          </div>
        )}
      </div>

      {/* Zone 2: Ações do Topo */}
      <div className="flex items-center gap-2 sm:gap-3 relative">
        {/* Seletor de Unidades */}
        <div className="relative flex items-center bg-slate-100 rounded-xl px-2.5 py-1.5 text-xs border border-slate-200/60">
          <Building2 className="w-3.5 h-3.5 text-slate-500 mr-1.5 shrink-0" />
          <select
            value={currentUnit?.id || ''}
            onChange={(e) => {
              const u = units.find(unit => unit.id === e.target.value);
              if (u) onSelectUnit(u);
            }}
            className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer pr-1"
          >
            {units.map((u) => (
              <option key={u.id} value={u.id} className="bg-white text-slate-800">
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Botão Totem Autoatendimento */}
        {openTotem && (
          <button
            onClick={openTotem}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors border border-emerald-200"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Totem Autoatendimento</span>
          </button>
        )}

        {/* Botão Cardápio Digital Público */}
        <button
          onClick={openPublicMenu}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors border border-amber-200"
        >
          <Store className="w-3.5 h-3.5 text-amber-600" />
          <span>Cardápio Online</span>
        </button>

        {/* Notificações Internas (Ícone 🔔 no Header) */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            title="Central de Notificações Internas"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative border border-slate-200/60"
          >
            <Bell className="w-4 h-4 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={onMarkNotificationRead}
              onClearAll={onClearNotifications}
              onClose={() => setShowNotifications(false)}
            />
          )}
        </div>

        {/* Perfil do Usuário e Botão de Sair */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
              {currentUser.first_name[0]}{currentUser.last_name ? currentUser.last_name[0] : ''}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">
                {currentUser.first_name} {currentUser.last_name}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 capitalize">
                {currentUser.role}
              </p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sair do Painel Administrativo"
              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
