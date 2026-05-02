"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRouter } from "next/navigation";
import { User, Mail, Shield, LogOut } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

interface AccountInfo {
  id: string;
  owner_name: string;
  email: string;
  created_at: string;
}

export default function ConfiguracionPage() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");
        
        const meResponse = await fetch(`${API_URL}/accounts/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!meResponse.ok) throw new Error("Session expired");
        
        const data = await meResponse.json();
        setAccount(data);
      } catch (err) {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <DashboardLayout accountId={account?.id}>
      <div className="flex flex-col gap-8 max-w-2xl mx-auto w-full">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Configuración</h1>
          <p className="text-sm text-slate-500">Gestiona tu perfil y preferencias de seguridad.</p>
        </header>

        {loading ? (
          <div className="animate-pulse space-y-6">
            <div className="h-40 bg-slate-200 rounded-3xl"></div>
            <div className="h-20 bg-slate-200 rounded-3xl"></div>
          </div>
        ) : account && (
          <>
            {/* Perfil */}
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#CCFF00] rounded-full blur-[80px] opacity-20"></div>
              
              <div className="flex items-start gap-6 relative z-10">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm shrink-0">
                  <User className="w-8 h-8 text-slate-400" />
                </div>
                <div className="pt-2">
                  <h2 className="text-2xl font-bold text-slate-900">{account.owner_name}</h2>
                  <div className="flex items-center gap-2 mt-1 text-slate-500">
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">{account.email}</span>
                  </div>
                  <div className="mt-4 inline-flex items-center px-2.5 py-1 rounded-md bg-slate-50 text-xs font-mono text-slate-500 border border-slate-200">
                    ID: {account.id}
                  </div>
                </div>
              </div>
            </section>

            {/* Seguridad */}
            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-5 h-5 text-slate-700" />
                <h3 className="text-lg font-bold text-slate-900">Seguridad de la Cuenta</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">Contraseña</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Última actualización hace 1 semana</p>
                  </div>
                  <button className="text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl transition-colors">
                    Cambiar
                  </button>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="pt-4">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-rose-600 font-bold bg-rose-50 hover:bg-rose-100 transition-colors"
              >
                <LogOut className="w-5 h-5" /> Cerrar Sesión
              </button>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}