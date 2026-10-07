import React, { useState } from 'react';
import { Bell, Check, Trash2, ShoppingBag, Package, CreditCard, MessageSquare, AlertTriangle, X } from 'lucide-react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'inventory' | 'payment' | 'system' | 'whatsapp';
  read: boolean;
}

interface NotificationCenterProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onClose,
}) => {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'order': return <ShoppingBag className="w-4 h-4 text-amber-500" />;
      case 'inventory': return <Package className="w-4 h-4 text-red-500" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4 text-green-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl z-50 overflow-hidden font-sans text-xs animate-in fade-in slide-in-from-top-2">
      {/* Header da Central */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-500" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">Central de Notificações</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-500 text-white font-extrabold rounded-full text-[10px]">
              {unreadCount} novas
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              title="Limpar todas"
              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista de Notificações Internas */}
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-1">
            <Bell className="w-6 h-6 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-400">Nenhuma notificação recente</p>
            <p className="text-[10px]">Você está em dia com os alertas do FoodS!</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              onClick={() => onMarkAsRead(n.id)}
              className={`p-3.5 flex items-start gap-3 cursor-pointer transition-colors ${
                n.read
                  ? 'bg-white dark:bg-slate-900 opacity-60'
                  : 'bg-amber-50/50 dark:bg-amber-950/20'
              }`}
            >
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0 mt-0.5">
                {getIcon(n.type)}
              </div>

              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 dark:text-white text-xs">{n.title}</p>
                  <span className="text-[10px] text-slate-400">{n.time}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{n.message}</p>
              </div>

              {!n.read && (
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1"></span>
              )}
            </div>
          ))
        )}
      </div>

      <div className="p-2 bg-slate-50 dark:bg-slate-800/40 text-center text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
        FoodS SaaS • Sistema de Notificações do Painel
      </div>
    </div>
  );
};
