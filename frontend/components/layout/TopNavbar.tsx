"use client";

import { Menu, Bell, LogOut, Settings, ChevronDown, ArrowDownLeft, AlertTriangle } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrencyFromCents } from "@/utils/formatters";

interface TopNavbarProps {
  onMenuClick: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface Notification {
  id: string;
  type: "transfer_received" | "alert";
  title: string;
  message: string;
  date: Date;
  read: boolean;
}

export default function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [userName, setUserName] = useState("Cargando...");
  const [userInitials, setUserInitials] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMeAndNotifications = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const meResponse = await fetch(`${API_URL}/accounts/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (meResponse.ok) {
          const data = await meResponse.json();
          setUserName(data.owner_name);
          // Generar iniciales dinámicamente
          const nameParts = data.owner_name.split(" ");
          if (nameParts.length > 1) {
            setUserInitials(`${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase());
          } else {
            setUserInitials(nameParts[0].substring(0, 2).toUpperCase());
          }

          // Fetch transactions for notifications
          const stmtRes = await fetch(`${API_URL}/accounts/${data.id}/statement`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          
          if (stmtRes.ok) {
            const stmtData = await stmtRes.json();
            const newNotifs: Notification[] = [];
            
            // Analyze transactions
            if (stmtData.transactions && Array.isArray(stmtData.transactions)) {
              // Get recent 10 transactions
              const recentTxs = stmtData.transactions.slice(0, 10);
              
              recentTxs.forEach((tx: any) => {
                // Incoming transfer
                if (tx.to_account_id === data.id && tx.from_account_id) {
                  newNotifs.push({
                    id: `notif_${tx.id}`,
                    type: "transfer_received",
                    title: "¡Dinero recibido!",
                    message: `Has recibido ${formatCurrencyFromCents(tx.amount_cents)} de ${tx.counterparty_name || "un amigo"}.`,
                    date: new Date(tx.timestamp),
                    read: false
                  });
                }
                // Alert: High spending (> 500,000 COP)
                if (tx.from_account_id === data.id && tx.amount_cents > 50000000) {
                   newNotifs.push({
                    id: `alert_${tx.id}`,
                    type: "alert",
                    title: "Alerta de gasto excesivo",
                    message: `Detectamos una transacción inusualmente alta de ${formatCurrencyFromCents(tx.amount_cents)}. ¿Fuiste tú?`,
                    date: new Date(tx.timestamp),
                    read: false
                  });
                }
              });
            }
            
            // Hardcode a welcome alert if no notifs to show the feature
            if (newNotifs.length === 0) {
              newNotifs.push({
                id: "welcome_alert",
                type: "alert",
                title: "Bienvenido a Alfred",
                message: "Mantendremos vigiladas tus finanzas para avisarte de excesos o movimientos sospechosos.",
                date: new Date(),
                read: false
              });
            }

            // Sort by date desc
            newNotifs.sort((a, b) => b.date.getTime() - a.date.getTime());
            setNotifications(newNotifs);
          }
        }
      } catch (err) {
        // Fallo silencioso
      }
    };
    fetchMeAndNotifications();
    
    // Check every 30 seconds for new notifications
    const interval = setInterval(fetchMeAndNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Cerrar dropdowns al hacer click fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="flex h-20 items-center justify-between bg-white px-4 md:px-8 border-b border-black/5 z-30 relative">
      <div className="flex items-center gap-4">
        {/* Botón Hamburguesa para Mobile */}
        <button 
          onClick={onMenuClick}
          className="rounded-xl p-2 text-black/40 hover:bg-black/5 hover:text-black focus:outline-none lg:hidden transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <div className="flex items-center gap-6">
        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsDropdownOpen(false);
            }}
            className="relative text-black/40 hover:text-black transition-colors block p-2 rounded-full hover:bg-black/5"
          >
            <Bell className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white shadow-sm"></span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 origin-top-right z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900">Notificaciones</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-[#85a600] hover:text-black transition-colors"
                  >
                    Marcar leídas
                  </button>
                )}
              </div>
              
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    No tienes notificaciones
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={`flex gap-4 p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-slate-50/50' : ''}`}
                      >
                        <div className="shrink-0 mt-1">
                          {notif.type === "transfer_received" ? (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                              <ArrowDownLeft className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                              <AlertTriangle className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900">{notif.title}</p>
                          <p className="text-sm text-slate-600 mt-0.5">{notif.message}</p>
                          <p className="text-xs text-slate-400 mt-2 font-medium">
                            {notif.date.toLocaleDateString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="shrink-0 mt-2">
                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* User Dropdown */}
        <div className="relative border-l border-black/5 pl-4 sm:pl-6" ref={dropdownRef}>
          <button 
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setIsNotificationsOpen(false);
            }}
            className="flex items-center gap-3 group focus:outline-none"
          >
            <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-[#CCFF00]/50 group-hover:ring-[#CCFF00] transition-all bg-[#0A0A0A] flex justify-center items-center shrink-0">
              <span className="font-display font-bold text-white text-sm">{userInitials || "..."}</span>
            </div>
            <div className="hidden md:flex items-center gap-2">
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-[#0A0A0A]">{userName}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-black/40">Mi Cuenta</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 origin-top-right z-50">
              {/* Info extra visible solo en mobile dentro del menu */}
              <div className="md:hidden px-4 py-2 border-b border-slate-100 mb-2">
                <p className="text-sm font-bold text-slate-900">{userName}</p>
                <p className="text-xs text-slate-500">Mi Cuenta</p>
              </div>

              <Link 
                href="/dashboard/configuracion"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" /> Editar perfil
              </Link>
              <div className="h-px bg-slate-100 my-1"></div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4 text-rose-500" /> Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
