"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { formatCurrencyFromCents } from "@/utils/formatters";
import { ArrowUp, ArrowDown, History, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

interface Transaction {
  id: string;
  from_account_id: string | null;
  to_account_id: string;
  amount_cents: number;
  timestamp: string;
  description?: string;
  counterparty_name?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function HistorialPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [myAccountId, setMyAccountId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");

        const meResponse = await fetch(`${API_URL}/accounts/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!meResponse.ok) throw new Error("Session expired");
        
        const myAccount = await meResponse.json();
        setMyAccountId(myAccount.id);

        const response = await fetch(`${API_URL}/accounts/${myAccount.id}/statement`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error("No se pudo cargar el historial.");
        }
        
        const result = await response.json();
        setTransactions(result.transactions || []);
      } catch (err: any) {
        if (err.message === "No token" || err.message === "Session expired") {
          router.push("/login");
          return;
        }
        setError(err.message || "Error de conexión.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [router]);

  return (
    <DashboardLayout accountId={myAccountId || undefined}>
      <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Historial de Transacciones</h1>
          <p className="text-sm text-slate-500">Visualiza todos tus movimientos pasados con detalle.</p>
        </header>

        {error && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {loading && !error && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-200"></div>
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-slate-200"></div>
                    <div className="h-3 w-24 rounded bg-slate-200"></div>
                  </div>
                </div>
                <div className="h-5 w-24 rounded bg-slate-200"></div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm ring-1 ring-slate-100">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
                  <History className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Sin historial</h3>
                <p className="text-slate-500 mt-1 max-w-sm mx-auto">Aún no has realizado ni recibido ninguna transacción. Cuando lo hagas, aparecerán aquí.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 rounded-t-xl">
                    <tr>
                      <th className="px-6 py-4 font-bold rounded-tl-xl">Tipo</th>
                      <th className="px-6 py-4 font-bold">Descripción / Contraparte</th>
                      <th className="px-6 py-4 font-bold">Fecha</th>
                      <th className="px-6 py-4 font-bold text-right rounded-tr-xl">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => {
                      const isDeposit = tx.to_account_id === myAccountId;
                      const date = new Date(tx.timestamp);
                      
                      return (
                        <tr key={tx.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm ring-1 ring-inset ${
                              isDeposit 
                                ? 'bg-emerald-50 text-emerald-600 ring-emerald-100/50' 
                                : 'bg-rose-50 text-rose-600 ring-rose-100/50'
                            }`}>
                              {isDeposit ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{tx.description || (isDeposit ? "Depósito Recibido" : "Transferencia Enviada")}</div>
                            <div className="text-xs text-slate-500 font-medium mt-1">
                              {isDeposit ? `De: ${tx.counterparty_name || 'Externo'}` : `Para: ${tx.counterparty_name || 'Externo'}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                            {date.toLocaleDateString("es-CO")} <span className="text-slate-400 text-xs ml-1">{date.toLocaleTimeString("es-CO", {hour: '2-digit', minute:'2-digit'})}</span>
                          </td>
                          <td className={`px-6 py-4 text-right font-bold whitespace-nowrap ${isDeposit ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {isDeposit ? '+' : '-'}{formatCurrencyFromCents(tx.amount_cents)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}