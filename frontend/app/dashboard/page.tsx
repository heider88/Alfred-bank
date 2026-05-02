"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrencyFromCents } from "@/utils/formatters";
import { ArrowUp, ArrowDown, Wallet, AlertTriangle, RefreshCcw } from "lucide-react";

// --- Types ---
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

import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatement = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Obtener el token (por ahora simulado si no existe una página de login real, en producción vendría de localStorage)
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No estás autenticado. Por favor inicia sesión.");
      }

      // 2. Obtener mi cuenta (/me)
      const meResponse = await fetch(`${API_URL}/accounts/me`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!meResponse.ok) {
        throw new Error("Sesión expirada o inválida.");
      }
      const myAccount = await meResponse.json();

      // 3. Obtener el estado de cuenta
      const response = await fetch(`${API_URL}/accounts/${myAccount.id}/statement`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!response.ok) {
        // Podría ser un 404 (cuenta no encontrada) o un 500
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
      
      // Capturamos si el servidor está apagado (Failed to fetch) o si tiró error
      setError(
        err.message === "Failed to fetch" 
          ? "No se pudo conectar con el servidor. Verifica tu conexión o intenta más tarde."
          : err.message || "Error de conexión."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatement();
  }, []);

  return (
    <DashboardLayout accountId={data?.account_id}>
      <div className="flex flex-col gap-8">
        
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Resumen Financiero</h1>
          <p className="text-sm text-slate-500">Consulta tu saldo actual y movimientos recientes.</p>
        </header>

        {/* --- STATE: ERROR (Friendly Network Fallback) --- */}
        {error && (
          <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-rose-100 bg-rose-50/50 p-8 text-center animate-in fade-in">
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

        {/* --- STATE: LOADING (Skeleton) --- */}
        {loading && !error && (
          <div className="flex flex-col gap-8 animate-pulse">
            {/* Hero Card Skeleton */}
            <div className="h-48 w-full rounded-3xl bg-slate-200"></div>
            
            {/* Feed Skeleton */}
            <div className="space-y-4">
              <div className="h-6 w-40 rounded bg-slate-200 mb-6"></div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-200"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded bg-slate-200"></div>
                      <div className="h-3 w-24 rounded bg-slate-200"></div>
                    </div>
                  </div>
                  <div className="h-5 w-20 rounded bg-slate-200"></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- STATE: DATA --- */}
        {!loading && !error && data && (
          <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 1. Saldo 'Hero Card' */}
            <section className="relative overflow-hidden rounded-[2rem] bg-[#0A0A0A] p-8 md:p-12 text-white shadow-xl">
              {/* Decoración de fondo sutil */}
              <div className="absolute -right-8 -top-24 h-64 w-64 rounded-full bg-[#CCFF00] opacity-20 blur-[80px]"></div>
              <div className="absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-blue-500 opacity-20 blur-[60px]"></div>
              
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-white/60 mb-2">
                  <Wallet className="h-5 w-5 text-[#CCFF00]" />
                  <span className="text-sm font-bold uppercase tracking-wider">Saldo Disponible</span>
                </div>
                <h2 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
                  {formatCurrencyFromCents(data.balance_cents)}
                </h2>
                <p className="mt-4 text-sm text-white/40 font-mono bg-white/5 inline-flex items-center self-start px-3 py-1.5 rounded-lg border border-white/10">
                  ID: <span className="ml-2 text-white/80">{data.account_id}</span>
                </p>
              </div>
            </section>

            {/* 2. Feed de Actividad */}
            <section>
              <h3 className="mb-6 text-lg font-bold text-slate-900">Actividad Reciente</h3>
              
              {data.transactions.length === 0 ? (
                <div className="text-center py-12 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 mb-3">
                    <Wallet className="h-6 w-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-900">No hay movimientos</p>
                  <p className="text-sm text-slate-500 mt-1">Tu historial de transacciones aparecerá aquí.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {data.transactions.map((tx) => {
                    const isDeposit = tx.to_account_id === data.account_id;
                    
                    return (
                      <li key={tx.id} className="flex items-center justify-between group rounded-2xl p-4 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-slate-100 transition-all bg-slate-50/50">
                        
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-inset ${
                            isDeposit 
                              ? 'bg-emerald-50 text-emerald-600 ring-emerald-100/50 group-hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-600 ring-rose-100/50 group-hover:bg-rose-100'
                          } transition-colors`}>
                            {isDeposit ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">
                              {tx.description || (isDeposit ? "Depósito Recibido" : "Transferencia Enviada")}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-semibold text-slate-600">
                                {isDeposit ? 'De:' : 'Para:'} {tx.counterparty_name || 'Externo'}
                              </span>
                              <span className="text-xs text-slate-300">•</span>
                              <span className="text-xs font-medium text-slate-500">
                                {new Date(tx.timestamp).toLocaleString("es-CO", {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className={`text-base font-bold ${isDeposit ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {isDeposit ? '+' : '-'}{formatCurrencyFromCents(tx.amount_cents)}
                        </div>
                        
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
