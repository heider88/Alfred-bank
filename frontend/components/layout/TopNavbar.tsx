"use client";

import { Menu, Bell, LogOut, Settings, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TopNavbarProps {
  onMenuClick: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function TopNavbar({ onMenuClick }: TopNavbarProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("Cargando...");
  const [userInitials, setUserInitials] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMe = async () => {
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
        }
      } catch (err) {
        // Fallo silencioso, dejamos que el dashboard handlee el redirect si expira
      }
    };
    fetchMe();
  }, []);

  useEffect(() => {
    // Cerrar dropdown al hacer click fuera
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

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
        <button className="relative text-black/40 hover:text-black transition-colors hidden sm:block">
          <Bell className="h-6 w-6" />
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#CCFF00] ring-2 ring-white shadow-sm"></span>
        </button>
        
        {/* User Dropdown */}
        <div className="relative border-l border-black/5 pl-4 sm:pl-6" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 origin-top-right">
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
