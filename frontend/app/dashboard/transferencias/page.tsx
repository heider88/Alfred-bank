"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRouter } from "next/navigation";
import { formatCurrencyFromCents } from "@/utils/formatters";
import { Send, AlertCircle, CheckCircle2, ArrowRightLeft } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function TransferenciasPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [myAccountId, setMyAccountId] = useState<string | null>(null);

  // Form states
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [recipientName, setRecipientName] = useState<string | null>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");
        
        const meResponse = await fetch(`${API_URL}/accounts/me`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!meResponse.ok) throw new Error("Session expired");
        
        const myAccount = await meResponse.json();
        setMyAccountId(myAccount.id);
      } catch (err) {
        router.push("/login");
      }
    };
    fetchMe();
  }, [router]);

  const maskName = (fullName: string) => {
    const parts = fullName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '';
    
    const maskPart = (str: string) => {
      if (str.length <= 3) return str;
      return str.substring(0, 3) + '*'.repeat(str.length - 3);
    };

    if (parts.length === 1) {
      return maskPart(parts[0]);
    } else {
      // Tomamos primer nombre y primer apellido (o lo que esté en las primeras dos posiciones)
      return maskPart(parts[0]) + ' ' + maskPart(parts[parts.length - 1]);
    }
  };

  const handleVerifyTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      if (!myAccountId) throw new Error("No se pudo identificar tu cuenta.");
      if (!toAccountId.trim()) throw new Error("Ingresa la cuenta destino");
      if (!amount || parseFloat(amount) <= 0) throw new Error("Ingresa un monto válido");

      setLoading(true);
      const token = localStorage.getItem("token");

      // 1. Obtener nombre del destinatario
      const resName = await fetch(`${API_URL}/accounts/${toAccountId.trim()}/name`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!resName.ok) {
        throw new Error("No se encontró la cuenta destino. Verifica el ID.");
      }

      const dataName = await resName.json();
      setRecipientName(maskName(dataName.owner_name));
      setIsModalOpen(true);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTransfer = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    setIsModalOpen(false);

    try {
      const token = localStorage.getItem("token");
      
      const payload = {
        from_account_id: myAccountId,
        to_account_id: toAccountId.trim(),
        amount_cents: Math.floor(parseFloat(amount) * 100), // Convert to cents
        description: description.trim() || "Transferencia"
      };

      const res = await fetch(`${API_URL}/transactions/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || data?.message || "Error al realizar la transferencia");
      }

      setSuccess("¡Transferencia enviada con éxito!");
      setToAccountId("");
      setAmount("");
      setDescription("");
      setRecipientName(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout accountId={myAccountId || undefined}>
      <div className="flex flex-col gap-8 max-w-xl mx-auto w-full">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Transferencias</h1>
          <p className="text-sm text-slate-500">Envía dinero al instante, sin fronteras y sin fricción.</p>
        </header>

        <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm ring-1 ring-slate-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Nueva Transferencia</h2>
              <p className="text-xs text-slate-500">Ingresa los datos del destinatario</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{success}</p>
            </div>
          )}

          <form onSubmit={handleVerifyTransfer} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Cuenta Destino (ID de Cuenta)</label>
              <input
                type="text"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                placeholder="ej. 4b3b1e44-4fe0-4b01-86c7-8e22fc1d0645"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent font-mono"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Monto (COP)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-bold">$</span>
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Concepto (Opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ej. Pago de cena"
                maxLength={50}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#CCFF00] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !myAccountId}
              className="w-full bg-[#0A0A0A] hover:bg-black text-white font-bold py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:scale-100 mt-4"
            >
              {loading ? (
                "Procesando..."
              ) : (
                <>
                  Enviar Dinero <Send className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>
        </section>

        {/* Modal de Confirmación */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-sm shadow-2xl scale-in-center">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Confirmar Envío</h3>
              <p className="text-slate-500 text-sm mb-6">Por favor verifica los datos antes de confirmar la transacción.</p>
              
              <div className="bg-slate-50 rounded-2xl p-4 mb-6 space-y-3 border border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Destinatario:</span>
                  <span className="text-sm font-bold text-slate-900">{recipientName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-500">Valor a enviar:</span>
                  <span className="text-sm font-bold text-[#0A0A0A]">${parseFloat(amount).toLocaleString('es-CO')}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleConfirmTransfer}
                  className="flex-1 py-3.5 px-4 rounded-xl font-bold text-black bg-[#CCFF00] hover:bg-[#b8e600] transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}