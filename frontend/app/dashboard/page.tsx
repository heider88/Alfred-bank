"use client";

import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrencyFromCents } from "@/utils/formatters";
import { ArrowUp, ArrowDown, Wallet, AlertTriangle, RefreshCcw, Send, Download, ChevronRight, Zap, PieChart, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Transaction {
  id: string;
  from_account_id: string | null;
  to_account_id: string;
  amount_cents: number;
  timestamp: string;
  description?: string;
  counterparty_name?: string;
}

interface StatementData {
  account_id: string;
  balance_cents: number;
  transactions: Transaction[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatement = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No estás autenticado. Por favor inicia sesión.");

      const meResponse = await fetch(`${API_URL}/accounts/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!meResponse.ok) throw new Error("Sesión expirada o inválida.");
      const myAccount = await meResponse.json();

      const response = await fetch(`${API_URL}/accounts/${myAccount.id}/statement`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "No se pudo cargar la información de la cuenta.");
      }
      
      const result: StatementData = await response.json();
      setData(result);
    } catch (err: any) {
      if (err.message.includes("autenticado") || err.message.includes("Sesión")) {
        router.push("/login");
        return;
      }
      setError(err.message === "Failed to fetch" ? "No se pudo conectar con el servidor." : err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, []);

  const stats = useMemo(() => {
    if (!data) return { income: 0, expenses: 0 };
    let income = 0;
    let expenses = 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    data.transactions.forEach((tx) => {
      const txDate = new Date(tx.timestamp);
      if (txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear) {
        if (tx.to_account_id === data.account_id) {
          income += tx.amount_cents;
        } else {
          expenses += tx.amount_cents;
        }
      }
    });
    return { income, expenses };
  }, [data]);

  return (
    <DashboardLayout accountId={data?.account_id}>
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto pb-12">
        
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Resumen Financiero</h1>
            <p className="text-slate-500 mt-1">Tu dinero a un vistazo. Gestiona tus recursos inteligentemente.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard/transferencias" className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-all active:scale-95">
              <Send className="h-4 w-4" /> Transferir
            </Link>
          </div>
        </header>

        {error && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-rose-100 bg-rose-50/50 p-8 text-center animate-in fade-in">
            <div className="rounded-full bg-rose-100 p-3 text-rose-600">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-semibold text-rose-900">Algo salió mal</h3>
              <p className="text-sm text-rose-600 max-w-sm mt-1">{error}</p>
            </div>
            <button 
              onClick={fetchStatement}
              className="mt-2 flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-all active:scale-95"
            >
              <RefreshCcw className="h-4 w-4" /> Reintentar
            </button>
          </div>
        )}

        {loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
            <div className="lg:col-span-2 h-64 rounded-[2rem] bg-slate-200"></div>
            <div className="h-64 rounded-[2rem] bg-slate-200"></div>
          </div>
        )}

        {!loading && !error && data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Left Column (Hero & Feed) */}
            <div className="lg:col-span-2 flex flex-col gap-8">
              
              {/* Balance Hero Card */}
              <section className="relative overflow-hidden rounded-[2rem] bg-[#0A0A0A] p-8 md:p-10 text-white shadow-xl group">
                <div className="absolute -right-10 -top-24 h-72 w-72 rounded-full bg-[#CCFF00] opacity-20 blur-[80px] group-hover:opacity-30 transition-opacity duration-700"></div>
                <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-blue-500 opacity-20 blur-[60px]"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03]"></div>
                
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 text-white/60 mb-2">
                      <Wallet className="h-5 w-5 text-[#CCFF00]" />
                      <span className="text-sm font-bold uppercase tracking-wider">Saldo Disponible</span>
                    </div>
                    <p className="text-xs text-white/40 font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hidden md:block">
                      Cuenta N° {data.account_id}
                    </p>
                  </div>
                  <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
                    {formatCurrencyFromCents(data.balance_cents)}
                  </h2>
                  
                  {/* Quick Actions / CTAs inline in the hero */}
                  <div className="mt-8 grid grid-cols-2 gap-3 md:gap-4">
                    <Link href="/dashboard/transferencias" className="flex flex-col items-center justify-center gap-2 bg-[#CCFF00] hover:bg-[#b3e600] text-black rounded-2xl p-3 md:p-4 transition-colors cursor-pointer shadow-[0_0_20px_rgba(204,255,0,0.3)]">
                      <Send className="h-5 w-5" />
                      <span className="text-xs font-bold">Enviar Dinero</span>
                    </Link>
                    <Link href="/dashboard/historial" className="flex flex-col items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl p-3 md:p-4 transition-colors cursor-pointer ring-1 ring-white/10">
                      <Activity className="h-5 w-5 text-white" />
                      <span className="text-xs font-semibold text-white">Ver Movimientos</span>
                    </Link>
                  </div>
                </div>
              </section>

              {/* Feed de Actividad */}
              <section className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Actividad Reciente</h3>
                  <Link href="/dashboard/historial" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group">
                    Ver historial IA <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                
                {data.transactions.length === 0 ? (
                  <div className="text-center py-10 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
                      <Wallet className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-900">No hay movimientos recientes</p>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {data.transactions.slice(0, 5).map((tx) => {
                      const isDeposit = tx.to_account_id === data.account_id;
                      
                      return (
                        <li key={tx.id} className="flex items-center justify-between group rounded-2xl p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-inset ${
                              isDeposit 
                                ? 'bg-emerald-50 text-emerald-600 ring-emerald-100/50' 
                                : 'bg-rose-50 text-rose-600 ring-rose-100/50'
                            }`}>
                              {isDeposit ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 truncate max-w-[180px] sm:max-w-xs">
                                {tx.description || (isDeposit ? "Depósito Recibido" : "Transferencia Enviada")}
                              </span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs font-semibold text-slate-500 truncate max-w-[120px]">
                                  {isDeposit ? 'De:' : 'Para:'} {tx.counterparty_name || 'Externo'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            <span className={`text-base font-bold ${isDeposit ? 'text-emerald-600' : 'text-slate-900'}`}>
                              {isDeposit ? '+' : '-'}{formatCurrencyFromCents(tx.amount_cents)}
                            </span>
                            <span className="text-xs font-medium text-slate-400 mt-0.5">
                              {new Date(tx.timestamp).toLocaleDateString("es-CO", { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </div>

            {/* Right Column (Functional Widgets only) */}
            <div className="flex flex-col gap-6">
              
              {/* Monthly Summary Widget */}
              <div className="bg-white rounded-[2rem] p-6 shadow-sm ring-1 ring-slate-100 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-slate-900 mb-2">
                  <PieChart className="w-5 h-5 text-[#CCFF00] fill-[#0A0A0A]" />
                  <h3 className="font-bold text-lg">Resumen del Mes</h3>
                </div>
                
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 flex justify-between items-center">
                   <div>
                     <p className="text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">Ingresos</p>
                     <h4 className="text-lg font-bold text-emerald-800">+{formatCurrencyFromCents(stats.income)}</h4>
                   </div>
                   <ArrowUp className="w-6 h-6 text-emerald-500" />
                </div>

                <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex justify-between items-center">
                   <div>
                     <p className="text-rose-700 text-xs font-bold uppercase tracking-wider mb-1">Gastos</p>
                     <h4 className="text-lg font-bold text-rose-800">-{formatCurrencyFromCents(stats.expenses)}</h4>
                   </div>
                   <ArrowDown className="w-6 h-6 text-rose-500" />
                </div>
              </div>

              {/* Alfred Chat Promotion Widget */}
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-40"></div>
                
                <div className="relative z-10 flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-white/20">
                    <img src="/alfreed.png" alt="Alfred" className="w-full h-full object-cover bg-black" />
                  </div>
                  <h3 className="font-bold text-lg">Habla con Alfred</h3>
                </div>
                
                <p className="text-sm text-indigo-200 mb-6 relative z-10">
                  Tu asistente financiero de inteligencia artificial está conectado. Pregúntale sobre tus gastos de este mes.
                </p>
                
                <button 
                  onClick={() => {
                    // Trigger custom event to open chat
                    const event = new CustomEvent('openAlfredChat');
                    window.dispatchEvent(event);
                  }}
                  className="relative z-10 w-full py-3 bg-[#CCFF00] text-black rounded-xl font-bold text-sm hover:bg-[#b3e600] transition-all shadow-[0_0_15px_rgba(204,255,0,0.2)]"
                >
                  Abrir Chat Automático
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
